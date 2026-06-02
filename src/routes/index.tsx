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
          <h2 className="text-balance text-[15px] leading-relaxed text-zinc-300 sm:text-base">
            Please rate the upcoming locations on a scale of 1 to 5 based on how
            safe that place is for women, where 1 being &lsquo;very safe&rsquo;
            and 5 being &lsquo;super unsafe&rsquo;.
          </h2>
          <p className="mt-3 text-[11px] leading-relaxed text-zinc-600">
            This rating is anonymous. We do not store your location or user data.
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
      <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden gap-5 bg-black px-6 text-center">
        <GeminiBackground />
        <div className="relative z-10 flex flex-col items-center gap-5">
          <Loader2 className="h-6 w-6 animate-spin text-zinc-400" strokeWidth={1.5} />
          <p className="text-[13px] tracking-wide text-zinc-500">
            Saving your anonymous ratings...
          </p>
        </div>
      </main>
    );
  }

  if (status === "saveError") {
    return (
      <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden gap-6 bg-black px-6 text-center">
        <GeminiBackground />
        <div className="relative z-10 flex flex-col items-center gap-6">
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
        </div>
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
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden gap-8 bg-black px-5 py-10 sm:gap-10">
      <GeminiBackground />
      {/* Title group — outside the modal */}
      <div className="relative z-10 w-full max-w-sm text-center">
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
        className="relative z-10 w-full max-w-sm rounded-3xl border border-white/10 bg-[#0a0a0a]/90 backdrop-blur-md px-8 py-10 text-center transition-all duration-300 sm:px-10 sm:py-12"
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
      <p className="relative z-10 max-w-sm text-center text-[11px] leading-relaxed text-zinc-600">
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
    leftLabel: "Very unsafe",
    rightLabel: "Very safe",
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
      className="w-full rounded-3xl border border-white/10 bg-zinc-900/80 px-5 py-7 backdrop-blur-md sm:px-7 sm:py-9"
    >
      <h3 className="text-balance text-center font-display text-2xl font-medium leading-tight tracking-tight text-white sm:text-3xl">
        {area}
      </h3>

      <div className="mt-5 h-px w-full bg-white/10" />

      <div className="mt-5 flex flex-col gap-5">
        {PARAMS.map((p) => {
          const selected = selections[p.key];
          return (
            <div key={p.key} className="w-full">
              <p className="text-center text-[12px] font-medium uppercase tracking-[0.14em] text-zinc-300 sm:text-[13px]">
                {p.title}
              </p>
              <div className="mt-2 flex w-full items-end justify-between gap-1.5 px-0.5 text-[9px] uppercase tracking-[0.16em] text-zinc-500">
                <span>{p.leftLabel}</span>
                <span>{p.rightLabel}</span>
              </div>
              <div className="mt-1.5 flex w-full items-center justify-between gap-1.5">
                {[1, 2, 3, 4, 5].map((n) => {
                  const isSelected = selected === n;
                  return (
                    <button
                      key={n}
                      type="button"
                      onClick={() => handleSelect(p.key, n)}
                      aria-label={`${p.title}: ${n}`}
                      aria-pressed={isSelected}
                      className={`flex h-11 flex-1 items-center justify-center rounded-xl border text-sm font-medium transition-colors sm:h-12 ${
                        isSelected
                          ? "border-white bg-white text-black"
                          : "border-white/5 bg-zinc-800 text-white hover:bg-zinc-700 active:bg-zinc-600"
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
        className="mx-auto mt-6 block text-[12px] text-zinc-500 transition-colors hover:text-zinc-300"
      >
        Skip this place
      </button>

      <p className="mt-3 text-center text-[10px] uppercase tracking-[0.22em] text-zinc-600">
        {position} / {total}
      </p>
    </article>
  );
}

function GeminiBackground() {
  return (
    <div aria-hidden className="pointer-events-none absolute top-0 inset-x-0 h-[420px] overflow-hidden z-0 bg-black">
      {/* Indigo Base */}
      <div
        className="absolute top-[-100px] left-[10%] w-[80%] h-[350px] rounded-full blur-[110px] opacity-60"
        style={{ background: "radial-gradient(circle, rgba(30, 58, 138, 0.3) 0%, rgba(0,0,0,0) 80%)" }}
      />
      {/* Teal / Emerald Spot */}
      <div
        className="animate-gemini-teal absolute top-[-150px] left-[-80px] w-[350px] h-[350px] rounded-full blur-[100px]"
        style={{ background: "radial-gradient(circle, rgba(13, 148, 136, 0.35) 0%, rgba(0,0,0,0) 75%)" }}
      />
      {/* Purple / Violet Spot */}
      <div
        className="animate-gemini-purple absolute top-[-120px] left-[15%] w-[400px] h-[400px] rounded-full blur-[110px]"
        style={{ background: "radial-gradient(circle, rgba(139, 92, 246, 0.35) 0%, rgba(0,0,0,0) 75%)" }}
      />
      {/* Gold / Orange Spot */}
      <div
        className="animate-gemini-gold absolute top-[-150px] right-[-80px] w-[320px] h-[320px] rounded-full blur-[90px]"
        style={{ background: "radial-gradient(circle, rgba(245, 158, 11, 0.28) 0%, rgba(0,0,0,0) 75%)" }}
      />
      {/* Smooth bottom fade-out to ensure solid black at the bottom */}
      <div className="absolute inset-x-0 bottom-0 h-[200px] bg-gradient-to-t from-black to-transparent" />
    </div>
  );
}
