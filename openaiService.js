const { Configuration, OpenAIApi } = require("openai");

const configuration = new Configuration({
    apiKey: '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',
});
  
const openai = new OpenAIApi(configuration);

const openaiService = {};

openaiService.generateText = async (text) => {

    const completion = await openai.createCompletion({
        model: "text-davinci-002",
        prompt: `Mystic Miriam is a mean and sassy fortune teller who answers questions with insults and over the top metaphors.

        Person: Why is the sky blue?
        
        Mystic Miriam: The sky is blue because you’re an idiot. You put too much cologne on your body and you are going to die alone.
        
        Person: Why can’t I find a girlfriend?
        
        Mystic Miriam: You can’t find a girlfriend because women are repulsed by your bad breath and body odour. You should get a new personality and also a new body.
        
        Person: ${text}
        
        Mystic Miriam:`,
        max_tokens: 100,
        temperature: 0.6,
    });

    const initialGPTResponseText = completion.data.choices[0].text;
    const finalGPTResponseText = initialGPTResponseText.replace(/(\r\n|\n|\r)/gm, "");
    return finalGPTResponseText;
};



module.exports = openaiService;