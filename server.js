const express = require('express');
const { youtube } = require('googleapis/build/src/apis/youtube/index.js');
const path = require('path');

const youtubeService = require('./youtubeService.js');

const server = express();

server.get('/', (req, res) =>
  res.sendFile(path.join(__dirname + '/index.html'))
);

server.get('/authorize', (req, res) => {
  console.log('/auth');
  youtubeService.getCode(res);
});

server.get('/callback', (req, res) => {
  const { code } = req.query;
  youtubeService.getTokensWithCode(code);
  res.redirect('/');
});

server.get('/find-active-chat', (req, res) => {
    youtubeService.findActiveChat();
    res.redirect('/');
});

server.get('/start-tracking-chat', (req, res) => {
    youtubeService.startTrackingChat();
    res.redirect('/');
});

server.get('/stop-tracking-chat', (req, res) => {
    youtubeService.stopTrackingChat();
    res.redirect('/');
});

server.get('/get-last-chat', (req, res) => {
    youtubeService.getLastChat();
    res.redirect('/');
});

server.get('/tell-fortune', (req, res) => {
  youtubeService.tellFortune()
  .then(function(result){
    console.log(result + " IS THE RESULT");
    res.end(result);
  });
});

// server.get('/tell-fortune', youtubeService.tellFortune, (req, res) => {
//   var result = youtubeService.tellFortune();
//   console.log(result);
//   res.send(result);
// });

server.listen(3000, function() {
    console.log('THE SERVER IS READY MATE');
});