# Mystic Miriam

Mystic Miriam is a work-in-progress AI-driven interactive fortune-telling game built with OpenAI's GPT-3, Descript's Overdub API and YouTube's Data & Livestream APIs.

Mystic Miriam is a character who takes questions from a YouTube livestream and creates sarcastic, witty responses in the form of fortune telling.

The code I wrote followed these steps:

* The game is launched and has listeners waiting for new comments
* New comment fires HTML request to Express app
* Harvest message from YouTube Livestream API, send to custom Express app
* Comment goes into custom prompt builder, then awaits GPT-3 response with full text answer
* Text returned from GPT-3 goes to Descript Overdub API, async Javascript code awaits URL return from API
* Final audio URL is returned to custom Express app and sent as a text string over HTTP to Unity Game Engine Web Request Listener
* Custom C# Unity Code reads audio directly from URL
* Blend Shapes in Unity reads amplitude values of audio from URL and moves jaw joint on the 3D model responsively
* Final app plays Mystic Miriam answering in her usual sarcastic way!

Any questions about this project, please don't hesitate to get in touch.