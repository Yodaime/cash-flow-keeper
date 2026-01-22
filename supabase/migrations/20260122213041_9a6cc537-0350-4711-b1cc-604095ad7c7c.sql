
-- 9. REMOVER políticas antigas e criar novas para profiles
DROP POLICY IF EXISTS "Usuários podem ver perfis restritos" ON public.profiles;
DROP POLICY IF EXISTS "Usuários podem atualizar próprio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Administradores podem atualizar qualquer perfil" ON public.profiles;
DROP POLICY IF EXISTS "Administradores podem deletar perfis" ON public.profiles;
DROP POLICY IF EXISTS "Usuários podem inserir próprio perfil" ON public.profiles;

CREATE POLICY "Super admins podem ver todos perfis"
  ON public.profiles FOR SELECT
  USING (is_super_admin(auth.uid()));

CREATE POLICY "Usuários podem ver perfis da própria organização"
  ON public.profiles FOR SELECT
  USING (
    id = auth.uid()
    OR organization_id = get_user_organization_id(auth.uid())
  );

CREATE POLICY "Usuários podem inserir próprio perfil"
  ON public.profiles FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE POLICY "Usuários podem atualizar próprio perfil"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "Admins da org podem atualizar perfis"
  ON public.profiles FOR UPDATE
  USING (
    is_super_admin(auth.uid())
    OR (organization_id = get_user_organization_id(auth.uid()) AND has_role(auth.uid(), 'administrador'))
  );

CREATE POLICY "Admins da org podem deletar perfis"
  ON public.profiles FOR DELETE
  USING (
    is_super_admin(auth.uid())
    OR (organization_id = get_user_organization_id(auth.uid()) AND has_role(auth.uid(), 'administrador'))
  );
