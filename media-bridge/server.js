/**
 * Aetheryx Media Bridge
 *
 * Twilio Media Streams → Deepgram → Aetheryx SSE clients
 *
 * Flow per call:
 *   1. Twilio opens WS to /twilio and sends base64 µ-law audio frames (inbound + outbound tracks).
 *   2. For each track we open a Deepgram WebSocket transcription session.
 *   3. Deepgram returns final transcripts; we label them inbound="client" / outbound="rep".
 *   4. Transcripts are pushed to every SSE subscriber watching /events?callSid=...
 *
 * Env: DEEPGRAM_API_KEY
 */

import { createServer } from 'node:http'
import { WebSocketServer, WebSocket } from 'ws'

const PORT = process.env.PORT || 8080
const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY

if (!DEEPGRAM_API_KEY) {
  console.warn('[WARN] DEEPGRAM_API_KEY not set — transcription will fail')
}

/**
 * Map of callSid → Set<res> for SSE subscribers waiting on transcripts.
 */
const subscribers = new Map()

function broadcast(callSid, event) {
  const set = subscribers.get(callSid)
  if (!set) return
  const payload = `data: ${JSON.stringify(event)}\n\n`
  for (const res of set) {
    try { res.write(payload) } catch (_) { /* ignore */ }
  }
}

function addSub(callSid, res) {
  if (!subscribers.has(callSid)) subscribers.set(callSid, new Set())
  subscribers.get(callSid).add(res)
}

function removeSub(callSid, res) {
  const set = subscribers.get(callSid)
  if (!set) return
  set.delete(res)
  if (set.size === 0) subscribers.delete(callSid)
}

// ── HTTP server (for SSE + health) ─────────────────────────────────────────
const server = createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`)

  // CORS (so the browser SSE from any origin works)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end() }

  if (url.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    return res.end(JSON.stringify({ ok: true, subscribers: [...subscribers.keys()] }))
  }

  if (url.pathname === '/events') {
    const callSid = url.searchParams.get('callSid')
    if (!callSid) { res.writeHead(400); return res.end('callSid required') }

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    })
    res.write(': connected\n\n')
    addSub(callSid, res)

    const ping = setInterval(() => {
      try { res.write(': ping\n\n') } catch (_) {}
    }, 25000)

    req.on('close', () => {
      clearInterval(ping)
      removeSub(callSid, res)
    })
    return
  }

  res.writeHead(404)
  res.end('Not found')
})

// ── WebSocket server (Twilio Media Streams) ────────────────────────────────
const wss = new WebSocketServer({ server, path: '/twilio' })

wss.on('connection', (twilioWs) => {
  console.log('[twilio] connection opened')

  let callSid = null
  let streamSid = null

  // Per-track Deepgram sockets
  /** @type {{ inbound?: WebSocket, outbound?: WebSocket }} */
  const dgSockets = {}

  function openDeepgram(track) {
    const role = track === 'inbound' ? 'client' : 'rep'
    const url = `wss://api.deepgram.com/v1/listen?encoding=mulaw&sample_rate=8000&channels=1&punctuate=true&interim_results=false&endpointing=800&smart_format=true&model=nova-2&language=en`
    const ws = new WebSocket(url, { headers: { Authorization: `Token ${DEEPGRAM_API_KEY}` } })

    ws.on('open', () => console.log(`[deepgram][${role}] open`))
    ws.on('error', (e) => console.error(`[deepgram][${role}] error`, e.message))
    ws.on('close', () => console.log(`[deepgram][${role}] closed`))
    ws.on('message', (buf) => {
      try {
        const msg = JSON.parse(buf.toString())
        if (msg.type === 'Results') {
          const text = msg.channel?.alternatives?.[0]?.transcript?.trim()
          if (text && msg.is_final && callSid) {
            broadcast(callSid, {
              speaker: role,
              text,
              timestamp: new Date().toISOString(),
              callSid,
            })
            console.log(`[transcript][${role}] ${text}`)
          }
        }
      } catch (_) { /* ignore */ }
    })
    return ws
  }

  twilioWs.on('message', (raw) => {
    let msg
    try { msg = JSON.parse(raw.toString()) } catch { return }

    if (msg.event === 'start') {
      streamSid = msg.start?.streamSid
      callSid = msg.start?.callSid || msg.start?.customParameters?.callSid
      console.log(`[twilio] start — call=${callSid} stream=${streamSid}`)
      // Prepare both Deepgram connections immediately
      dgSockets.inbound = openDeepgram('inbound')
      dgSockets.outbound = openDeepgram('outbound')
    }

    if (msg.event === 'media') {
      const track = msg.media?.track // 'inbound' (client) or 'outbound' (rep)
      const payload = msg.media?.payload // base64 µ-law 8kHz
      if (!track || !payload) return
      const dgWs = dgSockets[track]
      if (dgWs && dgWs.readyState === WebSocket.OPEN) {
        dgWs.send(Buffer.from(payload, 'base64'))
      }
    }

    if (msg.event === 'stop') {
      console.log(`[twilio] stop — call=${callSid}`)
      Object.values(dgSockets).forEach((ws) => { try { ws?.close() } catch (_) {} })
    }
  })

  twilioWs.on('close', () => {
    console.log(`[twilio] closed — call=${callSid}`)
    Object.values(dgSockets).forEach((ws) => { try { ws?.close() } catch (_) {} })
  })

  twilioWs.on('error', (e) => console.error('[twilio] ws error', e.message))
})

server.listen(PORT, () => {
  console.log(`[media-bridge] listening on :${PORT}`)
  console.log(`  WS  ws://HOST/twilio       (Twilio Media Streams)`)
  console.log(`  SSE http://HOST/events?callSid=...  (Aetheryx transcript stream)`)
})
