export const runtime = 'edge'

export const dynamic = 'force-dynamic'

export const fetchCache = 'force-no-store'

import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  let agentId = process.env.AGENT_ID
  let apiKey = process.env.XI_API_KEY
  try {
    const body = await request.json()
    if (body.apiKey) apiKey = body.apiKey
    if (body.agentId) agentId = body.agentId
  } catch {
    // Ignore parsing errors and use default values
  }
  if (!agentId) throw Error('AGENT_ID is not set or received.')
  if (!apiKey) throw Error('XI_API_KEY is not set or received.')
  try {
    const apiUrl = new URL('https://api.elevenlabs.io/v1/convai/conversation/get_signed_url')
    apiUrl.searchParams.set('agent_id', agentId)
    const response = await fetch(apiUrl.toString(), {
      headers: { 'xi-api-key': apiKey },
    })
    if (!response.ok) throw new Error(response.statusText)
    const data = await response.json()
    return NextResponse.json({ apiKey: data.signed_url })
  } catch (err) {
    // @ts-expect-error - Error may not have message property
    const message = err.message || err.toString()
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// The WebSocket line is not needed in the API route, so we'll remove it
// If it's required in the future, we should properly declare and initialize it
