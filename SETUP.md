# Voice Avatar Setup Guide

This project is Harry's Buddy, a LiveKit personal teacher for Harry with an Anam video avatar and a local React web interface.

The browser opens directly into the `voice-avatar` room. It does not require a login. When the agent joins, Harry's Buddy greets Harry automatically.

## What This Project Contains

```text
my-agent/
|-- src/agent.py                 Python voice agent and Anam integration
|-- tests/test_agent.py          Agent evaluation tests
|-- frontend/
|   |-- src/App.tsx              React application and LiveKit room UI
|   |-- src/index.css            Application styling
|   |-- server/token.ts          Secure token creation and agent dispatch
|   |-- vite.config.ts           Vite dev server and API proxy
|   |-- package.json              Frontend dependencies and scripts
|-- .env.local                  Local secrets; never commit this file
|-- pyproject.toml              Python dependencies and tool configuration
|-- uv.lock                     Locked Python dependency versions
|-- Dockerfile                  Production agent container
```

## Requirements

Install these tools on Windows:

- Python 3.10 through 3.14
- `uv` for Python environments and dependencies
- Node.js and npm for the web app
- A LiveKit Cloud project
- An Anam account, API key, and avatar ID

Check the installations from PowerShell:

```powershell
python --version
uv --version
node --version
npm --version
```

The project was developed with Python 3.14, Node.js 24, npm 11, and `uv`.

## Credentials

### LiveKit

