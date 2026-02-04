-- Create products/stock table
CREATE TABLE public.products (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 0,
    unit_value NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Super admins can view all products
CREATE POLICY "Super admins podem ver todos produtos"
ON public.products
FOR SELECT
USING (is_super_admin(auth.uid()));

-- Admins can view products from their organization
CREATE POLICY "Admins podem ver produtos da organização"
ON public.products
FOR SELECT
USING (
    has_role(auth.uid(), 'administrador'::app_role) 
    AND organization_id = get_user_organization_id(auth.uid())
);

-- Super admins can insert products
CREATE POLICY "Super admins podem inserir produtos"
ON public.products
FOR INSERT
WITH CHECK (is_super_admin(auth.uid()));

-- Admins can insert products in their organization
CREATE POLICY "Admins podem inserir produtos na organização"
ON public.products
FOR INSERT
WITH CHECK (
    has_role(auth.uid(), 'administrador'::app_role) 
    AND organization_id = get_user_organization_id(auth.uid())
);

-- Super admins can update all products
CREATE POLICY "Super admins podem atualizar produtos"
ON public.products
FOR UPDATE
USING (is_super_admin(auth.uid()));

-- Admins can update products in their organization
CREATE POLICY "Admins podem atualizar produtos da organização"
ON public.products
FOR UPDATE
USING (
    has_role(auth.uid(), 'administrador'::app_role) 
    AND organization_id = get_user_organization_id(auth.uid())
);

-- Super admins can delete products
CREATE POLICY "Super admins podem deletar produtos"
ON public.products
FOR DELETE
USING (is_super_admin(auth.uid()));

-- Admins can delete products in their organization
CREATE POLICY "Admins podem deletar produtos da organização"
ON public.products
FOR DELETE
USING (
    has_role(auth.uid(), 'administrador'::app_role) 
    AND organization_id = get_user_organization_id(auth.uid())
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();