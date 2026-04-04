// ─────────────────────────────────────────────────────────────────────────────
// LifeSync — Planning Module (Calendar + Events)
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useMemo } from "react";
import { useAppStore } from "../../store/appStore";
import { useEvents } from "../../hooks";
import { eventsService } from "../../services/dataService";
import {
  Card,
  PageHeader,
  Button,
  Modal,
  FormField,
  Input,
  Select,
  CategoryBadge,
  ConfirmDialog,
  EmptyState,
  CalendarIcon,
  PlusIcon,
  EditIcon,
  TrashIcon,
  ChevronLIcon,
  ChevronRIcon,
} from "../../components/ui";
import { todayISO, calendarGrid, daysUntil, fmtDatePT } from "../../lib/utils";
import {
  BLOCK_CATEGORIES,
  CATEGORY_CONFIG,
  DAYS_SHORT,
  MONTHS,
} from "../../lib/constants";
import type { CalendarEvent, EventFormData, BlockCategory } from "../../types";

const EMPTY_FORM: EventFormData = {
  title: "",
  date: todayISO(),
  type: "Estudo",
  notes: "",
};

export function PlanningModule() {
  const user = useAppStore((s) => s.user)!;
  const { events, loading, refresh } = useEvents();

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<EventFormData>({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const todayS = todayISO();
  const grid = useMemo(() => calendarGrid(year, month), [year, month]);

  const eventsForDay = (day: number) => {
    const ds = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return events.filter((e) => e.date === ds);
  };

  const upcoming = useMemo(
    () => events.filter((e) => daysUntil(e.date) >= 0).slice(0, 20),
    [events],
  );

  const openCreate = (date?: string) => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, date: date ?? todayS });
    setModalOpen(true);
  };

  const openEdit = (e: CalendarEvent) => {
    setEditingId(e.id);
    setForm({
      title: e.title,
      date: e.date,
      type: e.type,
      notes: e.notes ?? "",
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.date) return;
    setSaving(true);
    if (editingId) {
      await eventsService.update(user.id, editingId, form);
    } else {
      await eventsService.create(user.id, form);
    }
    await refresh();
    setSaving(false);
    setModalOpen(false);
  };

  const handleDelete = async () => {
    if (!confirmId) return;
    await eventsService.delete(user.id, confirmId);
    await refresh();
    setConfirmId(null);
  };

  const prevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else setMonth((m) => m + 1);
  };

  const f = <K extends keyof EventFormData>(k: K, v: EventFormData[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  return (
    <div className="p-8 max-w-5xl">
      <PageHeader
        title="Planeamento"
        subtitle="Calendário mensal e compromissos futuros"
        action={
          <Button icon={<PlusIcon />} onClick={() => openCreate()}>
            Novo evento
          </Button>
        }
      />

      <div className="grid grid-cols-3 gap-5">
        {/* Calendar (2/3) */}
        <div className="col-span-2">
          <Card>
            {/* Month nav */}
            <div className="flex items-center justify-between mb-5">
              <Button
                variant="ghost"
                size="sm"
                icon={<ChevronLIcon />}
                onClick={prevMonth}
              />
              <h3 className="text-base font-extrabold text-slate-900">
                {MONTHS[month]} {year}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                icon={<ChevronRIcon />}
                onClick={nextMonth}
              />
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {DAYS_SHORT.map((d) => (
                <div
                  key={d}
                  className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider py-1"
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Day grid */}
            <div className="grid grid-cols-7 gap-1">
              {grid.map((day, i) => {
                if (!day) return <div key={`e-${i}`} />;
                const ds = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const isToday = ds === todayS;
                const isPast = ds < todayS;
                const dayEvs = eventsForDay(day);
                return (
                  <button
                    key={day}
                    onClick={() => openCreate(ds)}
                    className={`aspect-square flex flex-col items-center justify-center rounded-xl text-sm transition-all duration-150 relative ${
                      isToday
                        ? "bg-indigo-600 text-white font-bold shadow-md shadow-indigo-200"
                        : dayEvs.length
                          ? "bg-indigo-50 text-indigo-900 border border-indigo-200"
                          : isPast
                            ? "text-slate-300 hover:bg-slate-50"
                            : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span>{day}</span>
                    {dayEvs.length > 0 && (
                      <div className="flex gap-0.5 mt-0.5 absolute bottom-1.5">
                        {dayEvs.slice(0, 3).map((ev, j) => (
                          <div
                            key={j}
                            className="w-1 h-1 rounded-full"
                            style={{
                              background: isToday
                                ? "rgba(255,255,255,0.7)"
                                : (CATEGORY_CONFIG[ev.type]?.color ??
                                  "#6366f1"),
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Events list (1/3) */}
        <div>
          <Card>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">
              Próximos eventos
            </h4>
            {loading ? (
              <p className="text-sm text-slate-400">A carregar...</p>
            ) : upcoming.length === 0 ? (
              <EmptyState icon={<CalendarIcon />} text="Nenhum evento" />
            ) : (
              <div className="flex flex-col gap-2 max-h-[500px] overflow-y-auto">
                {upcoming.map((ev) => (
                  <EventItem
                    key={ev.id}
                    event={ev}
                    onEdit={() => openEdit(ev)}
                    onDelete={() => setConfirmId(ev.id)}
                  />
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Editar evento" : "Novo evento"}
      >
        <FormField label="Título">
          <Input
            value={form.title}
            onChange={(e) => f("title", e.target.value)}
            placeholder="Ex: Prova de Física, Reunião..."
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
          />
        </FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Data">
            <Input
              type="date"
              value={form.date}
              onChange={(e) => f("date", e.target.value)}
            />
          </FormField>
          <FormField label="Tipo">
            <Select
              value={form.type}
              onChange={(e) => f("type", e.target.value as BlockCategory)}
              options={BLOCK_CATEGORIES.map((c) => ({ value: c, label: c }))}
            />
          </FormField>
        </div>
        <FormField label="Notas (opcional)">
          <Input
            value={form.notes}
            onChange={(e) => f("notes", e.target.value)}
            placeholder="Detalhes adicionais..."
          />
        </FormField>
        <div className="flex gap-3 justify-end mt-2">
          <Button variant="ghost" onClick={() => setModalOpen(false)}>
            Cancelar
          </Button>
          <Button loading={saving} onClick={handleSave}>
            {editingId ? "Salvar" : "Criar evento"}
          </Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(confirmId)}
        title="Excluir evento"
        message="Tens a certeza que queres excluir este evento?"
        onConfirm={handleDelete}
        onCancel={() => setConfirmId(null)}
      />
    </div>
  );
}

// ── Event Item ─────────────────────────────────────────────────────────────────

function EventItem({
  event: ev,
  onEdit,
  onDelete,
}: {
  event: CalendarEvent;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [hov, setHov] = useState(false);
  const days = daysUntil(ev.date);

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      className="p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-all duration-150"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-900 truncate">
            {ev.title}
          </p>
          <div className="flex items-center gap-2 mt-1.5">
            <CategoryBadge category={ev.type} />
            <span className="text-[11px] text-slate-400">
              {fmtDatePT(ev.date)}
            </span>
          </div>
        </div>
        <span
          className={`text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
            days === 0
              ? "bg-red-100 text-red-600"
              : days === 1
                ? "bg-orange-100 text-orange-600"
                : days <= 7
                  ? "bg-amber-100 text-amber-600"
                  : "bg-slate-100 text-slate-500"
          }`}
        >
          {days === 0 ? "Hoje!" : days === 1 ? "Amanhã" : `${days}d`}
        </span>
      </div>
      {ev.notes && (
        <p className="text-xs text-slate-400 mt-2 truncate">{ev.notes}</p>
      )}

      <div
        className={`flex gap-2 mt-2 transition-opacity duration-150 ${hov ? "opacity-100" : "opacity-0"}`}
      >
        <Button
          variant="outline"
          size="sm"
          icon={<EditIcon />}
          onClick={onEdit}
        >
          Editar
        </Button>
        <Button
          variant="danger"
          size="sm"
          icon={<TrashIcon />}
          onClick={onDelete}
        >
          Excluir
        </Button>
      </div>
    </div>
  );
}
