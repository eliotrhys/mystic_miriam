const { google } = require('googleapis');
const { Configuration, OpenAIApi } = require("openai");

const util = require('util');
const fs = require('fs');

const nodeServer = require('./server.js');

const configuration = new Configuration({
  apiKey: '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',
});

const openai = new OpenAIApi(configuration);

const express = require('express');
const server = express();

// HARDCODED
let liveChatId = "KicKGFVDcHlBclcySzZRQU9sYzVuZERkdjdRURILc2IwbHJEbWp3ak0"; // Where we'll store the id of our liveChat

let nextPage; // How we'll keep track of pagination for chat messages
const intervalTime = 5000; // Miliseconds between requests to check chat messages
let interval; // variable to store and control the interval that will check messages
let chatMessages = []; // where we'll store all messages
// const axios = require('axios');
// import fetch from 'node-fetch';
const fetch = require('node-fetch-commonjs');
const miriamVoiceId = "038ca4b3-efed-4e86-91f3-868d6cf2a177";
const apiToken = "dx_bearer_8f49f49a-5a83-412e-a050-3bc31aa41040:dx_secret_d0bf6cef-4be7-4d2f-ac04-1fa529d88610";
let descriptResponseId;
let finalAudioLink;

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

    // GET THE LAST CHAT MESSAGE FROM THE YOUTUBE CHAT BOX
    let lastChatMessage = chatMessages.pop();

    // CREATE THE FORTUNE QUESTION VARIABLE
    let fortuneQuestion = lastChatMessage.snippet.displayMessage;
    console.log("PROGRESS: " + fortuneQuestion + " WILL BE TOLD AS A FORTUNE");

    // GPT-3 QUESTION COMPLETION STARTS
    const completion = await openai.createCompletion("text-davinci-002", {
        prompt: `Use 10 adjectives as you answer this question: ${fortuneQuestion}`,
        max_tokens: 100,
        temperature: 0.6,
        suffix: "That alright, ya filthy animal?",
    });

    // GPT-3 QUESTION COMPLETION ENDS - GET FULL RESPONSE TEXT
    console.log("PROGRESS: GPT-3 RESPONSE COMPLETE")
    let initialGPTResponseText = completion.data.choices[0].text;


    // REMOVE LINE BREAKS FROM GPT-£ REPONSE
    let finalGPTResponseText = initialGPTResponseText.replace(/(\r\n|\n|\r)/gm, "");
    console.log("PROGRESS: " + finalGPTResponseText + " IS THE FINAL GPT RESPONSE TEXT");


    // START OF AUDIO GENERATION
    // RUN GET AUDIO LINK REQUEST. THIS FUNCTION WILL CALL ITSELF 5 TIMES IF THE REQUEST FAILS 
    getAudioLink(finalGPTResponseText, 5, callback);
    // return getAudioLink(finalGPTResponseText, 5, callback);
      
  } catch(error) 
  {
      console.log("ERROR ON THE PRAIRIE")
      console.log(error);
      return error;
  }
}

const generateAudio = async (finalGPTResponseText) => {
  try {
    await fetch("https://descriptapi.com/v1/overdub/generate_async", {
      body: `{"text": "${finalGPTResponseText}","voice_id": "${miriamVoiceId}"}`,
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json"
      },
      method: "POST"
    })
    .then(function(res) { console.log("PROGRESS: HITTING .then() IN GENERATE AUDIO"); return res.json() })
    .then(function(json) { 
      descriptResponseId = json["id"];
      console.log("PROGRESS: " + descriptResponseId + " IS THE DESCRIPT RENSPONSE ID");
      // return descriptResponseId;
    })
  }
  catch(ex) 
  {
    console.log("FAILED AT GENERATE AUDIO");
    console.log(ex.message);
    console.log(ex.response);
  }
}

var callback = (data, error) => {

  console.log("PROGRESS: HITTING callback() FUNCTION");
  // consume data
  setTimeout(function(){
    if (error) {
        console.error(error + " IS THE ERROR");
        return;
    }
    console.log(data);
  }, 5000);
};

function delay(t, v) {
  return new Promise(function(resolve) { 
      setTimeout(resolve.bind(null, v), t)
  });
}

const getAudioLink = async (finalGPTResponseText, retries, callback) => {
  try {
      // generateAudio() works.
      console.log("PROGRESS: " + finalGPTResponseText + " IS THE FINAL GPT RESPONSE TEXT HEAING INTO generateAudio()");
      await generateAudio(finalGPTResponseText);

      let testVariable = setTimeout(function(){
        console.log("PROGRESS: HITTING setTimeout FUNCTION TO GET LINK");
        const results = fetch(`https://descriptapi.com/v1/overdub/generate_async/${descriptResponseId}`, {
          headers: {
            Authorization: `Bearer ${apiToken}`
          }
        }).then(function(res) { 
            return delay(20000).then(function() {
              console.log("PROGRESS: WAITED 20 SECONDS FOR API CALL TO RETURN STATUS DONE");
              return res.json()});
        })
          .then(function(json) { 
            console.log("PROGRESS: JSON RETURNING");
            console.log("PROGRESS: " + json["state"] + " IS THE CURRENT STATE");
            if (json["state"] == "done")
            {
              console.log("PROGRESS: RESULTS ARE DONE AND " + json["state"] + " IS THE STATE");
              finalAudioLink = json["url"];
              console.log(finalAudioLink);
              return finalAudioLink;
            }
            else {
                // server not done yet
                // retry, if any retries left
                if (retries > 0) {
                  console.log(json["url"] + " IS THE URL");
                  console.log("PROGRESS: RETRYING");

                  setTimeout(function(){
                    getAudioLink(miriamText, --retries, callback);
                  }, 10000);
                }
                else {
                    // no retries left, calling callback with error
                    callback([], "PROGRESS: OUT OF RETRIES");
                }
            }
          })
          // console.log(results + " ARE THE RESULTS 1");
          // return results;
      }, 20000);
      console.log("Returning..." + testVariable);
      // return;
  } 
  catch(ex) 
  {
    console.log("FAILED AT GET AUDIO LINK");
  }
}

module.exports = youtubeService;