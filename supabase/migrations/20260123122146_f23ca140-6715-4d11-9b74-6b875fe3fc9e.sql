
-- 10. REMOVER políticas antigas e criar novas para cash_closings
DROP POLICY IF EXISTS "Usuários podem ver fechamentos da própria loja" ON public.cash_closings;
DROP POLICY IF EXISTS "Funcionários podem criar fechamentos" ON public.cash_closings;
DROP POLICY IF EXISTS "Gerentes e admins podem atualizar fechamentos" ON public.cash_closings;
DROP POLICY IF EXISTS "Administradores podem deletar fechamentos" ON public.cash_closings;

CREATE POLICY "Super admins podem ver todos fechamentos"
  ON public.cash_closings FOR SELECT
  USING (is_super_admin(auth.uid()));

CREATE POLICY "Usuários podem ver fechamentos da própria organização"
  ON public.cash_closings FOR SELECT
  USING (
    organization_id = get_user_organization_id(auth.uid())
    AND (
      user_id = auth.uid()
      OR store_id = get_user_store_id(auth.uid())
      OR has_role(auth.uid(), 'gerente')
      OR has_role(auth.uid(), 'administrador')
    )
  );

CREATE POLICY "Funcionários podem criar fechamentos na própria org"
  ON public.cash_closings FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND organization_id = get_user_organization_id(auth.uid())
  );

CREATE POLICY "Gerentes e admins podem atualizar fechamentos da org"
  ON public.cash_closings FOR UPDATE
  USING (
    is_super_admin(auth.uid())
    OR (
      organization_id = get_user_organization_id(auth.uid())
      AND (
        user_id = auth.uid()
        OR has_role(auth.uid(), 'gerente')
        OR has_role(auth.uid(), 'administrador')
      )
    )
  );

CREATE POLICY "Admins podem deletar fechamentos da org"
  ON public.cash_closings FOR DELETE
  USING (
    is_super_admin(auth.uid())
    OR (organization_id = get_user_organization_id(auth.uid()) AND has_role(auth.uid(), 'administrador'))
  );

-- 11. REMOVER políticas antigas e criar novas para user_roles
DROP POLICY IF EXISTS "Usuários podem ver próprio papel" ON public.user_roles;
DROP POLICY IF EXISTS "Administradores podem gerenciar papéis" ON public.user_roles;

CREATE POLICY "Super admins podem ver todos papéis"
  ON public.user_roles FOR SELECT
  USING (is_super_admin(auth.uid()));

CREATE POLICY "Usuários podem ver papéis da própria organização"
  ON public.user_roles FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = user_roles.user_id
        AND p.organization_id = get_user_organization_id(auth.uid())
    )
  );

CREATE POLICY "Super admins podem gerenciar todos papéis"
  ON public.user_roles FOR ALL
  USING (is_super_admin(auth.uid()));

CREATE POLICY "Admins da org podem gerenciar papéis"
  ON public.user_roles FOR ALL
  USING (
    has_role(auth.uid(), 'administrador')
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = user_roles.user_id
        AND p.organization_id = get_user_organization_id(auth.uid())
    )
  );
