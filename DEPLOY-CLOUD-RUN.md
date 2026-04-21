# Deploy Aetheryx to Google Cloud Run — Full Guide

Two services on one cloud:
- **aetheryx-app** — the Next.js web app (landing + dashboard + API)
- **aetheryx-media-bridge** — the WebSocket audio relay for Twilio → Deepgram

Both on Google Cloud Run. Pay-per-use, free tier covers normal usage.

---

## 0. One-time setup

### Install `gcloud` CLI
```bash
brew install --cask google-cloud-sdk
```

### Log in + create project
```bash
gcloud auth login
gcloud projects create aetheryx-prod --name="Aetheryx AI"
gcloud config set project aetheryx-prod
```

### Enable billing
Open: https://console.cloud.google.com/billing → link a billing account to the project.
(Required even for free tier.)

### Enable APIs
```bash
gcloud services enable run.googleapis.com cloudbuild.googleapis.com
```

---

## 1. Deploy the media-bridge (WebSocket relay)

The keys you need are already in `.env.local`. Before deploying, source them into your shell:

```bash
# From the project root:
set -a && source .env.local && set +a
```

Then deploy:

```bash
cd "/Users/rnewed/Downloads/AI Ventures/salesmaster-hero/media-bridge"

gcloud run deploy aetheryx-media-bridge \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080 \
  --memory 512Mi \
  --timeout 3600 \
  --min-instances 0 \
  --max-instances 10 \
  --set-env-vars "DEEPGRAM_API_KEY=${DEEPGRAM_API_KEY}"
```

When it completes, copy the **Service URL** — looks like:
```
https://aetheryx-media-bridge-xxxxxx-uc.a.run.app
```

Test it:
```bash
curl https://YOUR-MEDIA-BRIDGE-URL/health
# → {"ok":true,"subscribers":[]}
```

---

## 2. Deploy the Next.js app

Export your bridge URL (the hostname only, no `https://`):
```bash
export BRIDGE_HOST="aetheryx-media-bridge-xxxxxx-uc.a.run.app"
```

Deploy:
```bash
cd "/Users/rnewed/Downloads/AI Ventures/salesmaster-hero"

# Make sure .env.local is sourced
set -a && source .env.local && set +a

gcloud run deploy aetheryx-app \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080 \
  --memory 1Gi \
  --cpu 1 \
  --timeout 300 \
  --min-instances 0 \
  --max-instances 10 \
  --update-env-vars "OPENAI_API_KEY=${OPENAI_API_KEY}" \
  --update-env-vars "ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}" \
  --update-env-vars "PERPLEXITY_API_KEY=${PERPLEXITY_API_KEY}" \
  --update-env-vars "PINECONE_API_KEY=${PINECONE_API_KEY}" \
  --update-env-vars "PINECONE_INDEX=${PINECONE_INDEX}" \
  --update-env-vars "GMAIL_USER=${GMAIL_USER}" \
  --update-env-vars "GMAIL_APP_PASSWORD=${GMAIL_APP_PASSWORD}" \
  --update-env-vars "HUBSPOT_ACCESS_TOKEN=${HUBSPOT_ACCESS_TOKEN}" \
  --update-env-vars "TWILIO_ACCOUNT_SID=${TWILIO_ACCOUNT_SID}" \
  --update-env-vars "TWILIO_AUTH_TOKEN=${TWILIO_AUTH_TOKEN}" \
  --update-env-vars "TWILIO_FROM_NUMBER=${TWILIO_FROM_NUMBER}" \
  --update-env-vars "TWILIO_API_KEY_SID=${TWILIO_API_KEY_SID}" \
  --update-env-vars "TWILIO_API_KEY_SECRET=${TWILIO_API_KEY_SECRET}" \
  --update-env-vars "TWILIO_TWIML_APP_SID=${TWILIO_TWIML_APP_SID}" \
  --update-env-vars "DEEPGRAM_API_KEY=${DEEPGRAM_API_KEY}" \
  --update-env-vars "MEDIA_BRIDGE_HOST=${BRIDGE_HOST}" \
  --update-env-vars "NEXT_PUBLIC_MEDIA_BRIDGE_HOST=${BRIDGE_HOST}"
```

First deploy takes ~5 min (Cloud Build builds the Docker image).

When done, you'll get a URL like:
```
https://aetheryx-app-xxxxxx-uc.a.run.app
```

Export it:
```bash
export APP_URL="https://aetheryx-app-xxxxxx-uc.a.run.app"
```

---

## 3. Update Twilio TwiML App to point to new URL

```bash
curl -s -X POST \
  "https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Applications/${TWILIO_TWIML_APP_SID}.json" \
  -u "${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}" \
  --data-urlencode "VoiceUrl=${APP_URL}/api/twilio/twiml"
```

---

## 4. Point your domain at Cloud Run (optional)

Default URLs are ugly (`xxxxx-uc.a.run.app`). To use `aetheryx.ai`:

```bash
gcloud run domain-mappings create --service aetheryx-app --domain aetheryx.ai --region us-central1
gcloud run domain-mappings create --service aetheryx-app --domain www.aetheryx.ai --region us-central1
```

Then follow the printed DNS records and add them at your domain registrar.

---

## 5. Verify

```bash
# Landing page
curl -s -o /dev/null -w "%{http_code}\n" ${APP_URL}/

# Media bridge health
curl https://${BRIDGE_HOST}/health

# TwiML endpoint
curl -X POST ${APP_URL}/api/twilio/twiml \
  -d "To=%2B14155551234&CallSid=test123"
```

---

## 6. Watch logs during a test call

Terminal 1 (app):
```bash
gcloud run services logs tail aetheryx-app --region us-central1
```

Terminal 2 (media bridge):
```bash
gcloud run services logs tail aetheryx-media-bridge --region us-central1
```

During a call you should see in the media-bridge logs:
```
[twilio] connection opened
[deepgram][rep] open
[deepgram][client] open
[transcript][rep] Hello how are you doing
[transcript][client] I'm doing well thank you
```

---

## 7. Updating later

Re-deploy either service. Env vars persist across deploys.

```bash
# App
cd "/Users/rnewed/Downloads/AI Ventures/salesmaster-hero"
gcloud run deploy aetheryx-app --source . --region us-central1

# Media bridge
cd media-bridge
gcloud run deploy aetheryx-media-bridge --source . --region us-central1
```

---

## Architecture

```
User browser
   ↓ HTTPS
[Cloud Run] aetheryx-app          (Next.js — landing + dashboard + API)
   ↓ makes call via Twilio Voice SDK
Twilio
   ↓ webhook
[Cloud Run] aetheryx-app /api/twilio/twiml
   ↓ returns TwiML pointing to...
[Cloud Run] aetheryx-media-bridge (WebSocket — relays audio to Deepgram)
   ↓ SSE stream back to browser
User browser (transcripts appear live)
```

---

## Disable Vercel (after Cloud Run confirmed working)

1. Log into Vercel dashboard
2. Settings → General → "Delete Project" OR pause deployments
3. Point your domain's DNS to Cloud Run (see Step 4)

---

## Rollback

```bash
gcloud run revisions list --service aetheryx-app --region us-central1

gcloud run services update-traffic aetheryx-app \
  --to-revisions REVISION_NAME=100 \
  --region us-central1
```

---

## Pricing estimate

For ~100 calls/day × 15 min:
- **Media bridge**: ~$0-2/month
- **App**: ~$0-5/month

Essentially free under normal usage thanks to Cloud Run's generous free tier (2M req, 360K GB-sec memory/month).
