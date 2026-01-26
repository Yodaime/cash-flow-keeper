-- Drop existing DELETE policy for stores
DROP POLICY IF EXISTS "Admins podem deletar lojas" ON public.stores;

-- Create new DELETE policy that allows both admins and managers
CREATE POLICY "Admins e Gerentes podem deletar lojas" 
ON public.stores 
FOR DELETE 
USING (
  is_super_admin(auth.uid()) OR
  (
    organization_id = get_user_organization_id(auth.uid()) AND
    (has_role(auth.uid(), 'administrador') OR has_role(auth.uid(), 'gerente'))
  )
);