-- Consolidated database schema for Cash Flow Keeper
-- Generated from files in supabase/migrations
-- Date: 2026-01-13
-- Notes:
-- 1) This file recreates the database objects (types, tables, functions, triggers, policies) used by the app.
-- 2) It assumes a PostgreSQL server. It enables the "pgcrypto" extension (for gen_random_uuid()).
-- 3) This schema references the "auth.users" table and "authenticated" role which are part of Supabase Auth.
--    If you're migrating to a different platform (Hostinger/AWS RDS), ensure you also migrate your auth users
--    or adapt/remove references to auth.schema/auth.users and the "authenticated" role.
-- 4) Run this on a fresh database (or inspect & adapt before running on production).
-- 5) After creating schema, import your data (tables) and recreate any supabase-specific objects if required.

BEGIN;

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums
-- Drop+create to ensure exact definitions on a target DB.
DROP TYPE IF EXISTS public.app_role CASCADE;

CREATE TYPE public.app_role AS ENUM ('funcionaria', 'gerente', 'administrador');

DROP TYPE IF EXISTS public.closing_status CASCADE;

CREATE TYPE public.closing_status AS ENUM ('ok', 'atencao', 'pendente', 'aprovado');

-- Tables
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.stores (
    id UUID NOT NULL DEFAULT gen_random_uuid () PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    unit TEXT,
    organization_id UUID REFERENCES public.organizations (id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID NOT NULL PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    store_id UUID REFERENCES public.stores (id) ON DELETE SET NULL,
    organization_id UUID REFERENCES public.organizations (id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    user_id UUID REFERENCES auth.users (id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'funcionaria',
    organization_id UUID REFERENCES public.organizations (id) ON DELETE CASCADE,
    UNIQUE (user_id, role)
);

CREATE TABLE IF NOT EXISTS public.cash_closings (
    id UUID NOT NULL DEFAULT gen_random_uuid () PRIMARY KEY,
    store_id UUID NOT NULL REFERENCES public.stores (id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
    organization_id UUID REFERENCES public.organizations (id) ON DELETE CASCADE,
    date DATE NOT NULL,
    expected_value DECIMAL(12, 2) NOT NULL,
    counted_value DECIMAL(12, 2) NOT NULL,
    difference DECIMAL(12, 2) NOT NULL,
    status closing_status NOT NULL DEFAULT 'pendente',
    observations TEXT,
    validated_by UUID REFERENCES auth.users (id),
    validated_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.cash_closings ENABLE ROW LEVEL SECURITY;

-- Functions
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
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
      AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- Function to get user's store id (security definer)
CREATE OR REPLACE FUNCTION public.get_user_store_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT store_id
  FROM public.profiles
  WHERE id = _user_id
  LIMIT 1
$$;

-- Function to check if user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
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
      AND role = 'super_admin'
  )
$$;

-- Function to get user's organization id (security definer)
CREATE OR REPLACE FUNCTION public.get_user_organization_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id
  FROM public.profiles
  WHERE id = _user_id
  LIMIT 1
$$;

-- Function to check if user is organization admin
CREATE OR REPLACE FUNCTION public.is_org_admin(_user_id uuid, _org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN public.user_roles ur ON ur.user_id = p.id
    WHERE p.id = _user_id
      AND p.organization_id = _org_id
      AND ur.role = 'administrador'
  )
$$;

-- Function to check if user has employee role (funcionaria or gerente)
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

-- Trigger function to update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Function to create profile automatically on new auth.user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.email),
    NEW.email
  );
  
  -- assign default role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'funcionaria');
  
  RETURN NEW;
END;
$$;

-- Triggers
CREATE TRIGGER IF NOT EXISTS update_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_stores_updated_at
  BEFORE UPDATE ON public.stores
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_cash_closings_updated_at
  BEFORE UPDATE ON public.cash_closings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Note: Trigger on auth.users requires auth.users table to exist and privileges to create triggers in auth schema.
-- Create trigger to handle new users in auth.users if desired (uncomment and run where auth.users exists):
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Policies
-- Organizations
DROP POLICY IF EXISTS "Super admins podem ver todas organizações" ON public.organizations;

CREATE POLICY "Super admins podem ver todas organizações" ON public.organizations FOR
SELECT USING (is_super_admin (auth.uid ()));

DROP POLICY IF EXISTS "Usuários podem ver própria organização" ON public.organizations;

CREATE POLICY "Usuários podem ver própria organização" ON public.organizations FOR
SELECT USING (
        id = get_user_organization_id (auth.uid ())
    );

DROP POLICY IF EXISTS "Super admins podem criar organizações" ON public.organizations;

CREATE POLICY "Super admins podem criar organizações" ON public.organizations FOR INSERT
WITH
    CHECK (is_super_admin (auth.uid ()));

DROP POLICY IF EXISTS "Super admins podem atualizar organizações" ON public.organizations;

CREATE POLICY "Super admins podem atualizar organizações" ON public.organizations
FOR UPDATE
    USING (is_super_admin (auth.uid ()));

DROP POLICY IF EXISTS "Super admins podem deletar organizações" ON public.organizations;

CREATE POLICY "Super admins podem deletar organizações" ON public.organizations FOR DELETE USING (is_super_admin (auth.uid ()));

-- Stores
DROP POLICY IF EXISTS "Super admins podem ver todas lojas" ON public.stores;

CREATE POLICY "Super admins podem ver todas lojas" ON public.stores FOR
SELECT USING (is_super_admin (auth.uid ()));

DROP POLICY IF EXISTS "Usuários podem ver lojas da própria organização" ON public.stores;

CREATE POLICY "Usuários podem ver lojas da própria organização" ON public.stores FOR
SELECT USING (
        organization_id = get_user_organization_id (auth.uid ())
    );

DROP POLICY IF EXISTS "Admins da org podem criar lojas" ON public.stores;

CREATE POLICY "Admins da org podem criar lojas" ON public.stores FOR INSERT
WITH
    CHECK (
        is_super_admin (auth.uid ())
        OR (
            organization_id = get_user_organization_id (auth.uid ())
            AND has_role (auth.uid (), 'administrador')
        )
    );

DROP POLICY IF EXISTS "Admins da org podem atualizar lojas" ON public.stores;

CREATE POLICY "Admins da org podem atualizar lojas" ON public.stores
FOR UPDATE
    USING (
        is_super_admin (auth.uid ())
        OR (
            organization_id = get_user_organization_id (auth.uid ())
            AND has_role (auth.uid (), 'administrador')
        )
    );

DROP POLICY IF EXISTS "Admins da org podem deletar lojas" ON public.stores;

CREATE POLICY "Admins da org podem deletar lojas" ON public.stores FOR DELETE USING (
    is_super_admin (auth.uid ())
    OR (
        organization_id = get_user_organization_id (auth.uid ())
        AND has_role (auth.uid (), 'administrador')
    )
);

-- Profiles
DROP POLICY IF EXISTS "Super admins podem ver todos perfis" ON public.profiles;

CREATE POLICY "Super admins podem ver todos perfis" ON public.profiles FOR
SELECT USING (is_super_admin (auth.uid ()));

DROP POLICY IF EXISTS "Usuários podem ver próprio perfil" ON public.profiles;

CREATE POLICY "Usuários podem ver próprio perfil" ON public.profiles FOR
SELECT USING (id = auth.uid ());

DROP POLICY IF EXISTS "Admins da org podem ver funcionários e gerentes" ON public.profiles;

CREATE POLICY "Admins da org podem ver funcionários e gerentes" ON public.profiles FOR
SELECT USING (
        organization_id = get_user_organization_id (auth.uid ())
        AND has_role (auth.uid (), 'administrador')
        AND is_employee_role (id)
    );

DROP POLICY IF EXISTS "Gerentes podem ver funcionários" ON public.profiles;

CREATE POLICY "Gerentes podem ver funcionários" ON public.profiles FOR
SELECT USING (
        organization_id = get_user_organization_id (auth.uid ())
        AND has_role (auth.uid (), 'gerente')
        AND is_employee_role (id)
    );

DROP POLICY IF EXISTS "Usuários podem inserir próprio perfil" ON public.profiles;

CREATE POLICY "Usuários podem inserir próprio perfil" ON public.profiles FOR INSERT
WITH
    CHECK (id = auth.uid ());

DROP POLICY IF EXISTS "Usuários podem atualizar próprio perfil" ON public.profiles;

CREATE POLICY "Usuários podem atualizar próprio perfil" ON public.profiles
FOR UPDATE
    USING (id = auth.uid ());

DROP POLICY IF EXISTS "Admins da org podem atualizar funcionários e gerentes" ON public.profiles;

CREATE POLICY "Admins da org podem atualizar funcionários e gerentes" ON public.profiles
FOR UPDATE
    USING (
        is_super_admin (auth.uid ())
        OR (
            organization_id = get_user_organization_id (auth.uid ())
            AND has_role (auth.uid (), 'administrador')
            AND is_employee_role (id)
        )
    );

DROP POLICY IF EXISTS "Super admins podem deletar qualquer perfil" ON public.profiles;

CREATE POLICY "Super admins podem deletar qualquer perfil" ON public.profiles FOR DELETE USING (is_super_admin (auth.uid ()));

DROP POLICY IF EXISTS "Admins da org podem deletar funcionários e gerentes" ON public.profiles;

CREATE POLICY "Admins da org podem deletar funcionários e gerentes" ON public.profiles FOR DELETE USING (
    organization_id = get_user_organization_id (auth.uid ())
    AND has_role (auth.uid (), 'administrador')
    AND is_employee_role (id)
);

-- User roles
DROP POLICY IF EXISTS "Super admins podem ver todos papéis" ON public.user_roles;

CREATE POLICY "Super admins podem ver todos papéis" ON public.user_roles FOR
SELECT USING (is_super_admin (auth.uid ()));

DROP POLICY IF EXISTS "Usuários podem ver papéis da própria organização" ON public.user_roles;

CREATE POLICY "Usuários podem ver papéis da própria organização" ON public.user_roles FOR
SELECT USING (
        user_id = auth.uid ()
        OR EXISTS (
            SELECT 1
            FROM public.profiles p
            WHERE
                p.id = user_roles.user_id
                AND p.organization_id = get_user_organization_id (auth.uid ())
        )
    );

DROP POLICY IF EXISTS "Super admins podem gerenciar todos papéis" ON public.user_roles;

CREATE POLICY "Super admins podem gerenciar todos papéis" ON public.user_roles FOR ALL USING (is_super_admin (auth.uid ()));

DROP POLICY IF EXISTS "Admins da org podem gerenciar papéis" ON public.user_roles;

CREATE POLICY "Admins da org podem gerenciar papéis" ON public.user_roles FOR ALL USING (
    has_role (auth.uid (), 'administrador')
    AND EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE
            p.id = user_roles.user_id
            AND p.organization_id = get_user_organization_id (auth.uid ())
    )
);

