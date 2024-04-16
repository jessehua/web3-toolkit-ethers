require('dotenv').config({ path: '../.env' })
const { ethers } = require("ethers");
const events = require('events');
const fs = require('fs');
const utils=require('../common/utils');

const eventEmitter = new events.EventEmitter();

const provider = new ethers.JsonRpcProvider(process.env.EtherRpcUrl);

// From which block to start scanning, -1 indicates scanning from the latest block
var currentBlockNumber = -1;

const main = async () => {
    if (currentBlockNumber == -1) {
        currentBlockNumber = await provider.getBlockNumber();
    }
    const currentBlock = await provider.getBlock(currentBlockNumber);
    const txList = currentBlock.transactions;

    console.log('Current block height:' + currentBlockNumber);
    console.log('Current block transaction count:' + txList.length);

    for (let i = 0; i < txList.length; i++) {
        provider.getTransactionReceipt(txList[i]).then((txReceipt) => {
            try {
                // Determine if the transaction is a contract deployment transaction
                if (txReceipt.to == null && txReceipt.contractAddress) {
                    // Determine if the contract is an ERC20 contract
                    utils.isErc20Token(txReceipt.contractAddress, provider).then((erc20Token) => {
                        eventEmitter.emit('Erc20TokenDeployed', erc20Token);
                    }, (error) => {
                        console.log('Determine if the contract is an ERC20 contract exception:' + error);
                    });
                }
            } catch (error) {
                console.log('Determine if the contract is an ERC20 contract exception:' + error);
            }
        });
    }

    currentBlockNumber++;
}

main();
setInterval(main, 15000);

eventEmitter.on('Erc20TokenDeployed', function (erc20Token) {
    const msg = 'Detected ERC20 contract:' + erc20Token.contractAddress + 'contract name:' + erc20Token.name + '，contract symbol:' + erc20Token.symbol + '，contract decimals:' + erc20Token.decimals + '\n';
    console.log(msg);

    fs.appendFile('token.txt', msg, function (error) {
        if (error) {
            console.log('file write exception:' + error);
        }
    });
});

