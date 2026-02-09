
-- 1) Allow admins/super_admins to DELETE account requests
CREATE POLICY "Admins can delete account requests"
ON public.account_requests
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = ANY (ARRAY['super_admin'::app_role, 'administrador'::app_role])
  )
);

-- 2) Update profiles SELECT policy to hide super_admins from admins/gerentes
DROP POLICY IF EXISTS "Visualização de perfis por papel" ON public.profiles;

CREATE POLICY "Visualização de perfis por papel"
ON public.profiles
FOR SELECT
USING (
  is_super_admin(auth.uid())
  OR (id = auth.uid())
  OR (
    has_role(auth.uid(), 'administrador') 
    AND ((organization_id = get_user_organization_id(auth.uid())) OR (organization_id IS NULL))
    AND NOT is_super_admin(id)
  )
  OR (
    has_role(auth.uid(), 'gerente') 
    AND (organization_id = get_user_organization_id(auth.uid()))
    AND NOT has_role(id, 'administrador')
    AND NOT is_super_admin(id)
  )
);

-- 3) Update user_roles SELECT policy to hide super_admin roles from non-super_admins
DROP POLICY IF EXISTS "Visualização de papéis por papel" ON public.user_roles;

CREATE POLICY "Visualização de papéis por papel"
ON public.user_roles
FOR SELECT
USING (
  is_super_admin(auth.uid())
  OR (user_id = auth.uid())
  OR (
    has_role(auth.uid(), 'administrador')
    AND NOT is_super_admin(user_roles.user_id)
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = user_roles.user_id
        AND p.organization_id = get_user_organization_id(auth.uid())
    )
  )
  OR (
    has_role(auth.uid(), 'gerente')
    AND NOT is_super_admin(user_roles.user_id)
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = user_roles.user_id
        AND p.organization_id = get_user_organization_id(auth.uid())
        AND NOT has_role(user_roles.user_id, 'administrador')
    )
  )
);
