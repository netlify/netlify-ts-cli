# Survey Example

A movie survey form built with TanStack Start and Netlify Forms for Netlify deployment.

## Features

- **Netlify Forms**: Server-side form handling without a backend
- **Movie Selection**: Dropdown with popular movie choices
- **Honeypot Protection**: Spam prevention via hidden field
- **Success Feedback**: Thank-you message after submission

## How It Works

The form uses Netlify's built-in form handling. A hidden HTML file (`public/form-survey.html`) registers the form with Netlify at build time. Submissions are viewable in the Netlify dashboard.

## Development

```bash
npm run dev
```
