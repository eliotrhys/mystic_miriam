const fetch = require('node-fetch-commonjs');
const miriamVoiceId = "038ca4b3-efed-4e86-91f3-868d6cf2a177";
const apiToken = "dx_bearer_8f49f49a-5a83-412e-a050-3bc31aa41040:dx_secret_d0bf6cef-4be7-4d2f-ac04-1fa529d88610";

const descriptService = {};

descriptService.generateAudio = async (finalGPTResponseText) => {
    try {
      const response = await fetch("https://descriptapi.com/v1/overdub/generate_async", {
        body: `{"text": "${finalGPTResponseText}","voice_id": "${miriamVoiceId}"}`,
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json"
        },
        method: "POST"
      });

      const descriptJSON = await response.json();

      var descriptResponseId = descriptJSON["id"];

      return descriptResponseId;
    }
    catch(ex) 
    {
      console.log("FAILED AT GENERATE AUDIO");
      console.log(ex.message);
      console.log(ex.response);
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function sleepWait() {
    await sleep(20000);
    console.log('DONE WAITING');
}

descriptService.getAudioLink = async (descriptResponseId) => {
    try {

        await sleepWait();

        const results = await fetch(`https://descriptapi.com/v1/overdub/generate_async/${descriptResponseId}`, {
        headers: {
            Authorization: `Bearer ${apiToken}`
        }});

        const audioLinkJSON = await results.json();

        var finalAudioLink;

        if (audioLinkJSON["state"] == "done")
        {
            console.log("PROGRESS: RESULTS ARE DONE AND " + audioLinkJSON["state"] + " IS THE STATE");
            finalAudioLink = audioLinkJSON["url"];
            console.log(finalAudioLink);
            return finalAudioLink;
        }
        return finalAudioLink;
    } 
    catch(ex) 
    {
        console.log("FAILED AT GET AUDIO LINK");
    }
}

function delay(t, v) {
    return new Promise(function(resolve) { 
        setTimeout(resolve.bind(null, v), t)
    });
  }

module.exports = descriptService;