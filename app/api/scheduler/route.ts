import { NextRequest, NextResponse } from 'next/server'
import { readFile, writeFile, mkdir } from 'fs/promises'
import path from 'path'

/**
 * Native Scheduler API Route
 * Stores scheduled tasks as JSON files. In production, use Vercel Cron or similar.
 */

const SCHEDULES_DIR = path.join(process.cwd(), '.data', 'schedules')

interface Schedule {
  id: string
  agent_id: string
  cron: string
  message: string
  enabled: boolean
  created_at: string
  updated_at: string
  last_run?: string
  run_count: number
}

async function ensureDir() {
  await mkdir(SCHEDULES_DIR, { recursive: true })
}

async function loadSchedules(): Promise<Schedule[]> {
  await ensureDir()
  try {
    const data = await readFile(path.join(SCHEDULES_DIR, 'schedules.json'), 'utf-8')
    return JSON.parse(data)
  } catch {
    return []
  }
}

async function saveSchedules(schedules: Schedule[]) {
  await ensureDir()
  await writeFile(path.join(SCHEDULES_DIR, 'schedules.json'), JSON.stringify(schedules, null, 2))
}

function generateId(): string {
  return `sched-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

// GET — list schedules
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const agentId = searchParams.get('agent_id')
    const scheduleId = searchParams.get('id')

    let schedules = await loadSchedules()

    if (scheduleId) {
      const s = schedules.find(s => s.id === scheduleId)
      return s
        ? NextResponse.json({ success: true, schedule: s })
        : NextResponse.json({ success: false, error: 'Schedule not found' }, { status: 404 })
    }

    if (agentId) {
      schedules = schedules.filter(s => s.agent_id === agentId)
    }

    return NextResponse.json({ success: true, schedules, total: schedules.length })
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Error' }, { status: 500 })
  }
}

// POST — create schedule
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { agent_id, cron, message, enabled } = body

    if (!agent_id || !cron || !message) {
      return NextResponse.json({ success: false, error: 'agent_id, cron, and message are required' }, { status: 400 })
    }

    const schedules = await loadSchedules()
    const newSchedule: Schedule = {
      id: generateId(),
      agent_id,
      cron,
      message,
      enabled: enabled !== false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      run_count: 0,
    }

    schedules.push(newSchedule)
    await saveSchedules(schedules)

    return NextResponse.json({ success: true, schedule: newSchedule })
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Error' }, { status: 500 })
  }
}

// DELETE — remove schedule
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { id } = body

    if (!id) return NextResponse.json({ success: false, error: 'id required' }, { status: 400 })

    let schedules = await loadSchedules()
    const before = schedules.length
    schedules = schedules.filter(s => s.id !== id)

    if (schedules.length === before) {
      return NextResponse.json({ success: false, error: 'Schedule not found' }, { status: 404 })
    }

    await saveSchedules(schedules)
    return NextResponse.json({ success: true, message: 'Schedule deleted' })
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Error' }, { status: 500 })
  }
}
