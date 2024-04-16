const { ethers } = require("ethers");

const erc20Abi = [
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)",
    "function totalSupply() view returns (uint256)",
    "function balanceOf(address account) view returns (uint256)",
    "function transfer(address recipient, uint256 amount) returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function transferFrom(address sender, address recipient, uint256 amount) returns (bool)",
    "event Transfer(address indexed from, address indexed to, uint256 value)",
    "event Approval(address indexed owner, address indexed spender, uint256 value)"
];

async function isErc20Token(contractAddress, provider) {
    const contract = new ethers.Contract(contractAddress, erc20Abi, provider);

    const name = await contract.name();
    const symbol = await contract.symbol();
    const decimals = await contract.decimals();

    const isErc20 =
        typeof name === "string" &&
        typeof symbol === "string" &&
        (typeof decimals === "number" || typeof decimals === 'bigint') &&
        contract.interface.getEvent('Transfer') !== null &&
        contract.interface.getEvent('Approval') !== null;

    return { isErc20, contractAddress, name, symbol, decimals };
}

// format numbers with suffixes of k, m, and b
const formatNumber = (num) => {
    const units = ["", "k", "m", "b", "t"];
    let unitIndex = 0;
    while (num >= 1000 && unitIndex < units.length - 1) {
        num /= 1000;
        unitIndex++;
    }

    return num.toFixed(2) + units[unitIndex];
};

// format the quantity of tokens
const formatTokenCount = (num, decimals) => {
    const formatUnits = Number(num) / (10 ** Number(decimals))
    return formatNumber(formatUnits);
};

module.exports = {
    erc20Abi,
    isErc20Token,
    formatNumber,
    formatTokenCount
}