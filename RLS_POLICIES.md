# 🔐 RLS Policies para LifeSync — Supabase

Para que o Supabase funcione corretamente com as políticas de segurança, você precisa ter as seguintes RLS policies configuradas.

## 📋 Como Aplicar

1. Abra seu projeto no [Supabase Dashboard](https://supabase.com)
2. Vá para **SQL Editor** (lateral esquerda)
3. Crie uma nova query
4. Cole o SQL abaixo (copie a seção relevante para sua tabela)
5. Clique **Run**

---

## ✅ Time Blocks Table

```sql
-- Enable RLS on table
ALTER TABLE time_blocks ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can only read their own time blocks
CREATE POLICY "Users can read their own time_blocks"
  ON time_blocks
  FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT: Users can only create their own time blocks
CREATE POLICY "Users can insert their own time_blocks"
  ON time_blocks
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: Users can only edit their own time blocks
CREATE POLICY "Users can update their own time_blocks"
  ON time_blocks
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: Users can only delete their own time blocks
CREATE POLICY "Users can delete their own time_blocks"
  ON time_blocks
  FOR DELETE
  USING (auth.uid() = user_id);
```

---

## ✅ Block Templates Table

```sql
ALTER TABLE block_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own templates"
  ON block_templates
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create templates"
  ON block_templates
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own templates"
  ON block_templates
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own templates"
  ON block_templates
  FOR DELETE
  USING (auth.uid() = user_id);
```

---

## ✅ Block Template Items Table

```sql
ALTER TABLE block_template_items ENABLE ROW LEVEL SECURITY;

-- This one is trickier because it references block_templates
CREATE POLICY "Users can read items from their templates"
  ON block_template_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM block_templates
      WHERE block_templates.id = block_template_items.template_id
      AND block_templates.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create items in their templates"
  ON block_template_items
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM block_templates
      WHERE block_templates.id = block_template_items.template_id
      AND block_templates.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update items in their templates"
  ON block_template_items
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM block_templates
      WHERE block_templates.id = block_template_items.template_id
      AND block_templates.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM block_templates
      WHERE block_templates.id = block_template_items.template_id
      AND block_templates.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete items from their templates"
  ON block_template_items
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM block_templates
      WHERE block_templates.id = block_template_items.template_id
      AND block_templates.user_id = auth.uid()
    )
  );
```

---

## ✅ Hydration Logs Table

```sql
ALTER TABLE hydration_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own hydration logs"
  ON hydration_logs
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create logs"
  ON hydration_logs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their logs"
  ON hydration_logs
  FOR DELETE
  USING (auth.uid() = user_id);
```

---

## ✅ Meals Table (se existir)

```sql
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own meals"
  ON meals
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create meals"
  ON meals
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own meals"
  ON meals
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own meals"
  ON meals
  FOR DELETE
  USING (auth.uid() = user_id);
```

---

## ✅ Workouts Table (se existir)

```sql
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own workouts"
  ON workouts
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create workouts"
  ON workouts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workouts"
  ON workouts
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workouts"
  ON workouts
  FOR DELETE
  USING (auth.uid() = user_id);
```

---

## ✅ Workout Exercises Table (se existir)

```sql
ALTER TABLE workout_exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read exercises from their workouts"
  ON workout_exercises
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workouts
      WHERE workouts.id = workout_exercises.workout_id
      AND workouts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create exercises"
  ON workout_exercises
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workouts
      WHERE workouts.id = workout_exercises.workout_id
      AND workouts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their exercises"
  ON workout_exercises
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM workouts
      WHERE workouts.id = workout_exercises.workout_id
      AND workouts.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workouts
      WHERE workouts.id = workout_exercises.workout_id
      AND workouts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their exercises"
  ON workout_exercises
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM workouts
      WHERE workouts.id = workout_exercises.workout_id
      AND workouts.user_id = auth.uid()
    )
  );
```

---

## ✅ Events Table (se existir)

```sql
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own events"
  ON events
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create events"
  ON events
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own events"
  ON events
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own events"
  ON events
  FOR DELETE
  USING (auth.uid() = user_id);
```

---

## 🔍 Como Verificar se as Policies Estão Ativas

1. **No Supabase Dashboard:**
   - Vá para **Authentication** → **Policies** (ou **Table Editor** → clique numa tabela → **RLS** botão no canto superior)
   - Você deve ver as policies listadas em verde/ativo

2. **Via Console:**
   ```sql
   -- Ver todas as policies
   SELECT * FROM pg_policies WHERE schemaname = 'public';
   
   -- Ver policies de uma tabela específica
   SELECT * FROM pg_policies WHERE tablename = 'time_blocks';
   ```

---

## ⚠️ Troubleshooting

### "permission denied for schema public"
- Confirm aplicou as policies acima
- Confirm que `auth.uid()` retorna um user_id válido
- Verifique que o `user_id` enviado do frontend EQUALS ao `auth.uid()`

### "relation does not exist"
- Verificar que o nome da tabela está correto (case-sensitive)
- Verificar que o schema é `public`

### "Row-level security bypassed" (no dev)
- Isso é normal se você tem Supabase em modo development
- Vérifiez que tirou o bypass quando foi para produção

---

## 📊 Checklist de Aplicação

- [ ] `ALTER TABLE time_blocks ENABLE ROW LEVEL SECURITY;`
- [ ] 4 policies aplicadas (SELECT, INSERT, UPDATE, DELETE) para time_blocks
- [ ] 4 policies para block_templates
- [ ] 5 policies para block_template_items (com JOINs)
- [ ] 4 policies para hydration_logs
- [ ] Repetir para meals, workouts, workout_exercises, events se existirem
- [ ] Teste: Fazer login e criar um time block
- [ ] Verificar no console: `✅ [time_blocks] CREATE - Success`
- [ ] Verificar no Supabase Dashboard que o registro apareceu

---

## 🚀 Depois de Aplicar

Após aplicar as policies, teste:

1. **CREATE:** Novo time block deve ser criado com seu user_id
2. **READ:** Só você vê seus blocos (reload a página)
3. **UPDATE:** Editar um bloco seu deve funcionar
4. **DELETE:** Deletar um bloco seu deve funcionar
5. **ISOLATION:** Outro usuário não vê seus blocos

Se algum falhar, procure a mensagem de erro no console (F12).
