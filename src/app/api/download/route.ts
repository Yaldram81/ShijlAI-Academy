import { NextResponse } from 'next/server'
import { execSync, spawnSync } from 'child_process'
import { existsSync, readFileSync, unlinkSync, statSync, mkdirSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'

// Cache the zip file path so we don't regenerate every time
let cachedZipPath: string | null = null
let cachedZipTime = 0
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

export async function GET() {
  try {
    const now = Date.now()
    const useCache = cachedZipPath && existsSync(cachedZipPath) && (now - cachedZipTime) < CACHE_TTL

    if (!useCache) {
      // Generate a new zip
      const projectRoot = process.cwd()
      const tmpZipPath = join(tmpdir(), `shijlai-academy-${now}.zip`)

      const excludeArgs = [
        '-x', 'node_modules/*',
        '-x', '.next/*',
        '-x', '.git/*',
        '-x', '.turbo/*',
        '-x', 'dev.log',
        '-x', 'server.log',
        '-x', '*.zip',
        '-x', 'upload/*',
      ].join(' ')

      // Use spawnSync for better timeout handling
      const result = spawnSync('zip', [
        '-r', '-q', tmpZipPath, '.',
        '-x', 'node_modules/*',
        '-x', '.next/*',
        '-x', '.git/*',
        '-x', '.turbo/*',
        '-x', 'dev.log',
        '-x', 'server.log',
        '-x', '*.zip',
        '-x', 'upload/*',
      ], {
        cwd: projectRoot,
        timeout: 45000,
        maxBuffer: 50 * 1024 * 1024,
      })

      if (result.status !== 0 || !existsSync(tmpZipPath)) {
        throw new Error(`zip failed with status ${result.status}`)
      }

      // Delete old cached zip if exists
      if (cachedZipPath && existsSync(cachedZipPath)) {
        try { unlinkSync(cachedZipPath) } catch {}
      }

      cachedZipPath = tmpZipPath
      cachedZipTime = now
    }

    if (!cachedZipPath || !existsSync(cachedZipPath)) {
      throw new Error('Zip file not found')
    }

    const buffer = readFileSync(cachedZipPath)
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    const filename = `shijlai-academy-${timestamp}.zip`

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('Download error:', error)
    return NextResponse.json(
      { error: 'Failed to create project archive' },
      { status: 500 }
    )
  }
}
