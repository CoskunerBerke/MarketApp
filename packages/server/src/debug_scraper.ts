import cheerio from 'cheerio';
import fs from 'fs';

async function run() {
    const content = fs.readFileSync('C:/Users/berke/OneDrive/Masaüstü/Market/bim_date_page.html', 'utf-8');
    const $ = cheerio.load(content);

    const products = $('.product').toArray();
    console.log(`Total products found by selector: ${products.length}`);

    let count = 0;
    products.forEach((el, index) => {
        const subTitle = $(el).find('.subTitle').text().trim();
        const title = $(el).find('.title').text().trim();
        const details = $(el).find('.gramajadet').text().trim();
        const fullName = `${subTitle} ${title} ${details}`.trim();
        
        const priceWhole = $(el).find('.gButton.triangle .text.quantify').text().trim().replace(',', '');
        const priceDecimal = $(el).find('.gButton.triangle .kusurArea .number').text().trim();
        const price = parseFloat(`${priceWhole}.${priceDecimal}`);
        
        const imgPath = $(el).find('.image img').attr('src') || $(el).find('.image img').attr('xsrc') || $(el).find('img').attr('src') || $(el).find('img').attr('xsrc');
        
        if (fullName && price) {
            count++;
        } else {
            console.log(`Skipped product at index ${index}: Name="${fullName}", Price="${price}", Img="${imgPath}"`);
        }
    });

    console.log(`Successfully parsed: ${count}`);
}

run();
