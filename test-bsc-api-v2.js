const axios = require('axios');

async function testApi() {
    const apiKey = "K9VMVGP37V727I7FJPPQENUZFRF9N7MXAR";
    const address = "0x1747aA804c606F43725648d5ccff0B4f2266A1de";

    const urls = [
        { name: "BscScan Mainnet V1", url: `https://api.bscscan.com/api?module=account&action=tokentx&address=${address}&page=1&offset=10&sort=desc&apikey=${apiKey}` },
        { name: "BscScan Testnet V1", url: `https://api-testnet.bscscan.com/api?module=account&action=tokentx&address=${address}&page=1&offset=10&sort=desc&apikey=${apiKey}` },
        { name: "Etherscan V2 (Chain 56)", url: `https://api.etherscan.io/v2/api?chainid=56&module=account&action=tokentx&address=${address}&page=1&offset=10&sort=desc&apikey=${apiKey}` },
        { name: "Etherscan V2 (Chain 97)", url: `https://api.etherscan.io/v2/api?chainid=97&module=account&action=tokentx&address=${address}&page=1&offset=10&sort=desc&apikey=${apiKey}` },
    ];

    for (const item of urls) {
        try {
            console.log(`\n--- Testing ${item.name} ---`);
            const { data } = await axios.get(item.url);
            console.log(`Status: ${data.status}`);
            console.log(`Message: ${data.message}`);
            console.log(`Result: ${JSON.stringify(data.result).slice(0, 150)}`);
        } catch (err) {
            console.error(`Error ${item.name}: ${err.message}`);
        }
    }
}

testApi();
