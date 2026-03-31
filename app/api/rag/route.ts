/**
 * RAG Knowledge Base API Route
 * Uses Pinecone for vector storage + OpenAI embeddings
 */

import { NextRequest, NextResponse } from "next/server"

const PINECONE_API_KEY = process.env.PINECONE_API_KEY || ""
const PINECONE_INDEX = process.env.PINECONE_INDEX || "aetheryx-knowledge"
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || ""

// Get embedding from OpenAI
async function getEmbedding(text: string): Promise<number[]> {
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${OPENAI_API_KEY}` },
    body: JSON.stringify({ model: "text-embedding-3-small", input: text }),
  })
  if (!res.ok) throw new Error(`Embedding error: ${res.status}`)
  const data = await res.json()
  return data.data[0].embedding
}

// Get Pinecone host from index
async function getPineconeHost(): Promise<string> {
  const res = await fetch(`https://api.pinecone.io/indexes/${PINECONE_INDEX}`, {
    headers: { "Api-Key": PINECONE_API_KEY },
  })
  if (!res.ok) throw new Error(`Pinecone index lookup failed: ${res.status}`)
  const data = await res.json()
  return data.host
}

function checkKeys() {
  if (!PINECONE_API_KEY) return NextResponse.json({ success: false, error: "PINECONE_API_KEY not configured" }, { status: 500 })
  if (!OPENAI_API_KEY) return NextResponse.json({ success: false, error: "OPENAI_API_KEY not configured" }, { status: 500 })
  return null
}

/**
 * POST /api/rag
 * - { action: "query", text, ragId? } → semantic search
 * - { action: "list", ragId } → list documents (returns metadata)
 * - { action: "upsert", text, metadata } → store a document chunk
 */
export async function POST(request: NextRequest) {
  const keyErr = checkKeys()
  if (keyErr) return keyErr

  try {
    const contentType = request.headers.get("content-type") || ""

    // File upload via form data
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData()
      const file = formData.get("file") as File | null
      const ragId = formData.get("ragId") as string | null

      if (!file) return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 })

      const text = await file.text()
      const chunks = chunkText(text, 500)
      const host = await getPineconeHost()

      const vectors = await Promise.all(
        chunks.map(async (chunk, i) => ({
          id: `${ragId || "doc"}-${Date.now()}-${i}`,
          values: await getEmbedding(chunk),
          metadata: { text: chunk, source: file.name, ragId: ragId || "default", chunk_index: i },
        }))
      )

      // Upsert to Pinecone
      const upsertRes = await fetch(`https://${host}/vectors/upsert`, {
        method: "POST",
        headers: { "Api-Key": PINECONE_API_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ vectors, namespace: ragId || "default" }),
      })

      if (!upsertRes.ok) throw new Error(`Pinecone upsert failed: ${upsertRes.status}`)

      return NextResponse.json({ success: true, chunks_stored: vectors.length, file_name: file.name })
    }

    // JSON body
    const body = await request.json()
    const { action, text, ragId, metadata } = body

    if (action === "query" && text) {
      const embedding = await getEmbedding(text)
      const host = await getPineconeHost()

      const queryRes = await fetch(`https://${host}/query`, {
        method: "POST",
        headers: { "Api-Key": PINECONE_API_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({
          vector: embedding,
          topK: 5,
          includeMetadata: true,
          namespace: ragId || "default",
        }),
      })

      if (!queryRes.ok) throw new Error(`Pinecone query failed: ${queryRes.status}`)
      const results = await queryRes.json()

      return NextResponse.json({
        success: true,
        matches: results.matches?.map((m: any) => ({
          score: m.score,
          text: m.metadata?.text,
          source: m.metadata?.source,
        })) || [],
      })
    }

    if (action === "list") {
      const host = await getPineconeHost()
      const listRes = await fetch(`https://${host}/vectors/list?namespace=${ragId || "default"}&limit=100`, {
        headers: { "Api-Key": PINECONE_API_KEY },
      })
      if (!listRes.ok) throw new Error(`Pinecone list failed: ${listRes.status}`)
      const data = await listRes.json()
      return NextResponse.json({ success: true, documents: data.vectors || [] })
    }

    if (action === "upsert" && text) {
      const embedding = await getEmbedding(text)
      const host = await getPineconeHost()
      const id = `doc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

      const upsertRes = await fetch(`https://${host}/vectors/upsert`, {
        method: "POST",
        headers: { "Api-Key": PINECONE_API_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({
          vectors: [{ id, values: embedding, metadata: { text, ...metadata } }],
          namespace: ragId || "default",
        }),
      })

      if (!upsertRes.ok) throw new Error(`Pinecone upsert failed: ${upsertRes.status}`)
      return NextResponse.json({ success: true, id })
    }

    return NextResponse.json({ success: false, error: "Invalid action. Use: query, list, or upsert" }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "RAG error" }, { status: 500 })
  }
}

/**
 * DELETE /api/rag — delete vectors by namespace
 */
export async function DELETE(request: NextRequest) {
  const keyErr = checkKeys()
  if (keyErr) return keyErr

  try {
    const body = await request.json()
    const { ragId } = body

    if (!ragId) return NextResponse.json({ success: false, error: "ragId required" }, { status: 400 })

    const host = await getPineconeHost()
    const delRes = await fetch(`https://${host}/vectors/delete`, {
      method: "POST",
      headers: { "Api-Key": PINECONE_API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ deleteAll: true, namespace: ragId }),
    })

    if (!delRes.ok) throw new Error(`Pinecone delete failed: ${delRes.status}`)
    return NextResponse.json({ success: true, message: `Namespace ${ragId} cleared` })
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Delete error" }, { status: 500 })
  }
}

function chunkText(text: string, maxChars: number): string[] {
  const sentences = text.split(/(?<=[.!?])\s+/)
  const chunks: string[] = []
  let current = ""
  for (const s of sentences) {
    if ((current + " " + s).length > maxChars && current) {
      chunks.push(current.trim())
      current = s
    } else {
      current = current ? current + " " + s : s
    }
  }
  if (current.trim()) chunks.push(current.trim())
  return chunks
}
