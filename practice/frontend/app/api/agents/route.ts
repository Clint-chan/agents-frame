export const runtime = 'nodejs'

export async function GET() {
  const backend = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'
  try {
    const resp = await fetch(`${backend}/chat/agents`, { cache: 'no-store' })
    const text = await resp.text()
    return new Response(text, {
      status: resp.status,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (e: any) {
    return Response.json({ code: 500, message: e?.message || 'proxy failed' }, { status: 500 })
  }
}

