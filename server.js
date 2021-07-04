const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { ExpressPeerServer } = require('peer');
const log = require('loglevel');

log.setLevel('DEBUG');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);

const peerServerOptions = { debug: true };
const peerServer = ExpressPeerServer(server, peerServerOptions);

app.set('view engine', 'ejs');
app.use('/peerjs', peerServer);
app.use(express.static('public'));

app.get('/', (req, res) => {
  const room = uuidv4();
  log.debug(`[/] Root url accessed, redirecting to '/${room}'`);
  res.redirect(`/${room}`);
});
app.get('/:room', (req, res) => {
  const { room: roomId } = req.params;
  log.debug(`[/:room] Room ${roomId} accessed`);
  res.render('room', { roomId });
});

io.on('connection', (socket) => {
  const { id } = socket;
  log.debug(`[connection] A user has connected on socket id: ${id}`);
  socket.on('join-room', (roomId, userId) => {
    log.debug(`[join-room] New user: ${userId} is joining room: ${roomId}`);
    socket.join(roomId);
    log.debug(
      `[join-room] Emitting new user ${userId} to all other users in room ${roomId}`
    );
    socket.to(roomId).emit('user-connected', userId);
    socket.on('disconnected', () => {
      log.debug(
        `[disconnected] User ${userId} has disconnected from room ${roomId}`
      );
      log.debug(
        `[disconnected] Emitting disconnected user ${userId} to all other users in room ${roomId}`
      );
      socket.to(roomId).emit('user-disconnected', userId);
    });
  });
});

const port = 3005;
server.listen(port);
log.debug(`Express server running on http://localhost:${port}`);
