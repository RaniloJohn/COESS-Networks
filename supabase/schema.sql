-- ============================================
-- COESS Networks — Supabase Database Schema
-- ============================================

-- Profiles (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  display_name text,
  avatar_url text,
  total_xp integer DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable" ON public.profiles
  FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Modules (seeded, not user-created)
CREATE TABLE public.modules (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  description text,
  icon text NOT NULL,
  order_index integer NOT NULL,
  difficulty text CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  total_xp integer DEFAULT 0
);

ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Modules are public" ON public.modules FOR SELECT USING (true);

-- Tasks within modules
CREATE TABLE public.tasks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  module_id uuid REFERENCES public.modules(id) ON DELETE CASCADE,
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  description text,
  type text CHECK (type IN ('tutorial', 'calculator', 'lab', 'visualizer', 'quiz')),
  xp_reward integer DEFAULT 10,
  order_index integer NOT NULL,
  content_meta jsonb DEFAULT '{}'::jsonb
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tasks are public" ON public.tasks FOR SELECT USING (true);

-- Task completions (XP tracking)
CREATE TABLE public.task_completions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id uuid REFERENCES public.tasks(id) ON DELETE CASCADE,
  xp_earned integer NOT NULL,
  answer_data jsonb DEFAULT '{}'::jsonb,
  completed_at timestamptz DEFAULT now(),
  UNIQUE(user_id, task_id)
);

ALTER TABLE public.task_completions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own completions" ON public.task_completions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own completions" ON public.task_completions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Auto-update profile total_xp on completion
CREATE OR REPLACE FUNCTION update_user_xp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
  SET total_xp = (
    SELECT COALESCE(SUM(xp_earned), 0)
    FROM public.task_completions
    WHERE user_id = NEW.user_id
  ), updated_at = now()
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_task_completed
AFTER INSERT ON public.task_completions
FOR EACH ROW EXECUTE FUNCTION update_user_xp();

-- Saved topologies
CREATE TABLE public.saved_topologies (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  topology_data jsonb NOT NULL,
  is_public boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.saved_topologies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own topologies" ON public.saved_topologies
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Public topologies are viewable" ON public.saved_topologies
  FOR SELECT USING (is_public = true);
