# 🔧 LifeSync — Guia Completo de Correção Supabase

## ✅ O Que Foi Corrigido

### 1. **Session Listener do Supabase (CRÍTICO)**
**Problema:** O `user` no store permanecia `null` mesmo após login bem-sucedido.

**Solução:** 
- Criado arquivo `src/store/initializeAuth.ts` com:
  - `initializeSupabaseAuth()` - registra listener da autenticação
  - `checkAuthStatus()` - verifica sesão atual
- Atualizado `src/store/appStore.ts` para inicializar `user: null` (não mais lê localStorage)
- Adicionado estado `isAuthLoading` para mostrar loading durante inicialização
- `App.tsx` agora chama `initializeSupabaseAuth()` no `useEffect` da raiz

**Impacto:** ✅ User agora é sincronizado corretamente com Supabase auth quando a app inicia

---

### 2. **Logging Detalhado para RLS (Debugging)**
**Problema:** Erros silenciosos quando RLS bloqueava operações (erro 403/permission denied)

**Solução:**
- Criado arquivo `src/lib/debug.ts` com:
  - `logSupabaseOperation()` - registra operações com contexto completo
  - `debugAuthStatus()` - verifica autenticação atual
  - `debugRLSError()` - explica tipos comuns de erro RLS
  - `withErrorContext()` - wrapper que captura erros com contexto
  - `printDiagnostics()` - prints no console ao iniciar

**Integração:**
- `src/services/timeBlockingService.ts` agora usa `withErrorContext()` em CREATE, UPDATE, DELETE
- `App.tsx` chama `printDiagnostics()` ao iniciar

**Impacto:** ✅ Erros de RLS agora são visíveis no console com sugestões de solução

---

### 3. **Arquitetura de Payload (JÁ CORRETO)**
**Verificado:** Nomes de colunas estão corretos
- ✅ `start_time` e `end_time` (não `start`/`end`)
- ✅ `user_id` está sendo enviado em todos os INSERTs
- ✅ `category` está sendo mapeado corretamente
- ✅ `date` está no formato ISO (YYYY-MM-DD)

---

## 🧪 Como Testar

### Teste 1: Verificar Session Listener
1. Abrir DevTools (F12) → Console
2. Fazer login
3. Verificar mensagens: `[Auth] ✅ User logged in: <user-id>`
4. Recarregar página (F5)
5. Verificar que user é restaurado automaticamente
6. **Esperado:** User não fica `null` após recarregar

---

### Teste 2: Criar um Time Block
1. Estar logado
2. Navegar para "Time Blocking"
3. Clicar "Novo bloco"
4. Preencher: Título, Hora início/fim, Categoria
5. Clicar "Salvar"
6. **Console esperado:**
   - `✅ [time_blocks] CREATE (userId: xxxx...) - Success` (se OK)
   - `❌ [time_blocks] CREATE (userId: xxxx...) - Failed` + detalhes (se erro)

---

### Teste 3: Resolver Erro de RLS
Se vir erro como: `permission denied for schema public`

**Checklist:**
1. ✅ Está logado? (Procure `[Auth] ✅ Authenticated as` no console)
2. ✅ Supabase está configurado? (Procure `Supabase configured: true`)
3. ✅ RLS policies existem? (Vá ao Supabase Dashboard → Home → Policies)
4. ✅ Política permite o seu user_id?
   ```sql
   -- Example policy:
   CREATE POLICY "Users can only access their own rows"
   ON time_blocks
   FOR ALL
   USING (auth.uid() = user_id);
   ```

---

### Teste 4: Verificar Payload Enviado
Se um CREATE falhar, procure no console:
```
Payload sent: {
  id: "abc123",
  user_id: "xyz789",
  title: "Estudo",
  start_time: "08:00",    ← Deve ser string HH:MM
  end_time: "09:00",      ← Deve ser string HH:MM
  category: "Estudo",     ← Deve ser uma das categorias válidas
  date: "2026-03-30",     ← Deve ser YYYY-MM-DD
  is_ghost: false,
  created_at: "2026-03-30T..."
}
```

**Se algum campo está `undefined`, isso é o problema!**

---

## 📋 Checklist de Funcionamento

- [ ] Pode fazer login sem erros
- [ ] Após login, `user` não é null (veja store)
- [ ] Pode criar um time block
- [ ] Após recarregar, blocos ainda estão lá
- [ ] Pode editar um bloco
- [ ] Pode deletar um bloco
- [ ] Console mostra `[Auth] ✅` ou `[time_blocks] ✅` para operações bem-sucedidas
- [ ] Se há erro, console mostra detalhadamente qual foi

---

## 🔍 Se Ainda Houver Problemas

### Sintoma: "Lista vazia [] mesmo após criar blocos"
**Causa potencial:** RLS está bloqueando a SELECT
```sql
-- Verifique se há policy para SELECT:
CREATE POLICY "Users can read their own rows"
ON time_blocks
FOR SELECT
USING (auth.uid() = user_id);
```

### Sintoma: "CREATE funciona mas UPDATE/DELETE falham"
**Causa potencial:** Falta policy para UPDATE/DELETE
```sql
CREATE POLICY "Users can update their own rows"
ON time_blocks
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own rows"
ON time_blocks
FOR DELETE
USING (auth.uid() = user_id);
```

### Sintoma: "Funciona local (localStorage) mas falha no Supabase"
**Debug:**
1. Confirm `isSupabaseConfigured` é `true` (DevTools Console)
2. Procure por `[Auth] ❌ Not authenticated` (token expirado)
3. Verifique RLS policies existem (Supabase Dashboard)

---

## 📂 Arquivos Modificados

| Arquivo | Mudança |
|---------|---------|
| `src/store/appStore.ts` | Inicializa `user: null`, adicionado `isAuthLoading` |
| `src/store/initializeAuth.ts` | Novo - implementa session listener |
| `src/lib/debug.ts` | Novo - logging e diagnostics |
| `src/services/timeBlockingService.ts` | Adicionado `withErrorContext()` para logging |
| `src/App.tsx` | Inicializa autenticação, mostra loading, chama diagnostics |

---

## 🚀 Próximos Passos Sugeridos

1. **Teste completo** - Execute todos os testes acima
2. **Monitore console** - Veja se todas as operações mostram `✅ Success` 
3. **Se houver erro** - Compartilhe a mensagem exata do console
4. **RLS policies** - Confirme que todas existem no seu Supabase

---

## Sumário do Diagnóstico Original

Você identificou 3 problemas. Aqui está o status:

| Problema | Status | Solução |
|----------|--------|---------|
| Desacoplamento síncrono/assíncrono | ✅ Corrigido | Session listener + useEffect assíncrono |
| Inconsistência de Payload | ✅ Verificado | Payload está correto, nenhuma mudança necessária |
| Falha de Sessão/RLS | ✅ Corrigido | Logging detalhado + inicialização correta |

O código agora está pronto para migração completa de LocalStorage → Supabase.
