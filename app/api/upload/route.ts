import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

/**
 * POST /api/upload
 * Stores uploaded files locally in /public/uploads/ and returns asset references.
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]

    if (!files || files.length === 0) {
      return NextResponse.json({ success: false, error: 'No files provided', asset_ids: [], files: [], total_files: 0, successful_uploads: 0, failed_uploads: 0, message: 'No files provided', timestamp: new Date().toISOString() }, { status: 400 })
    }

    const uploadDir = path.join(process.cwd(), 'public', 'uploads')
    await mkdir(uploadDir, { recursive: true })

    const results: { asset_id: string; file_name: string; success: boolean; error?: string }[] = []

    for (const file of files) {
      try {
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)
        const uniqueName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
        const filePath = path.join(uploadDir, uniqueName)
        await writeFile(filePath, buffer)
        results.push({ asset_id: uniqueName, file_name: file.name, success: true })
      } catch (err) {
        results.push({ asset_id: '', file_name: file.name, success: false, error: err instanceof Error ? err.message : 'Upload failed' })
      }
    }

    const successful = results.filter(r => r.success)
    const failed = results.filter(r => !r.success)

    return NextResponse.json({
      success: failed.length === 0,
      asset_ids: successful.map(r => r.asset_id),
      files: results,
      total_files: files.length,
      successful_uploads: successful.length,
      failed_uploads: failed.length,
      message: `${successful.length}/${files.length} files uploaded`,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json({
      success: false, error: error instanceof Error ? error.message : 'Server error',
      asset_ids: [], files: [], total_files: 0, successful_uploads: 0, failed_uploads: 0,
      message: 'Upload failed', timestamp: new Date().toISOString(),
    }, { status: 500 })
  }
}
