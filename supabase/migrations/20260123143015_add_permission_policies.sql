-- Migration: Adicionar permissões para administrador gerenciar funcionários e gerentes
-- Data: 23 de janeiro de 2026
-- Objetivo: Permitir que administrador veja, altere e delete funcionários/gerentes
--           Permitir que gerente veja funcionários

-- Adicionar coluna organization_id em user_roles se não existir
-- (garante que roles estejam vinculadas à organização para filtragem correta)
-- Obs: Se já existe, este comando será ignorado
ALTER TABLE public.user_roles 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Função para verificar se um usuário é gerente ou funcionário
CREATE OR REPLACE FUNCTION public.is_employee_role(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('funcionaria', 'gerente')
  )
$$;

-- Remover políticas antigas de profiles que são muito permissivas
DROP POLICY IF EXISTS "Usuários podem ver perfis da própria organização" ON public.profiles;
DROP POLICY IF EXISTS "Admins da org podem atualizar perfis" ON public.profiles;
DROP POLICY IF EXISTS "Admins da org podem deletar perfis" ON public.profiles;

-- Novas políticas com separação clara de permissões

-- SELECT: Super admins veem todos
CREATE POLICY "Super admins podem ver todos perfis"
  ON public.profiles FOR SELECT
  USING (is_super_admin(auth.uid()));

-- SELECT: Usuários veem o próprio perfil
CREATE POLICY "Usuários podem ver próprio perfil"
  ON public.profiles FOR SELECT
  USING (id = auth.uid());

-- SELECT: Administradores veem funcionários e gerentes da própria organização
CREATE POLICY "Admins da org podem ver funcionários e gerentes"
  ON public.profiles FOR SELECT
  USING (
    organization_id = get_user_organization_id(auth.uid())
    AND has_role(auth.uid(), 'administrador')
    AND is_employee_role(id)
  );

-- SELECT: Gerentes veem funcionários da própria organização
CREATE POLICY "Gerentes podem ver funcionários"
  ON public.profiles FOR SELECT
  USING (
    organization_id = get_user_organization_id(auth.uid())
    AND has_role(auth.uid(), 'gerente')
    AND is_employee_role(id)
  );

-- INSERT: Usuários podem inserir próprio perfil
CREATE POLICY "Usuários podem inserir próprio perfil"
  ON public.profiles FOR INSERT
  WITH CHECK (id = auth.uid());

-- UPDATE: Usuários podem atualizar próprio perfil
CREATE POLICY "Usuários podem atualizar próprio perfil"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid());

-- UPDATE: Administradores podem atualizar funcionários e gerentes da própria organização
CREATE POLICY "Admins da org podem atualizar funcionários e gerentes"
  ON public.profiles FOR UPDATE
  USING (
    is_super_admin(auth.uid())
    OR (
      organization_id = get_user_organization_id(auth.uid())
      AND has_role(auth.uid(), 'administrador')
      AND is_employee_role(id)
    )
  );

-- DELETE: Super admins podem deletar qualquer perfil
CREATE POLICY "Super admins podem deletar qualquer perfil"
  ON public.profiles FOR DELETE
  USING (is_super_admin(auth.uid()));

-- DELETE: Administradores podem deletar funcionários e gerentes da própria organização
CREATE POLICY "Admins da org podem deletar funcionários e gerentes"
  ON public.profiles FOR DELETE
  USING (
    organization_id = get_user_organization_id(auth.uid())
    AND has_role(auth.uid(), 'administrador')
    AND is_employee_role(id)
  );
