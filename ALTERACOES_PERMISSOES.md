# Alterações de Permissões - Sistema Cash Flow Keeper
**Data:** 23 de janeiro de 2026

## 📋 Resumo das Alterações

Foram implementadas políticas RLS (Row Level Security) refinadas para controlar acessos baseado em papéis e organização.

---

## 🔐 Permissões Implementadas

### 1. **Administrador da Organização**
- ✅ **Ver** funcionários e gerentes da sua organização
- ✅ **Alterar** dados de funcionários e gerentes
- ✅ **Excluir** funcionários e gerentes
- ✅ Pode criar, alterar e deletar lojas da organização
- ✅ Pode criar e validar fechamentos de caixa
- ✅ Pode gerenciar papéis de usuários

### 2. **Gerente**
- ✅ **Ver** outros funcionários da sua organização
- ❌ Não pode alterar ou excluir funcionários
- ✅ Pode validar fechamentos de caixa
- ✅ Pode visualizar fechamentos da sua loja

### 3. **Funcionário**
- ❌ Não pode ver outros funcionários (a menos que seja pelo gerente/admin)
- ✅ Pode visualizar apenas seu próprio perfil
- ✅ Pode criar fechamentos de caixa na sua loja
- ✅ Pode editar seus próprios dados

### 4. **Super Admin**
- ✅ **Acesso total** a todas as organizações, usuários e dados
- ✅ Pode gerenciar organizações, lojas e usuários globalmente

---

## 📁 Arquivos Modificados

### 1. **supabase/migrations/20260123143015_add_permission_policies.sql** (NOVO)
Migration que implementa as novas políticas de permissão baseadas em organização e papel.

**Conteúdo:**
- Adição da coluna `organization_id` em `user_roles` (se não existir)
- Função `is_employee_role()` - verifica se usuário é funcionário ou gerente
- Políticas RLS refinadas para `profiles`:
  - Super admins veem todos
  - Usuários veem seu próprio perfil
  - Admins veem funcionários/gerentes da org
  - Gerentes veem funcionários da org
  - Permissões de update e delete com validações

### 2. **supabase/schema.sql** (ATUALIZADO)
Arquivo consolidado com o esquema completo atualizado:
- Inclusão da tabela `organizations`
- Adição de `organization_id` às tabelas `stores`, `profiles`, `user_roles` e `cash_closings`
- Todas as funções helper atualizadas
- Políticas RLS completas por tabela

---

## 🔧 Funções SQL Criadas

```sql
-- Verifica se usuário é funcionário ou gerente
is_employee_role(_user_id uuid) -> boolean

-- Já existiam:
- has_role(_user_id, _role)
- get_user_role(_user_id)
- is_super_admin(_user_id)
- get_user_organization_id(_user_id)
- is_org_admin(_user_id, _org_id)
- get_user_store_id(_user_id)
```

---

## 🚀 Como Aplicar as Alterações

### Opção 1: Aplicar apenas a nova migration (recomendado)
```bash
psql -h seu-host -U seu-usuario -d seu-database -f supabase/migrations/20260123143015_add_permission_policies.sql
```

### Opção 2: Aplicar o schema completo em um novo banco
```bash
psql -h seu-host -U seu-usuario -d novo-database -f supabase/schema.sql
```

---

## ⚠️ Notas Importantes

1. **Organização é obrigatória**: Usuários precisam ter `organization_id` definido para que as políticas funcionem corretamente.

2. **Migração de dados**: Se você tem usuários existentes sem `organization_id`, execute:
   ```sql
   UPDATE public.profiles 
   SET organization_id = 'seu-uuid-org' 
   WHERE organization_id IS NULL;
   ```

3. **Compatibilidade com Supabase Auth**: As políticas usam `auth.uid()` que é fornecido automaticamente pelo Supabase.

4. **RLS habilitado**: Todas as tabelas têm RLS habilitado, portanto:
   - Sem política explícita = acesso negado
   - Um usuário vê apenas dados que suas políticas permitem

---

## 🧪 Teste as Permissões

### Para Administrador:
```sql
-- Deve retornar funcionários e gerentes da sua org
SELECT * FROM profiles 
WHERE organization_id = 'seu-org-id' AND role IN ('funcionaria', 'gerente');
```

### Para Gerente:
```sql
-- Deve retornar apenas funcionários (não outros gerentes nem admins)
SELECT * FROM profiles 
WHERE organization_id = 'seu-org-id' AND role = 'funcionaria';
```

### Para Funcionário:
```sql
-- Deve retornar erro de RLS ou resultado vazio para outros usuários
SELECT * FROM profiles WHERE id != auth.uid();
```

---

## 📊 Matriz de Permissões

| Ação | Super Admin | Admin Org | Gerente | Funcionário |
|------|-------------|-----------|---------|-------------|
| Ver todos da org | ✅ | ✅ | ✅* | ❌ |
| Alterar funcionário/gerente | ✅ | ✅ | ❌ | ❌ |
| Deletar funcionário/gerente | ✅ | ✅ | ❌ | ❌ |
| Criar loja | ✅ | ✅ | ❌ | ❌ |
| Validar fechamento | ✅ | ✅ | ✅ | ❌ |
| Criar fechamento | ✅ | ✅ | ✅ | ✅ |

*Gerente vê apenas funcionários, não outros gerentes ou admins
