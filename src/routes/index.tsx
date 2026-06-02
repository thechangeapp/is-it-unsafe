import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MapPin, Loader2, Check } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { AnimatePresence, motion } from "framer-motion";
import { getNearbyAreas } from "@/lib/areas.functions";
import { saveRatings } from "@/lib/ratings.functions";

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
  type Status =
    | "idle"
    | "locating"
    | "fetching"
    | "success"
    | "saving"
    | "saveError"
    | "done"
    | "error";
  type Rating = { area: string; rating: number };
  const [status, setStatus] = useState<Status>("idle");
  const [areas, setAreas] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [index, setIndex] = useState(0);
  const fetchAreas = useServerFn(getNearbyAreas);
  const persistRatings = useServerFn(saveRatings);

  const loading = status === "locating" || status === "fetching";

  const submitRatings = async (toSave: Rating[]) => {
    setStatus("saving");
    try {
      await persistRatings({
        data: {
          ratings: toSave.map((r) => ({ area_name: r.area, rating: r.rating })),
        },
      });
      setStatus("done");
    } catch (err) {
      console.error(err);
      setErrorMsg(
        err instanceof Error && err.message
          ? err.message
          : "Couldn't save your ratings. Please try again.",
      );
      setStatus("saveError");
    }
  };

  const handleGrant = () => {
    if (loading) return;
    setErrorMsg("");
    setStatus("locating");

    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setErrorMsg("Geolocation is not supported on this device.");
      setStatus("error");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setStatus("fetching");
        try {
          const result = await fetchAreas({
            data: { lat: pos.coords.latitude, lon: pos.coords.longitude },
          });
          setAreas(result.areas);
          setRatings([]);
          setIndex(0);
          setStatus("success");
        } catch (err) {
          console.error(err);
          setErrorMsg(
            err instanceof Error && err.message
              ? `Couldn't load nearby areas. ${err.message}`
              : "Couldn't load nearby areas. Please try again.",
          );
          setStatus("error");
        }
      },
      (geoErr) => {
        if (geoErr.code === geoErr.PERMISSION_DENIED) {
          setErrorMsg("Location access is required to find nearby areas.");
        } else if (geoErr.code === geoErr.TIMEOUT) {
          setErrorMsg("Location request timed out. Please try again.");
        } else {
          setErrorMsg("Couldn't determine your location. Please try again.");
        }
        setStatus("error");
      },
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 },
    );
  };

  if (status === "success") {
    const current = areas[index];
    const done = index >= areas.length;

    const handleRate = (rating: number) => {
      if (!current) return;
      const next = [...ratings, { area: current, rating }];
      setRatings(next);
      setIndex((i) => i + 1);
      if (next.length >= areas.length) {
        void submitRatings(next);
      }
    };

    return (
      <main className="relative flex min-h-screen flex-col items-center justify-between overflow-hidden bg-black px-5 pt-10 pb-12 sm:pt-14">
        {/* Breathing dark-blue ambient layer */}
        <div aria-hidden className="pointer-events-none fixed inset-0 z-0">
          <div
            className="animate-breathe absolute -top-32 -left-32 h-[420px] w-[420px] rounded-full blur-[120px]"
            style={{ background: "radial-gradient(circle, rgba(20,40,90,0.35) 0%, rgba(0,0,0,0) 70%)" }}
          />
          <div
            className="animate-breathe absolute -bottom-40 -right-24 h-[460px] w-[460px] rounded-full blur-[140px]"
            style={{ background: "radial-gradient(circle, rgba(15,30,75,0.32) 0%, rgba(0,0,0,0) 70%)", animationDelay: "2.5s" }}
          />
          <div
            className="animate-breathe absolute left-1/2 top-1/2 h-[380px] w-[380px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[150px]"
            style={{ background: "radial-gradient(circle, rgba(18,35,80,0.22) 0%, rgba(0,0,0,0) 70%)", animationDelay: "4s" }}
          />
        </div>

        <header className="relative z-10 w-full max-w-md text-center">
          <h2 className="text-balance text-[15px] leading-relaxed text-zinc-300 sm:text-base">
            Please rate the upcoming locations on a scale of 1 to 5 based on how
            safe that place is for women, where 1 being &lsquo;very safe&rsquo;
            and 5 being &lsquo;super unsafe&rsquo;.
          </h2>
          <p className="mt-3 text-[11px] leading-relaxed text-zinc-600">
            This rating is anonymous. We do not store your location or user data.
          </p>
        </header>

        <div className="relative z-10 flex w-full max-w-sm flex-1 items-center justify-center py-8">
          {done ? null : (
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.article
                key={`${current}-${index}`}
                initial={{ opacity: 0, x: 60, scale: 0.98 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -300 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="w-full rounded-3xl border border-white/10 bg-zinc-900/80 px-6 py-10 backdrop-blur-md sm:px-8 sm:py-12"
              >
                <div className="flex min-h-[120px] items-center justify-center">
                  <h3 className="text-balance text-center font-display text-3xl font-medium leading-tight tracking-tight text-white sm:text-4xl">
                    {current}
                  </h3>
                </div>

                <div className="mt-8 h-px w-full bg-white/10" />

                <div className="mt-8 flex w-full items-end justify-between gap-2 px-1 text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                  <span>Very Unsafe</span>
                  <span>Very Safe</span>
                </div>
                <div className="mt-2 flex w-full items-center justify-between gap-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => handleRate(n)}
                      className="flex h-12 w-12 flex-1 items-center justify-center rounded-xl border border-white/5 bg-zinc-800 text-base font-medium text-white transition-colors hover:bg-zinc-700 active:bg-zinc-600 sm:h-14"
                      aria-label={`Rate ${n}`}
                    >
                      {n}
                    </button>
                  ))}
                </div>

                <p className="mt-5 text-center text-[11px] uppercase tracking-[0.22em] text-zinc-500">
                  {index + 1} / {areas.length}
                </p>
              </motion.article>
            </AnimatePresence>
          )}
        </div>

        {/* Spacer to keep layout balanced */}
        <div aria-hidden className="relative z-10 h-2" />
      </main>
    );
  }

  if (status === "saving") {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-5 bg-black px-6 text-center">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-400" strokeWidth={1.5} />
        <p className="text-[13px] tracking-wide text-zinc-500">
          Saving your anonymous ratings...
        </p>
      </main>
    );
  }

  if (status === "saveError") {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-black px-6 text-center">
        <p className="max-w-xs text-[13px] leading-relaxed text-red-400/80">
          {errorMsg || "Couldn't save your ratings."}
        </p>
        <button
          type="button"
          onClick={() => void submitRatings(ratings)}
          className="rounded-full border border-white/15 px-5 py-2 text-[12px] tracking-wide text-zinc-200 transition-colors hover:bg-white/5"
        >
          Retry
        </button>
      </main>
    );
  }

  if (status === "done") {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black px-6">
        {/* Ambient rose-gold glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 h-[480px] w-[480px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-60 blur-[120px]"
          style={{
            background:
              "radial-gradient(circle, rgba(190,110,98,0.35) 0%, rgba(120,40,60,0.18) 45%, rgba(0,0,0,0) 75%)",
          }}
        />
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative z-10 flex flex-col items-center text-center"
        >
          <Check
            className="h-10 w-10 text-[#e8c4b8]"
            strokeWidth={1.25}
          />
          <h1 className="mt-8 font-display text-5xl font-medium leading-none tracking-tight text-white sm:text-6xl">
            Thank You.
          </h1>
          <p className="mt-5 max-w-xs text-[14px] leading-relaxed text-zinc-300">
            Your voice helps build a safer world.
          </p>
          <p className="mt-16 text-[11px] tracking-wide text-zinc-500">
            You can now securely close this window.
          </p>
        </motion.section>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-black px-5 py-10 sm:gap-10">
      {/* Title group — outside the modal */}
      <div className="w-full max-w-sm text-center">
        <h1
          id="modal-title"
          className="font-display text-4xl font-medium leading-[1.1] tracking-tight text-white sm:text-5xl"
        >
          Is it <em className="italic font-normal">Unsafe</em>?
        </h1>
        <p className="mt-4 text-[10px] font-medium uppercase tracking-[0.22em] text-zinc-500">
          By Midnight Intelligence &amp; TheChange Initiative
        </p>
      </div>

      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="w-full max-w-sm rounded-3xl border border-white/10 bg-[#0a0a0a] px-8 py-10 text-center transition-all duration-300 sm:px-10 sm:py-12"
      >
        {/* Prompt */}
        <p className="text-[15px] leading-relaxed text-zinc-300">
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

        {status === "error" && errorMsg ? (
          <p
            role="alert"
            className="mt-3 text-[12px] leading-relaxed text-red-400/80"
          >
            {errorMsg}
          </p>
        ) : null}
      </section>

      {/* Disclaimer — outside and below the modal */}
      <p className="max-w-sm text-center text-[11px] leading-relaxed text-zinc-600">
        This rating is anonymous. We do not store your location or user data.
      </p>
    </main>
  );
}
