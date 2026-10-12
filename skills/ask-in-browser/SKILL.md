---
name: ask-in-browser
description: Questions for the user as a browser form. Use to ask any question that is a choice between options.
---

Ask the questions as a browser form, in place of asking in chat. The form server and an example sit beside this file.

1. Write the questions as JSON in the OS temp directory, shaped like [`example-questions.json`](example-questions.json), with a recommended answer on every question. Every count and every claim about how things stand today, in `facts` or a `why`, comes from a command already run.
2. Serve it in the background: `node <this skill's directory>/ask-in-browser.mjs <questions.json> <answers.json>`. It opens the browser and exits once the answers are sent.
3. Tell the user the form is open, plus anything they need to know before answering.
4. When the server exits, read the answers file and carry on from the answers.

If the server fails to start, ask the questions in chat and say why.
