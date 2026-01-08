-- Criar função security definer para obter store_id do usuário atual (evitar recursão)
CREATE OR REPLACE FUNCTION public.get_user_store_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT store_id
  FROM public.profiles
  WHERE id = _user_id
  LIMIT 1
$$;

-- Remover política com recursão
DROP POLICY IF EXISTS "Usuários podem ver perfis restritos" ON public.profiles;

-- Criar nova política usando a função security definer
CREATE POLICY "Usuários podem ver perfis restritos" 
ON public.profiles 
FOR SELECT 
USING (
  (id = auth.uid()) 
  OR (
    store_id IS NOT NULL 
    AND store_id = public.get_user_store_id(auth.uid())
  ) 
  OR public.has_role(auth.uid(), 'administrador')
);

-- Atualizar política de cash_closings para funcionários verem apenas dados da própria loja
DROP POLICY IF EXISTS "Usuários podem ver fechamentos da própria loja" ON public.cash_closings;

CREATE POLICY "Usuários podem ver fechamentos da própria loja" 
ON public.cash_closings 
FOR SELECT 
USING (
  (user_id = auth.uid()) 
  OR (
    store_id = public.get_user_store_id(auth.uid())
  )
  OR public.has_role(auth.uid(), 'gerente')
  OR public.has_role(auth.uid(), 'administrador')
);