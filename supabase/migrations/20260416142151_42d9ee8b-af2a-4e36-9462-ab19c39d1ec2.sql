-- Create enums
CREATE TYPE public.state_tier AS ENUM ('licensed', 'psypact', 'none', 'excluded');
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create clinic_locations table
CREATE TABLE public.clinic_locations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  slug TEXT NOT NULL,
  external_url TEXT,
  svg_x NUMERIC NOT NULL,
  svg_y NUMERIC NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create state_configs table
CREATE TABLE public.state_configs (
  state_code TEXT PRIMARY KEY,
  tier state_tier NOT NULL DEFAULT 'none',
  is_license_only BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Enable RLS on all tables
ALTER TABLE public.clinic_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.state_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Public read policies
CREATE POLICY "Anyone can read clinic locations"
  ON public.clinic_locations FOR SELECT
  USING (true);

CREATE POLICY "Anyone can read state configs"
  ON public.state_configs FOR SELECT
  USING (true);

-- Admin write policies for clinic_locations
CREATE POLICY "Admins can insert clinic locations"
  ON public.clinic_locations FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update clinic locations"
  ON public.clinic_locations FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete clinic locations"
  ON public.clinic_locations FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admin write policies for state_configs
CREATE POLICY "Admins can insert state configs"
  ON public.state_configs FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update state configs"
  ON public.state_configs FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete state configs"
  ON public.state_configs FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admin can read user_roles
CREATE POLICY "Admins can read user roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Users can read their own roles
CREATE POLICY "Users can read own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_clinic_locations_updated_at
  BEFORE UPDATE ON public.clinic_locations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_state_configs_updated_at
  BEFORE UPDATE ON public.state_configs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
