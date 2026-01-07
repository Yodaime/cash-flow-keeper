-- Drop the existing overly permissive SELECT policy
DROP POLICY IF EXISTS "Usuários podem ver todos os perfis" ON public.profiles;

-- Create a new, more restrictive SELECT policy
-- Users can see: their own profile, profiles in the same store, or all profiles if admin
CREATE POLICY "Usuários podem ver perfis restritos"
ON public.profiles
FOR SELECT
USING (
  id = auth.uid() 
  OR (
    store_id IS NOT NULL 
    AND store_id = (SELECT store_id FROM public.profiles WHERE id = auth.uid())
  )
  OR has_role(auth.uid(), 'administrador')
);