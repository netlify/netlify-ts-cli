import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/form-example')({
  component: FormExample,
})

function FormExample() {
  return (
    <div className="min-h-screen bg-linear-to-br from-teal-900 via-emerald-800 to-cyan-900 flex items-center justify-center">
      <div className="w-full max-w-md px-4">
        <h1 className="text-4xl md:text-5xl font-black text-white mb-2 tracking-tight">
          Sign up
        </h1>
        <p className="text-teal-100/80 mb-8">
          Enter your name and email to get started.
        </p>

        <form
          name="signup"
          method="POST"
          data-netlify="true"
          netlify-honeypot="bot-field"
          className="space-y-6"
        >
          <input type="hidden" name="form-name" value="signup" />
          <p className="hidden" style={{ display: 'none' }}>
            <label>
              Don&apos;t fill this out: <input name="bot-field" />
            </label>
          </p>

          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-teal-200 mb-2"
            >
              Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-teal-300/50 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
              placeholder="Your name"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-teal-200 mb-2"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-teal-300/50 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
              placeholder="you@example.com"
            />
          </div>

          <button
            type="submit"
            className="w-full px-8 py-3 bg-teal-500 hover:bg-teal-600 text-white font-semibold rounded-lg transition-colors shadow-lg shadow-teal-500/30"
          >
            Submit
          </button>
        </form>
      </div>
    </div>
  )
}
