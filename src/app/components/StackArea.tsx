/**
 * 年度を x に取った積み上げ面。構成比（各年 100%）と量（実数の積み上げ）を切り替える。
 * 系列を強調しているときは、ほかの帯を薄くして強調した帯だけを読ませる。
 */

import { useRef, type Dispatch, type KeyboardEvent, type PointerEvent, type SetStateAction } from "react";
import { scaleLinear } from "d3-scale";
import { area, stack, stackOffsetExpand, stackOffsetNone, type SeriesPoint } from "d3-shape";

export type Mode = "share" | "amount";

export interface StackSeries {
  key: string;
  label: string;
  color: string;
  /** years と同じ順序・同じ長さ。 */
  values: number[];
}

export interface Mark {
  year: number;
  label: string;
}

type Row = Record<string, number>;

function xTicks(from: number, to: number): number[] {
  const step = to - from <= 20 ? 2 : 5;
  const ticks: number[] = [];
  for (let t = Math.ceil(from / step) * step; t <= to; t += step) ticks.push(t);
  if (ticks[0] !== from) ticks.unshift(from);
  if (ticks.at(-1) !== to) ticks.push(to);
  // 端の目盛りが隣と重なるときは、内側を落とす。
  if (ticks.length > 2 && ticks[1]! - ticks[0]! < step) ticks.splice(1, 1);
  if (ticks.length > 2 && ticks.at(-1)! - ticks.at(-2)! < step) ticks.splice(-2, 1);
  return ticks;
}

const grouping = new Intl.NumberFormat("ja-JP", { maximumFractionDigits: 0 });

export function StackArea({
  years,
  series,
  mode,
  emphasized,
  marks,
  width,
  height,
  hoverYear,
  onHoverYear,
  label,
}: {
  years: number[];
  series: StackSeries[];
  mode: Mode;
  emphasized: string | null;
  marks: Mark[];
  width: number;
  height: number;
  hoverYear: number | null;
  onHoverYear: Dispatch<SetStateAction<number | null>>;
  label: string;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const M = { left: 48, right: 12, top: 22, bottom: 26 };
  const from = years[0]!;
  const to = years.at(-1)!;

  const rows = years.map((year, i) => {
    const row: Row = { year };
    for (const s of series) row[s.key] = s.values[i]!;
    return row;
  });
  const layers = stack<Row>()
    .keys(series.map((s) => s.key))
    .offset(mode === "share" ? stackOffsetExpand : stackOffsetNone)(rows);
  const top = mode === "share" ? 1 : Math.max(...layers.at(-1)!.map((p) => p[1]));

  const x = scaleLinear().domain([from, to]).range([M.left, width - M.right]);
  const y = scaleLinear().domain([0, top]).range([height - M.bottom, M.top]);
  if (mode === "amount") y.nice(4);
  const yTicks = mode === "amount" ? y.ticks(4) : [0, 0.25, 0.5, 0.75, 1];

  const shape = area<SeriesPoint<Row>>()
    .x((p) => x(p.data.year!))
    .y0((p) => y(p[0]))
    .y1((p) => y(p[1]));

  function clampYear(year: number): number {
    return Math.min(to, Math.max(from, year));
  }

  function onMove(e: PointerEvent<SVGSVGElement>) {
    const rect = svgRef.current?.getBoundingClientRect();
    if (rect === undefined) return;
    onHoverYear(clampYear(Math.round(x.invert(e.clientX - rect.left))));
  }

  function onKey(e: KeyboardEvent<SVGSVGElement>) {
    const step = e.key === "ArrowLeft" ? -1 : e.key === "ArrowRight" ? 1 : 0;
    if (step !== 0) {
      e.preventDefault();
      onHoverYear((year) => clampYear((year ?? to) + step));
    } else if (e.key === "Escape") {
      onHoverYear(null);
    }
  }

  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      role="img"
      aria-label={label}
      tabIndex={0}
      className="block touch-none select-none outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
      onPointerMove={onMove}
      onPointerLeave={() => onHoverYear(null)}
      onKeyDown={onKey}
      onBlur={() => onHoverYear(null)}
    >
      {layers.map((layer, i) => (
        <path
          key={layer.key}
          d={shape(layer) ?? undefined}
          fill={series[i]!.color}
          opacity={emphasized === null || emphasized === layer.key ? 1 : 0.28}
          stroke="var(--color-paper)"
          strokeWidth={0.75}
          className="transition-opacity duration-150 ease-[var(--ease-out)]"
        />
      ))}

      {yTicks.map((v) => (
        <g key={v}>
          {v > 0 && (
            <line x1={M.left} x2={width - M.right} y1={y(v)} y2={y(v)} className="stroke-paper/70" strokeWidth={0.5} />
          )}
          <text x={M.left - 8} y={y(v) + 3.5} textAnchor="end" className="tnum fill-faint text-[10px]">
            {mode === "share" ? `${v * 100}%` : grouping.format(v)}
          </text>
        </g>
      ))}

      {marks
        .filter((m) => m.year >= from && m.year <= to)
        .map((m) => (
          <g key={m.year} className="pointer-events-none">
            <line
              x1={x(m.year)}
              x2={x(m.year)}
              y1={M.top - 4}
              y2={height - M.bottom}
              className="stroke-ink/40"
              strokeWidth={1}
              strokeDasharray="2 3"
            />
            <text x={x(m.year) + 4} y={M.top - 8} className="fill-muted text-[10px]">
              {m.label}
            </text>
          </g>
        ))}

      {hoverYear !== null && (
        <line
          x1={x(hoverYear)}
          x2={x(hoverYear)}
          y1={M.top}
          y2={height - M.bottom}
          className="pointer-events-none stroke-ink"
          strokeWidth={1}
        />
      )}

      <g transform={`translate(0, ${height - M.bottom})`}>
        <line x1={M.left} x2={width - M.right} className="stroke-rule-strong" strokeWidth={1} />
        {xTicks(from, to).map((t) => (
          <text key={t} x={x(t)} y={16} textAnchor="middle" className="tnum fill-muted text-[10px]">
            {t}
          </text>
        ))}
        {hoverYear !== null && (
          <g className="pointer-events-none">
            <rect x={x(hoverYear) - 20} y={3} width={40} height={17} rx={3} className="fill-ink" />
            <text
              x={x(hoverYear)}
              y={16}
              textAnchor="middle"
              className="tnum fill-paper text-[10px] font-medium"
            >
              {hoverYear}
            </text>
          </g>
        )}
      </g>
    </svg>
  );
}
