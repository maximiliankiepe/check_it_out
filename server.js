// ---- Settings ----+
const rows = 22;
const cols = 22;
const reset = true;  // If true -> boxes get reset on server start.

// ---- DB SETUP ----+
r = require('rethinkdb');
const dBName = 'test';
const tableName = 'checkboxes';

// Create a connection to the database.
let connection = null;
r.connect({host: 'localhost', port: 28015}, function (err, conn) {
    if (err) throw err;
    connection = conn;

    r.db(dBName).tableList().run(connection, function (err, result) {
        if (err) throw err;

        // If table does not exist -> create table in db
        if (result.indexOf(tableName) === -1) {
            console.log('Create table: ' + tableName);
            r.db(dBName).tableCreate(tableName).run(connection, function (err, res) {
                if (err) throw err;
                resetBoxes();
            });
        } else {
            // if table exist
            if (reset === true) {
                console.log('Reset table: ' + tableName);
                resetBoxes();
            }
        }
    })
});


function resetBoxes() {
    // ---- Reset all boxes in db ----+
    let boxes = [];
    for (let i = 0; i < (cols * rows); i++) {
        boxes.push({x: true, y: i})
    }
    // remove all boxes from table
    r.table(tableName).delete().run(connection, function (err, result) {
        if (err) throw err;
        // save boxes in table
        r.table(tableName).insert(boxes).run(connection, function (err, result) {
            if (err) throw err;
        })
    })
}

// ---- SOCKET IO SETUP ----+
let express = require('express');
let app = express();
let server = app.listen(3000);
app.use(express.static('public'));

console.log('My socket server is running');
let socket = require('socket.io');
let io = socket(server);
io.sockets.on('connection', onNewConnection);

function onNewConnection(socket) {
    // --- 1) On new connection, init client with data from the db. ----+
    console.log('New connection: ' + socket.id);
    r.table(tableName).run(connection, function (err, cursor) {
        if (err) throw err;
        cursor.toArray(function (err, result) {
            if (err) throw err;
            console.log('Initialize boxes for socket: ' + socket.id);
            result.map(initBoxes);

            function initBoxes(data) {
                socket.emit('mouse', data);
            }
        });
    });


    // ---- 2) On message from client -> fire function. ----+
    socket.on('mouse', mouseMsg);

    function mouseMsg(data) {
        // ---- 3) Update the checkbox status in db ----+
        r.db(dBName).table('checkboxes').filter({y: data.y}).update({x: data.x}).run(connection, function (err, result) {
            if (err) throw err;

            // 4) ---- Broadcast update to other clients ----+
            console.log(data);
            socket.broadcast.emit('mouse', data);
        });
    }
}
