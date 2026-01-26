# Blog Example

A Hawaii adventures travel blog built with TanStack Start and content-collections for Netlify deployment.

## Features

- **Content Collections**: Blog posts managed as markdown files with frontmatter
- **Category Navigation**: Filter posts by category (Relaxing, Hiking)
- **Beautiful UI**: Postcard-style blog cards with shadcn/ui components
- **SSR Ready**: Full server-side rendering with TanStack Start

## Project Structure

```
├── content/
│   └── posts/           # Markdown blog posts
├── src/
│   ├── components/
│   │   ├── blog-posts.tsx    # Blog post grid
│   │   ├── Header.tsx        # Navigation header
│   │   └── ui/
│   │       └── card.tsx      # Shadcn card component
│   ├── lib/
│   │   └── utils.ts          # Utility functions
│   └── routes/
│       ├── __root.tsx        # Root layout
│       ├── index.tsx         # Home page
│       ├── posts.$slug.tsx   # Individual post
│       └── category.$category.tsx  # Category filter
└── public/
    └── *.jpg                 # Blog images
```

## Adding Blog Posts

Create a new markdown file in `content/posts/` with the following frontmatter:

```markdown
---
date: 2025-03-01
title: "Your Post Title"
summary: "A brief summary of your post"
categories:
  - Category1
  - Category2
image: your-image.jpg
---

Your post content here...
```

## Development

```bash
# Start development server
npm run dev

# Build for production
npm run build
```
