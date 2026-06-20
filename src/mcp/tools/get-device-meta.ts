import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { getDeviceMeta } from '@/db/firebase.js';

const DEFAULT_DEVICE_ID = process.env.DEFAULT_DEVICE_ID ?? 'esp32-01';

export const inputSchema = z.object({
  deviceId: z.string().optional(),
});

export type GetDeviceMetaInput = z.infer<typeof inputSchema>;

export async function handleGetDeviceMeta(args: GetDeviceMetaInput) {
  const deviceId = args.deviceId ?? DEFAULT_DEVICE_ID;
  const meta = await getDeviceMeta(deviceId);

  return {
    device: meta ? { id: deviceId, ...meta } : null,
  };
}

export function register(server: McpServer): void {
  server.registerTool(
    'get_device_meta',
    {
      description:
        'Get metadata for a weather station device: its human-friendly name, physical location, and site elevation (meters). Useful for giving the AI context about where readings come from.',
      inputSchema: inputSchema.shape,
    },
    async (args) => ({
      content: [
        {
          type: 'text',
          text: JSON.stringify(await handleGetDeviceMeta(args), null, 2),
        },
      ],
    }),
  );
}
