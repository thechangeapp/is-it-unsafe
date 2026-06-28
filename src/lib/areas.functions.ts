import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
});

const SYSTEM_PROMPT =
  "You are a highly precise geographic assistant mapping areas for localized safety data. Based strictly on the provided user's latitude and longitude, return a JSON object containing a district string, an area string, and an areas array of 5 to 7 specific micro-locations.\n\nCRITICAL SELECTION RULES:\n\n1. DIFFERENTIATE DISTRICT VS AREA:\n   - district: The official, broader administrative district on the map (e.g., 'Central Delhi', 'South East Delhi', 'Gurugram').\n   - area: The specific recognizable local neighborhood or locality (e.g., 'Karol Bagh', 'Kirti Nagar', 'Sector 14').\n\n2. STRICT LOCALIZATION & HIGH VARIETY: You must ONLY return real, accurate places that actually exist within a close radius of the provided coordinates. To ensure variety, do NOT just return the top 5 most famous landmarks. Mix and match from the categories below so different users get a diverse set of micro-locations.\n\n3. CATEGORIES TO TARGET FOR MICRO-LOCATIONS (areas array):\n   - Transit: Metro stations, prominent bus stands.\n   - Residential & Navigational: Specific block numbers or sectors (e.g., 'Block 14A', 'Sector 9C'), famous local roads, and traffic circles/roundabouts.\n   - Commerce: Popular malls, bustling local markets.\n   - Leisure & Study: Local parks, nearby libraries, or well-known cafes.\n\n4. AVOID DEAD ZONES: Absolutely do not return obscure, unpopulated map coordinates, industrial wastelands, or empty fields.\n\n5. NO PLACEHOLDER COPYING: The place names in this prompt are purely examples of the format. Never copy them unless they actually exist at the user's exact coordinates.\n\nReturn only the precise JSON format: { \"district\": \"Official District Name\", \"area\": \"Local Neighborhood Name\", \"areas\": [\"Micro Area 1\", \"Micro Area 2\", ...] } — no markdown, no backticks, no commentary.";

function parseResult(content: string): { district: string; area: string; areas: string[] } {
  const tryParse = (raw: string) => {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (
        parsed &&
        typeof parsed === "object" &&
        !Array.isArray(parsed) &&
        typeof (parsed as { district?: unknown }).district === "string" &&
        Array.isArray((parsed as { areas?: unknown }).areas) &&
        (parsed as { areas: unknown[] }).areas.every((x) => typeof x === "string")
      ) {
        const maybeArea = (parsed as { area?: unknown }).area;
        return {
          district: (parsed as { district: string }).district,
          area: typeof maybeArea === "string" ? maybeArea : "",
          areas: (parsed as { areas: string[] }).areas,
        };
      }
    } catch {
      // ignore
    }
    return null;
  };

  const direct = tryParse(content.trim());
  if (direct && direct.areas.length > 0) return direct;

  const match = content.match(/\{[\s\S]*\}/);
  if (match) {
    const fromBlock = tryParse(match[0]);
    if (fromBlock && fromBlock.areas.length > 0) return fromBlock;
  }

  throw new Error("Could not parse district/area/areas from model response.");
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

    const { district, area, areas } = parseResult(content);
    return { district, area, areas };
  });