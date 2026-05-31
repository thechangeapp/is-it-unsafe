import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { MapPin, Loader2 } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Is it Unsafe? — Map Safety for Women" },
      {
        name: "description",
        content:
          "Anonymously rate how safe nearby neighborhoods feel for women and help map safety in your area.",
      },
      { property: "og:title", content: "Is it Unsafe? — Map Safety for Women" },
      {
        property: "og:description",
        content:
          "Anonymously rate how safe nearby neighborhoods feel for women and help map safety in your area.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const [loading, setLoading] = useState(false);

  const handleGrant = () => {
    if (loading) return;
    setLoading(true);
    setTimeout(() => setLoading(false), 2500);
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-5 py-8">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="w-full max-w-sm rounded-3xl border border-white/10 bg-[#0a0a0a] px-8 py-10 text-center sm:px-10 sm:py-12"
      >
        {/* Title */}
        <h1
          id="modal-title"
          className="font-display text-4xl font-medium leading-[1.1] tracking-tight text-white sm:text-5xl"
        >
          Is it <em className="italic font-normal">Unsafe</em>?
        </h1>

        {/* Subtitle */}
        <p className="mt-4 text-[10px] font-medium uppercase tracking-[0.22em] text-zinc-500">
          By Midnight Intelligence &amp; TheChange Initiative
        </p>

        {/* Divider */}
        <div className="mx-auto mt-8 h-px w-10 bg-white/10" />

        {/* Prompt */}
        <p className="mt-8 text-[15px] leading-relaxed text-zinc-300">
          To help map safety, we need to know your general area to find nearby
          neighborhoods.
        </p>

        {/* Button */}
        <button
          type="button"
          onClick={handleGrant}
          disabled={loading}
          className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-[14px] font-medium tracking-wide text-black transition-colors hover:bg-zinc-200 disabled:cursor-not-allowed disabled:bg-zinc-300"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Locating…</span>
            </>
          ) : (
            <>
              <MapPin className="h-4 w-4" strokeWidth={2} />
              <span>Grant Location Access</span>
            </>
          )}
        </button>

        {/* Footer */}
        <p className="mt-8 text-[11px] leading-relaxed text-zinc-600">
          This rating is anonymous. We do not store your location or user data.
        </p>
      </section>
    </main>
  );
}
