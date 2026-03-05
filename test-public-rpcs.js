const axios = require('axios');

async function testPublicRpcs() {
    const rpcs = [
        "https://binance.llamarpc.com",
        "https://bsc.publicnode.com",
        "https://bsc-dataseed1.binance.org"
    ];
    const address = "0x1747aA804c606F43725648d5ccff0B4f2266A1de";
    const usdtContract = "0x55d398326f99059fF775485246999027B3197955";
    const topicFilter = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
    const paddedTo = "0x" + address.replace("0x", "").padStart(64, "0").toLowerCase();

    for (const rpcUrl of rpcs) {
        try {
            console.log(`\n--- Testing RPC: ${rpcUrl} ---`);

            const { data: blockData } = await axios.post(rpcUrl, {
                jsonrpc: "2.0", id: 1, method: "eth_blockNumber", params: []
            });
            const latestBlock = parseInt(blockData.result, 16);
            console.log(`Latest Block: ${latestBlock}`);

            // Try 100 blocks
            const fromBlock = "0x" + (latestBlock - 100).toString(16);

            const { data: logData } = await axios.post(rpcUrl, {
                jsonrpc: "2.0",
                id: 2,
                method: "eth_getLogs",
                params: [{
                    fromBlock: fromBlock,
                    toBlock: "latest",
                    address: usdtContract,
                    topics: [topicFilter, null, paddedTo]
                }]
            });

            if (logData.error) {
                console.log(`RPC Result: Error - ${logData.error.message}`);
            } else {
                console.log(`RPC Result: Success! Found ${logData.result.length} logs.`);
            }
        } catch (err) {
            console.log(`RPC Failed ${rpcUrl}: ${err.message}`);
        }
    }
}

testPublicRpcs();
