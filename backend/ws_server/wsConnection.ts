import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 8080 });

wss.on('connection', function connection(ws) {
  ws.on('error', console.error);
  console.log("Client connected");

  ws.on('message', function message(data) {
    console.log('received: %s', data);
  });
  
  ws.send('something');
});