import { Router, type Request, type Response, type NextFunction } from 'express';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { createMcpServer } from './server.js';

const router = Router();

// Each request gets a fresh server + transport pair (stateless: sessionIdGenerator: undefined).
// All four tools are read-only request-response operations — no persistent sessions needed.
async function handle(req: Request, res: Response): Promise<void> {
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  const server = createMcpServer();
  await server.connect(transport);
  await transport.handleRequest(
    req as unknown as IncomingMessage,
    res as unknown as ServerResponse,
    req.body,
  );
}

router.post('/mcp', (req: Request, res: Response, next: NextFunction) => {
  handle(req, res).catch(next);
});

// GET handles the optional SSE channel for server-to-client push (unused at MVP but valid).
router.get('/mcp', (req: Request, res: Response, next: NextFunction) => {
  handle(req, res).catch(next);
});

export default router;
