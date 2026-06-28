ALTER TABLE public.safety_ratings ADD COLUMN IF NOT EXISTS area text;

DROP POLICY IF EXISTS "Anyone can insert ratings" ON public.safety_ratings;

CREATE POLICY "Anyone can insert ratings"
ON public.safety_ratings
FOR INSERT
TO anon, authenticated
WITH CHECK (
  length(area_name) >= 1 AND length(area_name) <= 200
  AND lighting_rating BETWEEN 1 AND 5
  AND density_rating BETWEEN 1 AND 5
  AND gut_rating BETWEEN 1 AND 5
  AND (district IS NULL OR length(district) <= 200)
  AND (area IS NULL OR length(area) <= 200)
);