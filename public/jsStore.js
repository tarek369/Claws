// this wont execute in web worker
// var connection = new JsStore.Instance();
// this will execute in web worker -  jsstore strongly recommend to use web worker
var connection = new JsStore.Instance(new Worker('jsstore.worker.min.js'));
var dbName = "ApolloTV";
initJsStore();

async function initJsStore() {
    try {
        const isExist = await connection.isDbExist(dbName)
        if (isExist) {
            connection.openDb(dbName);
        } else {
            const Database = getDbStructure();
            connection.createDb(Database);
        }
    } catch(err) {
        console.error(err);
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
    };
    var Db = {
        name: dbName,
        tables: [tblFavorite]
    }
    return Db;
}

function addItem() {
    var tableFirstRow = $(this).parents().eq(1);
    var value = {
        itemName: tableFirstRow.find('td:nth-child(1) input').val(),
        price: Number(tableFirstRow.find('td:nth-child(2) input').val()),
        // datatype is number
        quantity: Number(tableFirstRow.find('td:nth-child(3) input').val())
    };
    connection.insert({
        into: 'Product',
        values: [value],
        return: true // return the inserted values
    }).then(function(values) {
        if (values.length > 0) {
            addRows(values);
            alert('successfully added');
            clearItem();
        }
    }).catch(function(err) {
        console.log(err);
        alert(err.message);
    });
}

function addRows(values) {
    var table = $('#tblGrid tbody');
    var tableRow;

    values.forEach(function(value) {
        tableRow = "<tr data-id=" + value.id + "></td><td>" + value.itemName + "</td><td>" + value.price +
        "</td><td>" + value.quantity + "</td><td>" + "<button class='btn-edit'>Edit</button>" +
        "</td><td>" + "<button class='btn-delete'>Delete</button>" + "</td></tr>";
        table.append(tableRow);
    })
}

function clearItem() {
    var tableFirstRow = $('#tblGrid tbody tr:first-child');
    tableFirstRow.find('td:nth-child(1) input').val('');
    tableFirstRow.find('td:nth-child(2) input').val('');
    tableFirstRow.find('td:nth-child(3) input').val('');
}

function selectAll() {
    connection.select({
        from: 'Product'
    }).
    then(function(results) {
        addRows(results);
    }).catch(function(err) {
        console.log(err);
        alert(err.message);
    });
}

function deleteItem() {
    var row = $(this).parents().eq(1);
    var id = Number(row.attr('data-id'));

    connection.remove({
        from: 'Product',
        where: {
            id: id
        }
    }).then(function(rowsDeleted) {
        if (rowsDeleted > 0) {
            //remove the row from table
            row.remove();
        }
    }).catch(function(err) {
        console.log(err);
        alert(err.message);
    });
}

function cancelEdit() {
    var row = $(this).parents().eq(1);
    var value = {
        id: Number(row.attr('data-id')),
        itemName: row.find('td:nth-child(1) input').val(),
        price: Number(row.find('td:nth-child(2) input').val()),
        quantity: Number(row.find('td:nth-child(3) input').val())
    };

    row.html("<td>" + value.itemName +
        "</td><td>" + value.price +
        "</td><td>" + value.quantity + "</td><td>" +
        "<button class='btn-edit'>Edit</button>" +
        "</td><td>" + "<button class='btn-delete'>Delete</button>" + "</td>");
}

function editItem() {
    //here you can get the data from table directly but i am gonna use select api.
    var row = $(this).parents().eq(1);
    var id = Number(row.attr('data-id'));
    var createTextBox = function(val) {
        return '<input type="text" value=' + val + '>';
    }
    connection.select({
        from: 'Product',
        where: {
            id: id
        }
    }).then(function(results) {
        var value = results[0];
        row.html("<td>" + createTextBox(value.itemName) +
            "</td><td>" + createTextBox(value.price) +
            "</td><td>" + createTextBox(value.quantity) + "</td><td>" +
            "<button class='btn-update'>Update</button>" +
            "</td><td>" + "<button class='btn-editCancel'>Cancel</button>" + "</td>"
            );
    }).catch(function(err) {
        console.log(err);
        alert(err.message);
    });
}

function updateItem() {
    var row = $(this).parents().eq(1),
    value = {
        id: Number(row.attr('data-id')),
        itemName: row.find('td:nth-child(1) input').val(),
        price: Number(row.find('td:nth-child(2) input').val()),
        quantity: Number(row.find('td:nth-child(3) input').val())
    };
    connection.update({ in: 'Product',
        where: {
            id: value.id
        },
        set: {
            itemName: value.itemName,
            price: value.price,
            quantity: value.quantity
        }
    }).then(function(rowsUpdated) {
        if (rowsUpdated > 0) {
            row.html("<td>" + value.itemName +
                "</td><td>" + value.price +
                "</td><td>" + value.quantity + "</td><td>" +
                "<button class='btn-edit'>Edit</button>" +
                "</td><td>" + "<button class='btn-delete'>Delete</button>" + "</td>");
        }
    }).catch(function(err) {
        console.log(err);
        alert(err.Message);
    });
}
