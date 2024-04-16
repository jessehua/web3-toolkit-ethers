require('dotenv').config({ path: '../.env' })
const https = require('https');

function getContractSourceCode(contractAddress, callback) {
    const path = `/api?module=contract&action=getsourcecode&address=${contractAddress}&apikey=${process.env.EtherScanApiKey}`;

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
            if (response.status == '1' && response.message == 'OK') {
                callback(response.result[0]);
            }
        });
    });

    req.on('error', (error) => {
        console.error('failed to retrieve contract source code:' + error);
    });

    req.end();
}

module.exports = { getContractSourceCode };


