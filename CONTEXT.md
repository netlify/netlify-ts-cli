# Netlify CTA - Project Context

## Overview

`netlify-cta` is a custom CLI application that creates TanStack Start applications pre-configured for Netlify deployment. It's based on the `create-rwsdk` example pattern but builds TanStack Start apps instead of Redwood SDK apps.

## What Was Built

### CLI Structure

```
./
├── package.json              # CLI package (workspace:* deps)
├── tsconfig.json             # TypeScript config
├── src/
│   └── index.ts              # CLI entry point
├── project/
│   ├── packages.json         # Conditional dependencies
│   └── base/
│       ├── package.json      # Base project dependencies
│       ├── vite.config.ts    # Vite + Start + Netlify + Tailwind
│       ├── tsconfig.json     # TypeScript config
│       ├── netlify.toml      # Netlify deployment config
│       ├── _dot_gitignore    # Git ignore (becomes .gitignore)
│       ├── public/
│       │   └── favicon.ico
│       └── src/
│           ├── styles.css    # Tailwind CSS imports
│           ├── router.tsx    # TanStack Router config
│           └── routes/
│               ├── __root.tsx   # Root layout with SSR shell
│               └── index.tsx    # Home page - "Hello from Netlify"
└── add-ons/
    └── _dot_gitkeep          # Placeholder for future add-ons
```

### Key Features

1. **TanStack Start**: Full SSR support with `@tanstack/react-start`
2. **Netlify Deployment**: Pre-configured with `@netlify/vite-plugin-tanstack-start`
3. **Tailwind CSS**: Installed and configured out of the box
4. **File-based Routing**: Uses TanStack Router's file-based routing (TypeScript enforced)
5. **Minimal Setup**: Just a home route saying "Hello from Netlify" - no demo routes

### Framework Registration

The CLI registers a framework called "Netlify TanStack Start" with:
- ID: `netlify-start`
- Single mode: `file-router` (TypeScript enforced)
- No customized UI (uses default CTA UI)

## Usage

## Dependencies

### CLI Dependencies
- `@tanstack/cta-cli`: workspace:*
- `@tanstack/cta-engine`: workspace:*

### Generated Project Dependencies
- `@tanstack/react-start`: ^1.132.0
- `@tanstack/react-router`: ^1.132.0
- `@netlify/vite-plugin-tanstack-start`: ^1.2.3
- `tailwindcss`: ^4.0.6
- `react`: ^19.2.0
- `vite`: ^7.1.7

## Files Reference

### src/index.ts
Registers the framework and starts the CLI. Key points:
- Scans `project/` directory for base files
- Scans `add-ons/` directory for add-ons (currently empty)
- Registers single "file-router" mode with forced TypeScript

### project/base/vite.config.ts
Configures Vite with:
- `@tanstack/devtools-vite` - TanStack devtools
- `vite-tsconfig-paths` - Path alias support
- `@tailwindcss/vite` - Tailwind CSS
- `@netlify/vite-plugin-tanstack-start` - Netlify deployment
- `@tanstack/react-start/plugin/vite` - TanStack Start
- `@vitejs/plugin-react` - React support

### project/base/src/routes/__root.tsx
Root layout using TanStack Start's `shellComponent` for SSR:
- Sets up HTML document structure
- Configures head meta tags
- Includes TanStack devtools
- Renders children with Scripts for hydration

### project/base/src/routes/index.tsx
Simple home page with:
- Teal/cyan gradient background
- "Hello from Netlify" heading
- Links to TanStack Start and Netlify docs
- Edit instruction pointing to the file

## Examples

Four example applications are included:

### Blog Example (`examples/blog/`)
A Hawaii adventures travel blog built with content-collections and shadcn UI components.
- Content-collections for markdown blog posts
- Category-based navigation
- Postcard-style blog cards with beautiful UI
- Routes: `/`, `/posts/$slug`, `/category/$category`

### Events Example (`examples/events/`)
A pastry conference website ("Haute Pâtisserie 2026") with speakers, sessions, schedule, and AI assistant.
- Content-collections for speakers and talks markdown content
- Conference schedule with day-by-day timeline
- AI-powered chat assistant (Remy) for conference navigation
- Beautiful dark theme with Playfair Display font and copper/gold accents
- Routes: `/`, `/schedule`, `/speakers`, `/speakers/$slug`, `/talks`, `/talks/$slug`, `/api/remy-chat`

### Marketing Example (`examples/marketing/`)
An AI-powered motorcycle marketing site with TanStack AI chat assistant.
- TanStack AI for intelligent chat
- TanStack Store for state management
- Motorcycle product catalog
- AI-powered product recommendations
- Routes: `/`, `/motorcycles/$motorcycleId`, `/api/motorcycle-chat`

### Resume Example (`examples/resume/`)
A professional resume template with content-collections and shadcn UI components.
- Content-collections for jobs and education
- Interactive skills filter sidebar
- Multiple shadcn UI components (badge, card, checkbox, hover-card, separator)
- Routes: `/`

## Future Enhancements

Potential additions:
- Add-ons for common Netlify features (Functions, Edge Functions, Blobs)
- Authentication add-ons (Netlify Identity)
- Database add-ons (Netlify DB, Supabase, etc.)
- Customized UI with Netlify branding
