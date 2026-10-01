// data/ 폴더의 곡 파일을 훑어서 data/index.json(곡 목록)을 만들고,
// sw.js 의 CACHE_VERSION 을 배포할 때마다 자동으로 바꿉니다.
// GitHub Actions 가 실행합니다. 내 컴퓨터에서는:  node scripts/build-song-index.mjs
import { readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";

const DIR = "data";
const isSongFile = n => /\.json$/i.test(n) && n.toLowerCase() !== "index.json" && !/^[_.]/.test(n);

/* index.html 의 parseLoose 와 같은 규칙: 닫는 따옴표 빠짐 · 끝 쉼표는 고쳐서 읽음 */
function parseLoose(text) {
  text = String(text).replace(/^\uFEFF/, "");
  let firstErr;
  try { return { data: JSON.parse(text), fixes: [] }; } catch (e) { firstErr = e; }
  const fixes = [];
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  lines.forEach((ln, i) => {
    const quotes = (ln.replace(/\\./g, "").match(/"/g) || []).length;
    if (quotes % 2 === 1) {
      const m = ln.match(/^(.*?)(,?)\s*$/);
      lines[i] = m[1] + '"' + m[2];
      fixes.push(`${i + 1}번째 줄에 닫는 따옴표(")가 빠져 있어요`);
    }
  });
  let t = lines.join("\n");
  const t2 = t.replace(/,(\s*[\]}])/g, "$1");
  if (t2 !== t) { fixes.push("목록·묶음 끝에 필요 없는 쉼표(,)가 있어요"); t = t2; }
  try { return { data: JSON.parse(t), fixes }; }
  catch (e) {
    const pos = String(firstErr.message).match(/position (\d+)/);
    if (pos) {
      const before = text.replace(/\r\n?/g, "\n").slice(0, +pos[1]).split("\n");
      throw new Error(`${before.length}번째 줄 ${before.at(-1).length + 1}번째 글자 근처에 JSON 문법 오류가 있어요`);
    }
    throw new Error("JSON 문법 오류가 있어요");
  }
}

const files = existsSync(DIR) ? readdirSync(DIR).filter(isSongFile).sort() : [];
const songs = [], broken = [];
for (const file of files) {
  try {
    const { data: raw, fixes } = parseLoose(readFileSync(`${DIR}/${file}`, "utf8"));
    const meta = Array.isArray(raw) ? {} : raw;
    const cards = Array.isArray(raw) ? raw : (meta.cards || meta.lyrics || meta.lines);
    if (!Array.isArray(cards) || !cards.length) throw new Error("\"cards\" 목록이 없거나 비어 있어요");
    const order = Number(meta.order);
    const song = {
      file,
      title: String(meta.title || file.replace(/\.json$/i, "")).trim(),
      order: meta.order != null && meta.order !== "" && Number.isFinite(order) ? order : 9999,
      youtube: String(meta.youtube || meta.youtubeUrl || meta.youtubeId || meta.video || ""),
      chance: null,
      lines: cards.length
    };
    if (meta.chance != null && String(meta.chance).trim() !== "") {
      const n = Number(meta.chance);
      if (!Number.isFinite(n)) fixes.push(`"chance" 값(${meta.chance})이 숫자가 아니라 별점을 표시하지 않아요`);
      else {
        song.chance = Math.min(10, Math.max(1, Math.round(n)));
        if (song.chance !== n) fixes.push(`"chance" 값 ${meta.chance}을(를) ${song.chance}(으)로 맞췄어요 (1~10 사이 정수)`);
      }
    }
    songs.push(song);
    console.log(`✓ ${file}  "${song.title}" (${cards.length}줄${song.youtube ? "" : ", 유튜브 링크 없음"}${song.chance != null ? `, 부를 확률 ${song.chance}/10` : ""})`);
    for (const f of fixes) console.log(`::warning file=${DIR}/${file}::${file}: ${f} — 자동으로 고쳐서 넣었지만 파일도 고쳐 주세요`);
  } catch (e) {
    broken.push({ file, msg: e.message });
    console.log(`::error file=${DIR}/${file}::${file} 을(를) 읽지 못했어요 — ${e.message}`);
  }
}
songs.sort((a, b) => a.order - b.order || a.title.localeCompare(b.title, "ko"));

writeFileSync(`${DIR}/index.json`, JSON.stringify({
  generated: new Date().toISOString(),
  files: songs.map(s => s.file),
  songs,
  broken
}, null, 2) + "\n");

const version = "build-" + (process.env.GITHUB_SHA || Date.now().toString(36)).slice(0, 10);
if (existsSync("sw.js")) {
  const sw = readFileSync("sw.js", "utf8").replace(/const CACHE_VERSION = "[^"]*";/, `const CACHE_VERSION = "${version}";`);
  writeFileSync("sw.js", sw);
}
console.log(`곡 ${songs.length}개를 목록에 넣었어요${broken.length ? ` (${broken.length}개는 읽지 못해 뺐어요)` : ""} · 캐시 버전 ${version}`);
