const fs = require('fs');
const html = fs.readFileSync('scratch/sok_live.html', 'utf8');

const scripts = html.match(/<script[^>]*>([\s\S]*?)<\/script>/g) || [];
scripts.forEach((s, i) => {
  if (s.length > 1000) {
    console.log(`Script ${i} length: ${s.length}`);
    console.log(`Script ${i} start: ${s.substring(0, 100)}...`);
  }
});
