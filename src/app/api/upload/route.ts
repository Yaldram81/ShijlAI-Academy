import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir, unlink } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Ensure uploads directory exists
    const uploadDir = join(process.cwd(), 'public', 'uploads')
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // Create unique filename
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
    const extension = file.name.split('.').pop()
    const filename = `${uniqueSuffix}.${extension}`
    const filepath = join(uploadDir, filename)

    // Write file to disk
    await writeFile(filepath, buffer)

    // Calculate file size formatted
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(2)
    const fileSizeFormatted = `${sizeInMB} MB`

    // Return the URL path
    const url = `/uploads/${filename}`

    return NextResponse.json({ 
      success: true, 
      url, 
      fileSizeFormatted,
      duration: 0 // Duration would ideally be parsed here
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const fileUrl = url.searchParams.get('url')

    if (!fileUrl || !fileUrl.startsWith('/uploads/')) {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
    }

    const filename = fileUrl.replace('/uploads/', '')
    const filepath = join(process.cwd(), 'public', 'uploads', filename)

    if (existsSync(filepath)) {
      await unlink(filepath)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 })
  }
}
