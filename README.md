# Securey

Securey is a full-stack application that allows for instant, real-time, one to one video. I built the back-end using Express.js, Peer.js, and Socket.io.

## Installation

1. Install the node dependencies for the application.

```npm install```

2. Copy the example environment file.

```cp .env.example .env```

3. Add the appropriate environmental variables.

* APP_ENV can be either "development" or "production".
* PRODUCTION_ORIGIN is the domain origin of the production deployment, e.g. https://www.google.com.

4. Run the application

```npm start```

## Built With

* [Express](https://expressjs.com/)
* [PeerJS](https://peerjs.com/)
* [Socket.IO](https://socket.io/)