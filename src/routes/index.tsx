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
    // Simulated for now — no real geolocation yet.
    setTimeout(() => setLoading(false), 2500);
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background bg-app-gradient px-6 py-12">
      {/* Ambient glow orbs */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 -left-24 h-80 w-80 rounded-full opacity-40 blur-3xl"
        style={{ background: "radial-gradient(circle, oklch(0.55 0.18 20 / 0.6), transparent 70%)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 -right-20 h-96 w-96 rounded-full opacity-40 blur-3xl"
        style={{ background: "radial-gradient(circle, oklch(0.4 0.16 340 / 0.6), transparent 70%)" }}
      />

      <section className="relative z-10 w-full max-w-[440px] text-center">
        {/* Title */}
        <h1
          className="font-display text-gradient-rose text-6xl font-medium leading-[1.05] tracking-tight sm:text-7xl animate-fade-in"
          style={{ animationDelay: "0ms", animationFillMode: "both" }}
        >
          Is it <em className="italic">Unsafe</em>?
        </h1>

        {/* Subtitle */}
        <p
          className="mt-4 text-[11px] font-light uppercase tracking-[0.22em] text-muted-foreground animate-fade-in"
          style={{ animationDelay: "120ms", animationFillMode: "both" }}
        >
          by Midnight Intelligence &nbsp;·&nbsp; TheChange Initiative
        </p>

        {/* Glass card */}
        <div
          className="glass mt-10 rounded-2xl px-6 py-5 text-left animate-fade-in"
          style={{ animationDelay: "240ms", animationFillMode: "both" }}
        >
          <p className="text-[15px] leading-relaxed text-foreground/85">
            To help map safety, we need to know your general area to find nearby
            neighborhoods.
          </p>
        </div>

        {/* CTA */}
        <div
          className="mt-6 animate-fade-in"
          style={{ animationDelay: "360ms", animationFillMode: "both" }}
        >
          <button
            type="button"
            onClick={handleGrant}
            disabled={loading}
            className="group relative w-full rounded-full p-[1.5px] bg-gradient-primary shadow-glow transition-transform duration-300 hover:scale-[1.015] active:scale-[0.99] disabled:cursor-not-allowed"
          >
            <span className="flex items-center justify-center gap-2.5 rounded-full bg-background/80 px-6 py-4 text-[15px] font-medium tracking-wide text-foreground backdrop-blur-sm transition-colors group-hover:bg-background/60">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-foreground/80">Locating…</span>
                </>
              ) : (
                <>
                  <MapPin className="h-4 w-4 text-primary" strokeWidth={2.25} />
                  Grant Location Access
                </>
              )}
            </span>
          </button>
        </div>

        {/* Disclaimer */}
        <p
          className="mt-6 text-[11px] leading-relaxed text-muted-foreground/70 animate-fade-in"
          style={{ animationDelay: "480ms", animationFillMode: "both" }}
        >
          This rating is anonymous. We do not store your location or user data.
        </p>
      </section>
    </main>
  );
}
