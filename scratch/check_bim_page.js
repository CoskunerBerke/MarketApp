const axios = require('axios');
const fs = require('fs');

async function checkPage() {
    const key = '1571'; // 05 May - 02 June
    const url = `https://www.bim.com.tr/?Bim_AktuelTarihKey=${key}`;
    try {
        const response = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' }
        });
        fs.writeFileSync('bim_date_page.html', response.data);
        console.log('Page saved to bim_date_page.html');
    } catch (e) {
        console.error(e);
    }
}
checkPage();
