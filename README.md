# ai photo booth

i plonked this quick website out for my dad's 70th birthday party. we hooked a tv up to it and put a webcam on a tripod. there was a logitech presenter remote to take the pictures and it worked out pretty well. if you want to use it feel free. it works well locally on a laptop connected to the internet.

---

## what it does

you point a webcam at someone, hit the button (or spacebar, or the forward button on a logitech r500 presenter remote), and it takes their photo and runs it through openai's image editing api to transform it. by default it makes everyone look like they're in a 1950s black and white photo which was pretty funny at a birthday party. the original and the ai version both get saved and you can scroll through everything that's been taken during the session.

### taking photos

- big camera button in the middle of the screen opens the webcam
- hit spacebar or the forward button on a logitech r500 to take the shot (or click the on-screen button)
- while the webcam is open, spacebar or the r500 button fires the shutter
- after a photo is transformed, spacebar or the r500 button dismisses it and takes you back to the main screen ready for the next person

### the ai transformation

- there's a prompt editor below the camera button where you can type whatever transformation you want
- it defaults to the 1950s style but you can change it to anything — watercolour painting, cartoon, oil portrait, whatever you like
- you can pick between a few different openai models depending on how fast vs how good you want the results
- it keeps a history of prompts you've used so you can quickly switch back to one that worked well

### photo history

- everything taken gets saved and shown in a grid at the bottom of the page
- click any photo to bring it up full screen
- each thumbnail has a little pill button to toggle between the original and the ai version
- you can download or delete individual photos from the grid
- from a full screen view you can reprocess a photo with a different prompt or model without retaking it

### exporting

at the top of the history grid there are three export buttons. click one and you'll get a folder picker, then it'll save everything into whatever folder you chose:

- **export all** — saves both the original and the ai version for every photo
- **originals** — just the raw webcam shots
- **transformations** — just the ai edited versions

---

## getting it running

you need an openai api key and docker installed. that's pretty much it.

1. copy `.env.example` to `.env` and drop your openai api key in there
2. run `docker compose up --build -d`
3. open `http://localhost:5174` in chrome or edge (firefox won't work for the folder export feature)

the backend runs on port 3001 and the frontend on 5174. photos are stored in a docker volume so they survive restarts.

if you're running it on a laptop and showing it on a tv, just plug the tv in and mirror or extend the display, open the browser full screen on the tv, and point the webcam at people. worked a treat.

---

## the tech

- frontend: react + vite + tailwind
- backend: node + express + typescript
- ai: openai image editing api (gpt-image-1 by default)
- containerised with docker compose
