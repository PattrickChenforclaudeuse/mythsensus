#!/usr/bin/env bash
# คำอ่านรายศาสตร์ ครบวงจรหนึ่งศาสตร์:  ./run.sh <systemKey> [--skip-gen]
#
#   1. payload   ค่าจากเอนจิน (ไม่มีโมเดลเกี่ยวข้อง)
#   2. answers   ชั้นที่ 1 — ตอบคำถามบังคับ 45 ข้อ = วัตถุดิบสำหรับ consensus
#   3. compose   ชั้นที่ 2 — เรียบเรียงเป็นความเรียง = สิ่งที่ลูกค้าอ่าน
#   4. render    ลงหน้าเดียวกับเล่มใหญ่ พร้อมภาพจากเอนจิน
#   5. check     ด่านวัดซ้ำ/กลวง/เรียบเรียง
#
# ⛔ ต้องวิ่งผ่าน subscription (claude -p) เท่านั้น — ห้ามให้ ANTHROPIC_API_KEY หลุดเข้ามา
set -euo pipefail
cd "$(dirname "$0")"

SYS="${1:?ใส่ชื่อศาสตร์ เช่น ./run.sh bazi}"
SKIP="${2:-}"

if [ -n "${ANTHROPIC_API_KEY:-}" ]; then
  echo "หยุด: เจอ ANTHROPIC_API_KEY ใน environment — จะกลายเป็นยิง API เสียเงินโดยไม่ตั้งใจ" >&2
  exit 1
fi

echo "[1/5] payload"
node build-payload.cjs "$SYS"

if [ "$SKIP" != "--skip-gen" ]; then
  echo "[2/5] answers — 45 ข้อ"
  { cat PROMPT-oneoff.md; printf '\n\n---\n## payload\n```json\n'; cat "payload-$SYS.json"; printf '\n```\n'; } > "_in-$SYS.txt"
  claude -p --output-format text < "_in-$SYS.txt" > "out-$SYS.raw.txt"
  node clean-json.cjs "out-$SYS.raw.txt" "out-$SYS.json"

  echo "[3/5] compose — เรียบเรียง"
  { cat PROMPT-compose.md; printf '\n\n---\n## answers\n```json\n'; cat "out-$SYS.json";
    printf '\n```\n\n## payload\n```json\n'; cat "payload-$SYS.json"; printf '\n```\n'; } > "_in2-$SYS.txt"
  claude -p --output-format text < "_in2-$SYS.txt" > "compose-$SYS.raw.txt"
  node clean-json.cjs "compose-$SYS.raw.txt" "compose-$SYS.json"
fi

echo "[4/5] render"
node render-compose.cjs "$SYS"

echo "[5/5] check"
node check-compose.cjs "compose-$SYS.json" "out-$SYS.json"
