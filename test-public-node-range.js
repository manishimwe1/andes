const axios = require('axios');

async function testPublicNode() {
    const rpcUrl = "https://bsc.publicnode.com";
    const address = "0x1747aA804c606F43725648d5ccff0B4f2266A1de";
    const usdtContract = "0x55d398326f99059fF775485246999027B3197955";
    const topicFilter = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
    const paddedTo = "0x" + address.replace("0x", "").padStart(64, "0").toLowerCase();

    const ranges = [1000, 5000, 10000];

    for (const range of ranges) {
        try {
            console.log(`\n--- Testing Range: ${range} blocks ---`);

            const { data: blockData } = await axios.post(rpcUrl, {
                jsonrpc: "2.0", id: 1, method: "eth_blockNumber", params: []
            });
            const latestBlock = parseInt(blockData.result, 16);
            const fromBlock = "0x" + (latestBlock - range).toString(16);

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
                console.log(`Result: Error - ${logData.error.message}`);
            } else {
                console.log(`Result: Success! Found ${logData.result.length} logs in ${range} blocks.`);
            }
        } catch (err) {
            console.log(`Failed: ${err.message}`);
        }
    }
}

testPublicNode();
