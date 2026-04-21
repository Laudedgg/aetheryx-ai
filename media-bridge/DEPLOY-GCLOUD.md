# Media Bridge — Deploy to Google Cloud Run

Same Node.js service, deployed to Google Cloud Run. Cloud Run supports WebSockets up to 60 min per connection — plenty for sales calls.

## 1. Install `gcloud` CLI

```bash
brew install --cask google-cloud-sdk
```

Or download: https://cloud.google.com/sdk/docs/install

## 2. Log in and set up project

```bash
gcloud auth login
```

Create a project (or use existing):
```bash
gcloud projects create aetheryx-ai-prod --name="Aetheryx AI"
gcloud config set project aetheryx-ai-prod
```

Enable billing (required for Cloud Run, even for free tier):
- Visit: https://console.cloud.google.com/billing
- Link a billing account to the project

Enable required APIs:
```bash
gcloud services enable run.googleapis.com cloudbuild.googleapis.com
```

## 3. Deploy

From the `media-bridge/` folder:

```bash
cd media-bridge

gcloud run deploy aetheryx-media-bridge \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080 \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10 \
  --timeout 3600 \
  --set-env-vars DEEPGRAM_API_KEY=7df7b36ddbb2d5ed95a1861418abe9e389fda1b6
```

The first deploy takes ~3 min (it builds the Docker image with Cloud Build, then deploys).

**Output will look like:**
```
Service [aetheryx-media-bridge] has been deployed and is serving 100 percent of traffic.
Service URL: https://aetheryx-media-bridge-abc123-uc.a.run.app
```

**Copy that URL.** You'll need it for the next step.

## 4. Test it's up

```bash
curl https://YOUR-SERVICE-URL/health
# → {"ok":true,"subscribers":[]}
```

## 5. Update Aetheryx environment variables

In your Vercel project (aetheryx-ai):

Go to **Settings → Environment Variables** and add:
```
MEDIA_BRIDGE_HOST = aetheryx-media-bridge-abc123-uc.a.run.app
NEXT_PUBLIC_MEDIA_BRIDGE_HOST = aetheryx-media-bridge-abc123-uc.a.run.app
```

(Use your actual Cloud Run hostname, without the `https://`.)

Then redeploy Vercel.

For localhost dev, add to `.env.local`:
```
MEDIA_BRIDGE_HOST=aetheryx-media-bridge-abc123-uc.a.run.app
NEXT_PUBLIC_MEDIA_BRIDGE_HOST=aetheryx-media-bridge-abc123-uc.a.run.app
```

## 6. Watch logs

```bash
gcloud run services logs tail aetheryx-media-bridge --region us-central1
```

When a call starts you should see:
```
[twilio] connection opened
[deepgram][rep] open
[deepgram][client] open
[transcript][rep] Hello how are you doing
[transcript][client] I'm doing well thank you
```

## Pricing

**Free tier (per month):**
- 2 million requests
- 360,000 GB-seconds of memory
- 180,000 vCPU-seconds

For a typical sales team (100 calls × 15 min/day), you'd be well within free tier.

## Architecture

```
Twilio Call
  ↓ (Media Streams — both tracks)
[Cloud Run] media-bridge
  ↓ (per-track)
Deepgram (×2, separate WS per speaker)
  ↓ (transcripts)
[Cloud Run] media-bridge
  ↓ (SSE broadcast)
Aetheryx Dashboard (EventSource)
```

## Updating

To push updates later:
```bash
cd media-bridge
gcloud run deploy aetheryx-media-bridge --source . --region us-central1
```

## Rollback

List revisions:
```bash
gcloud run revisions list --service aetheryx-media-bridge --region us-central1
```

Route 100% traffic to an older revision:
```bash
gcloud run services update-traffic aetheryx-media-bridge \
  --to-revisions REVISION_NAME=100 \
  --region us-central1
```
