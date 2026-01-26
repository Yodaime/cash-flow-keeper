
-- =====================================================
-- ATUALIZAÇÃO DE POLÍTICAS RLS POR PAPEL
-- Administrador: ver/editar/excluir lojas e usuários da org
-- Gerente: ver/editar funcionários e gerentes, criar/editar lojas
-- Funcionário: ver/registrar dados apenas da sua loja
-- =====================================================

-- =====================================================
-- 1. POLÍTICAS PARA STORES (LOJAS)
-- =====================================================

-- Remover políticas antigas
DROP POLICY IF EXISTS "Usuários podem ver lojas da própria organização" ON public.stores;
DROP POLICY IF EXISTS "Admins da org podem criar lojas" ON public.stores;
DROP POLICY IF EXISTS "Admins da org podem atualizar lojas" ON public.stores;
DROP POLICY IF EXISTS "Admins da org podem deletar lojas" ON public.stores;

-- Funcionários só veem sua própria loja
CREATE POLICY "Funcionários veem própria loja"
ON public.stores FOR SELECT
USING (
  is_super_admin(auth.uid()) OR
  (organization_id = get_user_organization_id(auth.uid()) AND (
    has_role(auth.uid(), 'administrador') OR
    has_role(auth.uid(), 'gerente') OR
    id = get_user_store_id(auth.uid())
  ))
);

-- Admins e Gerentes podem criar lojas na org
CREATE POLICY "Admins e Gerentes podem criar lojas"
ON public.stores FOR INSERT
WITH CHECK (
  is_super_admin(auth.uid()) OR
  (organization_id = get_user_organization_id(auth.uid()) AND (
    has_role(auth.uid(), 'administrador') OR
    has_role(auth.uid(), 'gerente')
  ))
);

-- Admins e Gerentes podem atualizar lojas na org
CREATE POLICY "Admins e Gerentes podem atualizar lojas"
ON public.stores FOR UPDATE
USING (
  is_super_admin(auth.uid()) OR
  (organization_id = get_user_organization_id(auth.uid()) AND (
    has_role(auth.uid(), 'administrador') OR
    has_role(auth.uid(), 'gerente')
  ))
);

-- Apenas Admins podem deletar lojas
CREATE POLICY "Admins podem deletar lojas"
ON public.stores FOR DELETE
USING (
  is_super_admin(auth.uid()) OR
  (organization_id = get_user_organization_id(auth.uid()) AND has_role(auth.uid(), 'administrador'))
);

-- =====================================================
-- 2. POLÍTICAS PARA PROFILES (USUÁRIOS)
-- =====================================================

-- Remover políticas antigas
DROP POLICY IF EXISTS "Usuários podem ver perfis da própria organização" ON public.profiles;
DROP POLICY IF EXISTS "Admins da org podem atualizar perfis" ON public.profiles;
DROP POLICY IF EXISTS "Admins da org podem deletar perfis" ON public.profiles;

