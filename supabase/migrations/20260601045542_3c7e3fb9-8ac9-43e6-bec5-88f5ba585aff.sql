CREATE TABLE IF NOT EXISTS public.safety_ratings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  area_name text NOT NULL,
  rating integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.safety_ratings TO anon, authenticated;
GRANT ALL ON public.safety_ratings TO service_role;

ALTER TABLE public.safety_ratings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert ratings" ON public.safety_ratings;
CREATE POLICY "Anyone can insert ratings"
  ON public.safety_ratings
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    rating >= 1 AND rating <= 5
    AND length(area_name) >= 1 AND length(area_name) <= 200
  );
