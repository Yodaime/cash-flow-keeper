
CREATE TABLE public.closing_issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  user_id uuid NOT NULL,
  store_id uuid REFERENCES public.stores(id) ON DELETE SET NULL,
  description text NOT NULL,
  status text NOT NULL DEFAULT 'pending'
);

ALTER TABLE public.closing_issues ENABLE ROW LEVEL SECURITY;

-- Authenticated users can create issues
CREATE POLICY "Users can create issues"
  ON public.closing_issues FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Admins, gerentes and issue creators can view issues in their org
CREATE POLICY "View issues by role"
  ON public.closing_issues FOR SELECT
  TO authenticated
  USING (
    is_super_admin(auth.uid()) OR
    (
      EXISTS (
        SELECT 1 FROM profiles p WHERE p.id = closing_issues.user_id 
        AND p.organization_id = get_user_organization_id(auth.uid())
      )
      AND (
        has_role(auth.uid(), 'administrador') OR
        has_role(auth.uid(), 'gerente') OR
        user_id = auth.uid()
      )
    )
  );

-- Admins and gerentes can update issues in their org
CREATE POLICY "Update issues by role"
  ON public.closing_issues FOR UPDATE
  TO authenticated
  USING (
    is_super_admin(auth.uid()) OR
    (
      EXISTS (
        SELECT 1 FROM profiles p WHERE p.id = closing_issues.user_id 
        AND p.organization_id = get_user_organization_id(auth.uid())
      )
      AND (has_role(auth.uid(), 'administrador') OR has_role(auth.uid(), 'gerente'))
    )
  );

-- Admins can delete issues
CREATE POLICY "Delete issues by role"
  ON public.closing_issues FOR DELETE
  TO authenticated
  USING (
    is_super_admin(auth.uid()) OR
    (
      EXISTS (
        SELECT 1 FROM profiles p WHERE p.id = closing_issues.user_id 
        AND p.organization_id = get_user_organization_id(auth.uid())
      )
      AND has_role(auth.uid(), 'administrador')
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_closing_issues_updated_at
  BEFORE UPDATE ON public.closing_issues
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
