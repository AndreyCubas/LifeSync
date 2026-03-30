// ─────────────────────────────────────────────────────────────────────────────
// LifeSync — Time Blocking Extended Service
// Supabase-first, localStorage fallback automático
// ─────────────────────────────────────────────────────────────────────────────

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { genId, offsetDate, todayISO } from '../lib/utils';
import type { DbResult, DbListResult } from '../types';
import type {
  TimeBlockExtended,
  BlockTemplate,
  BlockTemplateItem,
  BlockTemplateWithItems,
  HydrationLog,
} from '../types/timeBlocking';
import type { BlockCategory } from '../types';

// ── localStorage helpers (mesmo padrão do dataService.ts) ────────────────────
const ls = {
  get<T>(key: string): T | null {
    try { return JSON.parse(localStorage.getItem('ls_' + key) ?? 'null'); }
    catch { return null; }
  },
  set<T>(key: string, value: T): void {
    localStorage.setItem('ls_' + key, JSON.stringify(value));
  },
  forUser<T>(userId: string, table: string): T[] {
    return ls.get<T[]>(`${userId}_${table}`) ?? [];
  },
  saveForUser<T>(userId: string, table: string, data: T[]): void {
    ls.set(`${userId}_${table}`, data);
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// EXTENDED BLOCKS SERVICE
// Substitui blocksService do dataService.ts com suporte a is_ghost
// ─────────────────────────────────────────────────────────────────────────────

export const extBlocksService = {

  /** Lista blocos de um dia (reais + fantasmas) */
  async listForDate(userId: string, date: string): Promise<DbListResult<TimeBlockExtended>> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('time_blocks')
        .select('*')
        .eq('user_id', userId)
        .eq('date', date)
        .order('start_time');
      return { data: (data ?? []) as TimeBlockExtended[], error: error?.message ?? null };
    }
    const all = ls.forUser<TimeBlockExtended>(userId, 'ext_blocks');
    return { data: all.filter(b => b.date === date).sort((a, b) => a.start_time.localeCompare(b.start_time)), error: null };
  },

  /** Lista blocos de um dia anterior (para geração de ghost blocks) */
  async listForPreviousDay(userId: string, date: string): Promise<DbListResult<TimeBlockExtended>> {
    if (isSupabaseConfigured) {
      // SQL: SELECT * FROM time_blocks WHERE user_id = $1 AND date = $2 AND is_ghost = FALSE ORDER BY start_time
      const { data, error } = await supabase
        .from('time_blocks')
        .select('*')
        .eq('user_id', userId)
        .eq('date', date)
        .eq('is_ghost', false)
        .order('start_time');
      return { data: (data ?? []) as TimeBlockExtended[], error: error?.message ?? null };
    }
    const all = ls.forUser<TimeBlockExtended>(userId, 'ext_blocks');
    return { data: all.filter(b => b.date === date && !b.is_ghost), error: null };
  },

  /** Cria um bloco (real ou fantasma) */
  async create(
    userId: string,
    payload: {
      title: string;
      start_time: string;
      end_time: string;
      category: BlockCategory;
      date: string;
      is_ghost?: boolean;
      template_id?: string;
    }
  ): Promise<DbResult<TimeBlockExtended>> {
    const block: TimeBlockExtended = {
      id: genId(),
      user_id: userId,
      title: payload.title,
      start_time: payload.start_time,
      end_time: payload.end_time,
      category: payload.category,
      date: payload.date,
      is_ghost: payload.is_ghost ?? false,
      template_id: payload.template_id,
      created_at: new Date().toISOString(),
    };
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('time_blocks')
        .insert(block)
        .select()
        .single();
      return { data: data as TimeBlockExtended, error: error?.message ?? null };
    }
    const all = ls.forUser<TimeBlockExtended>(userId, 'ext_blocks');
    ls.saveForUser(userId, 'ext_blocks', [...all, block]);
    return { data: block, error: null };
  },

  /** Actualiza um bloco */
  async update(
    userId: string,
    id: string,
    patch: Partial<Omit<TimeBlockExtended, 'id' | 'user_id' | 'created_at'>>
  ): Promise<DbResult<TimeBlockExtended>> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('time_blocks')
        .update(patch)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();
      return { data: data as TimeBlockExtended, error: error?.message ?? null };
    }
    const all = ls.forUser<TimeBlockExtended>(userId, 'ext_blocks');
    const updated = all.map(b => b.id === id ? { ...b, ...patch } : b);
    ls.saveForUser(userId, 'ext_blocks', updated);
    return { data: updated.find(b => b.id === id) ?? null, error: null };
  },

  /** Elimina um bloco */
  async delete(userId: string, id: string): Promise<DbResult<null>> {
    if (isSupabaseConfigured) {
      // SQL: DELETE FROM time_blocks WHERE id = $1 AND user_id = $2
      const { error } = await supabase
        .from('time_blocks')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);
      return { data: null, error: error?.message ?? null };
    }
    const all = ls.forUser<TimeBlockExtended>(userId, 'ext_blocks');
    ls.saveForUser(userId, 'ext_blocks', all.filter(b => b.id !== id));
    return { data: null, error: null };
  },

  /**
   * Confirma todos os ghost blocks de um dia (is_ghost → false)
   * SQL: UPDATE time_blocks SET is_ghost = FALSE
   *      WHERE user_id = $1 AND date = $2 AND is_ghost = TRUE
   */
  async confirmAllGhosts(userId: string, date: string): Promise<DbResult<null>> {
    if (isSupabaseConfigured) {
      const { error } = await supabase
        .from('time_blocks')
        .update({ is_ghost: false })
        .eq('user_id', userId)
        .eq('date', date)
        .eq('is_ghost', true);
      return { data: null, error: error?.message ?? null };
    }
    const all = ls.forUser<TimeBlockExtended>(userId, 'ext_blocks');
    const updated = all.map(b =>
      b.date === date && b.is_ghost ? { ...b, is_ghost: false } : b
    );
    ls.saveForUser(userId, 'ext_blocks', updated);
    return { data: null, error: null };
  },

  /** Remove todos os ghost blocks de um dia */
  async deleteAllGhosts(userId: string, date: string): Promise<DbResult<null>> {
    if (isSupabaseConfigured) {
      const { error } = await supabase
        .from('time_blocks')
        .delete()
        .eq('user_id', userId)
        .eq('date', date)
        .eq('is_ghost', true);
      return { data: null, error: error?.message ?? null };
    }
    const all = ls.forUser<TimeBlockExtended>(userId, 'ext_blocks');
    ls.saveForUser(userId, 'ext_blocks', all.filter(b => !(b.date === date && b.is_ghost)));
    return { data: null, error: null };
  },

  /**
   * Cria ghost blocks a partir dos blocos de ontem
   * SQL equivalente:
   *   INSERT INTO time_blocks (user_id, title, start_time, end_time, category, date, is_ghost)
   *   SELECT user_id, title, start_time, end_time, category, $targetDate, TRUE
   *   FROM time_blocks
   *   WHERE user_id = $userId AND date = $sourceDate AND is_ghost = FALSE
   */
  async generateGhostsFromDay(
    userId: string,
    sourceDate: string,
    targetDate: string
  ): Promise<DbResult<null>> {
    const { data: sourceBlocks } = await this.listForPreviousDay(userId, sourceDate);
    if (!sourceBlocks || sourceBlocks.length === 0) return { data: null, error: null };

    for (const b of sourceBlocks) {
      await this.create(userId, {
        title: b.title,
        start_time: b.start_time,
        end_time: b.end_time,
        category: b.category,
        date: targetDate,
        is_ghost: true,
      });
    }
    return { data: null, error: null };
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATES SERVICE
// ─────────────────────────────────────────────────────────────────────────────

export const templatesService = {

  /** Lista todos os templates do utilizador com os seus items */
  async list(userId: string): Promise<DbListResult<BlockTemplateWithItems>> {
    if (isSupabaseConfigured) {
      // SQL: SELECT t.*, json_agg(ti ORDER BY ti.sort_order) as items
      //      FROM block_templates t LEFT JOIN block_template_items ti ON ti.template_id = t.id
      //      WHERE t.user_id = $1 GROUP BY t.id ORDER BY t.created_at
      const { data: templates, error } = await supabase
        .from('block_templates')
        .select('*, block_template_items(*)')
        .eq('user_id', userId)
        .order('created_at');
      if (error) return { data: [], error: error.message };
      return {
        data: (templates ?? []).map(t => ({
          ...t,
          items: (t.block_template_items ?? []).sort((a: BlockTemplateItem, b: BlockTemplateItem) => a.sort_order - b.sort_order),
        })) as BlockTemplateWithItems[],
        error: null,
      };
    }
    const templates = ls.forUser<BlockTemplate>(userId, 'templates');
    const items     = ls.get<BlockTemplateItem[]>('template_items') ?? [];
    return {
      data: templates.map(t => ({
        ...t,
        items: items.filter(i => i.template_id === t.id).sort((a, b) => a.sort_order - b.sort_order),
      })),
      error: null,
    };
  },

  /** Cria um template novo (e os seus items) */
  async create(
    userId: string,
    name: string,
    dayOfWeek: number | null,
    items: Array<{ title: string; start_time: string; end_time: string; category: BlockCategory }>
  ): Promise<DbResult<BlockTemplateWithItems>> {
    if (isSupabaseConfigured) {
      // SQL: INSERT INTO block_templates (user_id, name, day_of_week) VALUES ($1,$2,$3) RETURNING *
      const { data: tmpl, error: tErr } = await supabase
        .from('block_templates')
        .insert({ user_id: userId, name, day_of_week: dayOfWeek })
        .select()
        .single();
      if (tErr || !tmpl) return { data: null, error: tErr?.message ?? 'Erro' };

      // SQL: INSERT INTO block_template_items (template_id, title, ..., sort_order) VALUES (...)
      const itemRows = items.map((it, i) => ({
        template_id: tmpl.id,
        title: it.title,
        start_time: it.start_time,
        end_time: it.end_time,
        category: it.category,
        sort_order: i,
      }));
      const { data: savedItems } = await supabase
        .from('block_template_items')
        .insert(itemRows)
        .select();

      return { data: { ...tmpl, items: (savedItems ?? []) as BlockTemplateItem[] }, error: null };
    }

    const tmpl: BlockTemplate = {
      id: genId(), user_id: userId, name,
      day_of_week: dayOfWeek,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const tmplItems: BlockTemplateItem[] = items.map((it, i) => ({
      id: genId(), template_id: tmpl.id,
      title: it.title, start_time: it.start_time,
      end_time: it.end_time, category: it.category,
      sort_order: i,
    }));

    const templates = ls.forUser<BlockTemplate>(userId, 'templates');
    ls.saveForUser(userId, 'templates', [...templates, tmpl]);
    const allItems = ls.get<BlockTemplateItem[]>('template_items') ?? [];
    ls.set('template_items', [...allItems, ...tmplItems]);

    return { data: { ...tmpl, items: tmplItems }, error: null };
  },

  /** Elimina um template (e os seus items em cascata) */
  async delete(userId: string, id: string): Promise<DbResult<null>> {
    if (isSupabaseConfigured) {
      // SQL: DELETE FROM block_templates WHERE id = $1 AND user_id = $2
      //      (cascade elimina block_template_items automaticamente)
      const { error } = await supabase
        .from('block_templates')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);
      return { data: null, error: error?.message ?? null };
    }
    const templates = ls.forUser<BlockTemplate>(userId, 'templates');
    ls.saveForUser(userId, 'templates', templates.filter(t => t.id !== id));
    const allItems = ls.get<BlockTemplateItem[]>('template_items') ?? [];
    ls.set('template_items', allItems.filter(i => i.template_id !== id));
    return { data: null, error: null };
  },

  /**
   * Aplica um template a uma data como ghost blocks
   * SQL:
   *   INSERT INTO time_blocks (user_id, title, start_time, end_time, category, date, is_ghost, template_id)
   *   SELECT $userId, title, start_time, end_time, category, $date, TRUE, $templateId
   *   FROM block_template_items WHERE template_id = $templateId
   */
  async applyToDate(
    userId: string,
    template: BlockTemplateWithItems,
    date: string
  ): Promise<DbResult<null>> {
    for (const item of template.items) {
      await extBlocksService.create(userId, {
        title: item.title,
        start_time: item.start_time,
        end_time: item.end_time,
        category: item.category,
        date,
        is_ghost: true,
        template_id: template.id,
      });
    }
    return { data: null, error: null };
  },

  /**
   * Salva os blocos reais de hoje como um novo template
   * (Equivalente ao [F] do SQL de referência)
   */
  async saveFromBlocks(
    userId: string,
    name: string,
    dayOfWeek: number | null,
    blocks: TimeBlockExtended[]
  ): Promise<DbResult<BlockTemplateWithItems>> {
    const realBlocks = blocks.filter(b => !b.is_ghost);
    return this.create(
      userId,
      name,
      dayOfWeek,
      realBlocks.map(b => ({
        title: b.title,
        start_time: b.start_time,
        end_time: b.end_time,
        category: b.category,
      }))
    );
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// HYDRATION SERVICE
// ─────────────────────────────────────────────────────────────────────────────

export const hydrationService = {

  /** Total de ml ingeridos hoje */
  async getTodayTotal(userId: string, date: string): Promise<number> {
    if (isSupabaseConfigured) {
      // SQL: SELECT COALESCE(SUM(ml), 0) FROM hydration_logs WHERE user_id = $1 AND date = $2
      const { data } = await supabase
        .from('hydration_logs')
        .select('ml')
        .eq('user_id', userId)
        .eq('date', date);
      return (data ?? []).reduce((s, r) => s + (r.ml ?? 0), 0);
    }
    const all = ls.forUser<HydrationLog>(userId, 'hydration');
    return all.filter(h => h.date === date).reduce((s, h) => s + h.ml, 0);
  },

  /** Lista logs do dia */
  async listToday(userId: string, date: string): Promise<DbListResult<HydrationLog>> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('hydration_logs')
        .select('*')
        .eq('user_id', userId)
        .eq('date', date)
        .order('logged_at', { ascending: false });
      return { data: (data ?? []) as HydrationLog[], error: error?.message ?? null };
    }
    const all = ls.forUser<HydrationLog>(userId, 'hydration');
    return { data: all.filter(h => h.date === date), error: null };
  },

  /** Regista um copo de água */
  async log(
    userId: string,
    date: string,
    ml: number = 250,
    blockId?: string
  ): Promise<DbResult<HydrationLog>> {
    const entry: HydrationLog = {
      id: genId(), user_id: userId, date,
      logged_at: new Date().toISOString(),
      ml, block_id: blockId,
    };
    if (isSupabaseConfigured) {
      // SQL: INSERT INTO hydration_logs (user_id, date, ml, block_id) VALUES ($1,$2,$3,$4)
      const { data, error } = await supabase
        .from('hydration_logs')
        .insert(entry)
        .select()
        .single();
      return { data: data as HydrationLog, error: error?.message ?? null };
    }
    const all = ls.forUser<HydrationLog>(userId, 'hydration');
    ls.saveForUser(userId, 'hydration', [entry, ...all]);
    return { data: entry, error: null };
  },

  /** Remove o último registo (undo) */
  async deleteLast(userId: string, date: string): Promise<DbResult<null>> {
    if (isSupabaseConfigured) {
      const { data } = await supabase
        .from('hydration_logs')
        .select('id')
        .eq('user_id', userId)
        .eq('date', date)
        .order('logged_at', { ascending: false })
        .limit(1);
      if (data && data.length > 0) {
        await supabase.from('hydration_logs').delete().eq('id', data[0].id);
      }
      return { data: null, error: null };
    }
    const all = ls.forUser<HydrationLog>(userId, 'hydration');
    const todayLogs = all.filter(h => h.date === date).sort((a, b) => b.logged_at.localeCompare(a.logged_at));
    if (todayLogs.length > 0) {
      ls.saveForUser(userId, 'hydration', all.filter(h => h.id !== todayLogs[0].id));
    }
    return { data: null, error: null };
  },
};
