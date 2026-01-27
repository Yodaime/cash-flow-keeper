-- Criar tabela para solicitações de conta pendentes
CREATE TABLE public.account_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.account_requests ENABLE ROW LEVEL SECURITY;

-- Super admins e admins podem ver todas as solicitações
CREATE POLICY "Admins can view account requests"
ON public.account_requests
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('super_admin', 'administrador')
  )
);

-- Super admins e admins podem atualizar solicitações
CREATE POLICY "Admins can update account requests"
ON public.account_requests
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('super_admin', 'administrador')
  )
);

-- Qualquer pessoa pode inserir solicitação (não precisa estar autenticado)
CREATE POLICY "Anyone can create account requests"
ON public.account_requests
FOR INSERT
WITH CHECK (true);