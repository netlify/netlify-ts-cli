# Netlify CTA

Create TanStack Start applications for Netlify.

## Installation

Install dependencies using pnpm:

```bash
pnpm install
```

## Build

Build the project by compiling TypeScript:

```bash
pnpm build
```

Or using npm:

```bash
npm run build
```

This will compile the TypeScript source files from `src/` to `dist/`.

## Running

After building, you can run the CLI tool using:

```bash
node dist/index.js
```

Or if running from a different directory context:

```bash
node ../netlify-cta/dist/index.js
```

If you need to specify the package manager user agent:

```bash
npm_config_user_agent=pnpm node ../netlify-cta/dist/index.js
```
