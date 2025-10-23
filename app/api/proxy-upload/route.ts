import { NextRequest, NextResponse } from 'next/server'
import formidable from 'formidable'
import fs from 'fs'
import FormData from 'form-data'

export const config = {
  api: {
    bodyParser: false,
  },
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const printerIP = formData.get('printerIP') as string
    const wsPort = formData.get('wsPort') as string || '3030'

    if (!file || !printerIP) {
      return NextResponse.json(
        { error: 'Missing file or printerIP' },
        { status: 400 }
      )
    }

    // Create a new FormData for the printer
    const printerFormData = new FormData()

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Append the file with proper filename
    printerFormData.append('File', buffer, {
      filename: file.name,
      contentType: file.type || 'application/octet-stream',
    })

    // Upload to printer
    const printerUrl = `http://${printerIP}:${wsPort}/uploadFile/upload`
    const response = await fetch(printerUrl, {
      method: 'POST',
      body: printerFormData,
      headers: printerFormData.getHeaders(),
    })

    if (!response.ok) {
      throw new Error(`Printer upload failed: ${response.statusText}`)
    }

    const data = await response.text()
    return new NextResponse(data, { status: response.status })
  } catch (error: any) {
    console.error('Proxy upload error:', error)
    return NextResponse.json(
      { error: 'Upload failed', details: error.message },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'

