import path from 'path';
import { createJiti } from 'jiti';
const jiti = createJiti(process.cwd(), { alias: { '@': path.resolve('./src') } });
const { GeminiProvider } = jiti(path.resolve('./src/lib/ai/GeminiProvider.ts'));

async function test() {
  const p = new GeminiProvider();
  console.log('Status:', await p.status());
  try {
    const res = await p.chat([{ role: 'user', content: 'Say hello in 5 words' }], { timeoutMs: 10000 });
    console.log('Result:', res);
  } catch (e) {
    console.error('Chat error details:', e);
  }
}

test();
