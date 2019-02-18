// this wont execute in web worker
var connection = new JsStore.Instance()
// this will execute in web worker -  jsstore strongly recommend to use web worker
// var connection = new JsStore.Instance(new Worker('jsstore.worker.min.js'));
var dbName = "ApolloTV"
initJsStore()

async function initJsStore() {
    try {
        const isExist = await connection.isDbExist(dbName)
        if (isExist) {
            connection.openDb(dbName)
        } else {
            const Database = getDbStructure()
            connection.createDb(Database)
        }
    } catch(err) {
        console.error(err)
    }
}

function getDbStructure() {
    var tblFavorite = {
        name: 'Favorite',
        columns: [
            {
                name: 'id',
                primaryKey: true,
                dataType: JsStore.DATA_TYPE.Number
            },
            {
                name: 'backdrop_path',
                notNull: true,
                dataType: JsStore.DATA_TYPE.String
            },
            {
                name: 'genre_ids',
                notNull: true,
                dataType: JsStore.DATA_TYPE.Array
            },
            {
                name: 'media_type',
                notNull: true,
                dataType: JsStore.DATA_TYPE.String
            },
            {
                name: 'original_language',
                notNull: true,
                dataType: JsStore.DATA_TYPE.String
            },
            {
                name: 'overview',
                notNull: true,
                dataType: JsStore.DATA_TYPE.String
            },
            {
                name: 'popularity',
                notNull: true,
                dataType: JsStore.DATA_TYPE.Number
            },
            {
                name: 'poster_path',
                notNull: true,
                dataType: JsStore.DATA_TYPE.String
            },
            {
                name: 'vote_average',
                notNull: true,
                dataType: JsStore.DATA_TYPE.Number
            },
            {
                name: 'vote_count',
                notNull: true,
                dataType: JsStore.DATA_TYPE.Number
            },

            // Movie specific fields:

            {
                name: 'adult',
                dataType: JsStore.DATA_TYPE.Boolean
            },
            {
                name: 'original_title',
                dataType: JsStore.DATA_TYPE.String
            },
            {
                name: 'release_date',
                dataType: JsStore.DATA_TYPE.String
            },
            {
                name: 'title',
                dataType: JsStore.DATA_TYPE.String
            },
            {
                name: 'video',
                dataType: JsStore.DATA_TYPE.Boolean
            },

            // TV Specific fields:

            {
                name: 'first_air_date',
                dataType: JsStore.DATA_TYPE.String
            },
            {
                name: 'name',
                dataType: JsStore.DATA_TYPE.String
            },
            {
                name: 'origin_country',
                dataType: JsStore.DATA_TYPE.Array
            },
            {
                name: 'original_name',
                dataType: JsStore.DATA_TYPE.String
            },

        ]
    }
    var Db = {
        name: dbName,
        tables: [tblFavorite]
    }
    return Db
}

async function getFavorite(id) {
    try {
        const results = await connection.select({
            from: 'Favorite',
            limit: 1,
            where: {
                id
            }
        })
        if (results.length === 1) {
            return results[0]
        }
    } catch (err) {
        console.error(err)
    }

    return undefined
}

async function addFavorite(data) {
    try {
        const results = await connection.insert({
            into: 'Favorite',
            values: [data],
            return: true // return the inserted values
        })
        if (results.length === 1) {
            return true
        }
    } catch (err) {
        console.error(err)
    }

    return false
}

async function removeFavorite(id) {
    try {
        const results = await connection.remove({
            from: 'Favorite',
            where: {
                id
            }
        })
        if (results.length === 1) {
            return true
        }
    } catch (err) {
        console.error(err)
    }

    return false
}