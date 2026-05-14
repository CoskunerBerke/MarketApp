const fs = require('fs');

const content = fs.readFileSync('scratch/sok_target.html', 'utf8');

const products = [];
// Regex for product cards
// <h2 class="CProductCard-module_title__u8bMW">YumoY Extra YumuYatc Manolya 1008 Ml</h2>
const productRegex = /<h2 class="[^"]*?title[^"]*?">(.*?)<\/h2>.*?class="[^"]*?price[^"]*?">(.*?)<\/span>/gs;

let match;
while ((match = productRegex.exec(content)) !== null) {
    if (products.length >= 10) break;
    const title = match[1].trim();
    const price = match[2].replace(/<!-- -->/g, '').trim();
    products.push({ title, price });
}

console.log(JSON.stringify(products, null, 2));
