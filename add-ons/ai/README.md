# AI Chat Add-on

This add-on provides AI chat capabilities with multi-vendor support for your application.

## Features

- **Chat Page** (`/chat`) - Full-featured chat interface with model selection
- **AI Assistant** - Pop-up assistant available throughout the app
- **Multi-vendor Support** - Works with OpenAI, Anthropic, Gemini, and Ollama

## Setup

Add your API keys to `.env.local`:

```bash
# Anthropic (Claude)
ANTHROPIC_API_KEY=your-key-here

# OpenAI (GPT-4o)
OPENAI_API_KEY=your-key-here

# Google Gemini
GEMINI_API_KEY=your-key-here
```

**Note:** Ollama is available locally without an API key. Install from [ollama.ai](https://ollama.ai).

## Usage

The chat page is available at `/chat`. The AI Assistant button is added to the header and provides a pop-up chat interface available on any page.

## Dependencies

This add-on requires the `start` and `store` add-ons.
