require('dotenv').config({ path: '../.env' })
const { ethers } = require("ethers");
const events = require('events');
const utils = require("../common/utils");

const eventEmitter = new events.EventEmitter();

const provider = new ethers.JsonRpcProvider(process.env.EtherRpcUrl);

// user wallet address
const tokenHolderAddress = '0xAd433593058311eD806717FA03Ec96045f94546F';
// ERC20 token contract address,using Pepe token as an example
const contractAddress = '0x6982508145454ce325ddbe47a25d4ec3d2311933';
// the balance from the last query
var previousBalance = null;

const main = async () => {
    try {
        const erc20Token = await utils.isErc20Token(contractAddress, provider);
        if (erc20Token && erc20Token.isErc20) {
            const contract = new ethers.Contract(contractAddress, utils.erc20Abi, provider);

            const balance = await contract.balanceOf(tokenHolderAddress);
            const balanceStr = ethers.formatUnits(balance, erc20Token.decimals);
            const now = new Date();
            console.log('wallet address:', tokenHolderAddress, now.toLocaleString(), 'holding', erc20Token.symbol, 'the total amount of ', balanceStr);

            if (previousBalance == null) {
                previousBalance = balance;
            } else {
                if (balance != previousBalance) {
                    eventEmitter.emit('BalanceChange', balance, previousBalance, erc20Token);
                }

                previousBalance = balance;
            }
        }
    } catch (error) {
        console.log('balance query exception:' + error);
    }
};

main();
setInterval(main, 10 * 60 * 1000);

eventEmitter.on('BalanceChange', (balance, previousBalance, erc20Token) => {
    let message = null;
    let balanceChangeValue = balance - previousBalance;
    let formatUnits = Number(balanceChangeValue) / (10 ** Number(erc20Token.decimals));
    if (balance > previousBalance) {
        message = 'wallet address:' + tokenHolderAddress + ' holding ' + erc20Token.symbol + ' the total amount has increased by: ' + utils.formatNumber(formatUnits);
    } else if (balance < previousBalance) {
        message = 'wallet address:' + tokenHolderAddress + ' holding ' + erc20Token.symbol + 'The total amount has decreased by:' + utils.formatNumber(-1 * formatUnits);
    }
    
    console.log(message);
});
