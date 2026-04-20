# Media Bridge — Deploy to Fly.io

This tiny WebSocket service receives Twilio Media Streams audio, forwards both tracks (Rep + Client) to Deepgram, and pushes transcripts back to the Aetheryx dashboard via Server-Sent Events.

## 1. Install flyctl

```bash
brew install flyctl
```

(Or: `curl -L https://fly.io/install.sh | sh`)

## 2. Log in

```bash
fly auth signup   # first time
# or
fly auth login
```

## 3. Deploy

From **this folder** (`media-bridge/`):

```bash
cd media-bridge
fly launch --no-deploy
```

When prompted:
- **App name:** `aetheryx-media-bridge`  (or press Enter to accept)
- **Region:** `iad` (Virginia) — closest to Twilio US
- **Postgres / Redis:** No
- **Deploy now:** No (we need to set secrets first)

Then set the Deepgram key as a secret:

```bash
fly secrets set DEEPGRAM_API_KEY=7df7b36ddbb2d5ed95a1861418abe9e389fda1b6
```

Deploy:

```bash
fly deploy
```

## 4. Verify

```bash
curl https://aetheryx-media-bridge.fly.dev/health
# → {"ok":true,"subscribers":[]}
```

## 5. If your app name differs from `aetheryx-media-bridge`

Set the env var in Vercel so the TwiML knows where to tell Twilio to stream:

```
MEDIA_BRIDGE_HOST=your-app-name.fly.dev
```

And in `.env.local` for localhost dev:
```
NEXT_PUBLIC_MEDIA_BRIDGE_HOST=your-app-name.fly.dev
MEDIA_BRIDGE_HOST=your-app-name.fly.dev
```

## 6. Logs

```bash
fly logs
```

You should see `[twilio] connection opened` when a call starts, `[deepgram][rep] open` / `[deepgram][client] open`, and `[transcript][rep] ...` / `[transcript][client] ...` lines.

## Architecture

```
Twilio Call
  ↓ (Media Streams — both channels)
[Fly.io] media-bridge
  ↓ (per-track)
Deepgram (×2, separate WS per speaker)
  ↓ (transcripts)
[Fly.io] media-bridge
  ↓ (SSE broadcast)
Aetheryx Dashboard (EventSource)
```
