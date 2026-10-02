/**
 * 構成チャートの色。paper 上で区別できる、彩度を抑えた色。
 * 同じコード（石炭・石油など）はどのビューでも同じ色にする。
 */

const COLORS: Record<string, string> = {
  coal: "#3f4247",
  oil: "#8a6a4f",
  gas: "#6f8796",
  nuclear: "#8c7aa0",
  hydro: "#4f7f95",
  renewable: "#5f8a5a",
  unused: "#b8b1a6",
  electricity: "#c47a3a",
  heat: "#d9ab84",
  solar: "#c9a43e",
  wind: "#8fb3a6",
  geothermal: "#b0603a",
  biomass: "#7f9a4e",

  agriculture: "#a59a6a",
  manufacturing: "#5c6b7a",
  commercial: "#97a8b8",
  household: "#c47a3a",
  passenger: "#3d7a6a",
  freight: "#86b3a4",
};

export function colorOf(code: string): string {
  return COLORS[code] ?? "#a8a299";
}
