require('dotenv').config({ path: '../.env' })
const { ethers } = require("ethers");
const https = require('https');
const utils = require('../common/utils');

const provider = new ethers.JsonRpcProvider(process.env.EtherRpcUrl);

const uniswapV3ContractAddress = '0x1F98431c8aD98523631AE4a59f267346ea31F984';
const pairCreatedTopic = '0x783cca1c0412dd0d695e784568c96da2e9c22ff989357a2e8b1d9b2b4e6b7118';
const wethContractAddress = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2';
const ethThreshold = 50; // the new pool eth threshold
let startblock = 17350439;
const endblock = 9999999999;
const page = 1;
const offset = 200;

const main = async () => {
    const now = new Date().toLocaleString();
    console.log('starting query:' + now + ',start block num' + startblock);

    const path = `/api?module=logs&action=getLogs&fromBlock=${startblock}&toBlock=${endblock}&address=${uniswapV3ContractAddress}&topic0=${pairCreatedTopic}&page=${page}&offset=${offset}&apikey=${process.env.EtherScanApiKey}`;
    const options = {
        hostname: process.env.EtherScanApiHost,
        port: 443,
        path: path,
        method: 'GET',
        headers: {
            'accept': 'application/json'
        }
    };

    const req = https.request(options, (res) => {
        const buffers = [];
        res.on('data', (chunk) => {
            buffers.push(chunk);
        });

        res.on('end', async () => {
            const data = Buffer.concat(buffers).toString();
            const response = JSON.parse(data);
            const newPoolEventLogs = response.result;
            if (newPoolEventLogs.length == 0) {
                return;
            } else {
                startblock = parseInt(newPoolEventLogs[newPoolEventLogs.length - 1].blockNumber) + 1;
            }

            for (let i = 0; i < newPoolEventLogs.length; i++) {
                const newPoolEventLog = newPoolEventLogs[i];
                let contractAddress = '0x' + newPoolEventLog.topics[1].slice(26);
                if (contractAddress.toLowerCase() == wethContractAddress.toLowerCase()) {
                    contractAddress = '0x' + newPoolEventLog.topics[2].slice(26);
                }
                utils.isErc20Token(contractAddress, provider).then(async (erc20Token) => {
                    const transaction = await provider.getTransaction(newPoolEventLog.transactionHash);
                    const poolInitEthValueStr = ethers.formatUnits(transaction.value, 18);
                    if (Number(poolInitEthValueStr) >= ethThreshold) {
                        const msg = 'detected new UniswapV3 pool, contract address:' + erc20Token.contractAddress + ',name:' + erc20Token.name + ',symbol:' + erc20Token.symbol + '，initial liquidity:' + poolInitEthValueStr + 'ETH';
                        console.log(msg);
                    }
                }).catch((error) => {
                    console.log('determining if the contract is an ERC20 contract exception:' + error);
                });
            }
        });
    });

    req.on('error', (error) => {
        console.error('failed to retrieve historical transaction logs:' + error);
    });

    req.end();
};

main();
setInterval(main, 5 * 60 * 1000);

process.on('uncaughtException', function (err) {
    console.log('exception:' + err);
});