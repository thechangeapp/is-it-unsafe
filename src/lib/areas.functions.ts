import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
});

const SYSTEM_PROMPT =
  "You are a highly precise geographic assistant. Based on the user's latitude and longitude, return a raw JSON array of 5 to 7 specific micro-locations very near them. Do not return broad cities or large neighborhoods. Return specific sectors (e.g., 'Sector 4 Complex'), specific roads (e.g., 'Garhi Bolni Road'), intersections, or known local landmarks. Return only the JSON array of strings.";

function parseAreas(content: string): string[] {
  const tryParse = (raw: string) => {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.every((x) => typeof x === "string")) {
        return parsed as string[];
      }
    } catch {
      // ignore
    }
    return null;
  };

  const direct = tryParse(content.trim());
  if (direct && direct.length > 0) return direct;

  const match = content.match(/\[[\s\S]*?\]/);
  if (match) {
    const fromBlock = tryParse(match[0]);
    if (fromBlock && fromBlock.length > 0) return fromBlock;
  }

  throw new Error("Could not parse area list from model response.");
}

export const getNearbyAreas = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      throw new Error("Server is missing LOVABLE_API_KEY.");
    }

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `My coordinates are Latitude: ${data.lat}, Longitude: ${data.lon}.`,
          },
        ],
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("Lovable AI error", res.status, text);
      if (res.status === 429) throw new Error("Rate limited, please try again in a moment.");
      if (res.status === 402) throw new Error("AI credits exhausted. Add funds in Settings → Workspace → Usage.");
      throw new Error(`AI request failed (${res.status}).`);
    }

    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = json.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("Empty response from model.");
    }

    const areas = parseAreas(content);
    return { areas };
  });