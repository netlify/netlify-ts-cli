# Ecommerce Example

A motorcycle ecommerce site built with TanStack Start, Stripe checkout, and an AI shopping assistant for Netlify deployment.

## Features

- **Product Catalog**: Motorcycle listings with details and images
- **Stripe Checkout**: Secure payment processing via Stripe
- **AI Shopping Assistant**: Chat-based motorcycle recommendation engine
- **Product Detail Pages**: Individual motorcycle pages with full descriptions
- **Checkout Flow**: Success and cancellation pages

## Project Structure

```
├── src/
│   ├── components/
│   │   ├── BuyButton.tsx              # Stripe checkout trigger
│   │   ├── Header.tsx                 # Custom header with AI toggle
│   │   ├── MotorcycleAIAssistant.tsx  # AI chat panel
│   │   └── MotorcycleRecommendation.tsx
│   ├── data/
│   │   └── motorcycles.ts            # Product data
│   ├── lib/
│   │   ├── motorcycle-ai-hook.ts     # Chat hook
│   │   ├── motorcycle-tools.ts       # AI tools
│   │   └── stripe.server.ts          # Stripe server functions
│   ├── store/
│   │   └── motorcycle-assistant.ts   # UI state
│   └── routes/
│       ├── index.tsx                  # Product listing
│       ├── motorcycles/$motorcycleId.tsx
│       ├── checkout/success.tsx
│       ├── checkout/cancel.tsx
│       └── api.motorcycle-chat.ts
```

## Environment Variables

- `STRIPE_SECRET_KEY` — Stripe secret key for checkout
- `ANTHROPIC_API_KEY` — For AI assistant
- `SITE_URL` — Base URL for checkout redirects (defaults to localhost:3000)

## Development

```bash
npm run dev
```
