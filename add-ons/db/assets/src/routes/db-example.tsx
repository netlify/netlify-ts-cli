import { createFileRoute } from "@tanstack/react-router";
import { useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { getEntries, addEntry } from "@/server/guestbook.functions";

export const Route = createFileRoute("/db-example")({
  loader: async () => {
    const entries = await getEntries();
    return { entries };
  },
  component: DBExample,
});

function DBExample() {
  const { entries } = Route.useLoaderData();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    setIsSubmitting(true);

    const formData = new FormData(form);
    const name = formData.get("name") as string;
    const message = formData.get("message") as string;

    try {
      await addEntry({ data: { name, message } });
      form.reset();
      await router.invalidate();
    } catch (error) {
      console.error("Failed to add entry:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-teal-900 via-emerald-800 to-cyan-900 flex items-center justify-center">
      <div className="w-full max-w-lg px-4 py-12">
        <h1 className="text-4xl md:text-5xl font-black text-white mb-2 tracking-tight">
          Guestbook
        </h1>
        <p className="text-teal-100/80 mb-8">
          Sign the guestbook — powered by Netlify DB with Drizzle ORM.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6 mb-12">
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
              htmlFor="message"
              className="block text-sm font-medium text-teal-200 mb-2"
            >
              Message
            </label>
            <textarea
              id="message"
              name="message"
              required
              rows={3}
              className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-teal-300/50 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent resize-none"
              placeholder="Leave a message..."
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full px-8 py-3 bg-teal-500 hover:bg-teal-600 disabled:bg-teal-500/50 text-white font-semibold rounded-lg transition-colors shadow-lg shadow-teal-500/30"
          >
            {isSubmitting ? "Signing..." : "Sign Guestbook"}
          </button>
        </form>

        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white">
            {entries.length === 0
              ? "No entries yet — be the first!"
              : `${entries.length} ${entries.length === 1 ? "entry" : "entries"}`}
          </h2>

          {entries.map((entry) => (
            <div
              key={entry.id}
              className="rounded-lg bg-white/10 border border-white/10 p-4"
            >
              <div className="flex items-baseline justify-between mb-1">
                <span className="font-semibold text-white">{entry.name}</span>
                <span className="text-xs text-teal-300/60">
                  {new Date(entry.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="text-teal-100/80 text-sm">{entry.message}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
