const key = process.env.GEMINI_API_KEY || process.env.AI_API_KEY;
const models = ['gemini-flash-latest', 'gemini-3-flash-preview', 'gemini-2.5-pro', 'gemini-3.5-flash', 'gemini-3.5-flash-lite'];

async function testOne(m) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 12000);
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: 'Hello' }] }] }),
      signal: ctrl.signal
    });
    clearTimeout(timer);
    const data = await res.json();
    return `${m}: ${res.status} ${data.candidates ? 'SUCCESS: ' + data.candidates[0].content.parts[0].text.trim() : data.error?.message}`;
  } catch (e) {
    clearTimeout(timer);
    return `${m}: FAILED ${e.message}`;
  }
}

Promise.all(models.map(testOne)).then(results => results.forEach(r => console.log(r)));
