import type { IncomingMessage, ServerResponse } from 'node:http';
import { Readable } from 'node:stream';
import type { ReadableStream as NodeWebReadableStream } from 'node:stream/web';
import type { SolterraMcpHandler } from './server';

async function toRequest(req: IncomingMessage): Promise<Request> {
  const protocol = (req.headers['x-forwarded-proto'] as string | undefined)?.split(',')[0] ?? 'http';
  const host = (req.headers['x-forwarded-host'] as string | undefined) ?? req.headers.host ?? 'localhost';
  const url = new URL(req.url ?? '/', `${protocol}://${host}`);

  const headers = new Headers();
  for (const [name, value] of Object.entries(req.headers)) {
    if (Array.isArray(value)) {
      value.forEach((item) => headers.append(name, item));
    } else if (value !== undefined) {
      headers.set(name, value);
    }
  }

  const hasBody = req.method !== 'GET' && req.method !== 'HEAD';
  let body: Buffer | undefined;
  if (hasBody) {
    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    body = Buffer.concat(chunks);
  }

  return new Request(url, { method: req.method, headers, body });
}

async function writeResponse(response: Response, res: ServerResponse) {
  res.statusCode = response.status;
  response.headers.forEach((value, name) => res.setHeader(name, value));
  if (!response.body) {
    res.end();
    return;
  }
  // Stream so text/event-stream responses are flushed as they are produced.
  Readable.fromWeb(response.body as unknown as NodeWebReadableStream).pipe(res);
}

/** Adapts a Fetch-style handler to Node's (req, res) signature used by Vercel's Node runtime. */
export function toNodeHandler(getHandler: () => Promise<SolterraMcpHandler>) {
  return async (req: IncomingMessage, res: ServerResponse) => {
    try {
      const handler = await getHandler();
      await writeResponse(await handler(await toRequest(req)), res);
    } catch (handlerError) {
      console.error(handlerError);
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'MCP handler failed' }));
    }
  };
}
