
const RequestPromise = require('request-promise');

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

    async getHostList() {
        this.hostList = JSON.parse(await RequestPromise("https://api.real-debrid.com/rest/1.0/hosts"));
    }

    getHostName(link) {
        for (let host in this.hostList) {
            if (host && link.includes(host)) {
                const splitNames = this.hostList[host].name.split(' / ');
                return splitNames[0];
            }
        }
        return 'RD';
    }
}

const instance = new RD()

module.exports.rd = instance;