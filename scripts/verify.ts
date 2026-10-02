/**
 * 配信 cube の健全性チェック。
 *
 *   npm run verify
 */

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { CubeView, type ChunkName, type StackJson } from "../src/app/data/cube.ts";

const DATA = resolve(import.meta.dirname, "../public/data");
const LAST_YEAR = 2024;

let failed = 0;

function ok(label: string, cond: boolean, detail = ""): void {
  console.log(`${cond ? "OK" : "NG"}  ${label}${detail ? `: ${detail}` : ""}`);
  if (!cond) failed += 1;
}

async function load(name: ChunkName): Promise<StackJson> {
  return JSON.parse(await readFile(resolve(DATA, `${name}.json`), "utf8")) as StackJson;
}

function years(raw: StackJson): number[] {
  return raw.dims.find((d) => d.name === "year")!.codes.map(Number);
}

function totalAt(raw: StackJson, year: number): number {
  const cube = new CubeView(raw);
  return raw.items.reduce((sum, i) => sum + (cube.at("value", { item: i.code, year: String(year) }) ?? 0), 0);
}

const names: ChunkName[] = ["supply", "final", "sector", "power"];
const files = Object.fromEntries(
  await Promise.all(names.map(async (n) => [n, await load(n)] as const)),
) as Record<ChunkName, StackJson>;

for (const name of names) {
  const raw = files[name];
  const ys = years(raw);
  const values = raw.measures.value!;
  ok(`${name}: 年度が連続`, ys.every((y, i) => i === 0 || y === ys[i - 1]! + 1), `${ys[0]}–${ys.at(-1)}`);
  ok(`${name}: 最終年度が ${LAST_YEAR}`, ys.at(-1) === LAST_YEAR);
  ok(`${name}: 値の数 = 項目 × 年度`, values.length === raw.items.length * ys.length);
  ok(`${name}: 欠測なし・非負`, values.every((v) => v !== null && v >= 0));
}

ok("supply: 7項目", files.supply.items.length === 7);
ok("supply: 1990年度から", years(files.supply)[0] === 1990);
ok("power: 2010年度から（表注）", years(files.power)[0] === 2010);
ok("sector: 子はすべて groups の親を持つ", files.sector.items.every((i) => files.sector.groups?.some((g) => g.code === i.parent)));

const supply2024 = totalAt(files.supply, 2024);
ok("supply 2024 合計 ≈ 17,461 PJ", Math.abs(supply2024 - 17461) < 1, supply2024.toFixed(1));
const power2024 = totalAt(files.power, 2024);
ok("power 2024 合計 ≈ 9,911 億kWh", Math.abs(power2024 - 9911) < 1, power2024.toFixed(1));

if (failed > 0) {
  console.error(`\n${failed} 件 NG`);
  process.exit(1);
}
console.log("\nすべて OK");
