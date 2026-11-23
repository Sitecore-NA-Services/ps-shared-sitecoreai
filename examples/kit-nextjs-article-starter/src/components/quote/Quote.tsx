import type React from 'react';
import { Field, Text, useSitecore } from '@sitecore-content-sdk/nextjs';
import { ComponentProps } from '@/lib/component-props';
import { cn } from '@/lib/utils';
import { NoDataFallback } from '@/utils/NoDataFallback';

interface QuoteFields {
  subCopy?: Field<string>;
}

interface QuoteProps extends ComponentProps {
  fields?: QuoteFields;
}

export const Default: React.FC<QuoteProps> = ({ fields, params }) => {
  const { page } = useSitecore();
  const { subCopy } = fields ?? {};
  const id = params?.RenderingIdentifier;

  if (!subCopy && !page.mode.isEditing) {
    return <NoDataFallback componentName="Quote" />;
  }

  return (
    <figure
      className={cn(
        'mx-auto my-10 max-w-4xl border-l-4 border-accent px-6 py-2',
        params?.styles,
      )}
      id={id || undefined}
      data-component-name="quote"
    >
      <blockquote className="m-0">
        {subCopy ? (
          <Text
            field={subCopy}
            tag="p"
            className="font-heading text-primary text-2xl font-normal leading-relaxed"
          />
        ) : (
          <span className="is-empty-hint">Quote</span>
        )}
      </blockquote>
    </figure>
  );
};
