function Chat(socket) {
  this.socket = socket;
}

Chat.prototype = {
  sendMessage: function(room, text) {
    this.socket.emit('message', {
      room: room,
      text: text
    })
  },
  changeRoom: function(room) {
    this.socket.emit('join', { newRoom: room });
  },
  processCommand: function(command) {
    const words = command.split(' ');
    command = words[0].substring(1, words[0].length).toLowerCase();
    let message = false;
    switch (command) {
      case 'join':
        words.shift();
        const room = words.join(' ');
        this.changeRoom(room);
        break;
      case 'nick':
        words.shift();
        const name = words.join(' ');
        this.socket.emit('nameAttempt', name);
        break;
      default:
        message = 'Unrecognized command.'
    }
    return message;
  }
}