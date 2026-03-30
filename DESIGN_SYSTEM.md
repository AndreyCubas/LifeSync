# LifeSync Design System 🎨

## Visão Geral
LifeSync segue um **Minimalismo Utilitário** - Design limpo, sofisticado e focado em funcionalidade. Inspirado em ferramentas de alta performance como Claude.ai.

## 1. Paleta de Cores

### Neutros (Base)
- **Fundo Principal**: `bg-slate-50` - Branco suavemente acinzentado
- **Superfícies (Cards)**: `bg-white` - Branco com `border-slate-200`
- **Texto Principal**: `text-slate-800` - Quase preto, suave
- **Texto Secundário**: `text-slate-500` - Cinza médio para legendas
- **Bordas/Dividers**: `border-slate-200` - Cinza claro

### Acentos de Ação
- **Primário (Principal)**: `bg-indigo-600` / `text-indigo-600` - Roxo/azul moderno
  - Botões, links, seleções, focos
- **Fitness (Energia)**: `bg-rose-500` - Vermelho energético
  - Dados de fitness, treinos
- **Sucesso**: `bg-emerald-500` - Verde natural
  - Conclusão, confirmações
- **Aviso**: `bg-amber-500` - Amarelo quente
  - Alertas, notificações

## 2. Tipografia

### Famílias de Fonte
- **General**: Inter (Clean, Editorial)
  - Títulos: `font-bold` / `font-extrabold`
  - Corpo: `font-normal` / `font-medium`
  - Legendas: `font-light` / `font-normal`
- **Números/Dados**: Monospace (quando necessário)

### Tamanhos & Uso
- **Títulos**: `text-2xl` / `text-3xl` - PageHeader, seções principais
- **Subtítulos**: `text-sm` - `text-slate-500`
- **Corpo**: `text-sm` / `text-base`
- **Legenda**: `text-xs` / `text-[11px]` - Labels, hints
- **Números importantes**: `text-xl` / `text-2xl` - Métricas, macros

## 3. Componentes

### Button
```tailwind
/* Primário */
bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl

/* Ghost */
bg-slate-100 hover:bg-slate-200 text-slate-700

/* Danger */
bg-red-50 hover:bg-red-100 text-red-600 border border-red-200

/* Size SM */
text-xs px-3 py-1.5 rounded-lg

/* Size MD */
text-sm px-4 py-2.5 rounded-xl
```

### Card
```tailwind
/* Container */
bg-white border border-slate-200 rounded-xl shadow-sm
p-5 / p-6 / p-8 (dependendo do conteúdo)

/* Com hover (clickable) */
hover:shadow-md hover:border-slate-300 transition-all duration-200
```

### Modal/Dialog
```tailwind
/* Background overlay */
fixed inset-0 bg-black/40 backdrop-blur-sm

/* Conteúdo */
bg-white rounded-2xl shadow-2xl max-w-lg
```

### Inputs
```tailwind
/* Input padrão */
w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5
focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400
text-slate-900 placeholder-slate-400

/* Error state */
border-red-300 focus:ring-red-500/20
```

## 4. Espaçamento (Whitespace)

### Layout Geral
- **Padding de página**: `p-8` / `p-12` - Respiro dos cantos
- **Gap entre seções**: `mb-6` / `mb-8` - Separação clara
- **Gap entre cards**: `gap-3` / `gap-4` - Respiro entre elementos
- **Padding interno**: `p-4` / `p-5` / `p-6` - Confortável

### Exemplo
```
[Page Padding: p-12]
  └─ [Title]
  └─ [Gap: mb-8]
  └─ [Section]
       └─ [Cards: gap-3]
          └─ [Card Padding: p-5]
```

## 5. Bordas & Cantos

- **Cantos Arredondados**: `rounded-xl` (~12px) - Balanço entre moderno e funcional
  - Cards, buttons, inputs
- **Cantos Maiores**: `rounded-2xl` (~16px) - Modais
- **Sem transição agressiva**: Suave e confortável aos olhos

## 6. Sombras

- **Mínimas e sutis** - Não deve distrair
- `shadow-sm` - Cards em repouso
- `shadow-md` - Cards em hover/focus
- `shadow-lg` - Modais, elementos em primeiro plano

```tailwind
/* Card padrão */
shadow-sm hover:shadow-md transition-shadow duration-200

/* Modal */
shadow-2xl

/* Evitar */
Múltiplas camadas de sombra, sombras pretas opacos
```

## 7. Animações & Transições

```tailwind
/* Padrão */
transition-all duration-200

/* Hover de botão */
hover:bg-slate-200 transition-colors duration-200

/* Elementos visíveis */
opacity-0 hover:opacity-100 transition-opacity duration-200

/* Diálogos */
animate-in fade-in zoom-in-95 duration-200
```

**Princípio**: Suave, rápido (200-300ms), sem excesso.

## 8. Estados & Interação

### Hover
- Mudar `bg-color` ou `border-color`
- Aumentar `shadow` levemente
- Mudar `text-color` (se necessário)
- Duração: ~200ms

### Focus
- Ring customizado: `ring-2 ring-indigo-500/20`
- Nunca remover outline sem substituir

### Disabled
- `opacity-50 cursor-not-allowed`

### Active/Selected
- Fundo destacado: `bg-indigo-50 text-indigo-700`
- Borda: `border-indigo-200`

## 9. Dark Mode (Futuro)

Não implementado atualmente, mas estrutura pronta:
```tailwind
dark:bg-slate-900 dark:text-slate-100
```

## 10. Responsividade

```tailwind
/* Grid responsivo */
grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4

/* Tamanhos */
text-base md:text-lg (títulos crescem em telas maiores)

/* Padding */
p-4 md:p-8 (mais respiro em desktop)
```

## Exemplo Completo: Card com Estatística

```tsx
<Card className="p-5">
  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
    Calorias
  </div>
  <div className="text-2xl font-bold text-indigo-600">
    1.850 kcal
  </div>
  <div className="text-xs text-slate-400 mt-1">
    / 2.000 kcal objetivo
  </div>
</Card>
```

## Checklist de Estilo

Ao criar novos componentes:
- [ ] Usar cores da paleta (indigo, rose, emerald, amber)
- [ ] Padding consistente (múltiplos de 4px)
- [ ] Bordas `rounded-xl` para componentes normais
- [ ] Bordas `border-slate-200` para dividir
- [ ] Sombras sutis (`shadow-sm` / `shadow-md`)
- [ ] Tipografia via Tailwind (font-semibold, etc)
- [ ] Transições suaves (`duration-200`)
- [ ] Espaçamento consistente entre elementos
- [ ] Hover states definidos
- [ ] Focus ring em inputs/buttons interativos

---

**Filosofia**: Clareza mental através de design limpo. Menos é mais.
