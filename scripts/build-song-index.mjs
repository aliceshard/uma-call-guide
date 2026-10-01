// data/ 폴더의 곡 파일을 훑어서 data/index.json(곡 목록)을 만들고,
// sw.js 의 CACHE_VERSION 을 올릴 때마다 자동으로 바꿉니다.
// GitHub Actions 가 실행합니다. 내 컴퓨터에서는:  node scripts/build-song-index.mjs
import { readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";

const DIR = "data";
const isSongFile = n => /\.json$/i.test(n) && n.toLowerCase() !== "index.json" && !/^[_.]/.test(n);
const files = existsSync(DIR) ? readdirSync(DIR).filter(isSongFile).sort() : [];

const songs = [];
let skipped = 0;
for (const file of files) {
  try {
    const raw = JSON.parse(readFileSync(`${DIR}/${file}`, "utf8"));
    const meta = Array.isArray(raw) ? {} : raw;
    const cards = Array.isArray(raw) ? raw : (meta.cards || meta.lyrics || meta.lines);
    if (!Array.isArray(cards) || !cards.length) throw new Error("cards 배열이 없거나 비어 있어요");
    const order = Number(meta.order);
    songs.push({
      file,
      title: String(meta.title || file.replace(/\.json$/i, "")),
      order: meta.order != null && meta.order !== "" && Number.isFinite(order) ? order : 9999,
      youtube: String(meta.youtube || meta.youtubeUrl || meta.youtubeId || meta.video || ""),
      lines: cards.length
    });
    console.log(`✓ ${file}  (${cards.length}줄${songs.at(-1).youtube ? "" : ", 유튜브 링크 없음"})`);
  } catch (e) {
    skipped++;
    console.log(`::warning file=${DIR}/${file}::${file} 을(를) 읽지 못해 목록에서 뺐어요 — ${e.message}`);
  }
}
songs.sort((a, b) => a.order - b.order || a.title.localeCompare(b.title, "ko"));

writeFileSync(`${DIR}/index.json`, JSON.stringify({
  generated: new Date().toISOString(),
  files: songs.map(s => s.file),
  songs
}, null, 2) + "\n");

const version = "build-" + (process.env.GITHUB_SHA || Date.now().toString(36)).slice(0, 10);
if (existsSync("sw.js")) {
  const sw = readFileSync("sw.js", "utf8").replace(/const CACHE_VERSION = "[^"]*";/, `const CACHE_VERSION = "${version}";`);
  writeFileSync("sw.js", sw);
}
console.log(`곡 ${songs.length}개를 목록에 넣었어요${skipped ? ` (${skipped}개 건너뜀)` : ""} · 캐시 버전 ${version}`);
