-- Create custom types
CREATE TYPE catalog_status AS ENUM ('pending', 'processing', 'completed', 'error');
CREATE TYPE product_status AS ENUM ('review', 'approved', 'rejected');
CREATE TYPE content_type AS ENUM ('post', 'story', 'carousel', 'catalog', 'video');

-- Profiles table (extends auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Catalogs table
CREATE TABLE public.catalogs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  file_url TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  file_type TEXT NOT NULL,
  status catalog_status DEFAULT 'pending'::catalog_status NOT NULL,
  extraction_result JSONB,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Products table
CREATE TABLE public.products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  catalog_id UUID REFERENCES public.catalogs(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  brand TEXT,
  dosage TEXT,
  price NUMERIC NOT NULL,
  extracted_price_text TEXT,
  description TEXT,
  image_url TEXT,
  status product_status DEFAULT 'review'::product_status NOT NULL,
  confidence_score NUMERIC,
  source_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  approved_at TIMESTAMP WITH TIME ZONE
);

-- Generated Contents table
CREATE TABLE public.generated_contents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  type content_type NOT NULL,
  title TEXT NOT NULL,
  caption TEXT NOT NULL,
  hashtags TEXT NOT NULL,
  cta TEXT NOT NULL,
  video_script TEXT,
  content_data JSONB,
  art_url TEXT,
  scheduled_for TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Content Products (Relation for carousels)
CREATE TABLE public.content_products (
  content_id UUID REFERENCES public.generated_contents(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (content_id, product_id)
);

-- Set up Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_contents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_products ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
-- Profiles: Users can view and update their own profile
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Catalogs: Users can CRUD their own catalogs
CREATE POLICY "Users can view own catalogs" ON public.catalogs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own catalogs" ON public.catalogs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own catalogs" ON public.catalogs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own catalogs" ON public.catalogs FOR DELETE USING (auth.uid() = user_id);

-- Products: Users can CRUD their own products
CREATE POLICY "Users can view own products" ON public.products FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own products" ON public.products FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own products" ON public.products FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own products" ON public.products FOR DELETE USING (auth.uid() = user_id);

-- Generated Contents: Users can CRUD their own contents
CREATE POLICY "Users can view own contents" ON public.generated_contents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own contents" ON public.generated_contents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own contents" ON public.generated_contents FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own contents" ON public.generated_contents FOR DELETE USING (auth.uid() = user_id);

-- Content Products: Users can CRUD through generated_contents
CREATE POLICY "Users can view own content products" ON public.content_products FOR SELECT USING (EXISTS (SELECT 1 FROM public.generated_contents gc WHERE gc.id = content_products.content_id AND gc.user_id = auth.uid()));
CREATE POLICY "Users can insert own content products" ON public.content_products FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.generated_contents gc WHERE gc.id = content_products.content_id AND gc.user_id = auth.uid()));
CREATE POLICY "Users can delete own content products" ON public.content_products FOR DELETE USING (EXISTS (SELECT 1 FROM public.generated_contents gc WHERE gc.id = content_products.content_id AND gc.user_id = auth.uid()));

-- Trigger to automatically create a profile when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
