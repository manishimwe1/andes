const axios = require('axios');

async function testApi() {
    const apiKey = "K9VMVGP37V727I7FJPPQENUZFRF9N7MXAR"; // BSCSCAN_API_KEY from .env
    const ethKey = "CBYS4BWC7GNNNRD7XWY7MN2G17QH2FV823"; // ETHERSCAN_API_KEY from .env
    const address = "0x1747aA804c606F43725648d5ccff0B4f2266A1de";
    const chainId = 56; // BSC Mainnet for testing indexing

    const urls = [
        { name: "BscScan V1", url: `https://api.bscscan.com/api?module=account&action=tokentx&address=${address}&page=1&offset=10&sort=desc&apikey=${apiKey}` },
        { name: "Etherscan V2 (BscScan Key)", url: `https://api.etherscan.io/v2/api?chainid=${chainId}&module=account&action=tokentx&address=${address}&page=1&offset=10&sort=desc&apikey=${apiKey}` },
        { name: "Etherscan V2 (Etherscan Key)", url: `https://api.etherscan.io/v2/api?chainid=${chainId}&module=account&action=tokentx&address=${address}&page=1&offset=10&sort=desc&apikey=${ethKey}` }
    ];

    for (const item of urls) {
        try {
            console.log(`\n--- Testing ${item.name} ---`);
            console.log(`URL: ${item.url}`);
            const { data } = await axios.get(item.url);
            console.log(`Status: ${data.status}`);
            console.log(`Message: ${data.message}`);
            console.log(`Result Sample: ${JSON.stringify(data.result).slice(0, 200)}...`);
        } catch (err) {
            console.error(`Error ${item.name}: ${err.message}`);
        }
    }
}

testApi();
