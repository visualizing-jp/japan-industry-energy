# 日本は何のエネルギーに頼ってきたか

資源エネルギー庁「総合エネルギー統計」時系列表（参考表）をもとに、一次エネルギー供給・最終消費・部門・電源の構成変化を探索するダッシュボード。
シリーズ「日本の産業は、どう動いてきたか」（ハブは `../japan-industry/`）の1本。

## ビュー

| タブ | 内容 |
| --- | --- |
| 供給 | 一次エネルギー国内供給の資源別構成（1990–2024年度） |
| 消費 | 最終エネルギー消費のエネルギー源別構成（1990–2024年度） |
| 部門 | 最終エネルギー消費の部門別構成（1990–2024年度） |
| 電源 | 発電電力量の電源構成（2010–2024年度） |

どのビューも構成比（各年度 100%）と量（PJ／億kWh）を切り替えられる。

## 開発

```bash
npm install
npm run fetch && npm run data && npm run verify
npm run dev   # http://127.0.0.1:5311/
```

| スクリプト | 内容 |
| --- | --- |
| `npm run fetch` | 時系列表 xlsx を `data/raw/` に取得（WAF に弾かれたら手順を表示して止まる） |
| `npm run data` | xlsx から配信用 cube（`public/data/*.json`）を作る。公式の合計・構成比と照合する |
| `npm run verify` | 配信 cube の健全性チェック |
| `npm run dev` | Vite 開発サーバ |
| `npm run build` | 本番ビルド |
| `npm run typecheck` | TypeScript 検査 |

`npm run data` は Python 3 と openpyxl を使う。初回に `.venv/` を作って `requirements.txt` を入れる。

データ設計の正本は [`docs/data-sources.md`](docs/data-sources.md)。

## 公開

`.github/workflows/pages.yml` で GitHub Pages にデプロイできる。本番ドメインは未定のため `public/CNAME` は置いていない。
ドメインが決まったら、`src/app/components/Brand.tsx` の `HUB_URL` とハブの `catalog.ts` の `url` を差し替える。
