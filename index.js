'use strict';

var
  express = require('express'),
  app = express(),
  server = require('http').createServer(app),
  zmq = require('zmq'),
  io = require('socket.io').listen(server, {log: false}),
  controller = {
    player1: {y: 0},
    player2: {y: 0},
  },
  clients = [];

// === config
app.use(express.static(__dirname + '/public'));

// === WIIMOTE SUBSCRIBER
function buildSubscriber(address) {
  var subscriber = zmq.socket('sub');

  subscriber.subscribe('');

  subscriber.on('message', function(data) {
    var
      msg = JSON.parse(data.toString()),
      controllerPointer = controller['player'+msg.nunchuck];

    console.log('> DATA FOR [controller '+msg.nunchuck+']', msg);

    if (msg.y > 0 && controllerPointer.y < 100) {
      controllerPointer.y++;
    } else if (msg.y < 0 && controllerPointer.y > -100) {
      controllerPointer.y--;
    }

  });

  subscriber.connect(address);

  return subscriber;
}

// === bind client connection pool
io.sockets.on('connection', function(socket) {
  console.log('---> a client has connected...');

  var id;

  if (!clients[1]) {
    id = 1;
  } else if (!clients[2]) {
    id = 2;
  } else {
    socket.emit('maxplayers', {});
    return false;
  }

  clients[id] = socket;
  socket.emit('playerid', {id: id});
  socket.on('disconnect', function() {
    clients.splice(id-1, 1);
  });
});

// === build wiimote subscribers
//buildSubscriber('tcp://192.168.109.137:9000');
//buildSubscriber('tcp://192.168.109.137:9001');

// demo /test
var direction = -1,
    speed = 1;
setInterval(function() {
  for (var player in controller) {
    if (direction > 0 && controller[player].y < 80) {
      controller[player].y += direction * speed;
    } else if (direction < 0 && controller[player].y > -80) {
      controller[player].y += direction * speed;
    }

    if (controller[player].y > 80) controller[player].y = 80;
    if (controller[player].y < -80) controller[player].y = -80;
  }
}, 1);
setInterval(function() {
  direction = Math.random() * 2 - 1;
}, 500);

// === spray data to clients
setInterval(function() {
  clients.forEach(function(client) {
    client.emit('player', controller.player1);
    client.emit('opponent', controller.player2);
  });
}, 1);

// === start server
server.listen(3000);
console.log('Server started ---> listening on [localhost:3000]');
