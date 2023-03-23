const http = require('http');
const fs = require('fs');
const path = require('path');
const mime = require('mime');
const cache = {};

function send404 (response) {
  response.writeHead(404, {'Content-Type': 'text/plain'});
  response.write('Error 404: resource not found.');
  response.end();
}

function sendFile (response, filePath, fileContents) {
  response.writeHead(200, {
    'content-type': mime.getType(path.basename(filePath))
  });
  response.end(fileContents);
}

function serveStatic (response, cache, absPath) {
  if (cache[absPath]) {
    sendFile(response, absPath, cache[absPath]);
  } else {
    fs.readFile(absPath, function(err, data) {
      if (err) {
        send404(response);
      } else {
        cache[absPath] = data;
        sendFile(response, absPath, data);
      }
    })
  }
}

const server = http.createServer(function(request, response) {
  const filePath = request.url == '/' ? 'public/index.html' : 'public' + request.url;
  const absPath = './' + filePath;
  serveStatic(response, cache, absPath);
});

server.listen(3002, function() {
  console.log("Server listening on port 3002.")
});

const chatServer = require('./lib/chat_server'); 
chatServer.listen(server);