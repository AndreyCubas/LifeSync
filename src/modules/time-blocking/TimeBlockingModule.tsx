// ─────────────────────────────────────────────────────────────────────────────
// LifeSync — Time Blocking Module (Advanced)
//
// Features:
//   1. Live Timeline Feed com indicador de tempo real
//   2. Ghost Blocks (blocos fantasma) + Confirmar Rotina Base
//   3. Quick Capture Bar (parsing de texto natural)
//   4. Smart Suggestions (Meal Windows + Hydration Alerts)
//   5. Templates por dia da semana
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useAppStore } from '../../store/appStore';
import { useClock } from '../../hooks';
import {
  extBlocksService,
  templatesService,
  hydrationService,
} from '../../services/timeBlockingService';
import { parseQuickCapture } from '../../lib/quickCaptureParser';
import { generateSmartSuggestions, isDeepWork } from '../../lib/smartSuggestions';
import {
  timeToMinutes, nowMinutes, blockDurationMinutes,
  isBlockActive, isBlockPast, todayISO, offsetDate, fmtTime, fmtDuration, pad2,
} from '../../lib/utils';
import { CATEGORY_CONFIG, BLOCK_CATEGORIES, DAYS_SHORT } from '../../lib/constants';
import type { BlockCategory } from '../../types';
import type {
  TimeBlockExtended, BlockTemplateWithItems, ParsedQuickCapture,
} from '../../types/timeBlocking';
import {
  Button, Modal, FormField, Input, Select, ConfirmDialog,
  PlusIcon, EditIcon, TrashIcon, ChevronLIcon, ChevronRIcon,
} from '../../components/ui';

// ─────────────────────────────────────────────────────────────────────────────
// MAIN MODULE
// ─────────────────────────────────────────────────────────────────────────────

