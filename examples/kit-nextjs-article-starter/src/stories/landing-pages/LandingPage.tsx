import { Fragment } from 'react';
import { Flex, FlexItem } from '@/components/flex/Flex.dev';
import type { LandingPageManifest, Section } from './manifest';
import { SitecoreComponent } from './SitecoreComponent';

// Markup and classes of Container Full Bleed / Container Full Width with default parameters.
function FullBleed({ children }: { children: React.ReactNode }) {
  return (
    <section className="group @container container--full-bleed my-8 bg-transparent py-0 sm:my-16">
      <Flex fullBleed={true} className="group-[.is-inset]:p-0">
        <FlexItem basis="full">{children}</FlexItem>
      </Flex>
    </section>
  );
}

function FullWidth({ children }: { children: React.ReactNode }) {
  return (
    <section className="@container container--full-width group mt-4">
      <Flex className="group-[.is-inset]:p-0">
        <FlexItem basis="full">{children}</FlexItem>
      </Flex>
    </section>
  );
}

function SectionContainer({ section, children }: { section: Section; children: React.ReactNode }) {
  switch (section.container) {
    case 'full-bleed':
      return <FullBleed>{children}</FullBleed>;
    case 'full-width':
      return <FullWidth>{children}</FullWidth>;
    case 'full-bleed/full-width':
      return (
        <FullBleed>
          <FullWidth>{children}</FullWidth>
        </FullBleed>
      );
  }
}

export type LandingPageProps = {
  /** Landing page manifest: sections of Sitecore components with their datasource content. */
  manifest: LandingPageManifest;
};

/**
 * Renders a Solterra landing page manifest the way the `headless-main` placeholder renders
 * the published page: each section is a container rendering with the components inside it.
 * The same manifest is returned by the MCP `landing-page-get` tool together with the
 * Sitecore publish plan.
 */
export function LandingPage({ manifest }: LandingPageProps) {
  return (
    <main>
      <div id="content" className="antialiased">
        {manifest.sections.map((section, sectionIndex) => (
          <SectionContainer key={sectionIndex} section={section}>
            {section.components.map((entry) => (
              <Fragment key={`${entry.component}-${entry.name}`}>
                <SitecoreComponent entry={entry} pageFields={manifest.page.fields} />
              </Fragment>
            ))}
          </SectionContainer>
        ))}
      </div>
    </main>
  );
}
