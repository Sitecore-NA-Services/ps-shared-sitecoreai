'use client';

/**
 * Question-and-answer panel for the `/search` page, packaged as a Sitecore
 * rendering (`Default` export) and as an embeddable panel used by `SearchResults`.
 *
 * Sitecore Search (CEC) used to supply curated Q&A pairs through its Question &
 * Answer groups. Embedded SitecoreAI Search has no equivalent, so today every
 * answer is written on the spot by `/api/search-answer`: that route retrieves the
 * best articles from the search source, filters weak matches out, and lets the
 * model answer only from what it was handed. When the articles do not cover the
 * question the route returns an empty body and this panel stays hidden.
 *
 * If a curated knowledge base comes back (for example Q&A items indexed by a
 * content source), `querySitecoreQuestions()` in `src/lib/sitecore-search-query.ts`
 * is the single place to wire it in; this panel already shows provenance.
 */

import { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { cva } from 'class-variance-authority';
import { useTranslations } from 'next-intl';
import { useSitecore } from '@sitecore-content-sdk/nextjs';
import { cn } from '@/lib/utils';
import { dictionaryKeys } from '@/variables/dictionary';
import type { ComponentProps } from '@/lib/component-props';
import { useLocalizeHref } from '@/lib/localize-href';
import { isSearchConfigured } from './search-config';

/** Sitecore item path of the Agent Chat page. */
const AGENT_CHAT_PATH = '/Agent-Chat';

/**
 * Words that open a question. Used with a trailing "?" to decide whether a query
 * is worth spending a model call on — "solar panels" is a browse, "how do solar
 * panels work" is a question, and only the second deserves a written answer.
 */
const QUESTION_OPENERS =
  /^(who|what|when|where|why|how|which|is|are|was|were|do|does|did|can|could|should|would|will|has|have|had|am)\b/i;

/** True when the query reads as a question rather than a keyword browse. */
export const looksLikeQuestion = (q: string): boolean => {
  const trimmed = q.trim();
  if (trimmed.length < 8) return false;
  if (trimmed.endsWith('?')) return true;
  // Needs a few words behind it: "how" alone is a keyword, "how do I apply" is not.
  return QUESTION_OPENERS.test(trimmed) && trimmed.split(/\s+/).length >= 4;
};

/**
 * How long to wait for a written answer before giving up on it. This does NOT
 * hold up the page — the results list renders independently and the answer slots
 * in above it whenever it arrives — so the budget only exists to stop a stuck
 * request spinning forever. Measured end-to-end cost is ~3.5-4.5s warm.
 */
const ANSWER_TIMEOUT_MS = Number(process.env.NEXT_PUBLIC_SEARCH_ANSWER_TIMEOUT_MS) || 10000;

type Translator = ReturnType<typeof useTranslations>;

/**
 * The Q&A dictionary items are new, so they may not exist in Sitecore yet. Fall
 * back to English copy rather than rendering a missing-key error into the page.
 */
const label = (t: Translator, key: string, fallback: string) => (t.has(key) ? t(key) : fallback);

const QuestionsSkeleton = () => (
  <div className="rounded-xl border border-zinc-200 bg-white p-5">
    <div className="h-4 w-24 animate-pulse rounded bg-zinc-200" />
    <div className="mt-3 h-5 w-3/4 animate-pulse rounded bg-zinc-200" />
    <div className="mt-3 h-4 w-full animate-pulse rounded bg-zinc-100" />
    <div className="mt-2 h-4 w-5/6 animate-pulse rounded bg-zinc-100" />
  </div>
);

/**
 * Streams a grounded answer for a question-shaped query from `/api/search-answer`.
 * Tagged with the keyphrase it was produced for, so a result arriving after the
 * visitor has moved on is simply ignored rather than needing to be cleared.
 */
function useGeneratedAnswer(question: string, locale?: string) {
  const [result, setResult] = useState<{ q: string; answer: string | null } | null>(null);
  const startedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!question) return;
    if (startedRef.current === question) return;
    startedRef.current = question;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ANSWER_TIMEOUT_MS);
    let cancelled = false;

    (async () => {
      let accumulated = '';
      try {
        const res = await fetch('/api/search-answer', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ question, locale }),
          signal: controller.signal,
        });
        if (res.ok && res.body) {
          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            accumulated += decoder.decode(value, { stream: true });
            // Render as it arrives, so the answer forms in place rather than
            // appearing all at once several seconds later.
            if (!cancelled && accumulated) setResult({ q: question, answer: accumulated });
          }
        }
      } catch {
        // Aborted or failed: keep whatever already streamed in.
      }
      clearTimeout(timer);
      // An empty body is the "no answer" signal; settle so we stop waiting on it.
      if (!cancelled) setResult({ q: question, answer: accumulated.trim() || null });
    })();

    return () => {
      cancelled = true;
      clearTimeout(timer);
      controller.abort();
    };
  }, [question, locale]);

  const settled = result?.q === question;
  return { answer: settled ? result?.answer ?? null : null, pending: !settled };
}

