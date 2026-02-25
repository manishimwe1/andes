const axios = require('axios');

async function testTatum() {
    const tatumKey = "t-698eec7cddf3609d3fe2830a-2110bfa340914f9f826d3c04";
    const address = "0x1747aA804c606F43725648d5ccff0B4f2266A1de";
    const usdtContract = "0x55d398326f99059fF775485246999027B3197955";

    const url = `https://api.tatum.io/v3/blockchain/token/transaction/bsc/${address}/${usdtContract}?pageSize=10`;

    try {
        console.log(`\n--- Testing Tatum API ---`);
        console.log(`URL: ${url}`);
        const { data } = await axios.get(url, {
            headers: { 'x-api-key': tatumKey }
        });
        console.log(`Success! Found ${data.length} transactions.`);
        console.log(`Result Sample: ${JSON.stringify(data).slice(0, 300)}...`);
    } catch (err) {
        console.error(`Error Tatum: ${err.message}`);
        if (err.response) {
            console.error(`Response Data: ${JSON.stringify(err.response.data)}`);
        }
    }
}

testTatum();
