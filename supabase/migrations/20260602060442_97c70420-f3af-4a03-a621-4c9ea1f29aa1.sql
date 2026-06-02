DROP POLICY IF EXISTS "Anyone can insert ratings" ON public.safety_ratings;

TRUNCATE TABLE public.safety_ratings;

ALTER TABLE public.safety_ratings DROP COLUMN IF EXISTS rating;

ALTER TABLE public.safety_ratings
  ADD COLUMN lighting_rating integer NOT NULL,
  ADD COLUMN density_rating integer NOT NULL,
  ADD COLUMN gut_rating integer NOT NULL;

CREATE POLICY "Anyone can insert ratings"
ON public.safety_ratings
FOR INSERT
TO anon, authenticated
WITH CHECK (
  length(area_name) >= 1 AND length(area_name) <= 200
  AND lighting_rating BETWEEN 1 AND 5
  AND density_rating BETWEEN 1 AND 5
  AND gut_rating BETWEEN 1 AND 5
);