const axios = require('axios');
const fs = require('fs');

async function testA101() {
  try {
    const response = await axios.get('https://www.a101.com.tr/aldin-aldin/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'max-age=0',
        'Sec-Ch-Ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1'
      },
      timeout: 10000
    });
    fs.writeFileSync('scratch/a101_node_test.html', response.data);
    console.log('Success! Saved to scratch/a101_node_test.html');
  } catch (error) {
    console.error('Error status:', error.response?.status);
    console.error('Error message:', error.message);
    if (error.response?.data) {
       fs.writeFileSync('scratch/a101_error.html', error.response.data);
    }
  }
}

testA101();
