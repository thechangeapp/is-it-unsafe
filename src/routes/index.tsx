import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState, Fragment } from "react";
import { MapPin, Loader2, Check, ShieldAlert, VenusAndMars, Heart } from "lucide-react";
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
  const [district, setDistrict] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [index, setIndex] = useState(0);
  const [countdown, setCountdown] = useState(10);
  const [pledged, setPledged] = useState(false);
  const [gender, setGender] = useState<"woman" | "man" | null>(null);
  const [isBlocked, setIsBlocked] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        if (localStorage.getItem("blocked_user") === "true") {
          setIsBlocked(true);
        }
      } catch (err) {
        console.warn("localStorage access denied in iframe:", err);
      }
    }
  }, []);

  useEffect(() => {
    if (status !== "done") return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (typeof window !== "undefined") {
            window.open("", "_self", "");
            window.close();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [status]);

  const fetchAreas = useServerFn(getNearbyAreas);
  const persistRatings = useServerFn(saveRatings);

  const loading = status === "locating" || status === "fetching";

  const isStraightLine = (rs: Rating[]) => {
    if (rs.length === 0) return false;
    const first = rs[0];
    const v = first.lighting_rating;
    if (v !== 1 && v !== 5) return false;
    if (
      first.density_rating !== v ||
      first.gut_rating !== v
    ) {
      return false;
    }
    return rs.every(
      (r) =>
        r.lighting_rating === v &&
        r.density_rating === v &&
        r.gut_rating === v,
    );
  };

  const submitRatings = async (toSave: Rating[]) => {
    setStatus("saving");
    // Straight-line spam filter: silently succeed without saving.
    if (isStraightLine(toSave)) {
      setStatus("done");
      return;
    }
    try {
      await persistRatings({
        data: {
          district: district || undefined,
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
          setDistrict(result.district ?? "");
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

  if (isBlocked) {
    return (
      <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-black px-6 text-center">
        {/* Subtle deep red warning glow */}
        <div aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden bg-transparent">
          <div
            className="absolute left-[50%] top-[50%] h-[350px] w-[350px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[120px] opacity-40"
            style={{
              background: "radial-gradient(circle, rgba(220, 38, 38, 0.4) 0%, rgba(0,0,0,0) 80%)",
            }}
          />
        </div>

        <motion.section
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative z-10 flex max-w-sm flex-col items-center"
        >
          <div className="rounded-full bg-red-500/10 p-4 text-red-500">
            <ShieldAlert className="h-12 w-12" strokeWidth={1.5} />
          </div>

          <h1 className="mt-8 font-sans text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Access Restricted
          </h1>

          <p className="mt-4 text-[14px] leading-relaxed text-zinc-400 font-medium">
            Men are not allowed to rate this women's safety service.
          </p>

          <p className="mt-6 text-[12px] leading-relaxed text-zinc-600 max-w-xs">
            This map is a protected space dedicated to capturing the honest, lived experiences of women to ensure safety and precision.
          </p>
        </motion.section>
      </main>
    );
  }

  return (
    <main
      className={`relative flex min-h-screen flex-col items-center overflow-hidden bg-black transition-all duration-700 ${
        status === "success" && pledged
          ? "justify-start px-5 pt-10 pb-12 sm:pt-14"
          : status === "saving" || status === "saveError"
          ? "justify-center px-6 text-center"
          : status === "done" || (status === "success" && !pledged)
          ? "justify-start px-6 pt-10 pb-12 text-center sm:pt-16"
          : "justify-start gap-8 px-5 pt-12 pb-10 sm:gap-10 sm:pt-16"
      }`}
    >
      {/* Background Gradients with AnimatePresence */}
      <AnimatePresence>
        {status === "success" && pledged && (
          <motion.div
            key="gemini-bg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            className="absolute inset-0 z-0"
          >
            <GeminiBackground />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {(status === "locating" || status === "fetching" || status === "done" || (status === "success" && !pledged)) && (
          <motion.div
            key="cherry-bg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            aria-hidden
            className="pointer-events-none absolute inset-0 z-0 overflow-hidden bg-transparent"
          >
            {/* Cherry Red Spot */}
            <div
              className="animate-flow-1 absolute left-[10%] top-[15%] h-[400px] w-[400px] rounded-full blur-[120px]"
              style={{
                background: "radial-gradient(circle, rgba(220, 38, 38, 0.55) 0%, rgba(0,0,0,0) 75%)",
                mixBlendMode: "screen",
              }}
            />
            {/* Bright Pink Spot */}
            <div
              className="animate-flow-2 absolute right-[5%] bottom-[15%] h-[450px] w-[450px] rounded-full blur-[130px]"
              style={{
                background: "radial-gradient(circle, rgba(236, 72, 153, 0.45) 0%, rgba(0,0,0,0) 75%)",
                mixBlendMode: "screen",
              }}
            />
            {/* Rose Red Spot */}
            <div
              className="animate-flow-3 absolute left-[25%] bottom-[5%] h-[380px] w-[380px] rounded-full blur-[110px]"
              style={{
                background: "radial-gradient(circle, rgba(244, 63, 94, 0.4) 0%, rgba(0,0,0,0) 75%)",
                mixBlendMode: "screen",
              }}
            />
            {/* Bright Purple Spot */}
            <div
              className="animate-flow-4 absolute right-[15%] top-[5%] h-[400px] w-[400px] rounded-full blur-[120px]"
              style={{
                background: "radial-gradient(circle, rgba(168, 85, 247, 0.4) 0%, rgba(0,0,0,0) 75%)",
                mixBlendMode: "screen",
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* CONTENT REDIRECTS BASED ON STATUS */}
      {status === "success" && pledged && (
        <>
          <header className="relative z-10 w-full max-w-md text-center">
            <p className="mt-1 text-[11px] text-zinc-600">
              100% anonymous · No location data is stored
            </p>
          </header>

          <div className="relative z-10 flex w-full max-w-sm items-center justify-center pt-6 sm:pt-10 pb-4 min-h-[460px] sm:min-h-[500px]">
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
                        onComplete={(values, elapsedMs) => {
                          // Speed-trap: silently drop data if user tapped too fast.
                          const tooFast = elapsedMs < 1000;
                          const next = tooFast
                            ? ratings
                            : [...ratings, { area: cardArea, ...values }];
                          if (!tooFast) setRatings(next);
                          setIndex((idx) => idx + 1);
                          if (next.length >= areas.length) {
                            void submitRatings(next);
                          } else if (i + 1 >= areas.length) {
                            // last card and dropped: finalize
                            if (next.length > 0) {
                              void submitRatings(next);
                            } else {
                              setStatus("done");
                            }
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

          <div aria-hidden className="relative z-10 h-2" />
        </>
      )}

      {status === "success" && !pledged && gender === null && (
        <motion.section
          key="gender-card"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative z-10 w-full max-w-sm rounded-3xl border border-white/10 bg-[#0e0e11]/80 px-8 py-10 text-center shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] backdrop-blur-lg sm:px-10 sm:py-12"
        >
          <div className="flex justify-center">
            <div className="rounded-full bg-rose-500/10 p-3 text-rose-500">
              <VenusAndMars className="h-8 w-8" strokeWidth={1.5} />
            </div>
          </div>

          <h2 className="mt-6 font-sans text-2xl font-semibold tracking-tight text-white">
            Please select your gender
          </h2>

          <div className="mt-8 flex flex-col gap-3">
            <button
              type="button"
              onClick={() => setGender("woman")}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-rose-600 px-6 py-3.5 text-[14px] font-semibold tracking-wide text-white transition-all duration-300 hover:bg-rose-500 hover:shadow-[0_0_20px_rgba(244,63,94,0.4)] active:scale-95"
            >
              Woman
            </button>

            <button
              type="button"
              onClick={() => {
                if (typeof window !== "undefined") {
                  try {
                    localStorage.setItem("blocked_user", "true");
                  } catch (err) {
                    console.warn("localStorage access denied in iframe:", err);
                  }
                }
                setIsBlocked(true);
              }}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-blue-600 px-6 py-3.5 text-[14px] font-semibold tracking-wide text-white transition-all duration-300 hover:bg-blue-500 hover:shadow-[0_0_20px_rgba(37,99,235,0.4)] active:scale-95"
            >
              Man
            </button>
          </div>
        </motion.section>
      )}

      {status === "success" && !pledged && gender === "woman" && (
        <motion.section
          key="pledge-card"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative z-10 w-full max-w-sm rounded-3xl border border-white/10 bg-[#0e0e11]/80 px-8 py-10 text-center shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] backdrop-blur-lg sm:px-10 sm:py-12"
        >
          <div className="flex justify-center">
            <div className="rounded-full bg-rose-500/10 p-3 text-rose-500">
              <Heart className="h-8 w-8 text-rose-500 fill-rose-500/20" strokeWidth={1.5} />
            </div>
          </div>

          <h2 className="mt-6 font-sans text-xl font-semibold tracking-tight text-white">
            Notice
          </h2>

          <p className="mt-4 text-[14px] leading-relaxed text-zinc-300">
            This map is a protected space. Its accuracy could save a woman's life tonight.
          </p>

          <p className="mt-5 text-[13px] leading-relaxed text-zinc-400 font-medium italic">
            "By tapping continue, you pledge that you are a woman sharing your honest, lived experience."
          </p>

          <button
            type="button"
            onClick={() => setPledged(true)}
            className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full bg-rose-600 px-6 py-3.5 text-[14px] font-semibold tracking-wide text-white transition-all duration-300 hover:bg-rose-500 hover:shadow-[0_0_20px_rgba(244,63,94,0.4)] active:scale-95"
          >
            I pledge
          </button>
        </motion.section>
      )}

      {status === "saving" && (
        <div className="relative z-10 flex flex-col items-center justify-center gap-5 py-20">
          <Loader2 className="h-6 w-6 animate-spin text-zinc-400" strokeWidth={1.5} />
          <p className="text-[13px] tracking-wide text-zinc-500">
            Saving your anonymous ratings...
          </p>
        </div>
      )}

      {status === "saveError" && (
        <div className="relative z-10 flex flex-col items-center justify-center gap-6 py-20">
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
      )}

      {status === "done" && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative z-10 flex flex-col items-center text-center pt-6 pb-12"
        >
          <Check
            className="h-10 w-10 text-rose-500"
            strokeWidth={1.25}
          />
          <h1 className="mt-8 font-display text-4xl font-medium leading-[1.2] tracking-tight text-white sm:text-5xl">
            Thank you, <br className="sm:hidden" />
            <span className="italic font-normal">beautiful</span> ♥️
          </h1>
          <p className="mt-5 max-w-xs text-[14px] leading-relaxed text-zinc-300">
            Your voice helps build a safer world.
          </p>
          <button
            onClick={() => {
              if (typeof window !== "undefined") {
                window.open("", "_self", "");
                window.close();
              }
            }}
            className="mt-16 text-[12px] tracking-wide text-zinc-500 hover:text-rose-400 transition-colors duration-300"
          >
            Closing this tab in <span className="font-semibold text-rose-400 tabular-nums">{countdown}</span>s · <span className="underline decoration-zinc-600 hover:decoration-rose-400">Exit now</span>
          </button>
        </motion.section>
      )}

      {/* Landing page (idle, locating, fetching, error) */}
      {(status === "idle" || status === "locating" || status === "fetching" || status === "error") && (
        <>
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
            className="relative z-10 w-full max-w-sm rounded-3xl border border-white/10 bg-[#0a0a0a]/90 px-8 py-10 text-center transition-all duration-300 sm:px-10 sm:py-12"
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
        </>
      )}
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
    title: "Lighting at night",
    leftLabel: "Very lit",
    rightLabel: "Very dark",
  },
  {
    key: "density_rating",
    title: "Women in crowd",
    leftLabel: "Many women",
    rightLabel: "Very few",
  },
  {
    key: "gut_rating",
    title: "Gut feeling / intuition / experience",
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
  onComplete: (values: RatingValues, elapsedMs: number) => void;
  onSkip: () => void;
}) {
  const startTimeRef = useRef<number>(Date.now());
  useEffect(() => {
    startTimeRef.current = Date.now();
  }, []);
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
          const elapsedMs = Date.now() - startTimeRef.current;
          onComplete(
            {
              lighting_rating: next.lighting_rating!,
              density_rating: next.density_rating!,
              gut_rating: next.gut_rating!,
            },
            elapsedMs,
          );
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
        {PARAMS.map((p, idx) => {
          const selected = selections[p.key];
          return (
            <Fragment key={p.key}>
              {idx > 0 && <div className="mx-auto h-[1px] w-[8px] bg-zinc-700/60" />}
              <div className="w-full">
                <p className="text-left text-[13px] font-semibold tracking-[0.06em] text-zinc-400">
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
            </Fragment>
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
        className="mx-auto mt-7 block text-[11px] font-semibold uppercase tracking-[0.18em] text-rose-500/90 transition-colors duration-300 hover:text-rose-400"
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
      {/* Stationary wrapper with transparent background (fades in smoothly without layout glitches) */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2.2, ease: "easeOut" }}
        className="absolute top-0 inset-x-0 h-[450px] bg-transparent"
      >
        {/* Indigo Base */}
        <div
          className="absolute top-[-100px] left-[10%] w-[80%] h-[350px] rounded-full blur-[110px] opacity-60"
          style={{
            background: "radial-gradient(circle, rgba(37, 99, 235, 0.55) 0%, rgba(0,0,0,0) 80%)",
            mixBlendMode: "screen",
          }}
        />
        {/* Teal / Emerald Spot */}
        <div
          className="animate-gemini-teal absolute top-[-150px] left-[-80px] w-[350px] h-[350px] rounded-full blur-[100px]"
          style={{
            background: "radial-gradient(circle, rgba(20, 184, 166, 0.8) 0%, rgba(0,0,0,0) 75%)",
            mixBlendMode: "screen",
          }}
        />
        {/* Purple / Violet Spot */}
        <div
          className="animate-gemini-purple absolute top-[-120px] left-[15%] w-[400px] h-[400px] rounded-full blur-[110px]"
          style={{
            background: "radial-gradient(circle, rgba(139, 92, 246, 0.8) 0%, rgba(0,0,0,0) 75%)",
            mixBlendMode: "screen",
          }}
        />
        {/* Gold / Orange Spot */}
        <div
          className="animate-gemini-gold absolute top-[-150px] right-[-80px] w-[320px] h-[320px] rounded-full blur-[90px]"
          style={{
            background: "radial-gradient(circle, rgba(245, 158, 11, 0.7) 0%, rgba(0,0,0,0) 75%)",
            mixBlendMode: "screen",
          }}
        />
      </motion.div>
      {/* Stationary fade overlay - matches the parent's z-0 but sits in front of the moving blobs */}
      <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-t from-black to-transparent" />
    </div>
  );
}
