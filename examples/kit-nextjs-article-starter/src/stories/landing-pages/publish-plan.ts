import { SOLTERRA_MEDIA } from '../_support/solterra-media';
import { SOLTERRA_PAGES } from '../_support/solterra-pages';
import { toSitecoreFieldValue } from './field-values';
import type { ComponentEntry, FieldValues, LandingPageManifest, Section } from './manifest';
import { isImageValue } from './manifest';
import {
  SECTION_CONTAINERS,
  SITECORE_COMPONENTS,
  SOLTERRA_SITE,
  type ComponentKey,
  type FieldSpec,
  type SitecoreComponentSpec,
} from './registry';

export type ValidationResult = { errors: string[]; warnings: string[] };

const isComponentKey = (key: string): key is ComponentKey => key in SITECORE_COMPONENTS;

function validateFields(
  where: string,
  values: FieldValues,
  specs: readonly FieldSpec[],
  result: ValidationResult
) {
  const known = new Map(specs.map((spec) => [spec.name, spec]));
  for (const [name, value] of Object.entries(values)) {
    const spec = known.get(name);
    if (!spec) {
      result.errors.push(
        `${where}: unknown field "${name}". Allowed: ${[...known.keys()].join(', ')}`
      );
      continue;
    }
    const isImage = value !== null && isImageValue(value);
    const isLink = typeof value === 'object' && value !== null && !isImage;
    if (spec.type === 'Image' && !isImage) {
      result.errors.push(`${where}: field "${name}" is an Image; use { "media": "<key>" }`);
    } else if (spec.type === 'General Link' && !isLink) {
      result.errors.push(
        `${where}: field "${name}" is a General Link; use { "text", "page" } or { "text", "url" }`
      );
    } else if (spec.type !== 'Image' && spec.type !== 'General Link' && typeof value !== 'string') {
      result.errors.push(`${where}: field "${name}" is ${spec.type}; use a string`);
    }
    if (isImage && !(value.media in SOLTERRA_MEDIA)) {
      result.errors.push(`${where}: unknown media "${value.media}"`);
    }
    if (isLink && 'page' in value && !(value.page in SOLTERRA_PAGES)) {
      result.errors.push(`${where}: unknown page "${value.page}"`);
    }
  }
  for (const spec of specs) {
    if (spec.required && values[spec.name] === undefined) {
      result.warnings.push(`${where}: required field "${spec.name}" is empty`);
    }
  }
}

function validateEntry(where: string, entry: ComponentEntry, result: ValidationResult) {
  if (!isComponentKey(entry.component)) {
    result.errors.push(
      `${where}: unknown component "${entry.component}". Allowed: ${Object.keys(SITECORE_COMPONENTS).join(', ')}`
    );
    return;
  }
  const spec: SitecoreComponentSpec = SITECORE_COMPONENTS[entry.component];
  if (!entry.name?.trim()) {
    result.errors.push(`${where}: "name" (datasource item name) is required`);
  }
  validateFields(where, entry.fields ?? {}, spec.fields, result);

  if (entry.variant && entry.variant !== 'Default' && !spec.variants?.[entry.variant]) {
    result.errors.push(
      `${where}: unknown variant "${entry.variant}". Allowed: ${Object.keys(spec.variants ?? { Default: '' }).join(', ')}`
    );
  }

  const children = entry.children ?? [];
  if (!spec.children) {
    if (children.length) {
      result.errors.push(`${where}: ${entry.component} does not take child items`);
    }
    return;
  }
  const { min, max } = spec.children;
  if (min !== undefined && children.length < min) {
    result.warnings.push(`${where}: ${entry.component} expects at least ${min} child item(s)`);
  }
  if (max !== undefined && children.length > max) {
    result.warnings.push(`${where}: ${entry.component} renders at most ${max} child item(s)`);
  }
  const childNames = new Set<string>();
  children.forEach((child, index) => {
    const childWhere = `${where} > child ${index + 1} "${child.name}"`;
    if (childNames.has(child.name)) {
      result.errors.push(`${childWhere}: duplicate child item name`);
    }
    childNames.add(child.name);
    validateFields(childWhere, child.fields ?? {}, spec.children!.fields, result);
  });
}

