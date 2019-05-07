
const kue = require('kue');
const RequestPromise = require('request-promise');
const cloudscraper = require('cloudscraper');
const logger = require('./logger');
const constants = require('./constants');
const { handleRequestError } = require('./errors');

class Queue {
    constructor() {
        this.isEnabled = false;
        this.logger = logger;

        if (process.env.ENABLE_QUEUE === 'true') {
            logger.debug('Kue enabled - Using queue to resolve requests')
            this.queue = kue.createQueue();
            this.isEnabled = true;
            if (process.env.ENABLE_KUE_UI === 'true') {
                kue.app.listen(process.env.KUE_UI_PORT || 3001);
            }
        }
    }

    process() {
        logger.debug(`Queue Processing Started`)
        this.queue.process(constants.QUEUE_JOB_TYPES.CF_BYPASS, process.env.QUEUE_ACTIVE_JOB_NUMBER || 1, async function (job, done) {
            try {
                const data = await cloudscraper(job.data.request)
                done(null, data)
            } catch (err) {
                handleRequestError(err, true, 'queue.js - CF Bypass Request');
                done(err, null)
            }
        });
        this.queue.process(constants.QUEUE_JOB_TYPES.NON_CF, process.env.QUEUE_ACTIVE_JOB_NUMBER || 1, async function (job, done) {
            try {
                const data = await RequestPromise(job.data.request)
                done(null, data)
            } catch (err) {
                handleRequestError(err, true, 'queue.js - Non CF Bypass Request');
                done(err, null)
            }
        });
    }

    submit(jobDetails) {
        let job = this.queue.create(jobDetails.name, { request: jobDetails.job.request, title: jobDetails.title })
            .attempts(process.env.QUEUE_MAX_RETRIES || 3)
            .removeOnComplete(true)
            .backoff(true)
            .ttl(process.env.KUE_JOB_TTL);
        job.save();
        return job;
    }
}

const instance = new Queue()

module.exports.queue = instance;