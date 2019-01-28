'use strict';

const express           = require('express');
const session           = require('express-session');
const bodyParser        = require('body-parser');
const fccTesting        = require('./freeCodeCamp/fcctesting.js');
const auth              = require('./app/auth.js');
const routes            = require('./app/routes.js');
const mongo             = require('mongodb').MongoClient;
const passport          = require('passport');
const cookieParser      = require('cookie-parser')
const app               = express();
const http              = require('http').Server(app);
const sessionStore      = new session.MemoryStore(); 
const io                = require('socket.io')(http);
const passportSocketIo  = require('passport.socketio');


fccTesting(app); //For FCC testing purposes

app.use('/public', express.static(process.cwd() + '/public'));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'pug')

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  key: 'express.sid',
  store: sessionStore,
}));


mongo.connect(process.env.DATABASE, { useNewUrlParser: true }, (err, client) => {
  var db = client.db('six-socket');
  
  if(err) console.log('Database error: ' + err);
  
  auth(app, db);
  routes(app, db);
  
  http.listen(process.env.PORT || 3000, () => console.log("Listening..."));
  
  io.use(passportSocketIo.authorize({
    cookieParser: cookieParser,
    key:          'express.sid',
    secret:       process.env.SESSION_SECRET,
    store:        sessionStore,
    success:      onAuthorizeSuccess,
    fail:         onAuthorizeFail
  }));
  
  
  function onAuthorizeSuccess(data, accept){
    console.log('successful connection to socket.io');
    accept(null, true);
  }
  
  function onAuthorizeFail(data, message, error, accept){
    console.log('failed connection to socket.io');
    if (error) throw new Error(message);
    accept(null, false);
  }
  
  
  var currentUsers = 0;
  
  // Listen for a user connecting, and authenticate user with Socket.io
  io.on('connection', socket => {
    console.log('A user has connected');
    currentUsers++;  // Counts how many users (sockets) are using chat service
    // Emit to all users the following information:
    // names, number of users and whether connected 
    io.emit('user', {name: socket.request.user.name, currentUsers, connected: true});
    
    // Emit to all users the chat a user has sent
    socket.on('chat message', (message) => { 
      io.emit('chat message', {name: socket.request.user.name, message});
    });
    
    // When user disconnects emit that info to all users in chat room
    socket.on('disconnect', () => { 
      currentUsers--; // number of users has decrfeased
      io.emit('user', {name: socket.request.user.name, currentUsers, connected: false});
    });
    
    console.log('user ' + socket.request.user.name + ' connected');
  });
  
  
});