/** Checks a manifest against the registry (field names, types, media, pages, item names). */
export function validateManifest(manifest: LandingPageManifest): ValidationResult {
  const result: ValidationResult = { errors: [], warnings: [] };
  if (manifest.site !== 'solterra') {
    result.errors.push(`site must be "solterra"`);
  }
  if (!manifest.page?.name || /[^\w\- ]/.test(manifest.page.name)) {
    result.errors.push(`page.name must be letters, digits, spaces, "-" or "_"`);
  }
  if (!(manifest.page?.parent in SOLTERRA_PAGES)) {
    result.errors.push(
      `page.parent "${manifest.page?.parent}" is not a known page. Allowed: ${Object.keys(SOLTERRA_PAGES).join(', ')}`
    );
  }
  if (!manifest.page?.fields?.pageTitle) {
    result.errors.push('page.fields.pageTitle is required');
  }
  const datasourceNames = new Set<string>();
  manifest.sections.forEach((section, sectionIndex) => {
    const components = Array.isArray(section?.components) ? section.components : [];
    if (!['full-bleed', 'full-width', 'full-bleed/full-width'].includes(section?.container)) {
      result.errors.push(
        `section ${sectionIndex + 1}: container must be "full-bleed", "full-width" or "full-bleed/full-width"`
      );
    }
    if (!components.length) {
      result.warnings.push(`section ${sectionIndex + 1}: no components`);
    }
    components.forEach((entry, componentIndex) => {
      const where = `section ${sectionIndex + 1} > component ${componentIndex + 1} (${entry.component} "${entry.name}")`;
      // All datasources of a page live in the same Data folder.
      if (datasourceNames.has(entry.name)) {
        result.errors.push(`${where}: datasource name must be unique on the page`);
      }
      datasourceNames.add(entry.name);
      validateEntry(where, entry, result);
    });
  });
  if (manifest.sections.some((s) => s?.components?.some((c) => c.component === 'PageHeader'))) {
    if (!manifest.page?.fields?.pageHeaderTitle && !manifest.page?.fields?.pageTitle) {
      result.warnings.push('Page Header renders page.fields.pageHeaderTitle; it is empty');
    }
  }
  return result;
}

export type PlanStep = {
  step: number;
  /** Reference name; later steps use `{{<ref>.<output>}}` to read outputs of this step. */
  ref: string;
  description: string;
  /** sitecore-marketer MCP tool to call (equivalent tools in other Sitecore toolsets work too). */
  tool: string;
  args: Record<string, unknown>;
  /** Values to capture from the tool result for later steps. */
  outputs?: Record<string, string>;
  /** Steps that need a human or a tool with rendering-parameter support. */
  manual?: boolean;
};

export type PublishPlan = {
  manifestId: string;
  site: string;
  language: string;
  page: { name: string; itemPath: string; route: string; templateId: string; parentId: string };
  instructions: string[];
  steps: PlanStep[];
  validation: ValidationResult;
};

const fieldsArray = (values: FieldValues) =>
  Object.entries(values).map(([name, value]) => ({ name, value: toSitecoreFieldValue(value) }));

const fieldsRecord = (values: FieldValues) =>
  Object.fromEntries(Object.entries(values).map(([name, value]) => [name, toSitecoreFieldValue(value)]));

type ContainerKind = keyof typeof SECTION_CONTAINERS;

const containersFor = (section: Section): ContainerKind[] =>
  section.container === 'full-bleed'
    ? ['fullBleed']
    : section.container === 'full-width'
      ? ['fullWidth']
      : ['fullBleed', 'fullWidth'];

/**
 * Turns a manifest into the ordered list of Sitecore MCP calls that creates the page.
 * Values in `{{ref.output}}` form are produced by earlier steps.
 */
