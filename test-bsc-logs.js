const axios = require('axios');

async function testRpcLogs() {
    const rpcUrl = "https://bsc-dataseed.binance.org/";
    const address = "0x1747aA804c606F43725648d5ccff0B4f2266A1de";
    const usdtContract = "0x55d398326f99059fF775485246999027B3197955";

    // TransferTopic: Transfer(address,address,uint256)
    const topicFilter = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
    // Padded 'to' address
    const paddedTo = "0x" + address.replace("0x", "").padStart(64, "0").toLowerCase();

    try {
        console.log(`\n--- Testing RPC eth_getLogs ---`);

        // Get latest block
        const { data: blockData } = await axios.post(rpcUrl, {
            jsonrpc: "2.0", id: 1, method: "eth_blockNumber", params: []
        });
        const latestBlock = parseInt(blockData.result, 16);
        console.log(`Latest Block: ${latestBlock}`);

        // Scan last 5000 blocks (approx 4 hours)
        const fromBlock = "0x" + (latestBlock - 5000).toString(16);

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
        console.log(`Success! Found ${logs.length} transfers in the last 5000 blocks.`);

        for (const log of logs) {
            const amountRaw = parseInt(log.data, 16);
            const amount = amountRaw / 1e18; // USDT on BSC has 18 decimals
            console.log(`- TX: ${log.transactionHash}, Amount: ${amount} USDT`);
        }

    } catch (err) {
        console.error(`Error RPC: ${err.message}`);
    }
}

testRpcLogs();
