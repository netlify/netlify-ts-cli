# AI Chat Example

A weather chat assistant built with TanStack Start and TanStack AI for Netlify deployment.

## Features

- **AI Chat Interface**: Conversational weather assistant with streaming responses
- **Multi-Provider Support**: Works with Anthropic, OpenAI, Gemini, or Ollama
- **Tool Calling**: AI uses a getWeather tool to fetch weather data
- **Markdown Rendering**: Rich message formatting with syntax highlighting

## Project Structure

```
├── src/
│   ├── lib/
│   │   ├── ai-hook.ts          # Chat hook setup
│   │   └── weather-tools.ts    # Weather tool definition
│   └── routes/
│       ├── __root.tsx           # Root layout
│       ├── index.tsx            # Chat UI
│       └── api.chat.ts          # Chat API endpoint
```

## Development

```bash
npm run dev
```

Set one of these environment variables to use a cloud provider:
- `ANTHROPIC_API_KEY`
- `OPENAI_API_KEY`
- `GEMINI_API_KEY`

Falls back to Ollama (local) if no API key is set.
