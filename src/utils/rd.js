
const RequestPromise = require('request-promise');
const logger = require('./logger');

class RD {
    constructor() { };

    async getRDRegexList() {
        this.regexList = JSON.parse(await RequestPromise("https://api.real-debrid.com/rest/1.0/hosts/regex"));
    }

    isSupportedByRD(link) {
        for (let regexString of this.regexList) {
            regexString = regexString.substring(1, regexString.length - 1);
            let regex = new RegExp(regexString);
            if (regex.test(link)) {
                return true;
            }
        }
        return false;
    }
}

const instance = new RD()

module.exports.rd = instance;