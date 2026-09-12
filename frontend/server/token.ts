import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import path from 'node:path'
import { AccessToken, AgentDispatchClient } from 'livekit-server-sdk'

dotenv.config({ path: path.resolve(process.cwd(), '../.env.local') })

const app = express()
const port = Number(process.env.FRONTEND_TOKEN_PORT ?? 5174)
const livekitUrl = process.env.LIVEKIT_URL
const apiKey = process.env.LIVEKIT_API_KEY
const apiSecret = process.env.LIVEKIT_API_SECRET
const agentName = process.env.LIVEKIT_AGENT_NAME ?? 'my-agent'

app.use(cors())

app.get('/api/token', async (request, response) => {
  const room = String(request.query.room ?? 'voice-avatar').trim()
  if (!room) return response.status(400).json({ error: 'Room name is required' })
  if (!livekitUrl || !apiKey || !apiSecret) {
    return response.status(500).json({ error: 'LIVEKIT_URL, LIVEKIT_API_KEY, and LIVEKIT_API_SECRET are required in ../.env.local' })
  }

  try {
    const identity = `guest-${crypto.randomUUID().slice(0, 8)}`
    const token = new AccessToken(apiKey, apiSecret, { identity, ttl: '1h' })
    token.addGrant({ roomJoin: true, room })
    const dispatchClient = new AgentDispatchClient(livekitUrl.replace(/^wss:/, 'https:'), apiKey, apiSecret)
    let dispatch = undefined
    try {
      const existingDispatches = await dispatchClient.listDispatch(room)
      dispatch = existingDispatches.find((item) => item.agentName === agentName)
    } catch (error) {
      const status = typeof error === 'object' && error !== null && 'status' in error
        ? error.status
        : undefined
      if (status !== 404) throw error
    }
    dispatch ??= await dispatchClient.createDispatch(room, agentName)
    return response.json({ token: await token.toJwt(), url: livekitUrl, dispatchId: dispatch.id })
  } catch (error) {
    console.error(error)
    return response.status(500).json({ error: 'Could not create a LiveKit token' })
  }
})

app.delete('/api/dispatch', async (request, response) => {
  const room = String(request.query.room ?? '').trim()
  const dispatchId = String(request.query.dispatchId ?? '').trim()
  if (!room || !dispatchId) return response.status(400).json({ error: 'Room and dispatch ID are required' })
  if (!livekitUrl || !apiKey || !apiSecret) {
    return response.status(500).json({ error: 'LiveKit credentials are missing' })
  }

  try {
    const dispatchClient = new AgentDispatchClient(livekitUrl.replace(/^wss:/, 'https:'), apiKey, apiSecret)
    await dispatchClient.deleteDispatch(dispatchId, room)
    return response.json({ ok: true })
  } catch (error) {
    console.error(error)
    return response.status(500).json({ error: 'Could not remove the agent dispatch' })
  }
})

app.listen(port, () => {
  console.log(`Token server listening on http://localhost:${port}`)
})
