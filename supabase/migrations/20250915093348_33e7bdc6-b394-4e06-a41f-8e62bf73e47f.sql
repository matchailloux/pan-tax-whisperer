-- Create table for jurisdictions
CREATE TABLE public.jurisdictions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  jurisdiction TEXT NOT NULL,
  tax_id TEXT NOT NULL,
  valid_from DATE NOT NULL,
  valid_until DATE,
  permanent_establishment BOOLEAN NOT NULL DEFAULT false,
  registered_in_import_scheme BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.jurisdictions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own jurisdictions" 
ON public.jurisdictions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own jurisdictions" 
ON public.jurisdictions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own jurisdictions" 
ON public.jurisdictions 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own jurisdictions" 
ON public.jurisdictions 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add period fields to vat_reports table
ALTER TABLE public.vat_reports 
ADD COLUMN period_start DATE,
ADD COLUMN period_end DATE,
ADD COLUMN period_type TEXT; -- 'monthly', 'quarterly', 'annual'

-- Create trigger for updated_at
CREATE TRIGGER update_jurisdictions_updated_at
BEFORE UPDATE ON public.jurisdictions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();