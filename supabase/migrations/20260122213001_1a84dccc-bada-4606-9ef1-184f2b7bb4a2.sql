
-- 7. Políticas para organizations
CREATE POLICY "Super admins podem ver todas organizações"
  ON public.organizations FOR SELECT
  USING (is_super_admin(auth.uid()));

CREATE POLICY "Usuários podem ver própria organização"
  ON public.organizations FOR SELECT
  USING (id = get_user_organization_id(auth.uid()));

CREATE POLICY "Super admins podem criar organizações"
  ON public.organizations FOR INSERT
  WITH CHECK (is_super_admin(auth.uid()));

CREATE POLICY "Super admins podem atualizar organizações"
  ON public.organizations FOR UPDATE
  USING (is_super_admin(auth.uid()));

CREATE POLICY "Super admins podem deletar organizações"
  ON public.organizations FOR DELETE
  USING (is_super_admin(auth.uid()));

-- 8. REMOVER políticas antigas e criar novas para stores
DROP POLICY IF EXISTS "Usuários autenticados podem ver lojas" ON public.stores;
DROP POLICY IF EXISTS "Administradores podem criar lojas" ON public.stores;
DROP POLICY IF EXISTS "Administradores podem atualizar lojas" ON public.stores;
DROP POLICY IF EXISTS "Administradores podem deletar lojas" ON public.stores;

CREATE POLICY "Super admins podem ver todas lojas"
  ON public.stores FOR SELECT
  USING (is_super_admin(auth.uid()));

CREATE POLICY "Usuários podem ver lojas da própria organização"
  ON public.stores FOR SELECT
  USING (organization_id = get_user_organization_id(auth.uid()));

CREATE POLICY "Admins da org podem criar lojas"
  ON public.stores FOR INSERT
  WITH CHECK (
    is_super_admin(auth.uid()) 
    OR (organization_id = get_user_organization_id(auth.uid()) AND has_role(auth.uid(), 'administrador'))
  );

CREATE POLICY "Admins da org podem atualizar lojas"
  ON public.stores FOR UPDATE
  USING (
    is_super_admin(auth.uid()) 
    OR (organization_id = get_user_organization_id(auth.uid()) AND has_role(auth.uid(), 'administrador'))
  );

CREATE POLICY "Admins da org podem deletar lojas"
  ON public.stores FOR DELETE
  USING (
    is_super_admin(auth.uid()) 
    OR (organization_id = get_user_organization_id(auth.uid()) AND has_role(auth.uid(), 'administrador'))
  );
