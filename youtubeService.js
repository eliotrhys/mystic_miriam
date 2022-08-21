const { google } = require('googleapis');

const util = require('util');
const fs = require('fs');

const express = require('express');
const server = express();

const openaiService = require('./openaiService.js');
const descriptService = require('./descriptService.js');

// HARDCODED
let liveChatId = "KicKGFVDcHlBclcySzZRQU9sYzVuZERkdjdRURILOUFtRVJsakdqNDA"; // Where we'll store the id of our liveChat

let nextPage; // How we'll keep track of pagination for chat messages
const intervalTime = 5000; // Miliseconds between requests to check chat messages
let interval; // variable to store and control the interval that will check messages
let chatMessages = []; // where we'll store all messages

const writeFilePromise = util.promisify(fs.writeFile);
const readFilePromise = util.promisify(fs.readFile);

const save = async (path, str) => {
    await writeFilePromise(path, str);
    console.log("SAVED!!!!");
};

const read = async path => {
    const fileContents = await readFilePromise(path);
    return JSON.parse(fileContents);
};

const youtube = google.youtube('v3');
const OAuth2 = google.auth.OAuth2;

const clientId = '170479751642-a0ng6935cik05utjmjugrbh07t7f8hbp.apps.googleusercontent.com';
const clientSecret = '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';
const redirectURI = 'http://localhost:3000/callback';

// Permission needed to view and submit live chat comments

const scope = [
    'https://www.googleapis.com/auth/youtube.readonly',
    'https://www.googleapis.com/auth/youtube',
    'https://www.googleapis.com/auth/youtube.force-ssl'
];

const auth = new OAuth2(clientId, clientSecret, redirectURI);

const youtubeService = {};

youtubeService.getCode = response => {
    const authUrl = auth.generateAuthUrl({
        access_type: 'offline',
        scope
    });
    response.redirect(authUrl);
}

// Request access from tokens using code from login

youtubeService.getTokensWithCode = async code => {
    const credentials = await auth.getToken(code);
    youtubeService.authorize(credentials);
};

// Storing access tokens received from google in auth object

youtubeService.authorize = ({ tokens }) => {
    auth.setCredentials(tokens);
    console.log('Successfully set credentials');
    console.log('tokens:', tokens);
    save('./tokens.json', JSON.stringify(tokens));
};

// Update the tokens automatically when they expire

auth.on('tokens', (tokens) => {

    if (tokens.refresh_token) {
        // Store the refresh_token in my database!
        save('./tokens.json', JSON.stringify(auth.tokens));
        console.log(tokens.refresh_token);
    }

    console.log(tokens.access_token);
});

// Read tokens from stored file
const checkTokens = async () => {
    const tokens = await read('./tokens.json');
    if (tokens) 
    {
        auth.setCredentials(tokens);
        console.log('tokens set');
    } 
    else
    {
        console.log('no tokens set');
    }
};

// Check tokens as soon as server is started
checkTokens();

// THIS HAS MAX RESULTS AND IT SHOULDNT BEOLOW

youtubeService.findActiveChat = async () => {
    const response = await youtube.liveBroadcasts.list({
        auth,
        part: 'snippet',
        mine: 'true',
        maxResults: 100,
    });
    console.log(response.data.items);
    // const latestChat = response.data.items[response.data.items.length - 1];
    const latestChat = response.data.items[0];
    liveChatId = latestChat.snippet.liveChatId;
    console.log('Chat ID Found:', liveChatId)
};

const getChatMessages = async () => {

    const response = await youtube.liveChatMessages.list({
      auth,
      part: 'snippet',
      liveChatId,
      pageToken: nextPage
    });

    const { data } = response;

    const newMessages = data.items;

    chatMessages.push(...newMessages);

    nextPage = data.nextPageToken;

    console.log('Total Chat Messages:', chatMessages.length);
};

youtubeService.startTrackingChat = () => {
    interval = setInterval(getChatMessages, intervalTime);
};

youtubeService.stopTrackingChat = () => {
    clearInterval(interval);
};

youtubeService.getLastChat = () => {
    let lastChat = chatMessages.pop();
    console.log(lastChat);
    console.log(lastChat.snippet.displayMessage + " is the last chat that has been sent");
    return lastChat.snippet.displayMessage;
}

youtubeService.tellFortune = async () => {
  try 
  {
    console.log("PROGRESS: HIT THE TELL FORTUNE METHOD");
    
    // GPT-3 GENERATION
    const finalGPTResponseText = await createGPT3Completion();
    console.log("PROGRESS: " + finalGPTResponseText + " IS THE FINAL GPT RESPONSE TEXT");

    // START OF AUDIO GENERATION
    const descriptResponseId = await descriptService.generateAudio(finalGPTResponseText);
    console.log("PROGRESS: " + descriptResponseId + " IS THE DESCRIPT RENSPONSE ID");

    const finalAudioLink = await descriptService.getAudioLink(descriptResponseId);
    
    return finalAudioLink;
      
  } catch(error) 
  {
    console.log("ERROR ON THE PRAIRIE")
    console.log(error);
    return error;
  }
}

const createGPT3Completion = () => {

  // GET THE LAST CHAT MESSAGE FROM THE YOUTUBE CHAT BOX
  let lastChatMessage = chatMessages.pop();
  let fortuneQuestion = lastChatMessage.snippet.displayMessage;
  console.log("PROGRESS: " + fortuneQuestion + " WILL BE TOLD AS A FORTUNE");

  // GPT-3 QUESTION COMPLETION STARTS
  const finalGPTResponseText = openaiService.generateText(fortuneQuestion);

  return finalGPTResponseText;
}

module.exports = youtubeService;