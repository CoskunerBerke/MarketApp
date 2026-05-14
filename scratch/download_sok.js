const https = require('https');
const fs = require('fs');

const url = 'https://www.sokmarket.com.tr/bunlari-kacirmayin-cms-mps53';

https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    fs.writeFileSync('scratch/sok_live.html', data);
    console.log('Downloaded!');
  });
}).on('error', (err) => {
  console.log('Error: ' + err.message);
});
