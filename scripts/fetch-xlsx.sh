#!/usr/bin/env bash
# 総合エネルギー統計「時系列表（参考表）」を data/raw に置く。
# enecho.meti.go.jp は AWS WAF の JavaScript チャレンジを返すことがあり、そのとき curl は Excel ではなく HTML を受け取る。
# その場合はブラウザで落として同じパスに置く。
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
RAW="$ROOT/data/raw"
FILE="stte_jikeiretu2024fykaku.xlsx"
URL="https://www.enecho.meti.go.jp/statistics/total_energy/xls/stte/$FILE"
mkdir -p "$RAW"

echo "fetch $FILE"
curl -sSL -A "Mozilla/5.0" -o "$RAW/$FILE.tmp" "$URL" || true

# xlsx は zip なので先頭2バイトが PK になる。
if [[ -s "$RAW/$FILE.tmp" && "$(head -c 2 "$RAW/$FILE.tmp")" == "PK" ]]; then
  mv "$RAW/$FILE.tmp" "$RAW/$FILE"
  echo "done"
  exit 0
fi

rm -f "$RAW/$FILE.tmp"
cat >&2 <<EOF
取得できませんでした（WAF のチャレンジで Excel が返っていません）。
ブラウザで次の URL を開いてダウンロードし、data/raw/$FILE に置いてください。
  $URL
掲載ページ: https://www.enecho.meti.go.jp/statistics/total_energy/results.html
EOF
exit 1
