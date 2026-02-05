-- Atualizar política de visualização de perfis para incluir usuários sem organização
DROP POLICY IF EXISTS "Visualização de perfis por papel" ON public.profiles;

CREATE POLICY "Visualização de perfis por papel" 
ON public.profiles 
FOR SELECT 
USING (
  is_super_admin(auth.uid()) OR 
  (id = auth.uid()) OR 
  -- Admins podem ver usuários da mesma org OU usuários sem organização
  (has_role(auth.uid(), 'administrador'::app_role) AND (
    organization_id = get_user_organization_id(auth.uid()) OR
    organization_id IS NULL
  )) OR 
  -- Gerentes podem ver funcionários/gerentes da mesma org (não admins)
  (has_role(auth.uid(), 'gerente'::app_role) AND 
   organization_id = get_user_organization_id(auth.uid()) AND
   NOT has_role(id, 'administrador'::app_role) AND 
   NOT is_super_admin(id))
);

-- Atualizar política de atualização de perfis
DROP POLICY IF EXISTS "Atualização de perfis por papel" ON public.profiles;

CREATE POLICY "Atualização de perfis por papel" 
ON public.profiles 
FOR UPDATE 
USING (
  (id = auth.uid()) OR 
  can_manage_profile(auth.uid(), id) OR
  -- Admins podem atualizar usuários sem organização (para associá-los)
  (has_role(auth.uid(), 'administrador'::app_role) AND organization_id IS NULL)
);

-- Atualizar política de visualização de lojas para usuários sem loja associada
DROP POLICY IF EXISTS "Funcionários veem própria loja" ON public.stores;

CREATE POLICY "Visualização de lojas por papel" 
ON public.stores 
FOR SELECT 
USING (
  is_super_admin(auth.uid()) OR 
  -- Admins e gerentes veem todas as lojas da org
  (organization_id = get_user_organization_id(auth.uid()) AND 
   (has_role(auth.uid(), 'administrador'::app_role) OR has_role(auth.uid(), 'gerente'::app_role))) OR
  -- Funcionários só veem sua loja OU todas lojas da org se não tiver loja associada
  (organization_id = get_user_organization_id(auth.uid()) AND (
    id = get_user_store_id(auth.uid()) OR
    get_user_store_id(auth.uid()) IS NULL
  ))
);