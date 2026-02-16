# Netlify DB Setup

After scaffolding your project with the DB add-on, follow these steps to get Netlify DB running.

## Prerequisites

- A [Netlify](https://www.netlify.com/) account
- The [Netlify CLI](https://docs.netlify.com/cli/get-started/) installed (`npm install -g netlify-cli`)

## 1. Link Your Project to Netlify

If you haven't already, link your local project to a Netlify site:

```sh
netlify login
netlify init
```

Follow the prompts to create a new site or link to an existing one.

## 2. Initialize the Database

Run the Netlify DB initialization command to provision a Postgres database for your site:

```sh
netlify db init
```

This creates a Neon Postgres database attached to your Netlify site and sets the `DATABASE_URL` environment variable automatically.

## 3. Push the Schema to the Database

Use Drizzle Kit to push your schema to the database:

```sh
npx drizzle-kit push
```

This creates the `guestbook` table defined in `src/db/schema.ts`.

## 4. Run the Dev Server

Start local development via the Netlify CLI:

```sh
netlify dev
```

Then visit [http://localhost:8888/db-example](http://localhost:8888/db-example) to see the guestbook demo.

## 5. Deploy

When you're ready, deploy to Netlify:

```sh
netlify deploy --build --prod
```

Or push to your git remote and Netlify will build and deploy automatically if continuous deployment is configured.

## Troubleshooting

- **`DATABASE_URL` not set** — Make sure you've run `netlify db:init` and `netlify env:pull`.
- **Table not found errors** — Run `npx drizzle-kit push` to ensure the schema is applied.
- **Connection errors locally** — Confirm `.env.local` has the correct `DATABASE_URL` and that your IP is not blocked by the Neon project settings.
