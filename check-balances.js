const axios = require('axios');

async function checkBalance() {
    const address = "0x1747aA804c606F43725648d5ccff0B4f2266A1de";
    const rpcs = [
        { name: "Mainnet", url: "https://bsc-dataseed.binance.org/" },
        { name: "Testnet", url: "https://data-seed-prebsc-1-s1.binance.org:8545/" }
    ];

    for (const rpc of rpcs) {
        try {
            console.log(`\n--- Checking ${rpc.name} ---`);
            const { data } = await axios.post(rpc.url, {
                jsonrpc: "2.0", id: 1, method: "eth_getBalance", params: [address, "latest"]
            });
            const balanceWei = BigInt(data.result || "0x0");
            const balanceBnb = Number(balanceWei) / 1e18;
            console.log(`Balance: ${balanceBnb} BNB`);

            // Also check USDT balance
            const usdtContract = rpc.name === "Mainnet"
                ? "0x55d398326f99059fF775485246999027B3197955"
                : "0x337610d27c682E347C9cD60BD4b3b107C9d34dDd";

            const paddedAddress = address.toLowerCase().replace("0x", "").padStart(64, "0");
            const dataCall = "0x70a08231" + paddedAddress;

            const { data: usdtData } = await axios.post(rpc.url, {
                jsonrpc: "2.0", id: 2, method: "eth_call", params: [{ to: usdtContract, data: dataCall }, "latest"]
            });
            const usdtWei = BigInt(usdtData.result || "0x0");
            const usdtBalance = Number(usdtWei) / 1e18;
            console.log(`USDT Balance: ${usdtBalance}`);

        } catch (err) {
            console.error(`Error ${rpc.name}: ${err.message}`);
        }
    }
}

checkBalance();
