function divEscapedContentElement(message) {
  return $('<div></div>').text(message);
}
function divSystemContentElement(message) {
  return $('<div></div>').html('<i>' + message + '</i>');
}

function processUserInput(chatApp, socket) {
  const message = $("#send-message").val();
  let systemMessage;

  if (message.charAt(0) == '/') {
    systemMessage = chatApp.processCommand(message);
    if (systemMessage) {
      $("#messages").append(divSystemContentElement(systemMessage));
    }
  } else {
    chatApp.sendMessage($('#room').text(), message);
    $("#messages").append(divEscapedContentElement(message));
    $("#messages").scrollTop($("#messages").prop('scrollHeight'));
  }
  $("#send-message").val('');
}

const socket = io();

$(function () {
  const chatApp = new Chat(socket);

  socket.on('nameResult', function (result) {
    const message = result.success ? 'You are known as ' + result.name + '.' : result.message;
    $('#messages').append(divSystemContentElement(message));
  });

  socket.on('joinResult', function (result) {
    $("#room").text(result.room);
    $('#messages').append(divSystemContentElement('Room changed.'));
  });

  socket.on('message', function (message) {
    $('#messages').append($('<div></div>').text(message.text));
  });

  socket.on('rooms', function (rooms) {
    $('#room-list').empty();
    rooms.forEach(function(room) {
      $('#room-list').append(divEscapedContentElement(room));
    })
  });

  $('#room-list div').click(function () {  //点击房间名可以换到那个房间中
    chatApp.processCommand('/join ' + $(this).text());
    $('#send-message').focus();
  });


  $('#send-message').focus();

  $('#send-form').submit(function () {  //提交表单可以发送聊天消息
    processUserInput(chatApp, socket);
    return false;
  });

});

setInterval(function () {  //定期请求可用房间列表
  socket.emit('rooms');
}, 1000);