# Portfolio Example

A developer portfolio built with TanStack Start, content-collections, and AI resume assistant for Netlify deployment.

## Features

- **Blog**: Markdown-driven blog with tag filtering
- **Resume**: Interactive resume with skill-based filtering and AI assistant
- **Projects**: Project showcase with GitHub and live demo links
- **Contact Form**: Netlify Forms integration
- **Content Collections**: Markdown files for jobs, education, blog posts, and projects
- **AI Resume Assistant**: Chat-based candidate evaluation tool

## Project Structure

```
├── content/
│   ├── blog/           # Blog posts (markdown)
│   ├── education/      # Education history
│   ├── jobs/           # Work experience
│   └── projects/       # Project descriptions
├── src/
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── ResumeAssistant.tsx
│   │   └── ui/         # shadcn/ui components
│   ├── lib/
│   │   ├── resume-ai-hook.ts
│   │   ├── resume-tools.ts
│   │   └── utils.ts
│   └── routes/
│       ├── index.tsx          # Blog listing
│       ├── resume.tsx         # Resume page
│       ├── projects.tsx       # Projects page
│       ├── contact.tsx        # Contact form
│       ├── blog/$slug.tsx     # Blog post detail
│       └── api.resume-chat.ts # AI chat endpoint
```

## Development

```bash
npm run dev
```

Set one of these environment variables for the AI assistant:
- `ANTHROPIC_API_KEY`
- `OPENAI_API_KEY`
- `GEMINI_API_KEY`