export function createPublishPlan(manifest: LandingPageManifest, language = 'en'): PublishPlan {
  const validation = validateManifest(manifest);
  if (validation.errors.length) {
    return {
      manifestId: manifest.id,
      site: SOLTERRA_SITE.name,
      language,
      page: {
        name: manifest.page?.name,
        itemPath: '',
        route: '',
        templateId: SOLTERRA_SITE.landingPageTemplate.id,
        parentId: '',
      },
      instructions: ['Fix validation.errors and plan again. No steps are produced for an invalid manifest.'],
      steps: [],
      validation,
    };
  }
  const parent = SOLTERRA_PAGES[manifest.page.parent];
  const itemPath = `${parent.itemPath}/${manifest.page.name}`;
  const route = `${parent.route === '/' ? '' : parent.route}/${manifest.page.name}`;
  const steps: PlanStep[] = [];
  const add = (step: Omit<PlanStep, 'step'>) => steps.push({ step: steps.length + 1, ...step });

  const pageFields = Object.fromEntries(
    Object.entries(manifest.page.fields).filter(([, value]) => value !== undefined)
  ) as FieldValues;

  add({
    ref: 'page',
    description: `Create the landing page "${manifest.page.name}" under ${parent.itemPath}.`,
    tool: 'create_page',
    args: {
      templateId: SOLTERRA_SITE.landingPageTemplate.id,
      parentId: parent.id,
      name: manifest.page.name,
      language,
      fields: fieldsArray(pageFields),
    },
    outputs: { id: 'ID of the created page item' },
  });

  const needsDataFolder = manifest.sections.some((section) =>
    section.components.some(
      (entry) => (SITECORE_COMPONENTS[entry.component] as SitecoreComponentSpec).createDatasourceExplicitly
    )
  );
  if (needsDataFolder) {
    add({
      ref: 'data',
      description: `Find the page's Data folder (${itemPath}/Data). If get_content_item_by_path returns nothing, create it with create_content_item (name "Data", templateId ${SOLTERRA_SITE.pageDataFolderTemplate.id}, parentId {{page.id}}).`,
      tool: 'get_content_item_by_path',
      args: { itemPath: `${itemPath}/Data`, language, failOnNotFound: false },
      outputs: { id: 'itemId of the Data folder (existing or newly created)' },
    });
  }

  let previousSectionRef: string | undefined;

  manifest.sections.forEach((section, sectionIndex) => {
    const sectionRef = `s${sectionIndex + 1}`;
    let placeholderPath: string = SOLTERRA_SITE.mainPlaceholder;
    let outerRef: string | undefined;

    containersFor(section).forEach((kind, depth) => {
      const container = SECTION_CONTAINERS[kind];
      const ref = `${sectionRef}.${kind}`;
      outerRef ??= ref;
      add({
        ref,
        description: `Section ${sectionIndex + 1}: add ${container.renderingName} to ${placeholderPath}. It has no datasource. Then call get_components_on_page({{page.id}}) and read this instance's parameters.DynamicPlaceholderId.`,
        tool: 'add_component_on_page',
        args: {
          pageId: '{{page.id}}',
          componentRenderingId: container.renderingId,
          placeholderPath,
          componentItemName: `${manifest.page.name} ${sectionRef} ${container.placeholderPrefix}`,
          language,
          ...(depth === 0 && previousSectionRef
            ? { insertAfterComponentId: `{{${previousSectionRef}.instanceId}}` }
            : {}),
        },
        outputs: {
          instanceId: 'component instance ID of the container',
          dynamicPlaceholderId: 'parameters.DynamicPlaceholderId of that instance (get_components_on_page)',
        },
      });
      placeholderPath =
        depth === 0
          ? `/${SOLTERRA_SITE.mainPlaceholder}/${container.placeholderPrefix}-{{${ref}.dynamicPlaceholderId}}`
          : `${placeholderPath}/${container.placeholderPrefix}-{{${ref}.dynamicPlaceholderId}}`;
    });
    previousSectionRef = outerRef;

    let previousComponentRef: string | undefined;
    section.components.forEach((entry, componentIndex) => {
      const spec: SitecoreComponentSpec = SITECORE_COMPONENTS[entry.component];
      const ref = `${sectionRef}c${componentIndex + 1}`;
      const insertAfter = previousComponentRef
        ? { insertAfterComponentId: `{{${previousComponentRef}.instanceId}}` }
        : {};

      if (spec.createDatasourceExplicitly) {
        add({
          ref: `${ref}.ds`,
          description: `Create the ${spec.renderingName} datasource "${entry.name}" from template ${spec.datasourceTemplate.name} (the rendering's default template is not the one the component reads).`,
          tool: 'create_content_item',
          args: {
            name: entry.name,
            templateId: spec.datasourceTemplate.id,
            parentId: '{{data.id}}',
            language,
            fields: fieldsArray(entry.fields),
          },
          outputs: { id: 'ID of the datasource item' },
        });
        add({
          ref,
          description: `Add ${spec.renderingName} to ${placeholderPath}. The tool creates a throw-away datasource named "${entry.name} (auto)"; the next step replaces it.`,
          tool: 'add_component_on_page',
          args: {
            pageId: '{{page.id}}',
            componentRenderingId: spec.renderingId,
            placeholderPath,
            componentItemName: `${entry.name} (auto)`,
            language,
            ...insertAfter,
          },
          outputs: {
            instanceId: 'component instance ID',
            autoDatasourceId: 'ID of the auto-created datasource item, if any',
          },
        });
        add({
          ref: `${ref}.attach`,
          description: `Point the ${spec.renderingName} instance at the datasource from step ${ref}.ds, then delete {{${ref}.autoDatasourceId}} with delete_content if one was created.`,
          tool: 'set_component_datasource',
          args: {
            pageId: '{{page.id}}',
            componentId: `{{${ref}.instanceId}}`,
            datasourceId: `{{${ref}.ds.id}}`,
            language,
          },
        });
      } else {
        add({
          ref,
          description: `Add ${spec.renderingName} to ${placeholderPath} with datasource "${entry.name}" (template ${spec.datasourceTemplate.name}).`,
          tool: 'add_component_on_page',
          args: {
            pageId: '{{page.id}}',
            componentRenderingId: spec.renderingId,
            placeholderPath,
            componentItemName: entry.name,
            language,
            fields: fieldsRecord(entry.fields),
            ...insertAfter,
          },
          outputs: {
            instanceId: 'component instance ID',
            datasourceId: 'ID of the created datasource item (dataSourceItem.itemId in get_components_on_page)',
          },
        });
      }

      const parentRef = spec.createDatasourceExplicitly ? `${ref}.ds.id` : `${ref}.datasourceId`;
      (entry.children ?? []).forEach((child, childIndex) => {
        add({
          ref: `${ref}.child${childIndex + 1}`,
          description: `Create child item "${child.name}" (${spec.children!.template.name}) under the ${spec.renderingName} datasource.`,
          tool: 'create_content_item',
          args: {
            name: child.name,
            templateId: spec.children!.template.id,
            parentId: `{{${parentRef}}}`,
            language,
            fields: fieldsArray(child.fields),
          },
        });
      });

      const variant = entry.variant ?? 'Default';
      if (variant !== 'Default' && spec.variants?.[variant]) {
        add({
          ref: `${ref}.variant`,
          description: `Switch ${spec.renderingName} to the "${variant}" variant: set rendering parameter FieldNames = {${spec.variants[variant].toUpperCase()}}. add_component_on_page cannot set rendering parameters, so do this in Sitecore Pages (component > Variant) or with a tool that edits rendering parameters.`,
          tool: 'manual',
          args: { componentId: `{{${ref}.instanceId}}`, FieldNames: `{${spec.variants[variant].toUpperCase()}}` },
          manual: true,
        });
      }
      previousComponentRef = ref;
    });
  });

  add({
    ref: 'verify',
    description:
      'Verify: list the page components and compare section order, placeholders and datasource names with the manifest. Then share the preview URL (get_page_preview_url). The page is not published.',
    tool: 'get_components_on_page',
    args: { pageId: '{{page.id}}', language },
  });

  return {
    manifestId: manifest.id,
    site: SOLTERRA_SITE.name,
    language,
    page: {
      name: manifest.page.name,
      itemPath,
      route,
      templateId: SOLTERRA_SITE.landingPageTemplate.id,
      parentId: parent.id,
    },
    instructions: [
      'Stop if validation.errors is not empty.',
      'Before step 1, check the page does not exist yet: get_content_item_by_path page.itemPath with failOnNotFound=false. If it exists, ask the user whether to pick a new page.name or add to the existing page.',
      'Run the steps in order. Replace {{ref.output}} with the value captured in the step whose ref matches.',
      'Containers must be added before the components inside them: the child placeholder path needs the container\'s DynamicPlaceholderId.',
      'Field values are already in Sitecore storage format (HTML for Rich Text, <image>/<link> XML for Image and General Link).',
      'Steps marked manual cannot be done with add_component_on_page; report them to the user.',
      'Do not publish. Leave the page in its workflow state for review in Sitecore Pages.',
    ],
    steps,
    validation,
  };
}
