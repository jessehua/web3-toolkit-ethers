require('dotenv').config({ path: '../.env' })
const https = require('https');
const utils = require('../common/utils');

const address = '0xd4b69e8d62c880e9dd55d419d5e07435c3538342'; // smart money wallet address
const addressName = 'DWF';
let startblock = 17231043;
const endblock = 9999999999;
const page = 1;
const offset = 200;
const sort = 'desc';

const main = async () => {
    const now = new Date().toLocaleString();
    console.log('Begin query transaction records：' + now + '，start block number：' + startblock);

    const path = `/api?module=account&action=tokentx&address=${address}&page=${page}&offset=${offset}&startblock=${startblock}&endblock=${endblock}&sort=${sort}&apikey=${process.env.EtherScanApiKey}`;
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

        res.on('end', () => {
            const data = Buffer.concat(buffers).toString();
            const response = JSON.parse(data);
            const transactions = response.result;
            if (transactions.length == 0) {
                return;
            } else {
                startblock = Number(transactions[0].blockNumber) + 1;
            }

            for (let i = 0; i < transactions.length; i++) {
                const transaction = transactions[i];
                const tokenSymbol = transaction.tokenSymbol;
                if (tokenSymbol == 'USDT' || tokenSymbol == 'USDC' || tokenSymbol == 'WETH' || tokenSymbol == 'ETH') {
                    continue;
                }

                const formatUnits = utils.formatTokenCount(transaction.value, transaction.tokenDecimal);
                const transactionDate = new Date(Number(transaction.timeStamp) * 1000).toLocaleString();
                const contractAddress = transaction.contractAddress;

                let action = null;
                let message = null;
                if (transaction.to == address) {
                    action = 'buy';

                    const sellTransactions = transactions.filter(temp => temp.from == address && temp.to == transaction.from && temp.blockNumber == transaction.blockNumber && temp.hash == transaction.hash);
                    if (sellTransactions.length == 0) {
                        continue;
                    }

                    const sellTokenSymbol = sellTransactions[0].tokenSymbol;
                    const sellFormatUnits = utils.formatTokenCount(sellTransactions[0].value, sellTransactions[0].tokenDecimal);

                    message = `【${tokenSymbol}】：${addressName} at ${transactionDate}${action}${tokenSymbol} ${formatUnits}，cost ${sellTokenSymbol} ${sellFormatUnits}，contract address：${contractAddress}`;
                } else {
                    action = 'sell';
                    message = `【${tokenSymbol}】：${addressName} at ${transactionDate}${action}${tokenSymbol} ${formatUnits}`;
                }

                console.log(message);
            }
        });
    });

    req.on('error', (error) => {
        console.error('failed to retrieve historical transaction records：' + error);
    });

    req.end();
};

main();
setInterval(main, 5 * 60 * 1000);
