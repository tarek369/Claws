'use strict';

// Load providers
const {providers, queue} = require('../scrapers/providers');
const RequestPromise = require('request-promise');
var events = require('kue/lib/queue/events');

const BaseProvider = require('../scrapers/providers/BaseProvider');

/**
 * Sends the current time in milliseconds.
 */
const sendInitialStatus = (sse) => sse.send({ data: [`${new Date().getTime()}`], event: 'status'}, 'result');

/**
 * Return request handler for certain media types.
 * @param data media query
 * @param ws web socket
 * @param req request
 * @return {Function}
 */
const resolveLinks = async (searchData, ws, req) => {
    const type = searchData.type;
    const sse = {
        send: (resultData) => {
            try {
                ws.send(JSON.stringify(resultData));
            } catch (err) {
                console.log("WS client disconnected, can't send data");
            }
        },
        stopExecution: false
    };

    sendInitialStatus(sse);

    ws.on('close', () => {
        sse.stopExecution = true;
    });

    const promises = [];

    req.query = searchData;

    // Get available providers.
    let availableProviders = [...providers[type], ...providers.universal];

    // Add anime providers if Anime tag sent from client. 
    // TODO: Add and send this tag from the client
    if (type === 'anime') {
        availableProviders.push([...providers.anime]);
    }

    availableProviders.forEach((provider) => {
            return promises.push(provider.resolveRequests(req, sse));
    });

    queue.process('request', async function (job, done) {
        try {
            const data = await RequestPromise(job.data.rp)
            done(null, data)
        } catch (err) {
            console.log(err)
            done(err, null)
        }

    })

    await Promise.all(promises);

    sse.send({event: 'done'}, 'done');
};

module.exports = resolveLinks;
