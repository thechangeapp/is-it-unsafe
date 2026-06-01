CREATE TABLE public.safety_ratings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  area_name text NOT NULL,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT INSERT ON public.safety_ratings TO anon, authenticated;
GRANT ALL ON public.safety_ratings TO service_role;

ALTER TABLE public.safety_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert ratings"
ON public.safety_ratings
FOR INSERT
TO anon, authenticated
WITH CHECK (rating BETWEEN 1 AND 5 AND length(area_name) BETWEEN 1 AND 200);
