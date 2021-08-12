/* eslint-disable import/order */
const express = require('express');
const { ExpressPeerServer } = require('peer');
const log = require('loglevel');
const dotenv = require('dotenv');
const socketOptions = require('./socketOptions');

dotenv.config();
const { APP_ENV: appEnv } = process.env;
if (!appEnv) {
  log.error('Error, missing app environment, exiting program');
  process.exit(1);
}
const loggingLevel = appEnv === 'development' ? 'debug' : 'error';
log.setLevel(loggingLevel);

const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server, socketOptions);

const peerServerOptions = { debug: true };
const peerServer = ExpressPeerServer(server, peerServerOptions);

app.use('/peerjs', peerServer);

app.get('/', (req, res) => {
  res.send('OK');
});

let rooms = [];

io.on('connection', (socket) => {
  const { id } = socket;
  log.debug(`[connection] A user has connected on socket id: ${id}`);
  socket.on('join-room', (room, userId) => {
    log.debug(`[join-room] New user: ${userId} is joining room: ${room}`);
    const findRoom = (existingRoom) => existingRoom.roomId === room;
    const findUser = (user) => user === userId;
    const not = (fn) => (...args) => !fn(...args);
    const roomExists = rooms.some(findRoom);
    if (roomExists) {
      const existingRoom = rooms.filter(findRoom)[0];
      if (existingRoom.users.length >= 2) {
        log.debug('The max number of users in a room has been reached');
        return;
      }
      existingRoom.users.push(userId);
      socket.join(room);
      log.debug(
        `[join-room] Emitting new user ${userId} to all other users in room ${room}`
      );
      socket.to(room).emit('user-connected', userId);
      socket.on('disconnect', () => {
        log.debug(
          `[disconnect] User ${userId} has disconnected from room ${room}`
        );
        log.debug(
          `[disconnect] Emitting disconnected user ${userId} to all other users in room ${room}`
        );
        socket.to(room).emit('user-disconnected', userId);
        const newUsers = existingRoom.users.filter(findUser);
        existingRoom.users = newUsers;
      });
      return;
    }
    rooms.push({ roomId: room, users: [userId] });
    socket.join(room);
    log.debug('This room does not exist, creating new room');
    log.debug(`[join-room] Emitting new user ${userId} to room ${room}`);
    socket.to(room).emit('user-connected', userId);
    socket.on('disconnect', () => {
      log.debug(
        `[disconnect] User ${userId} has disconnected from room ${room}`
      );
      log.debug(
        `[disconnect] Emitting disconnected user ${userId} to all other users in room ${room}`
      );
      socket.to(room).emit('user-disconnected', userId);
      const existingRoom = rooms.filter(findRoom)[0];
      const newUsers = existingRoom.users.filter(findUser);
      if (newUsers.length === 0) {
        const newRooms = rooms.filter(not(findRoom));
        rooms = newRooms;
      }
      existingRoom.users = newUsers;
    });
  });
});

io.on('connect_error', (err) => {
  log.error(`connect_error due to ${err.message}`);
});

const port = 3005;
server.listen(port);
log.debug(`Express server running on http://localhost:${port}`);
