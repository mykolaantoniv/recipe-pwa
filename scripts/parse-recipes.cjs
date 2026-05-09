#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const FILES = [
  { file: 'breakfast_recipes.docx', mealType: 'сніданок', slug: 'snidanok' },
  { file: 'lunch_recipes.docx',     mealType: 'обід',     slug: 'obid'     },
  { file: 'dinner_recipes.docx',    mealType: 'вечеря',   slug: 'vecherya' },
  { file: 'snack_recipes.docx',     mealType: 'снек',     slug: 'snek'     },
];

const SRC_DIR = process.argv[2] || path.join(__dirname, '../../../project');
const OUT_DIR = process.argv[3] || path.join(__dirname, '../public/data');
fs.mkdirSync(OUT_DIR, { recursive: true });

const CAT_RULES = [
  { cat: "М'ясо",   keys: ['курк','ялович','свинин','фарш','бекон','шинк','ковбас','індич','качк','телят','баран'] },
  { cat: 'Риба',    keys: ['лосос','тунець','тріск','судак','форел','оселедець','скумбр','риб','краб','креветк','морепрод'] },
  { cat: 'Молочні', keys: ['молоко','вершк','йогурт','кефір','сметан','пармез','моцарел','рікот','творог','сир кисло','сир тверд','сир плавл'] },
  { cat: 'Яйця',    keys: ['яйц'] },
  { cat: 'Овочі',   keys: ['помідор','томат','огірок','морква','цибул','часник','перець болг','броколі','шпинат','салат','капуст','кабачок','баклажан','буряк','картопл','гарбуз','петрушк','кріп','базилік','руккол','селер','спаржа','кукурудз','гриб','цукін'] },
  { cat: 'Фрукти',  keys: ['лимон','апельсин','яблук','банан','полуниц','чорниц','малин','виноград','манго','ананас','авокад','ківі','грейпфрут'] },
  { cat: 'Крупи',   keys: ['рис','гречк','вівс','пшениц','макарон','паст','спагет','тальятел','пенне','феттуч','борошн','хліб','тост','булк','батон','лаваш','крупа','кіноа','булгур','кускус','пластівц','мюслі'] },
  { cat: 'Горіхи',  keys: ['горіх','мигдал','кеш\'ю','фундук','арахіс','насінн','кунжут','льон','чіа'] },
  { cat: 'Олія',    keys: ['олія','масло вершк','масло олив','масло рослин','масло кокос'] },
  { cat: 'Спеції',  keys: ['сіль','перець','кориц','кмин','куркум','паприк','орегано','тим\'ян','розмарин','гірчиц','імбир','мускат','лавр','ваніл','цукор','мед','кленов'] },
  { cat: 'Бакалія', keys: ['соус','кетчуп','майонез','оцет','соя','бульйон','консерв','томатн','нут','сочевиц','боби','вино','каперс','оливк','борошно','крохмал','желат'] },
];

function inferCat(name) {
  const n = name.toLowerCase();
  for (const { cat, keys } of CAT_RULES) {
    if (keys.some(k => n.includes(k))) return cat;
  }
  return 'Інше';
}

function parseCookTime(str) {
  if (!str) return 30;
  const m = str.match(/(\d+)/);
  return m ? parseInt(m[1]) : 30;
}

function buildTags(r) {
  const tags = [];
  if (r.protein >= 25) tags.push('багато білка');
  if (r.carbs <= 30)   tags.push('мало вуглеводів');
  if (r.cookTime <= 30) tags.push('до 30 хв');
  tags.push(r.mealType);
  return tags;
}

const UNSPLASH = {
  снідано: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=600&q=80',
  обід:    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80',
  вечеря:  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80',
  снек:    'https://images.unsplash.com/photo-1601972602237-8c79241e468b?w=600&q=80',
};

function strip(s) {
  return s.replace(/\*\*(.+?)\*\*/g,'$1').replace(/\*(.+?)\*/g,'$1').trim();
}

function parseFile({ file, mealType, slug }) {
  const text = fs.readFileSync(path.join(SRC_DIR, file), 'utf8');
  const lines = text.split('\n').map(l => l.replace(/\r$/,''));

  const blocks = [];
  let cur = [];
  for (const line of lines) {
    if (/^\*?\*?\d+\.\s+\S/.test(line.trim()) && cur.length > 0) { blocks.push(cur); cur = []; }
    cur.push(line);
  }
  if (cur.length > 0) blocks.push(cur);

  const recipes = [];
  for (const block of blocks) {
    const tm = block[0].match(/^\*?\*?(\d+)\.\s+(.+?)\*?\*?$/);
    if (!tm) continue;
    const num = parseInt(tm[1]);
    const title = tm[2].replace(/\*\*/g,'').trim();
    const id = `${slug}-${String(num).padStart(2,'0')}`;

    let calories=0, protein=0, fat=0, carbs=0, cookTimeStr='';
    const ingredients=[], steps=[];
    let inIng=false, inSteps=false;

    for (const line of block.slice(1)) {
      const clean = strip(line);
      if (!clean) continue;
      if (/^Калорії:/i.test(clean)) { const m=clean.match(/(\d+)/); if(m) calories=parseInt(m[1]); }
      else if (/^Б\s*\/\s*Ж\s*\/\s*В/i.test(clean)) {
        const p=clean.match(/Б\s*[—-]\s*([\d.]+)/i);
        const f=clean.match(/Ж\s*[—-]\s*([\d.]+)/i);
        const c=clean.match(/В\s*[—-]\s*([\d.]+)/i);
        if(p) protein=parseFloat(p[1]);
        if(f) fat=parseFloat(f[1]);
        if(c) carbs=parseFloat(c[1]);
      }
      else if (/^Час приготування:/i.test(clean)) cookTimeStr=clean.replace(/^Час приготування:\s*/i,'').trim();
      else if (/🛒/.test(clean)) { inIng=true; inSteps=false; }
      else if (/👨/.test(clean)) { inSteps=true; inIng=false; }
      else if (/^Посуд:/i.test(clean)) inIng=false;
      else if (inIng && line.trim().startsWith('-')) {
        const raw=strip(line).replace(/^-\s*/,'');
        const parts=raw.split(/\s*—\s*/);
        if (parts.length>=2) {
          const name=parts[0].trim();
          const amount=parts.slice(1).join('—').trim();
          ingredients.push({ name, amount, category: inferCat(name) });
        }
      }
      else if (inSteps && line.trim().startsWith('-')) {
        const step=strip(line).replace(/^-\s*/,'').trim();
        if(step) steps.push(step);
      }
    }

    const cookTime = parseCookTime(cookTimeStr);
    const imgKey = mealType.startsWith('снід') ? 'снідано' : mealType;
    const recipe = { id, title, image: UNSPLASH[imgKey] || UNSPLASH['обід'], calories, protein, fat, carbs, cookTime, mealType, ingredients, steps, tags:[] };
    recipe.tags = buildTags(recipe);
    recipes.push(recipe);
  }
  console.log(`${mealType}: ${recipes.length} рецептів`);
  return recipes;
}

const all = [];
for (const def of FILES) {
  const recs = parseFile(def);
  fs.writeFileSync(path.join(OUT_DIR, `${def.slug}.json`), JSON.stringify(recs, null, 2), 'utf8');
  all.push(...recs);
}
fs.writeFileSync(path.join(OUT_DIR, 'all.json'), JSON.stringify(all, null, 2), 'utf8');
console.log(`\nTotal: ${all.length} рецептів → ${OUT_DIR}`);