-- Criar função auxiliar para verificar se pode gerenciar um perfil
CREATE OR REPLACE FUNCTION public.can_manage_profile(_manager_id uuid, _target_profile_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    -- Super admin pode tudo
    is_super_admin(_manager_id) OR
    -- Administrador pode gerenciar qualquer um da mesma org
    (has_role(_manager_id, 'administrador') AND 
     get_user_organization_id(_manager_id) = get_user_organization_id(_target_profile_id)) OR
    -- Gerente pode gerenciar funcionários e gerentes (não admins)
    (has_role(_manager_id, 'gerente') AND 
     get_user_organization_id(_manager_id) = get_user_organization_id(_target_profile_id) AND
     NOT has_role(_target_profile_id, 'administrador') AND
     NOT is_super_admin(_target_profile_id))
$$;

-- Visualização de perfis por papel
CREATE POLICY "Visualização de perfis por papel"
ON public.profiles FOR SELECT
USING (
  is_super_admin(auth.uid()) OR
  id = auth.uid() OR
  -- Administrador vê todos da org
  (has_role(auth.uid(), 'administrador') AND organization_id = get_user_organization_id(auth.uid())) OR
  -- Gerente vê funcionários e gerentes da org
  (has_role(auth.uid(), 'gerente') AND organization_id = get_user_organization_id(auth.uid()) AND
   NOT has_role(id, 'administrador') AND NOT is_super_admin(id)) OR
  -- Funcionário só vê a si mesmo (já coberto por id = auth.uid())
  false
);

-- Atualização de perfis por papel
CREATE POLICY "Atualização de perfis por papel"
ON public.profiles FOR UPDATE
USING (
  id = auth.uid() OR
  can_manage_profile(auth.uid(), id)
);

-- Exclusão de perfis (apenas Admins)
CREATE POLICY "Admins podem deletar perfis da org"
ON public.profiles FOR DELETE
USING (
  is_super_admin(auth.uid()) OR
  (has_role(auth.uid(), 'administrador') AND organization_id = get_user_organization_id(auth.uid()))
);

-- =====================================================
-- 3. POLÍTICAS PARA USER_ROLES
-- =====================================================

-- Remover políticas antigas
DROP POLICY IF EXISTS "Usuários podem ver papéis da própria organização" ON public.user_roles;
DROP POLICY IF EXISTS "Admins da org podem gerenciar papéis" ON public.user_roles;

-- Criar função para verificar se pode gerenciar papel de outro usuário
CREATE OR REPLACE FUNCTION public.can_manage_user_role(_manager_id uuid, _target_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    is_super_admin(_manager_id) OR
    -- Administrador pode gerenciar papéis de qualquer um da org
    (has_role(_manager_id, 'administrador') AND 
     get_user_organization_id(_manager_id) = get_user_organization_id(_target_user_id)) OR
    -- Gerente pode gerenciar papéis de funcionários e gerentes
    (has_role(_manager_id, 'gerente') AND 
     get_user_organization_id(_manager_id) = get_user_organization_id(_target_user_id) AND
     NOT has_role(_target_user_id, 'administrador') AND
     NOT is_super_admin(_target_user_id))
$$;

-- Visualização de papéis
CREATE POLICY "Visualização de papéis por papel"
ON public.user_roles FOR SELECT
USING (
  is_super_admin(auth.uid()) OR
  user_id = auth.uid() OR
  -- Administrador vê todos da org
  (has_role(auth.uid(), 'administrador') AND EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = user_roles.user_id 
    AND p.organization_id = get_user_organization_id(auth.uid())
  )) OR
  -- Gerente vê funcionários e gerentes
  (has_role(auth.uid(), 'gerente') AND EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = user_roles.user_id 
    AND p.organization_id = get_user_organization_id(auth.uid())
    AND NOT has_role(user_roles.user_id, 'administrador')
    AND NOT is_super_admin(user_roles.user_id)
  ))
);

-- Gerenciamento de papéis (INSERT, UPDATE, DELETE)
CREATE POLICY "Gerenciamento de papéis por papel"
ON public.user_roles FOR ALL
USING (can_manage_user_role(auth.uid(), user_id))
WITH CHECK (can_manage_user_role(auth.uid(), user_id));

-- =====================================================
-- 4. POLÍTICAS PARA CASH_CLOSINGS (FECHAMENTOS)
-- =====================================================

-- Remover políticas antigas
DROP POLICY IF EXISTS "Usuários podem ver fechamentos da própria organização" ON public.cash_closings;
DROP POLICY IF EXISTS "Funcionários podem criar fechamentos na própria org" ON public.cash_closings;
DROP POLICY IF EXISTS "Gerentes e admins podem atualizar fechamentos da org" ON public.cash_closings;
DROP POLICY IF EXISTS "Admins podem deletar fechamentos da org" ON public.cash_closings;

-- Funcionário: só vê/cria fechamentos da sua loja
-- Gerente: vê/edita todos da org
-- Administrador: vê/edita/deleta todos da org
CREATE POLICY "Visualização de fechamentos por papel"
ON public.cash_closings FOR SELECT
USING (
  is_super_admin(auth.uid()) OR
  (organization_id = get_user_organization_id(auth.uid()) AND (
    has_role(auth.uid(), 'administrador') OR
    has_role(auth.uid(), 'gerente') OR
    store_id = get_user_store_id(auth.uid())
  ))
);

-- Criação de fechamentos
CREATE POLICY "Criação de fechamentos por papel"
ON public.cash_closings FOR INSERT
WITH CHECK (
  user_id = auth.uid() AND
  organization_id = get_user_organization_id(auth.uid()) AND
  (
    is_super_admin(auth.uid()) OR
    has_role(auth.uid(), 'administrador') OR
    has_role(auth.uid(), 'gerente') OR
    store_id = get_user_store_id(auth.uid())
  )
);

-- Atualização de fechamentos
CREATE POLICY "Atualização de fechamentos por papel"
ON public.cash_closings FOR UPDATE
USING (
  is_super_admin(auth.uid()) OR
  (organization_id = get_user_organization_id(auth.uid()) AND (
    has_role(auth.uid(), 'administrador') OR
    has_role(auth.uid(), 'gerente') OR
    (user_id = auth.uid() AND store_id = get_user_store_id(auth.uid()))
  ))
);

-- Exclusão de fechamentos (apenas Admins)
CREATE POLICY "Exclusão de fechamentos por admins"
ON public.cash_closings FOR DELETE
USING (
  is_super_admin(auth.uid()) OR
  (organization_id = get_user_organization_id(auth.uid()) AND has_role(auth.uid(), 'administrador'))
);
