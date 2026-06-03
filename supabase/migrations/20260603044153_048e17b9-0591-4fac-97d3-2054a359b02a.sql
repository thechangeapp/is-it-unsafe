ALTER TABLE public.safety_ratings ADD COLUMN district text;

DROP POLICY IF EXISTS "Anyone can insert ratings" ON public.safety_ratings;

CREATE POLICY "Anyone can insert ratings"
ON public.safety_ratings
FOR INSERT
TO anon, authenticated
WITH CHECK (
  length(area_name) >= 1 AND length(area_name) <= 200
  AND lighting_rating >= 1 AND lighting_rating <= 5
  AND density_rating >= 1 AND density_rating <= 5
  AND gut_rating >= 1 AND gut_rating <= 5
  AND (district IS NULL OR length(district) <= 200)
);