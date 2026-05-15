const axios = require('axios');

async function test() {
  const r = await axios.get('https://www.migros.com.tr/rest/sanalmarket/products/search?q=indirim&page=0', {
    headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' }
  });
  const d = r.data.data;
  console.log('hitCount:', d.hitCount);
  console.log('pageCount:', d.pageCount);
  console.log('products on this page:', d.storeProductInfos.length);
  
  const discounted = d.storeProductInfos.filter(p => p.discountRate > 0);
  console.log('with actual discount:', discounted.length);
  
  discounted.slice(0, 5).forEach(p => {
    console.log(`  ${p.name} | ${p.regularPrice/100} TL -> ${p.shownPrice/100} TL | %${p.discountRate}`);
  });
}

test().catch(e => console.error(e.message));
