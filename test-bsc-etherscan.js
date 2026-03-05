const axios = require('axios');

async function testApi() {
    const apiKey = "K9VMVGP37V727I7FJPPQENUZFRF9N7MXAR";
    const ethKey = "CBYS4BWC7GNNNRD7XWY7MN2G17QH2FV823";
    const address = "0x1747aA804c606F43725648d5ccff0B4f2266A1de";

    const urls = [
        { name: "Bsc-Etherscan V1", url: `https://api-bsc.etherscan.io/api?module=account&action=tokentx&address=${address}&page=1&offset=10&sort=desc&apikey=${apiKey}` },
        { name: "Bsc-Etherscan V2 (chainid=56)", url: `https://api-bsc.etherscan.io/api?chainid=56&module=account&action=tokentx&address=${address}&page=1&offset=10&sort=desc&apikey=${apiKey}` }
    ];

    for (const item of urls) {
        try {
            console.log(`\n--- Testing ${item.name} ---`);
            console.log(`URL: ${item.url}`);
            const { data } = await axios.get(item.url);
            console.log(`Status: ${data.status}`);
            console.log(`Message: ${data.message}`);
            console.log(`Result: ${JSON.stringify(data.result).slice(0, 150)}`);
        } catch (err) {
            console.log(`Failed ${item.name}: ${err.message}`);
        }
    }
}

testApi();