export function TimeBlockingModule() {
  const user  = useAppStore(s => s.user)!;
  const clock = useClock();

  // ── Date ────────────────────────────────────────────────────────────────────
  const [date, setDate] = useState(todayISO());
  const isToday         = date === todayISO();
  const dayOfWeek       = new Date(date + 'T12:00:00').getDay();

  // ── Data ────────────────────────────────────────────────────────────────────
  const [blocks, setBlocks]           = useState<TimeBlockExtended[]>([]);
  const [templates, setTemplates]     = useState<BlockTemplateWithItems[]>([]);
  const [hydrationMl, setHydrationMl] = useState(0);
  const [loading, setLoading]         = useState(true);

  // ── UI ──────────────────────────────────────────────────────────────────────
  const [showTemplatePanel, setShowTemplatePanel] = useState(false);
  const [showSaveTemplate, setShowSaveTemplate]   = useState(false);
  const [saveTplName, setSaveTplName]             = useState('');
  const [saveTplDay, setSaveTplDay]               = useState<number | null>(dayOfWeek);

  // ── Block modal ─────────────────────────────────────────────────────────────
  const [blockModal, setBlockModal]   = useState(false);
  const [editingId, setEditingId]     = useState<string | null>(null);
  const [blockForm, setBlockForm]     = useState({
    title: '', start_time: '', end_time: '', category: 'Estudo' as BlockCategory, date,
  });
  const [blockSaving, setBlockSaving] = useState(false);

  // ── Quick Capture ───────────────────────────────────────────────────────────
  const [quickInput, setQuickInput]   = useState('');
  const [parsed, setParsed]           = useState<ParsedQuickCapture | null>(null);
  const [quickSaving, setQuickSaving] = useState(false);
  const quickRef                      = useRef<HTMLInputElement>(null);

  // ── Confirm ─────────────────────────────────────────────────────────────────
  const [confirmId, setConfirmId]     = useState<string | null>(null);
  const nowLineRef                    = useRef<HTMLDivElement>(null);

  // ── Load ─────────────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    const [bRes, tRes, hMl] = await Promise.all([
      extBlocksService.listForDate(user.id, date),
      templatesService.list(user.id),
      hydrationService.getTodayTotal(user.id, date),
    ]);
    setBlocks(bRes.data);
    setTemplates(tRes.data);
    setHydrationMl(hMl);
    setLoading(false);
  }, [user.id, date]);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Auto ghost blocks from yesterday ─────────────────────────────────────────
  useEffect(() => {
    if (loading) return;
    const hasBlocks = blocks.length > 0;
    if (!hasBlocks) {
      (async () => {
        const yesterday = offsetDate(-1);
        const { data: prev } = await extBlocksService.listForPreviousDay(user.id, yesterday);
        if (prev && prev.length > 0) {
          await extBlocksService.generateGhostsFromDay(user.id, yesterday, date);
          loadData();
        }
      })();
    }
  }, [loading]);

  // ── Scroll to now line ────────────────────────────────────────────────────────
  useEffect(() => {
    setTimeout(() => nowLineRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 500);
  }, [date]);

  // ── Derived ───────────────────────────────────────────────────────────────────
  const sortedBlocks   = useMemo(() => [...blocks].sort((a, b) => a.start_time.localeCompare(b.start_time)), [blocks]);
  const realBlocks     = useMemo(() => sortedBlocks.filter(b => !b.is_ghost), [sortedBlocks]);
  const hasGhosts      = useMemo(() => blocks.some(b => b.is_ghost), [blocks]);
  const ghostCount     = useMemo(() => blocks.filter(b => b.is_ghost).length, [blocks]);

  const suggestions = useMemo(() => generateSmartSuggestions({
    blocks: realBlocks, hydrationTotalMl: hydrationMl, todayMealCount: 0,
  }), [realBlocks, hydrationMl]);

  const catSummary = useMemo(() => {
    const totals: Record<string, number> = {};
    let total = 0;
    realBlocks.forEach(b => { const d = blockDurationMinutes(b); totals[b.category] = (totals[b.category] ?? 0) + d; total += d; });
    return Object.entries(totals).map(([cat, mins]) => ({
      category: cat as BlockCategory, minutes: mins,
      pct: total > 0 ? Math.round((mins / total) * 100) : 0,
    })).sort((a, b) => b.minutes - a.minutes);
  }, [realBlocks]);

  // ── Quick Capture live parse ───────────────────────────────────────────────
  useEffect(() => {
    if (!quickInput.trim()) { setParsed(null); return; }
    setParsed(parseQuickCapture(quickInput));
  }, [quickInput]);

  // ── Block CRUD ────────────────────────────────────────────────────────────
  const openCreate = (pre?: Partial<typeof blockForm>) => {
    setEditingId(null); setBlockForm({ title: '', start_time: '', end_time: '', category: 'Estudo', date, ...pre }); setBlockModal(true);
  };
  const openEdit = (b: TimeBlockExtended) => {
    setEditingId(b.id); setBlockForm({ title: b.title, start_time: b.start_time, end_time: b.end_time, category: b.category, date: b.date }); setBlockModal(true);
  };
  const saveBlock = async () => {
    if (!blockForm.title.trim() || !blockForm.start_time || !blockForm.end_time) return;
    setBlockSaving(true);
    if (editingId) await extBlocksService.update(user.id, editingId, blockForm);
    else await extBlocksService.create(user.id, { ...blockForm, is_ghost: false });
    await loadData(); setBlockSaving(false); setBlockModal(false);
  };
  const deleteBlock = async () => {
    if (!confirmId) return;
    await extBlocksService.delete(user.id, confirmId); await loadData(); setConfirmId(null);
  };

  // ── Ghost actions ─────────────────────────────────────────────────────────
  const confirmAllGhosts  = async () => { await extBlocksService.confirmAllGhosts(user.id, date); await loadData(); };
  const dismissAllGhosts  = async () => { await extBlocksService.deleteAllGhosts(user.id, date);  await loadData(); };
  const confirmOneGhost   = async (id: string) => { await extBlocksService.update(user.id, id, { is_ghost: false }); await loadData(); };

  // ── Quick Capture submit ──────────────────────────────────────────────────
  const submitQuickCapture = async () => {
    if (!parsed?.isValid) return;
    setQuickSaving(true);
    await extBlocksService.create(user.id, { title: parsed.title, start_time: parsed.start_time, end_time: parsed.end_time, category: parsed.category, date, is_ghost: false });
    await loadData(); setQuickInput(''); setParsed(null); setQuickSaving(false); quickRef.current?.focus();
  };

  // ── Template actions ──────────────────────────────────────────────────────
  const applyTemplate = async (tpl: BlockTemplateWithItems) => {
    await extBlocksService.deleteAllGhosts(user.id, date);
    await templatesService.applyToDate(user.id, tpl, date);
    await loadData(); setShowTemplatePanel(false);
  };
  const saveAsTemplate = async () => {
    if (!saveTplName.trim()) return;
    await templatesService.saveFromBlocks(user.id, saveTplName, saveTplDay, realBlocks);
    await loadData(); setShowSaveTemplate(false); setSaveTplName('');
  };
  const delTemplate = async (id: string) => { await templatesService.delete(user.id, id); await loadData(); };

  // ── Hydration ─────────────────────────────────────────────────────────────
  const logWater  = async (ml = 250) => { await hydrationService.log(user.id, date, ml); setHydrationMl(p => p + ml); };
  const undoWater = async () => { await hydrationService.deleteLast(user.id, date); setHydrationMl(await hydrationService.getTodayTotal(user.id, date)); };

  const bf = <K extends keyof typeof blockForm>(k: K, v: (typeof blockForm)[K]) => setBlockForm(p => ({ ...p, [k]: v }));
  const nowMin = nowMinutes();

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-full overflow-hidden">

      {/* ── MAIN COLUMN ──────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* TOP BAR */}
        <div className="flex-shrink-0 bg-white border-b border-slate-100 px-6 py-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Time Blocking</h1>
              {isToday && (
                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200">
                  ● {pad2(clock.getHours())}:{pad2(clock.getMinutes())}:{pad2(clock.getSeconds())}
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowTemplatePanel(p => !p)}>📋 Templates</Button>
              <Button variant="ghost" size="sm" onClick={() => setShowSaveTemplate(true)}>💾 Salvar dia</Button>
              <Button size="sm" icon={<PlusIcon />} onClick={() => openCreate()}>Novo bloco</Button>
            </div>
          </div>

          {/* Date nav */}
          <div className="flex items-center gap-2">
            <button onClick={() => { const d = new Date(date); d.setDate(d.getDate()-1); setDate(d.toISOString().split('T')[0]); }}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"><ChevronLIcon /></button>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 outline-none focus:border-indigo-400 cursor-pointer" />
            <button onClick={() => { const d = new Date(date); d.setDate(d.getDate()+1); setDate(d.toISOString().split('T')[0]); }}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"><ChevronRIcon /></button>
            <button onClick={() => setDate(todayISO())}
              className="px-3 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 rounded-xl hover:bg-indigo-100 border border-indigo-200 transition-colors">Hoje</button>
            <span className="text-xs text-slate-400 ml-1">
              {DAYS_SHORT[dayOfWeek]}, {new Date(date+'T12:00:00').getDate()} de {['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'][new Date(date+'T12:00:00').getMonth()]}
            </span>
          </div>

          {/* ── QUICK CAPTURE ─────────────────────────────────────────────── */}
          <QuickCaptureBar
            inputRef={quickRef} value={quickInput} onChange={setQuickInput}
            parsed={parsed} loading={quickSaving} onSubmit={submitQuickCapture}
          />
        </div>

        {/* GHOST BANNER */}
        {hasGhosts && (
          <div className="flex-shrink-0 mx-6 mt-3 px-4 py-3 bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-200 rounded-2xl flex items-center gap-3">
            <span className="text-xl">👻</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-violet-800">Rotina base sugerida</p>
              <p className="text-xs text-violet-600">{ghostCount} bloco(s) baseados no teu dia anterior.</p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button onClick={dismissAllGhosts} className="text-xs text-violet-500 hover:text-violet-700 px-3 py-1.5 rounded-xl hover:bg-violet-100 transition-colors">Descartar</button>
              <button onClick={confirmAllGhosts} className="text-xs font-bold text-white bg-violet-600 hover:bg-violet-500 px-3 py-1.5 rounded-xl transition-colors">✓ Confirmar tudo</button>
            </div>
          </div>
        )}

        {/* SMART SUGGESTIONS */}
        {suggestions.length > 0 && isToday && (
          <div className="flex-shrink-0 px-6 py-2 flex gap-2 overflow-x-auto border-b border-slate-50">
            {suggestions.map((s, i) => (
              <button key={i} onClick={() => openCreate({ title: s.label, start_time: s.start, end_time: s.end, category: s.type === 'meal' ? 'Almoço' : 'Pausa' })}
                className={`flex-shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-2xl border transition-all hover:shadow-sm text-left ${s.type === 'meal' ? 'bg-amber-50 border-amber-200 hover:bg-amber-100' : 'bg-sky-50 border-sky-200 hover:bg-sky-100'}`}>
                <span className="text-base">{s.emoji}</span>
                <div>
                  <p className={`text-[11px] font-bold ${s.type === 'meal' ? 'text-amber-800' : 'text-sky-800'}`}>{s.label}</p>
                  <p className={`text-[10px] ${s.type === 'meal' ? 'text-amber-600' : 'text-sky-600'}`}>{s.sublabel}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* ── TIMELINE FEED ───────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? <LoadingSkeleton /> : (
            <TimelineFeed
              blocks={sortedBlocks} isToday={isToday} nowMin={nowMin} nowLineRef={nowLineRef}
              onEdit={openEdit} onDelete={id => setConfirmId(id)}
              onConfirmGhost={confirmOneGhost}
              onFillGap={pre => openCreate(pre)}
            />
          )}
        </div>
      </div>

      {/* ── SIDEBAR ──────────────────────────────────────────────────────────── */}
      <aside className="w-72 border-l border-slate-100 bg-white flex flex-col overflow-y-auto flex-shrink-0">

        {isToday && (
          <HydrationTracker totalMl={hydrationMl} goalMl={2500} onLog={logWater} onUndo={undoWater} />
        )}

        {catSummary.length > 0 && (
          <div className="p-5 border-b border-slate-50">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Distribuição do dia</p>
            <div className="space-y-2.5">
              {catSummary.map(item => {
                const cfg = CATEGORY_CONFIG[item.category];
                return (
                  <div key={item.category}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-medium text-slate-600">{item.category}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold" style={{ color: cfg?.color }}>{item.pct}%</span>
                        <span className="text-[10px] text-slate-400">{fmtDuration(item.minutes)}</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${item.pct}%`, background: cfg?.color }} />
                    </div>
                  </div>
                );
              })}
              <div className="pt-2 border-t border-slate-50 flex justify-between text-xs">
                <span className="text-slate-500">Total</span>
                <span className="font-bold text-slate-900">{fmtDuration(realBlocks.reduce((s, b) => s + blockDurationMinutes(b), 0))}</span>
              </div>
            </div>
          </div>
        )}

        {showTemplatePanel && (
          <TemplatePanelContent templates={templates} dayOfWeek={dayOfWeek} onApply={applyTemplate} onDelete={delTemplate} />
        )}
      </aside>

      {/* ── MODALS ───────────────────────────────────────────────────────────── */}
      <Modal open={blockModal} onClose={() => setBlockModal(false)} title={editingId ? 'Editar bloco' : 'Novo bloco de tempo'}>
        <FormField label="Título">
          <Input value={blockForm.title} onChange={e => bf('title', e.target.value)} placeholder="Ex: Estudo — Matemática" autoFocus onKeyDown={e => e.key === 'Enter' && saveBlock()} />
        </FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Início"><Input type="time" value={blockForm.start_time} onChange={e => bf('start_time', e.target.value)} /></FormField>
          <FormField label="Fim"><Input type="time" value={blockForm.end_time} onChange={e => bf('end_time', e.target.value)} /></FormField>
        </div>
        <FormField label="Categoria">
          <Select value={blockForm.category} onChange={e => bf('category', e.target.value as BlockCategory)} options={BLOCK_CATEGORIES.map(c => ({ value: c, label: c }))} />
        </FormField>
        <div className="flex gap-3 justify-end mt-2">
          <Button variant="ghost" onClick={() => setBlockModal(false)}>Cancelar</Button>
          <Button loading={blockSaving} onClick={saveBlock}>{editingId ? 'Salvar' : 'Criar bloco'}</Button>
        </div>
      </Modal>

      <Modal open={showSaveTemplate} onClose={() => setShowSaveTemplate(false)} title="Salvar como template" width="max-w-sm">
        <FormField label="Nome do template">
          <Input value={saveTplName} onChange={e => setSaveTplName(e.target.value)} placeholder="Ex: Segunda-feira Ideal" autoFocus />
        </FormField>
        <FormField label="Dia da semana">
          <Select value={saveTplDay?.toString() ?? ''} onChange={e => setSaveTplDay(e.target.value ? parseInt(e.target.value) : null)}
            options={[{ value: '', label: 'Genérico' }, ...DAYS_SHORT.map((d, i) => ({ value: i.toString(), label: d }))]} />
        </FormField>
        <p className="text-xs text-slate-400 -mt-2 mb-4">{realBlocks.length} bloco(s) reais serão guardados.</p>
        <div className="flex gap-3 justify-end">
          <Button variant="ghost" onClick={() => setShowSaveTemplate(false)}>Cancelar</Button>
          <Button onClick={saveAsTemplate} disabled={!saveTplName.trim() || realBlocks.length === 0}>Salvar</Button>
        </div>
      </Modal>

      <ConfirmDialog open={Boolean(confirmId)} title="Excluir bloco" message="Eliminar este bloco?" onConfirm={deleteBlock} onCancel={() => setConfirmId(null)} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// QUICK CAPTURE BAR
// ─────────────────────────────────────────────────────────────────────────────

function QuickCaptureBar({ inputRef, value, onChange, parsed, loading, onSubmit }: {
  inputRef: React.RefObject<HTMLInputElement>; value: string; onChange: (v: string) => void;
  parsed: ParsedQuickCapture | null; loading: boolean; onSubmit: () => void;
}) {
  const hasValue = value.trim().length > 0;
  const borderCls = parsed?.isValid ? 'border-indigo-300 bg-indigo-50/40 shadow-sm shadow-indigo-100'
    : hasValue ? 'border-amber-300 bg-amber-50/40' : 'border-slate-200 bg-slate-50 hover:border-slate-300';

  return (
    <div>
      <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all duration-200 ${borderCls}`}>
        <svg className="text-slate-400 flex-shrink-0" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
        </svg>
        <input ref={inputRef} value={value} onChange={e => onChange(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && parsed?.isValid) onSubmit(); if (e.key === 'Escape') onChange(''); }}
          placeholder='Captura rápida: "Academia 17:00 18:30" · "Estudo Matemática 07h 09h30"'
          className="flex-1 bg-transparent text-sm text-slate-900 placeholder-slate-400 outline-none font-medium" />
        {hasValue && parsed && (
          <div className={`flex items-center gap-1.5 flex-shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-full ${parsed.isValid ? 'bg-indigo-100 text-indigo-700' : 'bg-amber-100 text-amber-700'}`}>
            {parsed.isValid ? (
              <><span style={{ color: CATEGORY_CONFIG[parsed.category]?.color }}>●</span><span>{parsed.category} · {parsed.start_time}–{parsed.end_time}</span></>
            ) : <span>⚠ {parsed.error}</span>}
          </div>
        )}
        {parsed?.isValid && (
          <button onClick={onSubmit} disabled={loading}
            className="flex-shrink-0 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-colors disabled:opacity-50">
            {loading ? '...' : '↵ Add'}
          </button>
        )}
        {hasValue && !parsed?.isValid && (
          <button onClick={() => onChange('')} className="text-slate-400 hover:text-slate-600 text-lg leading-none flex-shrink-0">×</button>
        )}
      </div>
      {!value && (
        <div className="flex gap-2 mt-1.5 flex-wrap">
          {['Academia 17:00 18:30', 'Estudo 07h 09h30', 'Almoço 12:30-13:30', 'Pausa café 15:30 15:45'].map(tip => (
            <button key={tip} onClick={() => onChange(tip)}
              className="text-[10px] text-slate-400 hover:text-indigo-600 bg-slate-100 hover:bg-indigo-50 px-2 py-0.5 rounded-full transition-colors">
              {tip}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TIMELINE FEED
// ─────────────────────────────────────────────────────────────────────────────

function TimelineFeed({ blocks, isToday, nowMin, nowLineRef, onEdit, onDelete, onConfirmGhost, onFillGap }: {
  blocks: TimeBlockExtended[]; isToday: boolean; nowMin: number; nowLineRef: React.RefObject<HTMLDivElement>;
  onEdit: (b: TimeBlockExtended) => void; onDelete: (id: string) => void;
  onConfirmGhost: (id: string) => void;
  onFillGap: (pre: { title: string; start_time: string; end_time: string; category: BlockCategory }) => void;
}) {
  if (blocks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-300">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="9"/><polyline points="12 6 12 12 16 14"/></svg>
        <p className="text-sm text-slate-400">Nenhum bloco. Use a barra de captura rápida para começar.</p>
      </div>
    );
  }

  // Build interleaved feed (blocks + gaps)
  type FeedItem = { kind: 'block'; block: TimeBlockExtended } | { kind: 'gap'; start: string; end: string; dur: number };
  const feed: FeedItem[] = [];

  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    feed.push({ kind: 'block', block: b });
    if (i < blocks.length - 1 && !b.is_ghost && !blocks[i+1].is_ghost) {
      const gs = timeToMinutes(b.end_time), ge = timeToMinutes(blocks[i+1].start_time);
      if (ge - gs >= 15) feed.push({ kind: 'gap', start: b.end_time, end: blocks[i+1].start_time, dur: ge - gs });
    }
  }

  // Where to inject the now indicator
  let nowInserted = false;

  return (
    <div className="space-y-2 pb-10">
      {feed.map((item, idx) => {
        if (item.kind === 'gap') {
          const pastGap = timeToMinutes(item.end) <= nowMin;
          return (
            <GapRow key={`g${idx}`} start={item.start} end={item.end} dur={item.dur} isPast={pastGap}
              onFill={() => onFillGap({ title: '', start_time: item.start, end_time: item.end, category: item.dur >= 25 ? 'Almoço' : 'Pausa' })} />
          );
        }

        const b      = item.block;
        const active = isToday && isBlockActive(b as any);
        const past   = isToday && isBlockPast(b as any);

        // Inject now indicator before first non-past block
        let nowEl: React.ReactNode = null;
        if (isToday && !nowInserted && !past && (idx === 0 || (feed[idx-1].kind === 'block' && isBlockPast((feed[idx-1] as any).block)))) {
          nowInserted = true;
          nowEl = <NowIndicator key="now" nowLineRef={nowLineRef} nowMin={nowMin} />;
        }

        return (
          <div key={b.id}>
            {nowEl}
            <BlockCard block={b} isActive={active} isPast={past} nowMin={nowMin}
              onEdit={() => onEdit(b)} onDelete={() => onDelete(b.id)} onConfirmGhost={() => onConfirmGhost(b.id)} />
          </div>
        );
      })}

      {/* Now indicator at end if all blocks are past */}
      {isToday && !nowInserted && blocks.every(b => isBlockPast(b as any)) && (
        <NowIndicator nowLineRef={nowLineRef} nowMin={nowMin} />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BLOCK CARD
// ─────────────────────────────────────────────────────────────────────────────

function BlockCard({ block: b, isActive, isPast, nowMin, onEdit, onDelete, onConfirmGhost }: {
  block: TimeBlockExtended; isActive: boolean; isPast: boolean; nowMin: number;
  onEdit: () => void; onDelete: () => void; onConfirmGhost: () => void;
}) {
  const [hov, setHov] = useState(false);
  const cfg  = CATEGORY_CONFIG[b.category] ?? { color: '#6366f1', bg: '#eef2ff', border: '#c7d2fe' };
  const dur  = blockDurationMinutes(b);
  const deep = isDeepWork(b.category);

  // Live progress for active block
  const elapsed = isActive ? Math.max(0, nowMin - timeToMinutes(b.start_time)) : 0;
  const pct     = dur > 0 ? Math.min(100, Math.round((elapsed / dur) * 100)) : 0;

  return (
    <div
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      className={`relative flex rounded-2xl overflow-hidden border transition-all duration-200 ${
        b.is_ghost   ? 'opacity-50 border-dashed border-violet-300 bg-violet-50/20' :
        isActive     ? 'border-2 shadow-lg' :
        isPast       ? 'border-slate-100 bg-slate-50/40 opacity-55' :
                       'border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm'
      }`}
      style={isActive ? { borderColor: cfg.color, boxShadow: `0 4px 24px ${cfg.color}22` } : undefined}
    >
      {/* Left accent stripe — solid = deep, faded = shallow */}
      <div className="w-1 flex-shrink-0" style={{ background: b.is_ghost ? '#8b5cf6' : cfg.color, opacity: deep ? 1 : 0.4 }} />

      <div className="flex-1 px-4 py-3.5 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {deep && !b.is_ghost && <span title="Deep Work" className="text-sm">🎯</span>}
              {b.is_ghost           && <span title="Ghost block" className="text-sm">👻</span>}
              <span className={`text-sm font-semibold truncate ${isPast ? 'text-slate-400' : b.is_ghost ? 'text-violet-700' : 'text-slate-900'}`}>
                {b.title}
              </span>
              {isActive && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse"
                  style={{ background: cfg.bg, color: cfg.color }}>● AGORA</span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${!deep ? 'border-dashed' : ''}`}
                style={{ background: b.is_ghost ? '#ede9fe' : cfg.bg, color: b.is_ghost ? '#7c3aed' : cfg.color, borderColor: b.is_ghost ? '#c4b5fd' : cfg.border }}>
                {b.category}
              </span>
              <span className="text-[11px] text-slate-400 font-mono">{fmtTime(b.start_time)} – {fmtTime(b.end_time)}</span>
              <span className="text-[11px] text-slate-400">· {fmtDuration(dur)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className={`flex items-center gap-1.5 flex-shrink-0 transition-opacity ${hov ? 'opacity-100' : 'opacity-0'}`}>
            {b.is_ghost ? (
              <>
                <button onClick={onConfirmGhost} className="text-[11px] font-bold text-white bg-violet-600 hover:bg-violet-500 px-2.5 py-1.5 rounded-lg transition-colors">✓ Confirmar</button>
                <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors"><TrashIcon /></button>
              </>
            ) : (
              <>
                <button onClick={onEdit} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-300 hover:text-slate-600 transition-colors"><EditIcon /></button>
                <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors"><TrashIcon /></button>
              </>
            )}
          </div>
        </div>

        {/* Active block progress bar */}
        {isActive && dur > 0 && (
          <div className="mt-3">
            <div className="flex justify-between text-[10px] mb-1.5" style={{ color: cfg.color }}>
              <span className="font-bold">{pct}% concluído</span>
              <span>{fmtDuration(dur - elapsed)} restantes</span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${pct}%`, background: cfg.color }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// GAP ROW
// ─────────────────────────────────────────────────────────────────────────────

function GapRow({ start, end, dur, isPast, onFill }: {
  start: string; end: string; dur: number; isPast: boolean; onFill: () => void;
}) {
  const [hov, setHov] = useState(false);
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border-2 border-dashed transition-all duration-150 ${
        isPast ? 'border-slate-100 opacity-40' : hov ? 'border-indigo-200 bg-indigo-50/50' : 'border-slate-200'
      }`}>
      <span className="text-[11px] font-mono text-slate-400">{fmtTime(start)} – {fmtTime(end)}</span>
      <span className="text-[11px] text-slate-400">· {dur}min livres</span>
      {dur >= 25 && !isPast && <span className="text-[11px] text-amber-600 font-semibold bg-amber-50 px-2 py-0.5 rounded-full">🍽️ janela de refeição</span>}
      {!isPast && (
        <button onClick={onFill}
          className={`ml-auto text-[11px] font-semibold flex items-center gap-1 px-3 py-1.5 rounded-xl transition-all ${hov ? 'text-indigo-700 bg-indigo-100' : 'text-slate-400 hover:text-indigo-600'}`}>
          <span className="text-base leading-none">+</span> Preencher
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NOW INDICATOR
// ─────────────────────────────────────────────────────────────────────────────

function NowIndicator({ nowLineRef, nowMin }: { nowLineRef: React.RefObject<HTMLDivElement>; nowMin: number }) {
  const h = Math.floor(nowMin / 60), m = nowMin % 60;
  return (
    <div ref={nowLineRef} className="flex items-center gap-2 my-1 px-1">
      <span className="text-[10px] font-bold text-indigo-600 font-mono flex-shrink-0 w-11">{pad2(h)}:{pad2(m)}</span>
      <div className="flex-1 flex items-center">
        <div className="relative w-full h-px bg-indigo-400">
          <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-indigo-500 rounded-full shadow-md shadow-indigo-300" />
          <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-indigo-400 rounded-full animate-ping opacity-50" />
        </div>
      </div>
      <span className="text-[10px] text-indigo-400 flex-shrink-0">agora</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HYDRATION TRACKER
// ─────────────────────────────────────────────────────────────────────────────

function HydrationTracker({ totalMl, goalMl, onLog, onUndo }: {
  totalMl: number; goalMl: number; onLog: (ml: number) => void; onUndo: () => void;
}) {
  const pct     = Math.min(100, Math.round((totalMl / goalMl) * 100));
  const glasses = Math.floor(totalMl / 250);

  return (
    <div className="p-5 border-b border-slate-50">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">💧 Hidratação</p>
        <button onClick={onUndo} className="text-[10px] text-slate-300 hover:text-slate-500 transition-colors">↩ desfazer</button>
      </div>

      {/* Glass visualisation */}
      <div className="flex items-end justify-center gap-1 mb-3 h-14">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className={`w-5 rounded-t transition-all duration-300 ${i < glasses ? 'bg-sky-400' : 'bg-slate-100'}`}
            style={{ height: `${22 + i * 5}px` }} />
        ))}
      </div>

      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-slate-500">{totalMl}ml</span>
        <span className={`font-bold ${pct >= 100 ? 'text-emerald-600' : 'text-sky-600'}`}>{pct}%</span>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-3">
        <div className={`h-full rounded-full transition-all duration-500 ${pct >= 100 ? 'bg-emerald-400' : 'bg-sky-400'}`} style={{ width: `${pct}%` }} />
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        {[150, 250, 500].map(ml => (
          <button key={ml} onClick={() => onLog(ml)}
            className="py-2 text-xs font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-xl transition-colors">
            +{ml}ml
          </button>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE PANEL CONTENT
// ─────────────────────────────────────────────────────────────────────────────

function TemplatePanelContent({ templates, dayOfWeek, onApply, onDelete }: {
  templates: BlockTemplateWithItems[]; dayOfWeek: number;
  onApply: (t: BlockTemplateWithItems) => void; onDelete: (id: string) => void;
}) {
  const relevant = templates.filter(t => t.day_of_week === null || t.day_of_week === dayOfWeek);
  const others   = templates.filter(t => t.day_of_week !== null && t.day_of_week !== dayOfWeek);

  const TplCard = ({ t }: { t: BlockTemplateWithItems }) => (
    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-slate-200 transition-all">
      <div className="flex justify-between items-start mb-2">
        <div>
          <p className="text-xs font-bold text-slate-900">{t.name}</p>
          <p className="text-[10px] text-slate-400">{t.day_of_week !== null ? DAYS_SHORT[t.day_of_week] : 'Genérico'} · {t.items.length} blocos</p>
        </div>
        <button onClick={() => onDelete(t.id)} className="text-slate-300 hover:text-red-400 transition-colors"><TrashIcon /></button>
      </div>
      <div className="space-y-1 mb-2">
        {t.items.slice(0, 3).map((item, i) => {
          const cfg = CATEGORY_CONFIG[item.category as BlockCategory];
          return (
            <div key={i} className="flex items-center gap-1.5 text-[10px] text-slate-500">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: cfg?.color }} />
              <span className="flex-1 truncate">{item.title}</span>
              <span className="text-slate-300 font-mono">{item.start_time}–{item.end_time}</span>
            </div>
          );
        })}
        {t.items.length > 3 && <p className="text-[10px] text-slate-400">+{t.items.length - 3} mais...</p>}
      </div>
      <button onClick={() => onApply(t)}
        className="w-full text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 py-2 rounded-lg transition-colors border border-indigo-200">
        ↓ Aplicar como ghost blocks
      </button>
    </div>
  );

  return (
    <div className="p-5 flex-1 overflow-y-auto">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">📋 Templates</p>
      {templates.length === 0 ? (
        <p className="text-xs text-slate-400">Nenhum template guardado. Clica em "💾 Salvar dia" para criar o primeiro.</p>
      ) : (
        <div className="space-y-3">
          {relevant.length > 0 && <><p className="text-[10px] text-indigo-500 font-semibold">Para {DAYS_SHORT[dayOfWeek]}</p>{relevant.map(t => <TplCard key={t.id} t={t} />)}</>}
          {others.length > 0   && <><p className="text-[10px] text-slate-400 font-semibold mt-4">Outros dias</p>{others.map(t => <TplCard key={t.id} t={t} />)}</>}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LOADING SKELETON
// ─────────────────────────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {[80, 120, 60, 100, 90, 70].map((h, i) => (
        <div key={i} className="flex gap-0 rounded-2xl overflow-hidden">
          <div className="w-1 flex-shrink-0 bg-slate-200" style={{ height: h }} />
          <div className="flex-1 bg-slate-100 rounded-r-2xl" style={{ height: h }} />
        </div>
      ))}
    </div>
  );
}