-- Cash closings
DROP POLICY IF EXISTS "Super admins podem ver todos fechamentos" ON public.cash_closings;

CREATE POLICY "Super admins podem ver todos fechamentos" ON public.cash_closings FOR
SELECT USING (is_super_admin (auth.uid ()));

DROP POLICY IF EXISTS "Usuários podem ver fechamentos da própria organização" ON public.cash_closings;

CREATE POLICY "Usuários podem ver fechamentos da própria organização" ON public.cash_closings FOR
SELECT USING (
        organization_id = get_user_organization_id (auth.uid ())
        AND (
            user_id = auth.uid ()
            OR store_id = get_user_store_id (auth.uid ())
            OR has_role (auth.uid (), 'gerente')
            OR has_role (auth.uid (), 'administrador')
        )
    );

DROP POLICY IF EXISTS "Funcionários podem criar fechamentos na própria org" ON public.cash_closings;

CREATE POLICY "Funcionários podem criar fechamentos na própria org" ON public.cash_closings FOR INSERT
WITH
    CHECK (
        user_id = auth.uid ()
        AND organization_id = get_user_organization_id (auth.uid ())
    );

DROP POLICY IF EXISTS "Gerentes e admins podem atualizar fechamentos da org" ON public.cash_closings;

CREATE POLICY "Gerentes e admins podem atualizar fechamentos da org" ON public.cash_closings
FOR UPDATE
    USING (
        is_super_admin (auth.uid ())
        OR (
            organization_id = get_user_organization_id (auth.uid ())
            AND (
                user_id = auth.uid ()
                OR has_role (auth.uid (), 'gerente')
                OR has_role (auth.uid (), 'administrador')
            )
        )
    );

