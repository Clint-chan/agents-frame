import type { NextRequest } from 'next/server'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const backend = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'
  try {
    // 直接透传请求体，保持与后端兼容
    const bodyText = await req.text()
    const resp = await fetch(`${backend}/chat/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: bodyText,
    })

    // 将后端的 SSE 流直接转发给前端
    return new Response(resp.body, {
      status: resp.status,
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    })
  } catch (e: any) {
    return new Response(`data: ${JSON.stringify({ type: 'error', content: e?.message || 'proxy failed' })}\n\n`, {
      status: 500,
      headers: { 'Content-Type': 'text/event-stream' },
    })
  }
}

