-- Permitir que administradores deletem fechamentos
CREATE POLICY "Administradores podem deletar fechamentos" 
ON public.cash_closings 
FOR DELETE 
USING (public.has_role(auth.uid(), 'administrador'));