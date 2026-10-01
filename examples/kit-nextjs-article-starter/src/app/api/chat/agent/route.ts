import { streamText, tool, type Message } from 'ai';
import { z } from 'zod';
import { chatModel } from '@/lib/azure-openai';
import { querySitecoreSearch, listSearchFacetValues } from '@/lib/sitecore-search-query';
import { rerankByRelevance } from '@/lib/rerank';

export const maxDuration = 30;

/**
 * Agentic search chat: the model decides on its own when to call the
 * `searchArticles` tool against the Sitecore Search index, rather than the
 * index being retrieved automatically (compare with /api/chat/rag). It can
 * also call `listArticleFacets` to discover valid content type / author / tag
 * filter values before narrowing a search with them.
 *
 * There is no curated Q&A tool any more: embedded SitecoreAI Search has no Q&A
 * groups, and a tool that always answered "no curated answer" both wasted a step
 * and primed the model to decline (2026-10-01: "how does solterra recommend
 * storing batteries?" was declined 4/4 with a 0.63 match on the top article).
 */
export async function POST(req: Request) {
  const { messages, locale }: { messages: Message[]; locale?: string } = await req.json();

  // The Search index is language-scoped (an English query won't match Spanish
  // articles or vice versa), so the model needs to both answer and search in the
  // visitor's site language, not just whatever language they happened to type in.
  const languageNote =
    locale && locale.toLowerCase().startsWith('es')
      ? 'The visitor is on the Spanish (es-MX) site. Respond in Spanish, and phrase ' +
        'searchArticles/listArticleFacets queries in Spanish too (translate the topic ' +
        "first if the user asked in English), since the article index is Spanish-language."
      : 'The visitor is on the English site. Respond in English, and phrase searchArticles ' +
        'queries in English.';

  const result = streamText({
    model: chatModel,
    system:
      'You are a helpful assistant for the Solterra & Co. article site. ' +
      `${languageNote} ` +
      'Use the searchArticles tool whenever the user asks about article content, ' +
      'topics, or facts that may be covered by the site. If the user wants to narrow ' +
      'results by content type, author, or topic, call listArticleFacets first to see the ' +
      'exact values available, then pass matching contentType/author/tags arguments to ' +
      'searchArticles. The query keyphrase is matched against article text semantically, so ' +
      'when filtering by author or content type, do NOT put the author name or content type ' +
      'in the query - use a topical keyword instead, or omit query entirely if the user just ' +
      "wants everything by that author/type. Cite article titles and URLs in your answer. " +
      'Each result includes a relevanceScore (0-1, cosine similarity to the query) and the ' +
      "article's full text in description. Ground every statement in that text - never add " +
      'facts from your own general knowledge. ' +
      'Results scoring at least roughly 0.45 are relevant: read their text and answer with what ' +
      'they actually say that bears on the question, even when the articles do not use the ' +
      "user's exact wording or do not frame it as a single recommendation - summarise the " +
      'relevant practices, findings, or guidance they describe. Say plainly which parts of the ' +
      'question the articles do not cover. ' +
      'If the first search scores below that, try one rephrased search before giving up. Only ' +
      "when no result reaches roughly 0.45 should you say Solterra's content does not cover " +
      'the topic; in that case stop there and do not answer from outside knowledge.',
    messages,
    tools: {
      listArticleFacets: tool({
        description:
          'List the available content type, author, and topic tag values in the Solterra ' +
          'article index, with result counts, so a search can be narrowed accurately.',
        parameters: z.object({}),
        execute: async () => listSearchFacetValues('', locale),
      }),
      searchArticles: tool({
        description:
          'Search the Solterra article index for relevant content. Optionally narrow by ' +
          'content type, author, and/or topic tags (get exact values from listArticleFacets first). ' +
          'query is optional - omit it (or use a topical keyword, not the filter value itself) ' +
          'when browsing by author/content type/tags alone.',
        parameters: z.object({
          query: z.string().optional().describe('Search keyphrase (omit to just browse by filters)'),
          contentType: z.string().optional().describe('Filter to this exact content type value'),
          author: z.string().optional().describe('Filter to this exact author value'),
          tags: z.array(z.string()).optional().describe('Filter to articles tagged with any of these topics'),
        }),
        execute: async ({ query, contentType, author, tags }) => {
          const docs = await querySitecoreSearch(query ?? '', 5, { contentType, author, tags }, locale);
          // Rerank by embedding cosine similarity so the model (and the UI) sees a
          // relevanceScore per result.
          return rerankByRelevance(query ?? '', docs);
        },
      }),
    },
    maxSteps: 5,
  });

  return result.toDataStreamResponse();
}