DROP POLICY IF EXISTS "Admins podem deletar fechamentos da org" ON public.cash_closings;

CREATE POLICY "Admins podem deletar fechamentos da org" ON public.cash_closings FOR DELETE USING (
    is_super_admin (auth.uid ())
    OR (
        organization_id = get_user_organization_id (auth.uid ())
        AND has_role (auth.uid (), 'administrador')
    )
);

create table public.closing_issues (
    id uuid default gen_random_uuid () primary key,
    created_at timestamp with time zone default timezone ('utc'::text, now()) not null,
    user_id uuid references auth.users not null,
    store_id uuid references public.stores,
    description text not null,
    status text check (
        status in ('pending', 'resolved')
    ) default 'pending',
    updated_at timestamp with time zone default timezone ('utc'::text, now()) not null
);

alter table public.closing_issues enable row level security;

create policy "Users can view their own issues" on public.closing_issues for
select using (auth.uid () = user_id);

create policy "Admins and Super Admins can view all issues" on public.closing_issues for
select using (
        exists (
            select 1
            from public.user_roles
            where
                user_id = auth.uid ()
                and role in (
                    'administrador', 'super_admin'
                )
        )
    );

create policy "Authenticated users can insert issues" on public.closing_issues for insert
with
    check (auth.uid () = user_id);

create policy "Admins and Super Admins can update issues" on public.closing_issues
for update
    using (
        exists (
            select 1
            from public.user_roles
            where
                user_id = auth.uid ()
                and role in (
                    'administrador',
                    'super_admin'
                )
        )
    );

create policy "Admins and Super Admins can delete issues" on public.closing_issues for delete using (
    exists (
        select 1
        from public.user_roles
        where
            user_id = auth.uid ()
            and role in (
                'administrador',
                'super_admin'
            )
    )
);

COMMIT;

-- ===== Migration notes =====
-- - Ensure the "auth" schema and "auth.users" table exist if you want triggers that reference auth.users (handle_new_user, on_auth_user_created) to work.
-- - On Supabase the role "authenticated" and function auth.uid() are available automatically; on other platforms you may need to adapt policies and replace auth.uid() with current_user or session information.
-- - If your destination DB lacks Supabase features, you can:
--     * Remove or adapt RLS policies and triggers that reference auth.* objects.
--     * Create a minimal "auth.users" table with columns (id uuid PRIMARY KEY, email text, raw_user_meta_data jsonb) to allow references to work for an initial import.
-- - After creating schema, dump and import data (COPY/pg_restore) and recreate any database-level secrets/roles as needed.

-- End of consolidated schema