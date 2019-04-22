let mongoose = require('mongoose');
const logger = require('../utils/logger');

const mongoUrl = process.env.MONGODB_URL
const collection = process.env.MONGODB_COLLECTION
class Database {
    constructor() {

    }
    async connect() {
        await mongoose.connect(`mongodb://${mongoUrl}/${collection}`)
            .then(() => {
                logger.info(`DB connection successful - ${mongoUrl}/${collection}`)
            })
            .catch(err => {
                logger.error('Database connection error')
            })
        return mongoose.connection;
    }
}


module.exports = new Database();