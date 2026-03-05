const axios = require('axios');

async function checkBalance() {
    const address = "0x1747aA804c606F43725648d5ccff0B4f2266A1de";
    const networks = [
        { name: "BSC Mainnet", url: "https://bsc-dataseed.binance.org/", usdt: "0x55d398326f99059fF775485246999027B3197955" },
        { name: "BSC Testnet", url: "https://data-seed-prebsc-1-s1.binance.org:8545/", usdt: "0x337610d27c682E347C9cD60BD4b3b107C9d34dDd" },
        { name: "Polygon Mainnet", url: "https://polygon-rpc.com", usdt: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F" },
        { name: "Ethereum Mainnet", url: "https://eth.llamarpc.com", usdt: "0xdac17f958d2ee523a2206206994597c13d831ec7" }
    ];

    for (const net of networks) {
        try {
            console.log(`\n--- Checking ${net.name} ---`);

            // Native Balance
            const { data: balData } = await axios.post(net.url, {
                jsonrpc: "2.0", id: 1, method: "eth_getBalance", params: [address, "latest"]
            });
            const balanceWei = BigInt(balData.result || "0x0");
            const balanceNative = Number(balanceWei) / 1e18;
            console.log(`Native Balance: ${balanceNative}`);

            // USDT Balance
            const paddedAddress = address.toLowerCase().replace("0x", "").padStart(64, "0");
            const dataCall = "0x70a08231" + paddedAddress;
            const { data: usdtData } = await axios.post(net.url, {
                jsonrpc: "2.0", id: 2, method: "eth_call", params: [{ to: net.usdt, data: dataCall }, "latest"]
            });
            const usdtWei = BigInt(usdtData.result || "0x0");
            const decimals = net.name === "Polygon Mainnet" || net.name === "Ethereum Mainnet" ? 6 : 18;
            const usdtBalance = Number(usdtWei) / Math.pow(10, decimals);
            console.log(`USDT Balance: ${usdtBalance}`);

        } catch (err) {
            console.log(`Error on ${net.name}: ${err.message}`);
        }
    }
}

checkBalance();
