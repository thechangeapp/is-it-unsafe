import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { MapPin, Loader2 } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { AnimatePresence, motion } from "framer-motion";
import { getNearbyAreas } from "@/lib/areas.functions";

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
  type Status = "idle" | "locating" | "fetching" | "success" | "error";
  type Rating = { area: string; rating: number };
  const [status, setStatus] = useState<Status>("idle");
  const [areas, setAreas] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [index, setIndex] = useState(0);
  const fetchAreas = useServerFn(getNearbyAreas);

  const loading = status === "locating" || status === "fetching";

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
      setRatings((prev) => [...prev, { area: current, rating }]);
      setIndex((i) => i + 1);
    };

    return (
      <main className="flex min-h-screen flex-col items-center justify-between bg-black px-5 pt-10 pb-12 sm:pt-14">
        <header className="w-full max-w-md text-center">
          <h2 className="text-balance text-[15px] leading-relaxed text-zinc-300 sm:text-base">
            Please rate the upcoming locations on a scale of 1 to 5 based on how
            safe that place is for women, where 1 being &lsquo;very safe&rsquo;
            and 5 being &lsquo;super unsafe&rsquo;.
          </h2>
          <p className="mt-3 text-[11px] leading-relaxed text-zinc-600">
            This rating is anonymous. We do not store your location or user data.
          </p>
        </header>

        <div className="relative flex w-full max-w-sm flex-1 items-center justify-center py-8">
          {done ? (
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="text-center text-lg font-medium text-white"
            >
              All rated! Preparing database...
            </motion.p>
          ) : (
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

                <div className="mt-8 flex w-full items-center justify-between gap-2">
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
        <div aria-hidden className="h-2" />
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-5 py-8">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="w-full max-w-sm rounded-3xl border border-white/10 bg-[#0a0a0a] px-8 py-10 text-center transition-all duration-300 sm:px-10 sm:py-12"
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

        {status === "error" && errorMsg ? (
          <p
            role="alert"
            className="mt-3 text-[12px] leading-relaxed text-red-400/80"
          >
            {errorMsg}
          </p>
        ) : null}

        {/* Footer */}
        <p className="mt-8 text-[11px] leading-relaxed text-zinc-600">
          This rating is anonymous. We do not store your location or user data.
        </p>
      </section>
    </main>
  );
}
