# E-commerce Example

An AI-powered motorcycle e-commerce store built with TanStack Start and TanStack AI for Netlify deployment.

## Features

- **AI Chat Assistant**: Powered by TanStack AI with Anthropic Claude
- **Product Catalog**: Browse Luna-C motorcycle inventory
- **Smart Recommendations**: AI can recommend motorcycles based on your needs
- **SSR Ready**: Full server-side rendering with TanStack Start

## Project Structure

```
├── src/
│   ├── components/
│   │   ├── AIAssistant.tsx           # Chat panel component
│   │   ├── Header.tsx                # Navigation with AI button
│   │   └── MotorcycleRecommendation.tsx  # Product card for AI
│   ├── data/
│   │   └── motorcycles.ts            # Product inventory
│   ├── lib/
│   │   ├── ai-hook.ts                # useMotorcycleChat hook
│   │   └── motorcycle-tools.ts       # AI tool definitions
│   ├── store/
│   │   └── assistant.ts              # UI state with TanStack Store
│   └── routes/
│       ├── __root.tsx                # Root layout
│       ├── index.tsx                 # Product listing
│       ├── motorcycles/$motorcycleId.tsx  # Product detail
│       └── api.motorcycle-chat.ts    # Chat API endpoint
└── public/
    └── *.jpg                         # Product images
```

## AI Chat Features

The AI assistant can:
- Answer questions about motorcycles
- Recommend bikes based on your preferences (budget, experience level, riding style)
- Display product cards directly in the chat
- Help you find the perfect motorcycle

## Environment Variables

Create a `.env.local` file with your Anthropic API key:

```
ANTHROPIC_API_KEY=your_api_key_here
```

## Development

```bash
# Start development server
npm run dev

# Build for production
npm run build
```
