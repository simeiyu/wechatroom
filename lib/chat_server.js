const socketio = require('socket.io');
let io;
let guestNumber = 1;
const nickNames = {};
const namesUsed = [];
const currentRoom = {};

function assignGuestName(socket, guestNumber, nickNames, namesUsed) {
  const name = 'Guest' + guestNumber;
  nickNames[socket.id] = name;
  socket.emit('nameResult', {
    success: true,
    name: name
  });
  namesUsed.push(name);
  return guestNumber + 1;
}

function joinRoom(socket, room) {
  socket.join(room);
  currentRoom[socket.id] = room;
  socket.emit('joinResult', { room: room });
  socket.broadcast.to(room).emit('message', {
    text: nickNames[socket.id] + ' has joined ' + room + '.'
  });

  // 确定有哪些用户在这个房间
  const usersInRoom = io.sockets.adapter.rooms.get(room);
  if (usersInRoom.size > 1) {
    let usersInRoomSummary = 'Users currently in ' + room + ':';
    usersInRoom.forEach(function(item) {
      if (item !== socket.id) {
        usersInRoomSummary += ' ' + nickNames[item];
      }
    })
    socket.emit('message', { text: usersInRoomSummary });
  }
}

function handleMessageBroadcasting(socket, nickNames) {
  socket.on('message', function (message) {
    socket.broadcast.to(message.room).emit('message', {
      text: nickNames[socket.id] + ': ' + message.text
    })
  })
}

function handleNameChangeAttempts(socket, nickNames, namesUsed) {
  socket.on('nameAttempt', function (name) {
    if (name.indexOf('Guest') == 0) {
      socket.emit('nameResult', {
        success: false,
        message: 'Names cannot begin width "Guest".'
      });
    } else {
      if (namesUsed.indexOf(name) == -1) {
        var previousName = nickNames[socket.id];
        var previousNameIndex = namesUsed.indexOf(previousName);
        namesUsed.push(name);
        nickNames[socket.id] = name;
        delete namesUsed[previousNameIndex];
        socket.emit('nameResult', {
          success: true,
          name: name
        });
        socket.broadcast.to(currentRoom[socket.id]).emit('message', {
          text: previousName + ' is now known as ' + name + '.'
        })
      } else {
        socket.emit('nameResult', {
          success: false,
          message: 'That name is already in use.'
        })
      }
    }
  })
}

function handleRoomJoining(socket) {
  socket.on('join', function (room) {
    socket.leave(currentRoom[socket.id]);
    joinRoom(socket, room.newRoom);
  });
}

function handleClientDisconnection(socket) {
  socket.on('disconnect', function () {
    var nameIndex = namesUsed.indexOf(nickNames[socket.id]);
    delete namesUsed[nameIndex];
    delete nickNames[socket.id];
  });
}

exports.listen = function (server) {
  // 启动 Socket.io 服务器，允许他搭载在已有的HTTP服务器上
  io = socketio(server);
  
  io.sockets.on('connection', function (socket) {
    guestNumber = assignGuestName(socket, guestNumber, nickNames, namesUsed);
    joinRoom(socket, 'Lobby');
    handleMessageBroadcasting(socket, nickNames);
    handleNameChangeAttempts(socket, nickNames, namesUsed);
    handleRoomJoining(socket);
    socket.on('rooms', function() {
      const rooms = io.sockets.adapter.rooms;
      for (let socketId in nickNames) {
        if (rooms.has(socketId)) {
          rooms.delete(socketId);
        }
      }
      socket.emit('rooms', [...rooms.keys()]);
    });
    handleClientDisconnection(socket, nickNames, namesUsed);
  })

}