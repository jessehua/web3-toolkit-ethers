require('dotenv').config({ path: '../.env' })
const { ethers } = require("ethers");
const utils = require("../common/utils");

const provider = new ethers.JsonRpcProvider(process.env.EtherRpcUrl);

// ERC20 token contract address
const contractAddress = '0x5b68e1c25e0e4f3c70871745593a115f51e60c79';

const main = async () => {
    try {
        const erc20Token = await utils.isErc20Token(contractAddress, provider);
        if (erc20Token && erc20Token.isErc20) {
            console.log(erc20Token);
            const contract = new ethers.Contract(contractAddress, utils.erc20Abi, provider);
            contract.on("Transfer", (from, to, amount, event) => {
                const amountStr = ethers.formatUnits(amount, erc20Token.decimals);
                const message = `【${tokenSymbol}】：${from} => ${to}: ${amountStr}`;

                console.log(message);
            });
        }
    } catch (error) {
        console.log('event monitoring exception:' + error);
    }
};

main();
