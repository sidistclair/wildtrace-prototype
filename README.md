# Wild Trace (prototype)

Wild Trace is a short visual mystery game for around 10–18 year olds. The player takes over a wildlife survey after the researcher running it disappeared. Every night they place camera traps around the reserve, but there are more locations than cameras, so watching one spot means missing whatever happens somewhere else. The photos slowly start showing things like animals in the wrong places, a fence and road spreading into the reserve, vehicles at night and snares. At the end the player uses the photos they collected to build a case, so what they can actually prove depends on what they chose to pay attention to.

[Play Wild Trace](https://sidistclair.github.io/wildtrace-prototype/)

## In this prototype

- **5 nights:** drag 2 trail cameras onto 5 places on the reserve map each evening. The fence and road spread across the map from night to night.
- **Reviewing photos on the trail camera:** step through frames, pin photos, and hit the red FLAG button when something looks wrong. Flags don't say whether you were right; you find out on the clue board at the end.
- **The same animals keep coming back:** a fox with a white-tipped tail, and a doe with a pale shoulder mark and her fawn. There's also a mystery pickup (plate K7R-418), a construction crew, a hunter and snares.
- **Dr. Okafor's old photos:** the missing researcher's journal and photos, to compare with yours.
- **Supply drops between nights:** pick one item each time.
  - Zoom lens
  - Photo matcher (compare with earlier photos)
  - Motion sensor log (tracks on the map)
  - Field ID scope (outlines and names whatever you point at)
  - Repair kit
- **Things go wrong:**
  - A camera left on Ridge Road on night 2 gets smashed.
  - Some photos come back with a dirty lens you have to wipe clean.
  - The storm knocks a camera's wires loose, and you plug them back in.
- **Storm Sweep:** after night 3 a storm washes things down the creek trail. Sort litter into the sack and leave natural things in the undergrowth. The snare wire counts as evidence, and a good score earns an extra supply pick.
- **The case report:** pick your 6 strongest photos and tick the claims each one supports. Three claims are true and two are false. The verdict shows what you proved and the science behind each claim, and you can revise and resubmit.
- **Three endings:** full case, partial case or not enough evidence. Then a clue board shows every clue you found or missed.
- **Saving:** the game saves itself in the browser, so you can close the tab and carry on later.

## Controls

| Where | Keys |
|---|---|
| Map | 1–5 place a camera |
| Overnight | Space skips to morning |
| Trail camera | ← → frames · ↑ ↓ switch camera · F flag · P pin · C compare · V zoom |
| Storm Sweep | ← leave it · → bag it |
| Anywhere | Esc closes pop-ups |

Everything can also be done with the mouse.

## Running it

Open `index.html` in a browser, or use the link above. It needs an internet connection for p5.js and the fonts. All the game code is in `sketch.js`, and the art is in `assets/`.