Create or open a project at [LiveKit Cloud](https://cloud.livekit.io/). Copy:

- Project WebSocket URL, for example `wss://your-project.livekit.cloud`
- API key
- API secret

### Anam

1. Create an account at [Anam Lab](https://lab.anam.ai/).
2. Create an API key at [Anam API Keys](https://lab.anam.ai/api-keys).
3. Choose a stock avatar from the [Anam Avatar Gallery](https://docs.anam.ai/resources/avatar-gallery), or create a custom avatar in Anam Lab.
4. Copy the avatar ID.

The avatar ID is passed to Anam as `PersonaConfig.avatarId`.

## Environment File

Create this file at the Python project root:

```text
C:\AI_Projects\voice\voice avatar\my-agent\.env.local
```

Use this shape and replace every placeholder with a real value:

```env
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_API_SECRET=your_livekit_api_secret
ANAM_API_KEY=your_anam_api_key
ANAM_AVATAR_ID=your_anam_avatar_id
AVATAR_PROVIDER=simli
```

Optional values:

```env
LIVEKIT_AGENT_NAME=my-agent
FRONTEND_TOKEN_PORT=5174
TTS_MODEL=fishaudio/s2.1-pro
TTS_VOICE=fa4c9eb3dccc4806b382b40d61c6b10a
SIMLI_API_KEY=your_simli_api_key
SIMLI_FACE_ID=your_simli_face_id
```

Do not add quotes unless the value itself requires them. Do not share this file or commit it. The repository ignores `.env` and `.env.*` files. On Windows, `chmod` is not needed.

## Change The Voice

The voice is selected by `TTS_MODEL` and `TTS_VOICE` in `.env.local`. The current default is Fish Audio:

```env
TTS_MODEL=fishaudio/s2.1-pro
TTS_VOICE=fa4c9eb3dccc4806b382b40d61c6b10a
```

Replace `TTS_VOICE` with a voice ID supported by the selected LiveKit Inference TTS model. You can browse available providers and voices in the [LiveKit TTS model documentation](https://docs.livekit.io/agents/models/tts/). Restart the Python agent after changing the value:

```powershell
uv run python src/agent.py dev
```

## Change The Avatar Provider

Set the provider in `.env.local`:

```env
AVATAR_PROVIDER=anam
```

Supported values are:

- `anam`: uses `ANAM_API_KEY` and `ANAM_AVATAR_ID`
- `simli`: uses `SIMLI_API_KEY` and `SIMLI_FACE_ID`

For Simli, create an API key at [Simli API keys](https://app.simli.com/apikey) and choose a face from [Simli faces](https://app.simli.com/create/from-existing). Then configure:

```env
AVATAR_PROVIDER=simli
SIMLI_API_KEY=your_simli_api_key
SIMLI_FACE_ID=your_simli_face_id
```

Restart the Python agent after changing the provider. The React frontend supports either provider automatically because both publish their video through LiveKit.

## Install Dependencies

Open PowerShell in the project directory:

```powershell
Set-Location "C:\AI_Projects\voice\voice avatar\my-agent"
```

Install Python dependencies:

```powershell
uv sync
```

This creates or updates `.venv` and installs the packages declared in `pyproject.toml`, including:

- `livekit-agents[anam]`
- `livekit-plugins-ai-coustics`
- `python-dotenv`
- Development tools: `pytest`, `pytest-asyncio`, and `ruff`

Install frontend dependencies:

```powershell
Set-Location frontend
npm install
```

The frontend installs these runtime packages:

- `react` and `react-dom`
- `@livekit/components-react`
- `livekit-client`
- `express`
- `livekit-server-sdk`
- `cors`
- `dotenv`

The development packages include TypeScript, Vite, React types, Express types, and `tsx`.

## Run Locally

Use three PowerShell terminals. Keep all three running.

### Terminal 1: Python agent

```powershell
uv run --directory "C:\AI_Projects\voice\voice avatar\my-agent" python src/agent.py dev
```

A successful startup includes messages like:

```text
plugin registered ... livekit.plugins.anam
registered worker ... agent_name: my-agent
```

The `dev` command is currently supported by this project version. LiveKit also reports that `lk agent dev` is the newer CLI command.

### Terminal 2: Token and dispatch server

```powershell
Set-Location "C:\AI_Projects\voice\voice avatar\my-agent\frontend"
npm run server
```

Expected output:

```text
Token server listening on http://localhost:5174
```

This server does two important things:

1. Creates a short-lived LiveKit token for the browser.
2. Explicitly dispatches the registered `my-agent` worker into the requested room.

The LiveKit API secret is used only by this server and is never bundled into React.

### Terminal 3: React frontend

```powershell
Set-Location "C:\AI_Projects\voice\voice avatar\my-agent\frontend"
npm run dev -- --host 127.0.0.1
```

Open:

```text
http://127.0.0.1:5173/
```

The app automatically requests a token and connects to the fixed `voice-avatar` room. No login or room form is required.

## User Flow

1. The browser loads the React app.
2. React requests `/api/token?room=voice-avatar`.
3. The token server creates a guest identity and dispatches `my-agent`.
4. The browser joins LiveKit with microphone audio enabled and camera disabled.
5. The Python agent joins the same room.
6. The Python agent starts the STT, LLM, TTS, turn detector, and noise cancellation pipeline.
7. Anam creates a session and joins as `anam-avatar-agent`.
8. The frontend renders only the Anam camera track, so the user's webcam cannot cover the avatar.
9. The agent says: `Hello, I am here. How can I help you today?`

## Main Components

### Python agent

`src/agent.py` configures:

- LLM: LiveKit Inference Gemma
- STT: AssemblyAI Universal
- TTS: Fish Audio
- Turn detection: LiveKit turn detector
- Noise cancellation: AI Coustics
- Avatar: Anam
- Greeting: `Hi Harry, I am your Buddy. What would you like to learn today?`

The Anam integration uses:

```python
anam.AvatarSession(
    persona_config=anam.PersonaConfig(
        name="Voice Assistant",
        avatarId=os.getenv("ANAM_AVATAR_ID"),
    ),
)
```

### React frontend

`frontend/src/App.tsx` provides:

- Automatic connection on first load
- A child-friendly learning-room layout branded as Harry's Buddy
- An Anam-only video stage
- LiveKit audio playback
- End conversation and reconnect controls
- A fixed `voice-avatar` room

### Token server

`frontend/server/token.ts` reads the root `.env.local`, creates a guest token, and uses `AgentDispatchClient` to dispatch `my-agent` into the room. Never move the API secret into a `VITE_` environment variable or frontend source file.

## Validation Commands

Build the frontend:

```powershell
Set-Location "C:\AI_Projects\voice\voice avatar\my-agent\frontend"
npm run build
```

Run frontend linting:

```powershell
npm run lint
```

Check Python syntax and linting:

```powershell
Set-Location "C:\AI_Projects\voice\voice avatar\my-agent"
uv run python -m py_compile src/agent.py
uv run ruff check src/agent.py
```

Run the Python evaluation suite:

```powershell
uv run pytest
```

The evaluation tests may call LiveKit-hosted models, so valid credentials and network access are required.

## Troubleshooting

### The page does not open

Confirm the Vite terminal shows:

```text
Local: http://127.0.0.1:5173/
```

If port `5173` is busy, Vite will select another port and print it in the terminal.

### The page says it cannot connect

Confirm the token server is running on port `5174` and that the three LiveKit variables exist in `.env.local`.

### The page is waiting for the avatar

Check the Python agent terminal for all of these:

```text
plugin registered ... livekit.plugins.anam
registered worker ... agent_name: my-agent
received job request ... room: voice-avatar
Anam session token created successfully
Starting Anam engine session
```

If `received job request` never appears, restart the token server and refresh the browser. The token endpoint performs the explicit agent dispatch.

If the Anam session token fails, check `ANAM_API_KEY` and `ANAM_AVATAR_ID`.

### The browser shows the user's camera

The frontend intentionally sets `video={false}` and filters video to the `anam-avatar-agent` identity. Refresh the page after frontend changes and reconnect.

### The assistant speaks but the avatar is not visible

The voice agent and avatar are separate LiveKit participants. Check the browser console and the Python logs for Anam session errors. Confirm that the frontend is connected to the same LiveKit project as the Python agent.

### Audio is delayed or empty

LiveKit Inference services can temporarily return connection or quota errors. Restart the agent and try again. The turn detector can fall back to a local model when the cloud detector quota is exceeded.

### The agent command exits with code 1

Run it from the project directory or use the absolute `uv --directory` form:

```powershell
uv run --directory "C:\AI_Projects\voice\voice avatar\my-agent" python src/agent.py dev
```

Read the final error lines. Common causes are missing environment variables, an invalid Anam key, or an invalid avatar ID.

## Stopping Everything

Press `Ctrl+C` in each of the three running terminals:

1. Vite frontend
2. Token server
3. Python agent

## Production Notes

The local token server is intended for development. For production:

- Run the token endpoint behind HTTPS.
- Store LiveKit and Anam secrets in a managed secret store.
- Restrict CORS to the deployed frontend origin instead of allowing every origin.
- Use a production LiveKit agent deployment rather than the local `dev` command.
- Use a real authentication and authorization layer if rooms are private.
- Keep `uv.lock` and `frontend/package-lock.json` under version control for reproducible installs.

## Useful Links

- [LiveKit Cloud](https://cloud.livekit.io/)
- [LiveKit Agents for Python](https://docs.livekit.io/agents/)
- [LiveKit Anam integration](https://docs.livekit.io/agents/models/avatar/plugins/anam/)
- [Anam Lab](https://lab.anam.ai/)
- [Anam avatar gallery](https://docs.anam.ai/resources/avatar-gallery)
