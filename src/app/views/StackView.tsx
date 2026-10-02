/**
 * ビュー共通の画面。左に積み上げ面、右にその年度の内訳。
 * 内訳の行に触れるとその系列を強調し、押すと固定する。
 */

import { use, useMemo, useState } from "react";
import { loadStack } from "../data/chunks.ts";
import type { ChunkName, DictEntry } from "../data/cube.ts";
import { StackArea, type Mark, type Mode, type StackSeries } from "../components/StackArea.tsx";
import { colorOf } from "../data/colors.ts";
import { Segmented } from "../components/Segmented.tsx";
import { useUrlState } from "../hooks/useUrlState.ts";
import { useWidth } from "../hooks/useWidth.ts";

export interface ViewSpec {
  chunk: ChunkName;
  title: string;
  lead: string;
  notes: readonly string[];
}

const MARKS: Mark[] = [{ year: 2011, label: "2011 東日本大震災" }];

const MODES = [
  { value: "share", label: "構成比" },
  { value: "amount", label: "量" },
] as const;

const pct = new Intl.NumberFormat("ja-JP", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const whole = new Intl.NumberFormat("ja-JP", { maximumFractionDigits: 0 });
const tenth = new Intl.NumberFormat("ja-JP", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

function amount(v: number): string {
  return v < 100 ? tenth.format(v) : whole.format(v);
}

export function StackView({ spec }: { spec: ViewSpec }) {
  const { items, groups, cube, years, unit } = use(loadStack(spec.chunk));
  const [mode, setMode] = useUrlState<Mode>("mode", "share", (v) => MODES.some((m) => m.value === v));
  const [hoverYear, setHoverYear] = useState<number | null>(null);
  const [pinned, setPinned] = useState<string | null>(null);
  const [peek, setPeek] = useState<string | null>(null);
  const [ref, width] = useWidth<HTMLDivElement>();

  const series = useMemo<StackSeries[]>(
    () =>
      items.map((item) => ({
        key: item.code,
        label: item.label,
        color: colorOf(item.code),
        values: cube.series("value", "year", { item: item.code }).map((v) => v ?? 0),
      })),
    [items, cube],
  );

  const year = hoverYear ?? years.at(-1)!;
  const yi = years.indexOf(year);
  const total = series.reduce((s, x) => s + x.values[yi]!, 0);
  const emphasized = peek ?? pinned;

  return (
    <div className="mx-auto flex w-full max-w-[1240px] gap-10 px-6 py-6 max-lg:flex-col">
      <main className="min-w-0 flex-1">
        <header className="flex flex-wrap items-end justify-between gap-3 pb-4">
          <div>
            <h2 className="text-[19px] font-semibold tracking-tight">{spec.title}</h2>
            <p className="mt-1 max-w-[60ch] text-[12px] leading-relaxed text-muted">{spec.lead}</p>
          </div>
          <Segmented options={MODES} value={mode} onChange={setMode} label="表示" />
        </header>

        <div ref={ref} className="min-h-[300px]">
          {width > 0 && (
            <StackArea
              years={years}
              series={series}
              mode={mode}
              emphasized={emphasized}
              marks={MARKS}
              width={width}
              height={width < 640 ? 300 : 400}
              hoverYear={hoverYear}
              onHoverYear={setHoverYear}
              label={`${spec.title}の${mode === "share" ? "構成比" : `量（${unit}）`}の推移、${years[0]}–${years.at(-1)}年度`}
            />
          )}
        </div>
        <p className="pt-1 text-[10.5px] text-faint">
          {mode === "share" ? "各年度の合計を 100% とした構成比" : `単位: ${unit}`}
          。グラフ上で ← → キーでも年度を動かせる。
        </p>
      </main>

      <aside className="w-[300px] shrink-0 max-lg:w-full">
        <div className="flex items-baseline justify-between border-b border-rule pb-2">
          <p className={`tnum text-[15px] font-semibold ${hoverYear === null ? "text-ink" : "text-accent"}`}>
            {year}年度
          </p>
          <p className="text-[10.5px] text-faint">構成比 / {unit}</p>
        </div>
        <ul onPointerLeave={() => setPeek(null)}>
          {items.map((item, i) => (
            <Row
              key={item.code}
              item={item}
              heading={groupHeading(items, groups, i)}
              color={series[i]!.color}
              share={series[i]!.values[yi]! / total}
              value={series[i]!.values[yi]!}
              active={emphasized === item.code}
              pinned={pinned === item.code}
              onPeek={() => setPeek(item.code)}
              onUnpeek={() => setPeek(null)}
              onToggle={() => setPinned((p) => (p === item.code ? null : item.code))}
            />
          ))}
        </ul>
        <div className="flex items-baseline justify-between border-t border-rule-strong pt-2 text-[12px]">
          <span className="font-semibold">合計</span>
          <span className="tnum font-semibold">
            {whole.format(total)}
            <span className="ml-1 text-[10.5px] font-normal text-faint">{unit}</span>
          </span>
        </div>

        <section className="mt-6 border-t border-rule pt-3">
          <h3 className="text-[11px] font-semibold tracking-wide text-faint">注記</h3>
          <ul className="mt-1.5 flex flex-col gap-1.5">
            {spec.notes.map((n) => (
              <li key={n} className="text-[11px] leading-relaxed text-muted">
                {n}
              </li>
            ))}
          </ul>
        </section>
      </aside>
    </div>
  );
}

/** 親が変わる最初の子の上に、親の名前を出す。子が親と同名（家庭）なら出さない。 */
function groupHeading(items: DictEntry[], groups: DictEntry[], i: number): string | null {
  const item = items[i]!;
  if (item.parent === undefined || items[i - 1]?.parent === item.parent) return null;
  const group = groups.find((g) => g.code === item.parent);
  return group === undefined || group.label === item.label ? null : group.label;
}

function Row({
  item,
  heading,
  color,
  share,
  value,
  active,
  pinned,
  onPeek,
  onUnpeek,
  onToggle,
}: {
  item: DictEntry;
  heading: string | null;
  color: string;
  share: number;
  value: number;
  active: boolean;
  pinned: boolean;
  onPeek: () => void;
  onUnpeek: () => void;
  onToggle: () => void;
}) {
  return (
    <li>
      {heading !== null && (
        <p className="px-1 pt-2.5 pb-0.5 text-[10.5px] font-semibold tracking-wide text-faint">{heading}</p>
      )}
      <button
        type="button"
        aria-pressed={pinned}
        onPointerEnter={onPeek}
        onFocus={onPeek}
        onBlur={onUnpeek}
        onClick={onToggle}
        className={`flex w-full cursor-pointer items-center gap-2.5 rounded-[4px] px-1 py-1.5 text-left text-[12.5px] transition-[background-color,transform] duration-150 ease-[var(--ease-out)] active:scale-[0.99] ${
          active ? "bg-ink/[0.06]" : "hover:bg-ink/[0.04]"
        }`}
      >
        <span
          aria-hidden
          className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
          style={{ background: color }}
        />
        <span className={`min-w-0 grow truncate text-ink ${active ? "font-semibold" : ""}`}>
          {item.label}
        </span>
        <span className={`tnum w-[3.6em] text-right text-ink ${active ? "font-semibold" : ""}`}>
          {pct.format(share * 100)}%
        </span>
        <span className="tnum w-[4.4em] text-right text-[11px] text-muted">{amount(value)}</span>
      </button>
    </li>
  );
}
