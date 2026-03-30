-- ═══════════════════════════════════════════════════════════════════════════════
-- LifeSync — SQL Migration 002: Time Blocking Advanced Features
-- Execute este ficheiro no SQL Editor do Supabase
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. TABELA PRINCIPAL: time_blocks
--    (Adiciona colunas que podem estar em falta na versão anterior)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.time_blocks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  start_time   TIME NOT NULL,           -- ex: '08:00:00'
  end_time     TIME NOT NULL,           -- ex: '12:00:00'
  category     TEXT NOT NULL DEFAULT 'Estudo',
  date         DATE NOT NULL,           -- ex: '2025-03-29'
  is_ghost     BOOLEAN NOT NULL DEFAULT FALSE, -- TRUE = bloco fantasma (sugestão)
  template_id  UUID,                    -- referência ao template de origem (nullable)
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_time_blocks_user_date
  ON public.time_blocks (user_id, date);

CREATE INDEX IF NOT EXISTS idx_time_blocks_date_range
  ON public.time_blocks (user_id, date, start_time);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. TABELA: block_templates
--    Guarda "modelos de dia" (ex: "Segunda-feira Ideal")
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.block_templates (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,           -- ex: "Segunda-feira Ideal"
  day_of_week  SMALLINT,               -- 0=Dom, 1=Seg ... 6=Sab (NULL = genérico)
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_block_templates_user
  ON public.block_templates (user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. TABELA: block_template_items
--    Os blocos individuais dentro de cada template
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.block_template_items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id  UUID NOT NULL REFERENCES public.block_templates(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  start_time   TIME NOT NULL,
  end_time     TIME NOT NULL,
  category     TEXT NOT NULL DEFAULT 'Estudo',
  sort_order   SMALLINT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_template_items_template
  ON public.block_template_items (template_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. TABELA: hydration_logs
--    Registo de hidratação por bloco/hora
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.hydration_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date         DATE NOT NULL,
  logged_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ml           INTEGER NOT NULL DEFAULT 250,  -- mililitros ingeridos
  block_id     UUID REFERENCES public.time_blocks(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_hydration_user_date
  ON public.hydration_logs (user_id, date);

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. ROW LEVEL SECURITY (RLS)
--    Cada utilizador só vê os seus próprios dados
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.time_blocks         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.block_templates     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.block_template_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hydration_logs      ENABLE ROW LEVEL SECURITY;

-- time_blocks
CREATE POLICY "Users can manage own time_blocks"
  ON public.time_blocks FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- block_templates
CREATE POLICY "Users can manage own templates"
  ON public.block_templates FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- block_template_items (acesso via template que pertence ao user)
CREATE POLICY "Users can manage items of own templates"
  ON public.block_template_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.block_templates t
      WHERE t.id = block_template_items.template_id
        AND t.user_id = auth.uid()
    )
  );

-- hydration_logs
CREATE POLICY "Users can manage own hydration_logs"
  ON public.hydration_logs FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. QUERIES DE REFERÊNCIA
--    (Use estas queries no código / para testes)
-- ─────────────────────────────────────────────────────────────────────────────

-- [A] Buscar blocos de um dia específico (inclui fantasmas)
-- SELECT * FROM time_blocks
-- WHERE user_id = auth.uid() AND date = '2025-03-29'
-- ORDER BY start_time;

-- [B] Confirmar todos os blocos fantasma de um dia (torná-los reais)
-- UPDATE time_blocks
-- SET is_ghost = FALSE
-- WHERE user_id = auth.uid() AND date = '2025-03-29' AND is_ghost = TRUE;

-- [C] Buscar blocos do dia anterior para gerar ghost blocks
-- SELECT title, start_time, end_time, category
-- FROM time_blocks
-- WHERE user_id = auth.uid()
--   AND date = CURRENT_DATE - INTERVAL '1 day'
--   AND is_ghost = FALSE
-- ORDER BY start_time;

-- [D] Buscar templates do utilizador com items
-- SELECT t.*, ti.*
-- FROM block_templates t
-- LEFT JOIN block_template_items ti ON ti.template_id = t.id
-- WHERE t.user_id = auth.uid()
-- ORDER BY t.created_at, ti.sort_order;

-- [E] Hidratação total do dia
-- SELECT COALESCE(SUM(ml), 0) AS total_ml
-- FROM hydration_logs
-- WHERE user_id = auth.uid() AND date = CURRENT_DATE;

-- [F] Salvar um template a partir dos blocos de hoje
-- INSERT INTO block_templates (user_id, name, day_of_week)
-- VALUES (auth.uid(), 'Segunda-feira Ideal', 1)
-- RETURNING id;
-- -- Depois, para cada bloco de hoje:
-- INSERT INTO block_template_items (template_id, title, start_time, end_time, category, sort_order)
-- SELECT '<template_id_acima>', title, start_time, end_time, category, ROW_NUMBER() OVER (ORDER BY start_time)
-- FROM time_blocks
-- WHERE user_id = auth.uid() AND date = CURRENT_DATE AND is_ghost = FALSE;

-- [G] Aplicar template a um dia futuro (como ghost blocks)
-- INSERT INTO time_blocks (user_id, title, start_time, end_time, category, date, is_ghost, template_id)
-- SELECT auth.uid(), ti.title, ti.start_time, ti.end_time, ti.category, '2025-04-07', TRUE, t.id
-- FROM block_template_items ti
-- JOIN block_templates t ON t.id = ti.template_id
-- WHERE t.id = '<template_id>' AND t.user_id = auth.uid();
