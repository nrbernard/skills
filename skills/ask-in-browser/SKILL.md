---
name: ask-in-browser
description: Questions for the user as a browser form, in place of chat. Use for every grilling round, and for any other question that is a choice between options.
metadata:
  version: "0.2.1"
---

The form server sits beside this file.

1. Serve the questions in the background, as minified JSON on stdin. It opens the browser and exits once the answers are sent.

   ```sh
   node <this skill's directory>/ask-in-browser.mjs <<'EOF'
   {"title":"Page addresses","facts":["**Inline links are the convention today.** `astro.config.mjs` expects them."],"questions":[{"group":"Addresses","q":"Who owns a page's address?","body":"Today it is written at each link site.","options":["A small module outside `src/domain/`.","`VoteRecord` hands each thing its path.","Leave links inline."],"rec":"A","why":"The base path is a build fact, not a Council rule."}]}
   EOF
   ```

   `facts`, `group`, `body` and `why` are optional. Options are lettered A, B, C in order. Every question has a `rec`: one letter, or an array of letters to let the user tick several. Backticks and `**bold**` render; HTML does not. Every count and every claim about how things stand today, in `facts` or a `why`, comes from a command already run.
2. Tell the user the form is open, plus anything they need to know before answering.
3. When the server exits, its output ends with one line per question, `Q1: A` or `Q2: A, C — note`. Carry on from the answers.

If the server fails to start, ask the questions in chat and say why.
