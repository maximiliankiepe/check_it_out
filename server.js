const rows = 22;
const cols = 22;

// ---- DB SETUP ----+
r = require('rethinkdb');
const dBName = 'test';
const tableName = 'checkboxes';
// create connection to db
var connection = null;
r.connect({host: 'localhost', port: 28015}, function (err, conn) {
    if (err) throw err;
    connection = conn;


    r.db(dBName).tableList().run(connection, function (err, result) {
        if (err) throw err;
        // create table in db
        if (result.indexOf(tableName) == -1) {
            console.log('create table: ' + tableName);
            r.db(dBName).tableCreate(tableName).run(connection, function (err, res) {
                if (err) throw err;
                // console.log(res);
                resetBoxes();
            });
        } else {
            // if table exist
            console.log('reset table');
            resetBoxes();
        }
    })
});


function resetBoxes() {
    // ---- Reset all the boxes documents in db ----+
    let boxes = [];
    for (var i = 0; i < (cols * rows); i++) {
        boxes.push({x: true, y: i})
    }
    // console.log(boxes);
    // remove all boxes from table
    r.table(tableName).delete().run(connection, function (err, result) {
        if (err) throw err;
        // console.log(JSON.stringify(result, null, 2));
        // save boxes in table
        r.table(tableName).insert(boxes).run(connection, function (err, result) {
            if (err) throw err;
            // console.log(JSON.stringify(result, null, 2));
        })
    })

}

// ---- SOCKET IO SETUP ----+

var express = require('express');
var app = express();
var server = app.listen(3000);
app.use(express.static('public'));

console.log('my socket server is running');
var socket = require('socket.io');
var io = socket(server);
io.sockets.on('connection', newConnection);

function newConnection(socket) {
    // --- On new connection init client with data from the db ----+
    console.log('new connection: ' + socket.id);
    r.table(tableName).run(connection, function (err, cursor) {
        if (err) throw err;
        cursor.toArray(function (err, result) {
            if (err) throw err;
            console.log('init boxes');
            result.map(initBoxes);

            function initBoxes(data) {
                socket.emit('mouse', data);
            }
        });
    });


    // 2) fire function if receive message with name mouse
    socket.on('mouse', mouseMsg);

    function mouseMsg(data) {
        // 3) ---- Update the checkbox status in db and broadcast to other clients ----+
        r.db(dBName).table('checkboxes').filter({y: data.y}).update({x: data.x}).run(connection, function (err, result) {
            if (err) throw err;
            // console.log(JSON.stringify(result, null, 2))
        });

        socket.broadcast.emit('mouse', data);
        console.log(data);
    }

}
