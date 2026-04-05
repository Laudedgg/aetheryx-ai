import { NextRequest, NextResponse } from 'next/server'
import { readFile, writeFile, mkdir } from 'fs/promises'
import path from 'path'

/**
 * Server-side call history storage
 * GET  /api/calls — returns all calls
 * POST /api/calls — saves/syncs call history
 */

const DATA_DIR = path.join(process.cwd(), '.data')
const CALLS_FILE = path.join(DATA_DIR, 'call-history.json')

async function loadCalls(): Promise<any[]> {
  try {
    await mkdir(DATA_DIR, { recursive: true })
    const data = await readFile(CALLS_FILE, 'utf-8')
    return JSON.parse(data)
  } catch {
    return []
  }
}

async function saveCalls(calls: any[]) {
  await mkdir(DATA_DIR, { recursive: true })
  await writeFile(CALLS_FILE, JSON.stringify(calls, null, 2))
}

export async function GET() {
  const calls = await loadCalls()
  return NextResponse.json({ success: true, calls })
}

export async function POST(request: NextRequest) {
  try {
    const { calls } = await request.json()
    if (!Array.isArray(calls)) {
      return NextResponse.json({ success: false, error: 'calls must be an array' }, { status: 400 })
    }

    // Merge: server calls + incoming calls, deduplicate by id
    const existing = await loadCalls()
    const merged = new Map<string, any>()
    for (const c of existing) merged.set(c.id, c)
    for (const c of calls) merged.set(c.id, c) // incoming overwrites
    const final = Array.from(merged.values()).sort((a, b) => {
      return new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    })

    await saveCalls(final)
    return NextResponse.json({ success: true, count: final.length })
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Error' }, { status: 500 })
  }
}
