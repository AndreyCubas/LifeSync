import { useState, useEffect } from "react";
import {
  todayStr,
  timeToMin,
  minToTime,
  fmtTime,
  blockDuration,
} from "../../lib/utils";
import { db, uid } from "../../services/dataService";
import { CATEGORIES } from "../../lib/constants";
import {
  PageHeader,
  Card,
  Btn,
  Icon,
  Tag,
  EmptyState,
  Modal,
  FormRow,
  Input,
  Select,
} from "../../components/ui";

function BlockCard({ block: b, onEdit, onDelete }: any) {
  const [hov, setHov] = useState(false);
  const c = CATEGORIES[b.category] || { color: "#6b7280", bg: "#f3f4f6" };
  const dur = blockDuration(b);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "13px 16px",
        background: "#fff",
        borderRadius: 12,
        border: "1.5px solid " + (hov ? "#e5e7eb" : "#f0f0f0"),
        transition: "all .15s",
        boxShadow: hov ? "0 2px 12px rgba(0,0,0,0.05)" : "none",
      }}
    >
      <div
        style={{
          width: 4,
          height: 40,
          borderRadius: 99,
          background: c.color,
          flexShrink: 0,
        }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 13.5,
            fontWeight: 600,
            color: "#111",
            marginBottom: 4,
          }}
        >
          {b.title}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <Tag cat={b.category} />
          <span
            style={{
              fontSize: 11.5,
              color: "#9ca3af",
              fontFamily: "monospace",
            }}
          >
            {fmtTime(b.start)} – {fmtTime(b.end)}
          </span>
          <span style={{ fontSize: 11.5, color: "#9ca3af" }}>
            · {Math.floor(dur / 60)}h{dur % 60 ? ` ${dur % 60}m` : ""}
          </span>
        </div>
      </div>
      {hov && (
        <div style={{ display: "flex", gap: 6 }}>
          <Btn
            onClick={onEdit}
            style={{
              padding: "5px 9px",
              borderRadius: 7,
              border: "1px solid #e5e7eb",
              background: "#fff",
              cursor: "pointer",
              color: "#6b7280",
            }}
          >
            <Icon name="edit" size={13} />
          </Btn>
          <Btn
            onClick={onDelete}
            style={{
              padding: "5px 9px",
              borderRadius: 7,
              border: "1px solid #fecaca",
              background: "#fef2f2",
              cursor: "pointer",
              color: "#dc2626",
            }}
          >
            <Icon name="trash" size={13} />
          </Btn>
        </div>
      )}
    </div>
  );
}

