import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const printerIP = searchParams.get('printerIP')
  const videoPort = searchParams.get('videoPort') || '3031'
  const path = searchParams.get('path') || '/video'

  if (!printerIP) {
    return new Response('Missing printerIP parameter', { status: 400 })
  }

  try {
    const videoUrl = `http://${printerIP}:${videoPort}${path}`
    const response = await fetch(videoUrl)

    if (!response.ok) {
      throw new Error(`Failed to fetch video stream: ${response.statusText}`)
    }

    // Stream the video response
    return new Response(response.body, {
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'video/mp4',
        'Cache-Control': 'no-cache',
      },
    })
  } catch (error) {
    console.error('Video proxy error:', error)
    return new Response('Failed to proxy video stream', { status: 500 })
  }
}

export const dynamic = 'force-dynamic'

