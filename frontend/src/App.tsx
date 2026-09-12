import { useEffect, useRef, useState } from 'react'
import {
  LiveKitRoom,
  RoomAudioRenderer,
  VideoTrack,
  useTracks,
} from '@livekit/components-react'
import { Track } from 'livekit-client'
import './index.css'

function App() {
  const roomName = 'voice-avatar'
  const [token, setToken] = useState<string>()
  const [serverUrl, setServerUrl] = useState<string>()
  const [dispatchId, setDispatchId] = useState<string>()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const hasStarted = useRef(false)

  useEffect(() => {
    if (!hasStarted.current) {
      hasStarted.current = true
      void connect()
    }
  }, [])

  async function connect() {
    setIsLoading(true)
    setError('')
    try {
      const response = await fetch(`/api/token?room=${encodeURIComponent(roomName)}`)
      const data = await response.json()
      if (!response.ok) throw new Error(data.error ?? 'Could not get a room token')
      setToken(data.token)
      setServerUrl(data.url)
      setDispatchId(data.dispatchId)
    } catch (connectionError) {
      setError(connectionError instanceof Error ? connectionError.message : 'Connection failed')
    } finally {
      setIsLoading(false)
    }
  }

  async function disconnect() {
    if (dispatchId) {
      await fetch(`/api/dispatch?room=${encodeURIComponent(roomName)}&dispatchId=${encodeURIComponent(dispatchId)}`, { method: 'DELETE' })
    }
    setToken(undefined)
    setServerUrl(undefined)
    setDispatchId(undefined)
  }

  return (
    <main className="shell">
      <section className="app-content">
        <header className="app-header">
          <div className="brand-lockup"><span className="brand-mark">HB</span><div><p className="section-kicker">PERSONAL TEACHER</p><h1>Harry's Buddy</h1></div></div>
          <div className="session-status"><span className={`status-dot ${token ? 'live' : ''}`} />{token ? 'Connected' : 'Ready'}</div>
        </header>

        <div className="session-layout">
          <div className="stage-wrap">
            <div className="stage-label"><span>LIVE SESSION</span><span>{token ? 'LISTENING' : 'STANDBY'}</span></div>
          {token && serverUrl ? (
            <LiveKitRoom
              token={token}
              serverUrl={serverUrl}
              connect
              audio={{ echoCancellation: true, noiseSuppression: true, autoGainControl: true }}
              video={false}
              onDisconnected={disconnect}
            >
              <AvatarStage />
              <RoomAudioRenderer />
            </LiveKitRoom>
          ) : (
            <EmptyStage message="Buddy is ready" detail="Start a conversation" />
          )}
          </div>

          <aside className="session-card">
            <div className="icon-controls" aria-label="Conversation controls">
              <button className="icon-button start" type="button" onClick={connect} disabled={Boolean(token) || isLoading} aria-label="Connect" title="Connect">▶</button>
              <button className="icon-button stop" type="button" onClick={disconnect} disabled={!token} aria-label="Disconnect" title="Disconnect">■</button>
            </div>
            {error && <p className="error">{error}</p>}
          </aside>
        </div>

        <footer><span>HARRY'S BUDDY</span><span>PRIVATE SESSION</span></footer>
      </section>
    </main>
  )
}

function AvatarStage() {
  const avatarIdentities = new Set(['anam-avatar-agent', 'simli-avatar-agent'])
  const cameraTracks = useTracks([Track.Source.Camera]).filter(
    (track) => avatarIdentities.has(track.participant.identity),
  )

  return (
    <div className="video-stage">
      {cameraTracks.length > 0 ? cameraTracks.map((track) => (
        <VideoTrack key={track.publication?.trackSid ?? track.participant.identity} trackRef={track} />
      )) : <EmptyStage message="Waiting for your avatar" detail="Anam is joining the room" />}
    </div>
  )
}

function EmptyStage({ message, detail }: { message: string; detail: string }) {
  return <div className="empty-stage"><div><div className="silhouette">◌</div><p>{message}</p><span>{detail}</span></div></div>
}

export default App