export default function TimeBlocking({ userId }: any) {
  const [date, setDate] = useState(todayStr());
  const [blocks, setBlocks] = useState<any[]>([]);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    start: "",
    end: "",
    category: "Estudo",
  });

  useEffect(() => {
    db.forUser(userId, "blocks").then((data: any[]) => setBlocks(data));
  }, [userId]);

  const save = () => {
    if (!form.title || !form.start || !form.end) return;
    let updated;
    if (editing) {
      updated = blocks.map((b: any) =>
        b.id === editing ? { ...b, ...form } : b,
      );
    } else {
      updated = [...blocks, { id: uid(), date, ...form }];
    }
    setBlocks(updated);
    db.saveItem(userId, "blocks", updated);
    setModal(false);
    setEditing(null);
    setForm({ title: "", start: "", end: "", category: "Estudo" });
  };

  const del = (id: string) => {
    const updated = blocks.filter((b: any) => b.id !== id);
    setBlocks(updated);
    db.saveItem(userId, "blocks", updated);
  };

  const openEdit = (b: any) => {
    setEditing(b.id);
    setForm({
      title: b.title,
      start: b.start,
      end: b.end,
      category: b.category,
    });
    setModal(true);
  };

  const dayBlocks = blocks
    .filter((b: any) => b.date === date)
    .sort((a: any, b: any) => timeToMin(a.start) - timeToMin(b.start));

  const catTotals: any = {};
  dayBlocks.forEach((b: any) => {
    catTotals[b.category] = (catTotals[b.category] || 0) + blockDuration(b);
  });

  const gaps = [];
  for (let i = 0; i < dayBlocks.length - 1; i++) {
    const gapStart = timeToMin(dayBlocks[i].end);
    const gapEnd = timeToMin(dayBlocks[i + 1].start);
    if (gapEnd - gapStart >= 15) {
      gaps.push({
        start: minToTime(gapStart),
        end: minToTime(gapEnd),
        dur: gapEnd - gapStart,
      });
    }
  }

  return (
    <div style={{ padding: "32px 36px", maxWidth: 900 }}>
      <PageHeader
        title="Time Blocking"
        subtitle="Organize seu tempo em blocos de atividade"
        action={
          <Btn
            icon="plus"
            onClick={() => {
              setEditing(null);
              setForm({ title: "", start: "", end: "", category: "Estudo" });
              setModal(true);
            }}
          >
            Novo bloco
          </Btn>
        }
      />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 24,
        }}
      >
        <Btn
          onClick={() => {
            const d = new Date(date);
            d.setDate(d.getDate() - 1);
            setDate(d.toISOString().split("T")[0]);
          }}
          style={{
            background: "#f3f4f6",
            border: "none",
            borderRadius: 8,
            padding: "7px 10px",
            cursor: "pointer",
          }}
        >
          <Icon name="chevron_l" size={16} />
        </Btn>
        <Input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          style={{
            padding: "8px 12px",
            border: "1.5px solid #e5e7eb",
            borderRadius: 9,
            fontSize: 13.5,
            color: "#111",
            fontFamily: "inherit",
            cursor: "pointer",
          }}
        />
        <Btn
          onClick={() => {
            const d = new Date(date);
            d.setDate(d.getDate() + 1);
            setDate(d.toISOString().split("T")[0]);
          }}
          style={{
            background: "#f3f4f6",
            border: "none",
            borderRadius: 8,
            padding: "7px 10px",
            cursor: "pointer",
          }}
        >
          <Icon name="chevron_r" size={16} />
        </Btn>
        <span
          onClick={() => setDate(todayStr())}
          style={{
            fontSize: 13,
            color: "#6366f1",
            cursor: "pointer",
            fontWeight: 600,
            padding: "7px 11px",
            background: "#eef2ff",
            borderRadius: 8,
          }}
        >
          Hoje
        </span>
      </div>

      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 20 }}
      >
        <div>
          {dayBlocks.length === 0 ? (
            <Card style={{ padding: 40 }}>
              <EmptyState
                icon="clock"
                text="Nenhum bloco para este dia. Clique em 'Novo bloco' para começar."
              />
            </Card>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {dayBlocks.map((b: any) => (
                <BlockCard
                  key={b.id}
                  block={b}
                  onEdit={() => openEdit(b)}
                  onDelete={() => del(b.id)}
                />
              ))}
            </div>
          )}

          {gaps.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <p
                style={{
                  fontSize: 12.5,
                  fontWeight: 600,
                  color: "#9ca3af",
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                  marginBottom: 8,
                }}
              >
                Tempo livre detectado
              </p>
              {gaps.map((g, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px 14px",
                    background: "#f9fafb",
                    borderRadius: 9,
                    border: "1.5px dashed #e5e7eb",
                    marginBottom: 6,
                  }}
                >
                  <span style={{ fontSize: 13, color: "#9ca3af" }}>
                    ⬜ {fmtTime(g.start)} – {fmtTime(g.end)}
                  </span>
                  <span style={{ fontSize: 11.5, color: "#9ca3af" }}>
                    · {g.dur}min disponíveis
                  </span>
                  {g.dur >= 30 && (
                    <span
                      style={{
                        fontSize: 11.5,
                        color: "#f59e0b",
                        fontWeight: 600,
                      }}
                    >
                      💡 ideal para refeição
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Card style={{ padding: 20 }}>
            <h4
              style={{
                margin: "0 0 14px",
                fontSize: 13,
                fontWeight: 700,
                color: "#111",
              }}
            >
              Resumo do dia
            </h4>
            {Object.keys(catTotals).length === 0 ? (
              <span style={{ fontSize: 12.5, color: "#9ca3af" }}>
                Nenhum dado ainda
              </span>
            ) : (
              Object.entries(catTotals)
                .sort((a: any, b: any) => b[1] - a[1])
                .map(([cat, mins]: any) => (
                  <div
                    key={cat}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "6px 0",
                      borderBottom: "1px solid #f9fafb",
                    }}
                  >
                    <Tag cat={cat} />
                    <span
                      style={{ fontSize: 13, fontWeight: 700, color: "#111" }}
                    >
                      {Math.floor(mins / 60)}h
                      {mins % 60 ? ` ${mins % 60}m` : ""}
                    </span>
                  </div>
                ))
            )}
            {dayBlocks.length > 0 && (
              <div
                style={{
                  marginTop: 12,
                  padding: "10px 12px",
                  background: "#f9fafb",
                  borderRadius: 9,
                }}
              >
                <div
                  style={{ fontSize: 12, color: "#9ca3af", marginBottom: 2 }}
                >
                  Total programado
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#111" }}>
                  {(() => {
                    const t = Object.values(catTotals).reduce(
                      (a: any, b: any) => a + b,
                      0,
                    ) as number;
                    return `${Math.floor(t / 60)}h ${t % 60}m`;
                  })()}
                </div>
              </div>
            )}
          </Card>

          {Object.keys(catTotals).length > 0 && (
            <Card style={{ padding: 20 }}>
              <h4
                style={{
                  margin: "0 0 14px",
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#111",
                }}
              >
                Distribuição
              </h4>
              {Object.entries(catTotals).map(([cat, mins]: any) => {
                const total = Object.values(catTotals).reduce(
                  (a: any, b: any) => a + b,
                  0,
                ) as number;
                const pct = Math.round((mins / total) * 100);
                const c = CATEGORIES[cat] || { color: "#6b7280" };
                return (
                  <div key={cat} style={{ marginBottom: 8 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: 4,
                      }}
                    >
                      <span style={{ fontSize: 12, color: "#374151" }}>
                        {cat}
                      </span>
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: c.color,
                        }}
                      >
                        {pct}%
                      </span>
                    </div>
                    <div
                      style={{
                        height: 6,
                        background: "#f3f4f6",
                        borderRadius: 99,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: pct + "%",
                          height: "100%",
                          background: c.color,
                          borderRadius: 99,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </Card>
          )}
        </div>
      </div>

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title={editing ? "Editar bloco" : "Novo bloco de tempo"}
      >
        <FormRow label="Título">
          <Input
            value={form.title}
            onChange={(v: string) => setForm((f) => ({ ...f, title: v }))}
            placeholder="Ex: Estudo — Matemática"
          />
        </FormRow>
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
        >
          <FormRow label="Início">
            <Input
              type="time"
              value={form.start}
              onChange={(v: string) => setForm((f) => ({ ...f, start: v }))}
            />
          </FormRow>
          <FormRow label="Fim">
            <Input
              type="time"
              value={form.end}
              onChange={(v: string) => setForm((f) => ({ ...f, end: v }))}
            />
          </FormRow>
        </div>
        <FormRow label="Categoria">
          <Select
            value={form.category}
            onChange={(v: string) => setForm((f) => ({ ...f, category: v }))}
            options={Object.keys(CATEGORIES).map((c) => ({
              value: c,
              label: c,
            }))}
          />
        </FormRow>
        <div
          style={{
            display: "flex",
            gap: 8,
            justifyContent: "flex-end",
            marginTop: 8,
          }}
        >
          <Btn variant="ghost" onClick={() => setModal(false)}>
            Cancelar
          </Btn>
          <Btn onClick={save}>{editing ? "Salvar" : "Criar bloco"}</Btn>
        </div>
      </Modal>
    </div>
  );
}
