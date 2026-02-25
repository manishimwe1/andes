const axios = require('axios');

async function checkActivity() {
    const address = "0x1747aA804c606F43725648d5ccff0B4f2266A1de";
    const rpcUrl = "https://bsc.publicnode.com";

    try {
        console.log(`\n--- Checking Activity for ${address} ---`);

        // 1. Transaction count (nonce)
        const { data: nonceData } = await axios.post(rpcUrl, {
            jsonrpc: "2.0", id: 1, method: "eth_getTransactionCount", params: [address, "latest"]
        });
        const nonce = parseInt(nonceData.result, 16);
        console.log(`Transaction Count (Nonce): ${nonce}`);

        // 2. eth_getLogs for ANY transfer in the last 100,000 blocks
        const { data: blockData } = await axios.post(rpcUrl, {
            jsonrpc: "2.0", id: 2, method: "eth_blockNumber", params: []
        });
        const latestBlock = parseInt(blockData.result, 16);
        const fromBlock = "0x" + (latestBlock - 100000).toString(16);

        const topicFilter = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
        const paddedAddress = "0x" + address.replace("0x", "").padStart(64, "0").toLowerCase();

        // Check INCOMING to the address
        console.log(`Scanning last 100,000 blocks for incoming transfers...`);
        const { data: incomingData } = await axios.post(rpcUrl, {
            jsonrpc: "2.0",
            id: 3,
            method: "eth_getLogs",
            params: [{
                fromBlock,
                toBlock: "latest",
                topics: [topicFilter, null, paddedAddress]
            }]
        });

        if (incomingData.error) {
            console.log(`Incoming Scan: Error - ${incomingData.error.message}`);
        } else {
            console.log(`Incoming Scan: Found ${incomingData.result.length} logs.`);
            incomingData.result.forEach(log => {
                console.log(`- Incoming TX: ${log.transactionHash} (Block: ${parseInt(log.blockNumber, 16)})`);
            });
        }

        // Check OUTGOING from the address
        console.log(`\nScanning last 100,000 blocks for outgoing transfers...`);
        const { data: outgoingData } = await axios.post(rpcUrl, {
            jsonrpc: "2.0",
            id: 4,
            method: "eth_getLogs",
            params: [{
                fromBlock,
                toBlock: "latest",
                topics: [topicFilter, paddedAddress, null]
            }]
        });

        if (outgoingData.error) {
            console.log(`Outgoing Scan: Error - ${outgoingData.error.message}`);
        } else {
            console.log(`Outgoing Scan: Found ${outgoingData.result.length} logs.`);
        }

    } catch (err) {
        console.error(`Error: ${err.message}`);
    }
}

checkActivity();
