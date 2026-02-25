const axios = require('axios');

async function testAnkr() {
    const rpcUrl = "https://rpc.ankr.com/bsc";
    const address = "0x1747aA804c606F43725648d5ccff0B4f2266A1de";
    const usdtContract = "0x55d398326f99059fF775485246999027B3197955";

    const topicFilter = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
    const paddedTo = "0x" + address.replace("0x", "").padStart(64, "0").toLowerCase();

    try {
        console.log(`\n--- Testing Ankr RPC eth_getLogs ---`);

        const { data: blockData } = await axios.post(rpcUrl, {
            jsonrpc: "2.0", id: 1, method: "eth_blockNumber", params: []
        });
        const latestBlock = parseInt(blockData.result, 16);
        console.log(`Latest Block: ${latestBlock}`);

        // Some nodes only allow 1000 blocks
        const fromBlock = "0x" + (latestBlock - 1000).toString(16);

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
            console.error(`RPC Error: ${logData.error.message}`);
            return;
        }

        const logs = logData.result;
        console.log(`Success! Found ${logs.length} transfers in the last 1000 blocks.`);

        for (const log of logs) {
            const amountRaw = BigInt(log.data);
            const amount = Number(amountRaw) / 1e18;
            console.log(`- TX: ${log.transactionHash}, Amount: ${amount} USDT`);
        }

    } catch (err) {
        console.error(`Error RPC: ${err.message}`);
    }
}

testAnkr();
