import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { register as registerGetLatestReading } from './tools/get-latest-reading.js';
import { register as registerGetReadingsInRange } from './tools/get-readings-in-range.js';
import { register as registerGetStatsForRange } from './tools/get-stats-for-range.js';
import { register as registerGetDeviceMeta } from './tools/get-device-meta.js';

export function createMcpServer(): McpServer {
  const server = new McpServer({
    name: 'weather-station',
    version: '1.0.0',
  });

  registerGetLatestReading(server);
  registerGetReadingsInRange(server);
  registerGetStatsForRange(server);
  registerGetDeviceMeta(server);

  return server;
}