/**
 * Embeddable Q&A panel — no section chrome, so it can be composed into another
 * rendering (it sits above the list in `SearchResults`) as well as stand alone.
 *
 * Renders nothing when there is no question-shaped query or when search is
 * unconfigured: a Q&A block with no question is just empty chrome on the page.
 */
export const SearchQuestionsPanel = ({ keyphrase }: { keyphrase: string; showRelated?: boolean }) => {
  const t = useTranslations();
  const localizeHref = useLocalizeHref();
  const { page } = useSitecore();

  const question = looksLikeQuestion(keyphrase) && isSearchConfigured() ? keyphrase.trim() : '';
  const { answer, pending } = useGeneratedAnswer(question, page.locale);

  if (!question) return null;
  if (pending && !answer) return <QuestionsSkeleton />;
  if (!answer) return null;

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 md:p-6">
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
        {label(t, dictionaryKeys.SEARCH_QA_ANSWER_LABEL, 'Answer')}
        {/* Where this answer came from. Today always the model writing from the
            article index; a curated source would report FAQ here instead. */}
        <span className="text-[10px] font-normal normal-case tracking-normal text-zinc-400">
          {label(t, dictionaryKeys.SEARCH_QA_FROM_AI, 'AI Generated')}
        </span>
      </p>
      <h2 className="mt-2 text-lg font-semibold text-zinc-900">{question}</h2>
      <p className="mt-2 text-sm leading-relaxed text-zinc-700">{answer}</p>

      {/* Hand the question off to the agent, which re-answers it with its own
          tools, so the visitor picks up where the short answer left off. */}
      <Link
        href={`${localizeHref(AGENT_CHAT_PATH) ?? AGENT_CHAT_PATH}?q=${encodeURIComponent(question)}`}
        className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-accent underline underline-offset-2"
      >
        {label(t, dictionaryKeys.SEARCH_QA_CONTINUE, 'Continue this conversation')}
        <span aria-hidden="true">→</span>
      </Link>
    </div>
  );
};

const searchQuestionsVariants = cva('w-full py-6', {
  variants: {
    colorScheme: {
      light: 'bg-zinc-50 text-zinc-900',
      primary: 'bg-primary text-primary-foreground',
      secondary: 'bg-secondary text-secondary-foreground',
      tertiary: 'bg-tertiary text-primary',
      dark: 'bg-dark text-primary',
    },
  },
  defaultVariants: {
    colorScheme: 'light',
  },
});

type ColorScheme = 'primary' | 'secondary' | 'tertiary' | 'dark' | 'light';

/**
 * Sitecore rendering entry. Reads the `colorScheme` rendering parameter and the
 * `?q=` query string, and wraps the panel in a brand-styled section. Use this
 * when placing Q&A on a page as its own component; `SearchResults` embeds
 * `SearchQuestionsPanel` directly instead.
 */
const SearchQuestionsContent = ({ params }: ComponentProps) => {
  const colorScheme = ((params?.colorScheme as ColorScheme) || 'light') as ColorScheme;
  const q = useSearchParams()?.get('q') ?? '';

  if (!q.trim()) return null;

  return (
    <section className={cn(searchQuestionsVariants({ colorScheme }), params?.styles)}>
      <div className="mx-auto w-full max-w-screen-xl px-4 xl:px-8">
        <SearchQuestionsPanel keyphrase={q} />
      </div>
    </section>
  );
};

export const Default = (props: ComponentProps) => (
  <Suspense fallback={null}>
    <SearchQuestionsContent {...props} />
  </Suspense>
);
