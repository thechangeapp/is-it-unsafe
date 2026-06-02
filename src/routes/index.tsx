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
  type Rating = {
    area: string;
    lighting_rating: number;
    density_rating: number;
    gut_rating: number;
  };
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
          ratings: toSave.map((r) => ({
            area_name: r.area,
            lighting_rating: r.lighting_rating,
            density_rating: r.density_rating,
            gut_rating: r.gut_rating,
          })),
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

    return (
      <main className="relative flex min-h-screen flex-col items-center justify-between overflow-hidden bg-black px-5 pt-10 pb-12 sm:pt-14">
        <GeminiBackground />

        <header className="relative z-10 w-full max-w-md text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-zinc-500">
            Midnight Intelligence &amp; TheChange
          </p>
          <h1 className="mt-2 font-display text-3xl font-medium tracking-tight text-white">
            Rate Safety
          </h1>
          <p className="mt-3 text-[13px] leading-relaxed text-zinc-400">
            Rate from 1 (Safe) to 5 (Unsafe) to help map local safety for women.
          </p>
          <p className="mt-1 text-[11px] text-zinc-600">
            100% anonymous · No location data is stored
          </p>
        </header>

        <div className="relative z-10 flex w-full max-w-sm flex-1 items-center justify-center py-8 min-h-[460px] sm:min-h-[500px]">
          <AnimatePresence mode="popLayout" initial={false}>
            {(() => {
              const visibleIndices: number[] = [];
              if (index < areas.length) visibleIndices.push(index);
              if (index + 1 < areas.length) visibleIndices.push(index + 1);

              return visibleIndices.reverse().map((i) => {
                const isTop = i === index;
                const cardArea = areas[i];
                return (
                  <motion.div
                    key={`${cardArea}-${i}`}
                    style={{
                      position: "absolute",
                      width: "100%",
                      zIndex: isTop ? 10 : 0,
                      pointerEvents: isTop ? "auto" : "none",
                      willChange: "transform, opacity",
                    }}
                    initial={isTop ? { opacity: 0, scale: 0.95, y: 0 } : { opacity: 0, scale: 0.9, y: 32 }}
                    animate={
                      isTop
                        ? { opacity: 1, scale: 1, y: 0, x: 0, rotate: 0 }
                        : { opacity: 0, scale: 0.94, y: 16, x: 0, rotate: 0 }
                    }
                    exit={{
                      opacity: 0,
                      x: -360,
                      rotate: -10,
                      y: 20,
                      transition: { duration: 0.35, ease: "easeInOut" }
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 280,
                      damping: 26,
                      mass: 0.8
                    }}
                  >
                    <RatingCard
                      area={cardArea}
                      position={i + 1}
                      total={areas.length}
                      onComplete={(values) => {
                        const next = [...ratings, { area: cardArea, ...values }];
                        setRatings(next);
                        setIndex((idx) => idx + 1);
                        if (next.length >= areas.length) {
                          void submitRatings(next);
                        }
                      }}
                      onSkip={() => {
                        setIndex((idx) => idx + 1);
                        if (ratings.length + (areas.length - i - 1) === 0) {
                          // edge: nothing rated
                        }
                        if (i + 1 >= areas.length) {
                          if (ratings.length > 0) {
                            void submitRatings(ratings);
                          } else {
                            setStatus("done");
                          }
                        }
                      }}
                    />
                  </motion.div>
                );
              });
            })()}
          </AnimatePresence>
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

type RatingValues = {
  lighting_rating: number;
  density_rating: number;
  gut_rating: number;
};

type ParamKey = keyof RatingValues;

const PARAMS: Array<{
  key: ParamKey;
  title: string;
  leftLabel: string;
  rightLabel: string;
}> = [
  {
    key: "lighting_rating",
    title: "Lighting at Night",
    leftLabel: "Very lit",
    rightLabel: "Very dark",
  },
  {
    key: "density_rating",
    title: "Women in Crowd",
    leftLabel: "Many women",
    rightLabel: "Very few",
  },
  {
    key: "gut_rating",
    title: "Gut Feeling / Intuition / Experience",
    leftLabel: "Very safe",
    rightLabel: "Super unsafe",
  },
];

function RatingCard({
  area,
  position,
  total,
  onComplete,
  onSkip,
}: {
  area: string;
  position: number;
  total: number;
  onComplete: (values: RatingValues) => void;
  onSkip: () => void;
}) {
  const [selections, setSelections] = useState<{
    lighting_rating: number | null;
    density_rating: number | null;
    gut_rating: number | null;
  }>({
    lighting_rating: null,
    density_rating: null,
    gut_rating: null,
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSelect = (key: ParamKey, value: number) => {
    if (submitted) return;
    setSelections((prev) => {
      const next = { ...prev, [key]: value };
      if (
        next.lighting_rating !== null &&
        next.density_rating !== null &&
        next.gut_rating !== null
      ) {
        setSubmitted(true);
        // slight delay so the user sees the selected state before slide-away
        setTimeout(() => {
          onComplete({
            lighting_rating: next.lighting_rating!,
            density_rating: next.density_rating!,
            gut_rating: next.gut_rating!,
          });
        }, 220);
      }
      return next;
    });
  };

  return (
    <article
      className="w-full rounded-3xl border border-white/10 bg-[#0e0e11]/80 px-5 py-7 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] backdrop-blur-lg sm:px-7 sm:py-9"
    >
      <h3 className="text-balance text-center font-display text-3xl font-medium tracking-tight text-white/95 sm:text-4xl">
        {area}
      </h3>

      <div className="mt-5 h-px w-full bg-gradient-to-r from-transparent via-white/15 to-transparent" />

      <div className="mt-6 flex flex-col gap-6">
        {PARAMS.map((p) => {
          const selected = selections[p.key];
          return (
            <div key={p.key} className="w-full">
              <p className="text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-400">
                {p.title}
              </p>
              <div className="mt-2 flex w-full justify-between px-1 text-[9px] font-medium uppercase tracking-[0.18em] text-zinc-500/80">
                <span>{p.leftLabel}</span>
                <span>{p.rightLabel}</span>
              </div>
              <div className="mt-2 flex w-full items-center justify-between px-1">
                {[1, 2, 3, 4, 5].map((n) => {
                  const isSelected = selected === n;
                  return (
                    <button
                      key={n}
                      type="button"
                      onClick={() => handleSelect(p.key, n)}
                      aria-label={`${p.title}: ${n}`}
                      aria-pressed={isSelected}
                      className={`flex h-11 w-11 items-center justify-center rounded-full border text-sm font-semibold transition-all duration-300 sm:h-12 sm:w-12 ${
                        isSelected
                          ? "border-white bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.45)] scale-105"
                          : "border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10 hover:border-white/20 active:scale-95"
                      }`}
                    >
                      {n}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => {
          if (submitted) return;
          setSubmitted(true);
          onSkip();
        }}
        className="mx-auto mt-7 block text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500 transition-colors hover:text-zinc-300"
      >
        Skip this place
      </button>

      <p className="mt-4 text-center text-[10px] font-medium uppercase tracking-[0.25em] text-zinc-600">
        {position} / {total}
      </p>
    </article>
  );
}

function GeminiBackground() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden bg-transparent">
      {/* Moving wrapper with transparent background (no sharp edge outlines) */}
      <motion.div
        initial={{ y: "100vh", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 2.8, ease: [0.16, 1, 0.3, 1] }}
        className="absolute top-0 inset-x-0 h-[450px] bg-transparent"
      >
        {/* Indigo Base */}
        <div
          className="absolute top-[-100px] left-[10%] w-[80%] h-[350px] rounded-full blur-[110px] opacity-60"
          style={{
            background: "radial-gradient(circle, rgba(37, 99, 235, 0.45) 0%, rgba(0,0,0,0) 80%)",
            mixBlendMode: "screen",
          }}
        />
        {/* Teal / Emerald Spot */}
        <div
          className="animate-gemini-teal absolute top-[-150px] left-[-80px] w-[350px] h-[350px] rounded-full blur-[100px]"
          style={{
            background: "radial-gradient(circle, rgba(13, 148, 136, 0.65) 0%, rgba(0,0,0,0) 75%)",
            mixBlendMode: "screen",
          }}
        />
        {/* Purple / Violet Spot */}
        <div
          className="animate-gemini-purple absolute top-[-120px] left-[15%] w-[400px] h-[400px] rounded-full blur-[110px]"
          style={{
            background: "radial-gradient(circle, rgba(139, 92, 246, 0.65) 0%, rgba(0,0,0,0) 75%)",
            mixBlendMode: "screen",
          }}
        />
        {/* Gold / Orange Spot */}
        <div
          className="animate-gemini-gold absolute top-[-150px] right-[-80px] w-[320px] h-[320px] rounded-full blur-[90px]"
          style={{
            background: "radial-gradient(circle, rgba(245, 158, 11, 0.55) 0%, rgba(0,0,0,0) 75%)",
            mixBlendMode: "screen",
          }}
        />
      </motion.div>
      {/* Stationary fade overlay - matches the parent's z-0 but sits in front of the moving blobs */}
      <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-t from-black to-transparent" />
    </div>
  );
}
