import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const InputSchema = z.object({
  district: z.string().min(1).max(200).optional(),
  ratings: z
    .array(
      z.object({
        area_name: z.string().min(1).max(200),
        lighting_rating: z.number().int().min(1).max(5),
        density_rating: z.number().int().min(1).max(5),
        gut_rating: z.number().int().min(1).max(5),
      }),
    )
    .min(1)
    .max(50),
});

export const saveRatings = createServerFn({ method: "POST" })
  .inputValidator((input) => InputSchema.parse(input))
  .handler(async ({ data }) => {
    const rows = data.ratings.map((r) => ({
      ...r,
      district: data.district ?? null,
    }));

    const { error } = await supabaseAdmin
      .from("safety_ratings")
      .insert(rows);

    if (error) {
      console.error("saveRatings insert error", error);
      throw new Error("Failed to save ratings.");
    }

    return { ok: true, count: data.ratings.length };
  });