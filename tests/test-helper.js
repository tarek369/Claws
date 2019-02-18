const fs = require('fs');
const path = require('path');

function readTestAsset(file, prefix = './resources/') {
    let filePath = path.resolve(__dirname, prefix, file);
    return fs.readFileSync(filePath, 'utf8');
}

module.exports = {
    readTestAsset,
};