import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { MapPin, Loader2 } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
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
  const [status, setStatus] = useState<Status>("idle");
  const [areas, setAreas] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState<string>("");
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
    return (
      <main className="flex min-h-screen items-center justify-center bg-black px-5 py-8">
        <p className="animate-in fade-in text-center text-lg font-medium text-white duration-500">
          Successfully found {areas.length} areas.
        </p>
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
