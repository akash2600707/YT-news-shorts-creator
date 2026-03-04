import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
const GNEWS_KEY     = process.env.GNEWS_API_KEY;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(join(__dirname, 'public')));

app.get('/api/health', (req, res) => {
  res.json({ status:'ok', version:'2.0.0', services:{ anthropic:!!ANTHROPIC_KEY, gnews:!!GNEWS_KEY }, timestamp:new Date().toISOString() });
});

app.post('/api/news', async (req, res) => {
  const { niches = ['ai','finance','geo'] } = req.body;
  if (!GNEWS_KEY && !ANTHROPIC_KEY) return res.status(500).json({ error:'No API keys configured in .env' });

  try {
    let stories = [];

    if (GNEWS_KEY) {
      const queryMap = { ai:'artificial intelligence OR AI technology', finance:'stock market OR economy OR Federal Reserve', geo:'geopolitics OR international OR war', crypto:'Bitcoin OR cryptocurrency', science:'science breakthrough OR NASA' };
      const query = niches.map(n => queryMap[n] || n).join(' OR ');
      const gRes = await fetch(`https://gnews.io/api/v4/search?q=${encodeURIComponent(query)}&lang=en&max=10&apikey=${GNEWS_KEY}`);
      const gData = await gRes.json();

      if (gData.articles?.length && ANTHROPIC_KEY) {
        const rawHl = gData.articles.slice(0,8).map((a,i) => `${i+1}. [${a.source?.name}] ${a.title} — ${a.description||''}`).join('\n');
        const cRes = await fetch('https://api.anthropic.com/v1/messages', {
          method:'POST', headers:{'Content-Type':'application/json','x-api-key':ANTHROPIC_KEY,'anthropic-version':'2023-06-01'},
          body: JSON.stringify({ model:'claude-sonnet-4-20250514', max_tokens:1200,
            system:`You are a broadcast news editor. Rewrite these headlines for YouTube Shorts. Return ONLY a JSON array:\n[{"tag":"AI & TECH"|"FINANCE"|"GEOPOLITICS"|"CRYPTO"|"SCIENCE"|"BREAKING","headline":"CAPS MAX 10 WORDS","subtext":"one sentence max 15 words","ticker":"max 10 words","source":"name","breakLabel":"BREAKING NEWS"|"MARKET UPDATE"|"WORLD ALERT"|"TECH ALERT"}]`,
            messages:[{role:'user',content:`Rewrite for broadcast shorts:\n${rawHl}\nReturn JSON array only.`}] })
        });
        const cData = await cRes.json();
        const raw = cData.content?.find(b=>b.type==='text'&&b.text.includes('['))?.text||'';
        const m = raw.match(/\[[\s\S]*\]/);
        if (m) stories = JSON.parse(m[0]);
      }

      if (!stories.length && gData.articles?.length) {
        stories = gData.articles.slice(0,8).map(a => ({
          tag: detectTag(a.title), headline: a.title.replace(/ - .*$/,'').toUpperCase().substring(0,70),
          subtext: (a.description||'Developing story.').substring(0,100), ticker: a.title.substring(0,60),
          source: a.source?.name||'Live', breakLabel:'BREAKING NEWS'
        }));
      }
    }

    if (!stories.length && ANTHROPIC_KEY) {
      const topicMap = { ai:'artificial intelligence, tech', finance:'stock markets, economy', geo:'geopolitics, wars', crypto:'Bitcoin, crypto', science:'science, space' };
      const topics = niches.map(n=>topicMap[n]||n).join('; ');
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method:'POST', headers:{'Content-Type':'application/json','x-api-key':ANTHROPIC_KEY,'anthropic-version':'2023-06-01'},
        body:JSON.stringify({ model:'claude-sonnet-4-20250514', max_tokens:1400,
          system:`Enterprise news editor for YouTube Shorts. Use web search for 8 breaking stories. Return ONLY JSON array:\n[{"tag":"AI & TECH"|"FINANCE"|"GEOPOLITICS"|"CRYPTO"|"SCIENCE","headline":"CAPS MAX 10 WORDS","subtext":"sentence case 15 words","ticker":"10 words","source":"name","breakLabel":"BREAKING NEWS"|"MARKET UPDATE"|"WORLD ALERT"|"TECH ALERT"}]`,
          tools:[{type:'web_search_20250305',name:'web_search'}],
          messages:[{role:'user',content:`Breaking news NOW about: ${topics}. JSON array only, 8 stories.`}] })
      });
      const d = await r.json();
      const raw = d.content?.find(b=>b.type==='text'&&b.text.includes('['))?.text||'';
      const m = raw.match(/\[[\s\S]*\]/);
      if (m) stories = JSON.parse(m[0]);
    }

    if (!stories.length) throw new Error('No stories fetched. Check API keys in .env');
    res.json({ stories, count: stories.length });

  } catch(err) {
    console.error('[/api/news]', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/youtube/init-upload', async (req, res) => {
  const { ytToken, title, description, tags } = req.body;
  if (!ytToken) return res.status(400).json({ error:'ytToken required' });
  try {
    const r = await fetch('https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status', {
      method:'POST',
      headers:{'Authorization':`Bearer ${ytToken}`,'Content-Type':'application/json','X-Upload-Content-Type':'video/webm'},
      body: JSON.stringify({ snippet:{title:title?.substring(0,100)||'Breaking News',description:description||'#shorts',tags:tags||['news','shorts'],categoryId:'25',defaultLanguage:'en'}, status:{privacyStatus:'public',madeForKids:false} })
    });
    const uploadUrl = r.headers.get('Location');
    if (!uploadUrl) return res.status(r.status).json({ error: await r.text() });
    res.json({ uploadUrl });
  } catch(err) { res.status(500).json({ error:err.message }); }
});

function detectTag(t) {
  t = t.toLowerCase();
  if (/\bai\b|openai|tech|google|apple|microsoft/.test(t)) return 'AI & TECH';
  if (/market|stock|crypto|bitcoin|fed|economy/.test(t))   return 'FINANCE';
  if (/war|sanction|nato|china|russia|ukraine/.test(t))    return 'GEOPOLITICS';
  if (/bitcoin|ethereum|crypto|defi/.test(t))              return 'CRYPTO';
  return 'BREAKING';
}

app.get('*', (req, res) => res.sendFile(join(__dirname, 'public', 'index.html')));

app.listen(PORT, () => {
  console.log(`\n🔴 SIGNAL STUDIO ENTERPRISE`);
  console.log(`   http://localhost:${PORT}`);
  console.log(`   Anthropic : ${ANTHROPIC_KEY ? '✓' : '✗ missing'}`);
  console.log(`   GNews     : ${GNEWS_KEY     ? '✓' : '✗ missing'}\n`);
});
