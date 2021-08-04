/* eslint-disable import/order */
const express = require('express');
const { ExpressPeerServer } = require('peer');
const log = require('loglevel');
const dotenv = require('dotenv');
const socketOptions = require('./socketOptions');

dotenv.config();
const { APP_ENV: appEnv } = process.env;
const loggingLevel = appEnv === 'development' ? 'debug' : 'error';
log.setLevel(loggingLevel);

const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server, socketOptions);

const peerServerOptions = { debug: true };
const peerServer = ExpressPeerServer(server, peerServerOptions);

app.use('/peerjs', peerServer);

app.get('/', (req, res) => {
  res.send('Securey server running well');
});

io.on('connection', (socket) => {
  const { id } = socket;
  log.debug(`[connection] A user has connected on socket id: ${id}`);
  socket.on('join-room', (room, userId) => {
    log.debug(`[join-room] New user: ${userId} is joining room: ${room}`);
    socket.join(room);
    log.debug(
      `[join-room] Emitting new user ${userId} to all other users in room ${room}`
    );
    socket.to(room).emit('user-connected', userId);
    socket.on('disconnected', () => {
      log.debug(
        `[disconnected] User ${userId} has disconnected from room ${room}`
      );
      log.debug(
        `[disconnected] Emitting disconnected user ${userId} to all other users in room ${room}`
      );
      socket.to(room).emit('user-disconnected', userId);
    });
  });
});

io.on('connect_error', (err) => {
  log.error(`connect_error due to ${err.message}`);
});

const port = 3005;
server.listen(port);
log.debug(`Express server running on http://localhost:${port}`);
