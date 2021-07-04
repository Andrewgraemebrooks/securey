/* eslint-disable no-undef */
const socket = io('/');
const videoGrid = document.getElementById('video-grid');
const myVideo = document.createElement('video');
myVideo.muted = true;
const peers = {};
const peer = new Peer(undefined, {
  path: '/peerjs',
  host: '/',
  port: '3005',
  debug: 0,
});
const loggingLevel = 'DEBUG';
log.setLevel(loggingLevel);

/**
 * Adds a media stream to a HTML element.
 * @param {HTMLVideoElement} video The HTML element for the user's video
 * @param {MediaStream} stream The user's media stream (their video and audio tracks)
 */
const addVideoStream = (video, stream) => {
  log.debug('[addVideoStream] Adding video stream to a video HTML element');
  // eslint-disable-next-line no-param-reassign
  video.srcObject = stream;
  video.addEventListener('loadedmetadata', () => {
    video.play();
    videoGrid.append(video);
  });
};

/**
 * Handles any error from attempting to create local media tracks
 * @param {any} error The error produced from trying to get the local user's media
 */
const catchGetUserMedia = (error) => {
  log.error('[catchGetUserMedia] Error retrieving local mediastream');
  log.error(error);
};

/**
 * Connects to the newly connected user
 * @param {string} userId The id of the remote user
 * @param {MediaStream} stream The local user's mediastream (their video and audio tracks)
 */
const connectToNewUser = (userId, stream) => {
  log.debug(`[ConnectToNewUser] Calling new user ${userId}`);
  const call = peer.call(userId, stream);
  const remoteUserVideo = document.createElement('video');
  call.on('stream', (remoteStream) => {
    log.debug('[ConnectToNewUser] Adding peer video');
    addVideoStream(remoteUserVideo, remoteStream);
  });
  call.on('close', () => {
    log.debug('[ConnectToNewUser] Removing peer video');
    video.remove();
  });
  call.on('error', () => {
    log.error('[ConnectToNewUser] Error has occured with the peerjs call');
  });
  peers[userId] = call;
};

socket.on('user-disconnected', (userId) => {
  log.debug(`[user-disconnected] User: ${userId} has disconnected`);
  if (peers[userId]) {
    log.debug('[user-disconnected] User was a peer, closing their connection');
    peers[userId].close();
  }
});

peer.on('open', (id) => {
  log.debug('[open] Peerjs connection established and ready to use');
  log.debug(`[open] Peerjs local user id: ${id}`);
  const mediaConstraints = { audio: true, video: true };
  navigator.mediaDevices
    .getUserMedia(mediaConstraints)
    .then((stream) => {
      log.debug('[GetUserMedia] Successfully retrieved local user mediastream');
      addVideoStream(myVideo, stream);
      log.debug(
        `[GetUserMedia] Emitting socket io event 'join-room' to room: ${ROOM_ID}`
      );
      socket.emit('join-room', ROOM_ID, id);
      peer.on('call', (call) => {
        log.debug('[Call] New call recieved from peer, answering call');
        call.answer(stream);
        const remoteUserVideo = document.createElement('video');
        call.on('stream', (userVideoStream) => {
          log.debug('[Call] Adding peer video');
          addVideoStream(remoteUserVideo, userVideoStream);
        });
        call.on('error', () => {
          log.error(
            '[ConnectToNewUser] Error has occured with the peerjs call'
          );
        });
      });
      socket.on('user-connected', (userId) => {
        log.debug(`[user-connected] User: ${userId} has connected`);
        log.debug('[user-connected] Connecting to new user');
        connectToNewUser(userId, stream);
      });
    })
    .catch(catchGetUserMedia);
});
