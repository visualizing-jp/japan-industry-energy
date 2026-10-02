/**
 * 配信データの取得。
 */

import { CubeView, type ChunkName, type DictEntry, type StackJson } from "./cube.ts";

export interface StackData {
  unit: string;
  items: DictEntry[];
  groups: DictEntry[];
  cube: CubeView;
  years: number[];
}

const cache = new Map<ChunkName, Promise<StackData>>();

export function loadStack(name: ChunkName): Promise<StackData> {
  const hit = cache.get(name);
  if (hit !== undefined) return hit;
  const promise = fetch(`${import.meta.env.BASE_URL}data/${name}.json`)
    .then((r) => {
      if (!r.ok) throw new Error(`${name}.json の取得に失敗しました (${r.status})`);
      return r.json() as Promise<StackJson>;
    })
    .then((raw) => ({
      unit: raw.unit,
      items: raw.items,
      groups: raw.groups ?? [],
      cube: new CubeView(raw),
      years: raw.dims.find((d) => d.name === "year")!.codes.map(Number),
    }));
  cache.set(name, promise);
  return promise;
}
