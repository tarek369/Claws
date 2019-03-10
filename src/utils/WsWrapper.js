const RequestPromise = require('request-promise');
const tough = require('tough-cookie');
const ffprobe = require('ffprobe');
const ffprobeStatic = require('ffprobe-static');

class WsWrapper {
    constructor(ws, options) {
        this.ws = ws;
        this.options = options;

        this.stopExecution = false
        this.rp = RequestPromise.defaults(target => {
            if (this.stopExecution) {
                return null;
            }

            return RequestPromise(target);
        })

        this.sentLinks = [];
    }

    async send(resultData) {
        if (this.shouldSend(resultData)) {
            await this.setHeadInfo(resultData);
            // await this.setMetaInfo(resultData);
            try {
                this.ws.send(JSON.stringify(resultData));
                this.sentLinks.push(resultData.file.data);
            } catch (err) {
                console.log("WS client disconnected, can't send data");
            }
        }
    }

    shouldSend(resultData) {
        if (resultData.event === 'result') {
            return !this.sentLinks.includes(resultData.file.data);
        } else {
            return !this.sentLinks.includes(resultData.target);
        }
    }

    async setHeadInfo(resultData) {
        if (resultData.event === 'result') {
            const jar = this.rp.jar();
            const headers = resultData.headers || {};

            if (resultData.metadata.cookie) {
                const splitCookie = resultData.metadata.cookie.split('=');
                const cookie = new tough.Cookie({
                    key: splitCookie[0],
                    value: splitCookie[1]
                });
                jar.setCookie(cookie, resultData.file.data);
            }

            try {
                const response = await this.rp({
                    uri: resultData.file.data,
                    method: 'HEAD',
                    headers,
                    jar,
                    resolveWithFullResponse: true,
                    timeout: 5000
                });

                // resultData.metadata.fileSize = response.headers['content-length'];
                resultData.file.kind = response.headers['content-type'];
                resultData.metadata.isDownload = response.headers['accept-ranges'] !== 'bytes';
            } catch(err) {
                logger.error(err);
            }
        }
        return resultData;
    }

    async setFileInfo(resultData) {
        if (resultData.event === 'result') {
            const jar = this.rp.jar();
            const headers = resultData.headers || {};

            if (resultData.metadata.cookie) {
                const splitCookie = resultData.metadata.cookie.split('=');
                const cookie = new tough.Cookie({
                    key: splitCookie[0],
                    value: splitCookie[1]
                });
                jar.setCookie(cookie, resultData.file.data);
            }

            try {
                const response = await ffprobe({
                    uri: resultData.file.data,
                    method: 'HEAD',
                    headers,
                    jar,
                    resolveWithFullResponse: true,
                    timeout: 5000
                }, {path: ffprobeStatic.path});

                // resultData.metadata.fileSize = response.headers['content-length'];
                resultData.file.kind = response.headers['content-type'];
                resultData.metadata.isDownload = response.headers['accept-ranges'] !== 'bytes';
            } catch(err) {
                logger.error(err);
            }
        }
        return resultData;
    }
}


module.exports = exports = WsWrapper;