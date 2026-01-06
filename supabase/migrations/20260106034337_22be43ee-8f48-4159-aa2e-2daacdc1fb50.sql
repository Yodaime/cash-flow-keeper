-- Allow administrators to delete profiles
CREATE POLICY "Administradores podem deletar perfis" 
ON public.profiles 
FOR DELETE 
USING (has_role(auth.uid(), 'administrador'::app_role));

-- Allow administrators to update any profile
CREATE POLICY "Administradores podem atualizar qualquer perfil" 
ON public.profiles 
FOR UPDATE 
USING (has_role(auth.uid(), 'administrador'::app_role));