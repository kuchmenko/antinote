# Cloudflare Worker WebSocket Deployment

This directory contains the Cloudflare Worker for OpenAI Realtime API WebSocket proxy.

## Architecture

```
Browser ──WebSocket──> Cloudflare Worker ──WebSocket──> OpenAI Realtime API
```

The Worker acts as a secure proxy, hiding your OpenAI API key from the frontend.

## Files

- `src/worker.ts` - Main Cloudflare Worker code
- `wrangler.toml` - Configuration for deployment
- `src/hooks/useCloudflareTranscription.ts` - React hook for frontend

## Quick Start

### 1. Deploy to Cloudflare

```bash
# Install Wrangler CLI
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Deploy
wrangler deploy

# Output:
# Published antinote-ws
#   https://antinote-ws.YOUR_SUBDOMAIN.workers.dev
```

### 2. Configure Environment

After deployment, set these secrets in Cloudflare Dashboard:

1. Go to: https://dash.cloudflare.com
2. Select: Workers & Pages → antinote-ws
3. Settings → Variables and Secrets → Add Variable
4. Add: `OPENAI_API_KEY` = your OpenAI API key

### 3. Update Frontend

Update your frontend to connect to the deployed worker:

```typescript
// src/components/SmartInput.tsx or src/app/api/ws-config/route.ts
const CLOUDFLARE_WORKER_URL = "https://antinote-ws.YOUR_SUBDOMAIN.workers.dev";
```

## Development (Local Testing)

For local testing without deploying:

```bash
# Start local WebSocket server (see server/ws-server.ts)
pnpm run ws-server

# Or use Cloudflare Tunnel:
npm install -g cloudflared
cloudflared tunnel --url http://localhost:3001
```

## WebSocket Message Format

### From Frontend:
```json
{
  "type": "audio",
  "audio": "base64_encoded_audio_data"
}
```

### From Worker to Frontend:
```json
{
  "type": "transcription",
  "isFinal": true,
  "transcript": "the quick brown fox",
  "timestamp": 1234567890
}
```

## Monitoring

View real-time logs in Cloudflare Dashboard:
- Workers & Pages → antinote-ws → Logs → Real-time
- Filter by: `Client connected`, `OpenAI connection`, `Transcription`

## Troubleshooting

### Connection Issues:

1. **426 Upgrade Required**: Check Wrangler.toml `compatibility_date`
   ```toml
   compatibility_date = "2024-01-01"
   ```

2. **1003 DNS error**: Check worker deployment is live
   ```bash
   wrangler deployments list
   ```

3. **WebSocket immediately closes**:
   - Check browser console for error messages
   - Verify OPENAI_API_KEY is set in Cloudflare Dashboard
   - Check Cloudflare Dashboard logs

## Migration from Local Server

To migrate from `server/ws-server.ts` to Cloudflare Worker:

1. **Frontend code**: No changes needed! Just update the WebSocket URL.
2. **API Key**: Move from `.env` to Cloudflare Dashboard secrets.
3. **Deployment**: Remove local server, deploy worker instead.

## Cost & Limits

- **Free Tier**: 100k requests/day
- **WebSocket connections**: Unlimited on free tier
- **Execution time**: 10ms CPU time per request
- **Memory**: 128MB

## Security Notes

✅ API key stored in Cloudflare secrets (not in frontend)
✅ No direct exposure to browser DevTools
✅ Automatic HTTPS with Cloudflare SSL
✅ Global CDN with minimal latency

## Next Steps

1. Deploy to Cloudflare
2. Add OPENAI_API_KEY secret
3. Get the worker URL
4. Update frontend `wsUrl` to point to deployed worker
5. Test transcription in browser

## Support

- Cloudflare Workers Docs: https://developers.cloudflare.com/workers/
- Wrangler CLI: https://developers.cloudflare.com/workers/wrangler/
