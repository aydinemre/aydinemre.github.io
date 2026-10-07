import { readdir, readFile, stat } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import assert from 'node:assert/strict';
const root = resolve('dist');
async function files(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const result = await Promise.all(entries.map(e => e.isDirectory() ? files(join(dir, e.name)) : join(dir, e.name)));
  return result.flat();
}
const built = await files(root);
const html = built.filter(f => f.endsWith('.html'));
for (const file of html) {
  const text = await readFile(file, 'utf8');
  assert.match(text, /<html[^>]+lang="tr"/, `Missing Turkish language: ${file}`);
  assert.equal((text.match(/<h1[ >]/g) || []).length, 1, `Expected one h1: ${file}`);
  assert.match(text, /<title>[^<]+<\/title>/, `Missing title: ${file}`);
  assert.match(text, /name="description"/, `Missing description: ${file}`);
  assert.match(text, /rel="canonical"/, `Missing canonical: ${file}`);
  for (const match of text.matchAll(/(?:href|src)="(\/[^"#?]*)/g)) {
    const pathname = decodeURIComponent(match[1]);
    const target = resolve(root, '.' + pathname);
    assert.ok(target.startsWith(root), `Path escapes site: ${pathname}`);
    try {
      const info = await stat(target);
      if (info.isDirectory()) await stat(join(target, 'index.html'));
    } catch { throw new Error(`Broken local link or asset in ${file}: ${pathname}`); }
  }
}
for (const f of built.filter(f => /\.(js|css|html)$/.test(f))) {
  assert.ok((await stat(f)).size < (f.includes('/_astro/OSWorld.') ? 650_000 : 100_000), `Asset exceeds its size budget: ${f}`);
}
const home = await readFile(join(root, 'index.html'), 'utf8');
assert.match(home, /Kendini tanımak üzerine notlarım/, 'Published essay missing from homepage');
assert.match(home, /matrix-masthead[^>]*aria-hidden="true"/, 'Accessible static Matrix motif missing');
assert.match(home, /Data Science &amp; AI Leader/, 'Current profession missing');
assert.doesNotMatch(home, /Yüksek lisansa başladım/, 'Removed announcement returned');
assert.doesNotMatch(home, /<script|<canvas/, 'Homepage must remain free of decorative scripts and canvas');
for (const code of ['bil511', 'bil513']) assert.ok(home.includes(`/yuksek-lisans/${code}/`), `Course link missing: ${code}`);
const article = await readFile(join(root, 'kisisel-notlarim/kendini-tanimak-uzerine-notlarim/index.html'), 'utf8');
assert.match(article, /Bu yazının da bir amacı var\./, 'Migrated article is incomplete');
for (const code of ['bil511']) {
  const course = await readFile(join(root, `yuksek-lisans/${code}/index.html`), 'utf8');
  assert.match(course, /henüz yayımlanmış bir not yok/, `Missing truthful empty state: ${code}`);
}
for (const name of ['rss.xml', 'sitemap.xml', 'robots.txt', '404.html']) await stat(join(root, name));
console.log(`Verified ${html.length} pages: links, assets, metadata, migrated content and size budgets.`);

const lesson = await readFile(join(root, "yuksek-lisans/bil513/ders-1/index.html"), "utf8");
assert.equal((lesson.match(/class="slide"/g)||[]).length,28,'First week must retain 28 study sections');
assert.match(lesson,/id="language"/,'Bilingual control missing');
assert.doesNotMatch(lesson,/MatrixIntro|data-reader="step-play"|WebGL/,'Old lesson design must not load');
for(let week=1;week<=14;week++){
 const page=await readFile(join(root,`yuksek-lisans/bil513/hafta-${week}/index.html`),'utf8');
 assert.match(page,/study-config/,'Study data configuration missing');
 assert.match(page,/id="language"/,'Language control missing');
 assert.match(page,/id="sections"/,'Server rendered reading missing');
 assert.ok((page.match(/class="slide"/g)||[]).length>=14,`Incomplete week ${week}`);
}
const course=await readFile(join(root,'yuksek-lisans/bil513/index.html'),'utf8');
for(let week=1;week<=14;week++)assert.ok(course.includes(`/yuksek-lisans/bil513/hafta-${week}/`),`Missing week ${week}`);
const sourceText=await readFile(join(root,"yuksek-lisans/bil513/ders-1-kaynak/index.html"),"utf8");
for(let i=1;i<=65;i++) assert.ok(sourceText.includes(`id="slayt-${i}"`),`Missing slide ${i}`);

const animations=JSON.parse(await readFile(join(root,'study/cse513/animations/manifest.json'),'utf8'));
const animatedWeeks=[1,2,3,4,5,6,8,9,10];let animationIndex=0;
assert.deepEqual(Object.keys(animations).map(Number).sort((a,b)=>a-b),animatedWeeks);
for(const week of animatedWeeks)for(const slot of ['primary','secondary']){
 const animation=animations[week][slot];assert.equal(animation.index,++animationIndex);
 for(const language of ['tr','en']){
  const localized=animation.languages[language];assert.ok(localized.frames>1);
  for(const variant of ['desktop','mobile']){
   const asset=localized[variant],gif=await readFile(join(root,asset.gif.slice(1)));
   assert.match(gif.subarray(0,6).toString(),/^GIF8[79]a$/,'Animation must be a real GIF');
   assert.equal(gif.readUInt16LE(6),asset.width);assert.equal(gif.readUInt16LE(8),asset.height);
   assert.equal(gif.length,asset.bytes);await stat(join(root,asset.poster.slice(1)));
  }
 }
}
console.log('Verified 18 numbered animations in Turkish/English and desktop/mobile GIF formats.');
