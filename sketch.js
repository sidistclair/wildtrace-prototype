// Wild Trace prototype
// TODO: a real report

// Which screen is showing: "title", "howto", "briefing", "map", "night", "photos" or "end"
let screen = "title";

// The 5 camera spots. The same index is used in all three lists,
// e.g. index 2 is the Corridor at (563, 252) on the map.
let places = ["Forest", "Creek", "Corridor", "Farm", "Ridge Road"];
let placeX = [176, 314, 563, 692, 486];
let placeY = [204, 378, 252, 468, 96];
// Names used in the photo files, e.g. assets/photos/N2-corridor-frame-1.jpg
let ids = ["forest", "creek", "corridor", "farm", "ridge"];
let photos = {}; // photos[night][place][frame] is one frame from that place on that night
// How many frames each camera took: frameCounts[night - 1][place]
let frameCounts = [[2, 2, 2, 1, 1], [1, 2, 2, 2, 2], [2, 2, 2, 2, 1]];

// Other artwork, loaded in setup()
let maps = {};      // maps[night] is the painted reserve map for that night
let icons = [];     // icons[place] is the map icon for that place
let camIcons = [];  // camera 1 and camera 2 icons
let titlePic, notebook;
let nightPic, endPic; // Zeina's night-sky paintings for the night and end screens
let grain;          // night-vision speckles laid over the photos

let cameras = []; // indexes of the places that have a camera (max 2)
let timer = 0;    // counts frames on the night screen
let message = ""; // feedback shown after clicking a photo
let night = 1;    // current night, 1 to 3
let clues = [];   // the clues the player has found so far
let showOld = false; // true while Dr. Okafor's old photos are showing
let frame = [0, 0];  // which frame each camera's photo is on
let magnify = false; // true while the magnifier is on
let lens = null;     // the photo under the mouse, for the magnifier
let pins = [];       // pinned photos, each { pic, label }
let chosen = [];     // which pins (up to 2) are being compared

// Dr. Okafor's old photos to compare with yours: old[place], or null if that place has none
let old = [
  { file: "ARC-1", when: "6 WEEKS AGO", note: "Dr. Okafor's photo: the same fox, back when it lived in the forest." },
  null,
  { file: "ARC-2", when: "6 WEEKS AGO", note: "Dr. Okafor's photo: the doe and her fawn walking freely through the corridor, before the fence." },
  null,
  { file: "ARC-3", when: "4 WEEKS AGO", note: "Dr. Okafor's photo: the ridge before any road was built." },
];

// What each camera sees: events[night - 1][place].
// note describes the photo. clue is filled in when the photo shows something wrong.
// The same animals keep coming back: the fox (F1) has a white-tipped tail,
// and the doe (D2) has a pale mark on her shoulder and a spotted fawn.
let events = [
  [ // night 1
    { time: "22:14", note: "A doe with a pale shoulder mark grazes with her spotted fawn. A fox with a white-tipped tail trots past.", clue: "" },
    { time: "05:40", note: "An otter by the water, then the doe and her fawn come down to drink.", clue: "" },
    { time: "01:10", note: "The fox and a badger travel along the corridor. Later a buck walks through.", clue: "" },
    { time: "23:55", note: "Just the farm dog sniffing around the bins.", clue: "" },
    { time: "14:20", note: "Daytime. Workers from Ridgeline Developments mark out a road next to their yellow truck.", clue: "A construction crew is marking out a new road on the ridge." },
  ],
  [ // night 2
    { time: "21:48", note: "The doe and her fawn again.", clue: "" },
    { time: "20:30", note: "No animals, but there is a wire snare set on the path to the water. Later the doe and her fawn walk right past it.", clue: "Someone has set a snare by the creek." },
    { time: "00:30", note: "A badger reaches the half-built fence and has to turn back.", clue: "The new fence is cutting off the wildlife corridor." },
    { time: "02:31", note: "The fox from the forest, white-tipped tail and all, is raiding the farm's bins.", clue: "The forest fox has been pushed out to the farm." },
    { time: "23:50", note: "A dark pickup with a roof light bar and a dented tailgate drives the new road at night. Two hours later a gloved hand grabs the camera.", clue: "A mystery pickup is using the new road at night, and someone tampered with the camera." },
  ],
  [ // night 3
    { time: "03:00", note: "Nothing. The forest is empty tonight.", clue: "" },
    { time: "04:05", note: "A person with a headlamp and a bright stripe on their sleeve kneels at the snare. Fifteen minutes later the snare is gone, leaving only holes.", clue: "A hunter with a headlamp is checking the snare." },
    { time: "23:10", note: "The doe and her fawn reach the finished fence and can't get through.", clue: "The finished fence stops the doe and fawn using the corridor." },
    { time: "03:30", note: "The doe and her fawn from the reserve are eating the farm's crops.", clue: "The doe and fawn have been pushed out to the farm." },
    { time: "04:20", note: "The same dark pickup, seen from behind. The plate reads K7R-418.", clue: "The pickup is back, and its plate is K7R-418." },
  ],
];

function setup() {
  // The game is always drawn at 800x600. style.css scales it to fit the window.
  createCanvas(800, 600);
  // Draw at double resolution so the canvas stays sharp when scaled up
  pixelDensity(2);
  // Load every frame from every place on every night (15 scenes in total)
  for (let n = 1; n <= 3; n++) {
    photos[n] = [];
    for (let i = 0; i < 5; i++) {
      photos[n][i] = [];
      for (let f = 1; f <= frameCounts[n - 1][i]; f++) {
        photos[n][i].push(loadPic("assets/photos/N" + n + "-" + ids[i] + "-frame-" + f + ".jpg", 800, 500));
      }
    }
  }
  // Load Dr. Okafor's old photos
  for (let i = 0; i < 5; i++) {
    if (old[i]) old[i].pic = loadPic("assets/photos/" + old[i].file + "-frame-1.jpg", 800, 500);
  }
  // Load the maps, icons and screen backgrounds
  for (let n = 1; n <= 3; n++) maps[n] = loadPic("assets/map/night-" + n + ".jpg", 1720, 1200);
  for (let i = 0; i < 5; i++) icons[i] = loadPic("assets/ui/" + ids[i] + ".png", 64, 64);
  camIcons = [loadPic("assets/ui/camera-1.png", 96, 80), loadPic("assets/ui/camera-2.png", 96, 80)];
  titlePic = loadPic("assets/screens/title-background.jpg", 1920, 1080);
  notebook = loadPic("assets/screens/notebook-page.png", 800, 1200);
  nightPic = loadPic("assets/night-moon.png", 504, 323);
  endPic = loadPic("assets/night-lake.png", 503, 343);

  // Night-vision grain: random light and dark speckles. It is twice the size of a photo
  // so drawPhoto() can show a different part of it every frame, which makes it flicker.
  grain = createGraphics(740, 462);
  for (let i = 0; i < 12000; i++) {
    grain.stroke(random(255), random(20, 70));
    grain.point(random(740), random(462));
  }
}

// p5 calls draw() about 60 times a second. Each branch draws one screen.
function draw() {
  // No outlines unless a shape asks for one (p5 would also outline text otherwise)
  noStroke();
  if (screen == "title") {
    // Title screen: game name plus Start and How to play buttons.
    // The 1920x1080 painting is cropped to the middle 1440x1080 so it fills the 4:3 canvas.
    image(titlePic, 0, 0, 800, 600, 240, 0, 1440, 1080);
    fill(255);
    textAlign(CENTER);
    textSize(60);
    text("Wild Trace", 400, 220);
    button("Start", 230, 350);
    button("How to play", 410, 350);
  } else if (screen == "howto") {
    // How to play: the rules, then Back to the title
    drawNotebook("1. Click 2 places on the map to put your cameras.\n2. Start the night and wait for the photos.\n3. Click the photo that shows what's wrong.\n4. Use Pin, Next frame and the Magnifier to look closer.\n5. You have 3 nights, and you can move your cameras each night.");
    button("Back", 320, 450);
  } else if (screen == "briefing") {
    // Briefing: the story before the first night
    drawNotebook("Dr. Okafor, the researcher running the wildlife survey, has gone missing.\nA new fence and road are being built through the reserve.\nThe rangers think the animals are in trouble.\nYou have 3 nights to catch the problem on camera.\nCompare your photos with Dr. Okafor's old ones to spot what has changed.");
    button("Continue", 320, 450);
  } else if (screen == "map") {
    // Map: the player picks 2 places for the cameras.
    // Each night has its own painted map showing how far the fence and road have got.
    // The 1720x1200 map is cropped by 60 pixels on each side so it fits the 4:3 canvas.
    image(maps[night], 0, 0, 800, 600, 60, 0, 1600, 1200);
    // dark strip behind the instructions
    fill(0, 160);
    rect(0, 0, 800, 45);
    fill(255);
    textAlign(LEFT);
    textSize(20);
    text("Night " + night + ": click 2 places to put your cameras", 20, 30);

    // Draw each place as its icon with its name underneath.
    // Places with a camera get a yellow ring and that camera's icon.
    for (let i = 0; i < 5; i++) {
      if (cameras.includes(i)) {
        fill(255, 200, 0);
        ellipse(placeX[i], placeY[i], 52, 52);
        image(camIcons[cameras.indexOf(i)], placeX[i] + 10, placeY[i] - 45, 48, 40);
      }
      image(icons[i], placeX[i] - 20, placeY[i] - 20, 40, 40);
      // white name with a dark outline so it stands out on the map
      fill(255);
      stroke(0);
      strokeWeight(3);
      textAlign(CENTER);
      textSize(14);
      text(places[i], placeX[i], placeY[i] + 38);
    }
    noStroke();

    // Only let the night start once both cameras are placed
    if (cameras.length == 2) {
      button("Start night", 620, 530);
    }
  } else if (screen == "night") {
    // Night: a short pause before the photos.
    // The picture is cropped to its middle 431x323 so it fills the 4:3 canvas.
    image(nightPic, 0, 0, 800, 600, 36, 0, 431, 323);
    fill(255);
    textAlign(CENTER);
    textSize(40);
    text("Night " + night + "...", 400, 300);
    // 120 frames is about 2 seconds at 60 frames per second
    timer++;
    if (timer > 120) {
      timer = 0; // reset so the next night waits too
      frame = [0, 0];
      screen = "photos";
    }
  } else if (screen == "photos") {
    // Photos: one photo from each camera, side by side
    background(40);
    fill(255);
    textAlign(LEFT);
    textSize(18);
    text("Click a photo if you think it shows something wrong in the reserve.", 20, 40);
    for (let k = 0; k < 2; k++) {
      let x = 20 + k * 390;
      drawPhoto(shown(k), x, 100);
      // Pin under every photo, and Next frame if that camera took more than one
      button("Pin", x, 340, 80);
      if (hasFrames(k)) button("Next frame", x + 90, 340, 130);
    }
    // Feedback from the last photo the player clicked, wrapped inside a 720x80 box
    fill(255);
    textAlign(CENTER);
    textSize(18);
    text(message, 40, 400, 720, 80);
    // Hint so the player isn't stuck when neither camera caught anything
    let tonight = events[night - 1];
    if (!tonight[cameras[0]].clue && !tonight[cameras[1]].clue) {
      text("Tip: nothing looks wrong here tonight. Try other places next night.", 400, 490);
    }
    // Button to switch between tonight's photos and Dr. Okafor's,
    // only if one of the cameras is at a place with an old photo
    if (old[cameras[0]] || old[cameras[1]]) {
      button(showOld ? "Tonight's photos" : "Old photos", 20, 530);
    }
    button(magnify ? "Stop zoom" : "Magnifier", 190, 530, 130);
    if (pins.length > 0) button("Pinned (" + pins.length + ")", 330, 530, 130);
    // After the last night the button goes to the end screen instead
    button(night < 3 ? "Next night" : "Finish", 620, 530);
  } else if (screen == "end") {
    // End: list every clue the player found.
    // The picture is cropped to its middle 457x343, with a dark layer so the text stands out.
    image(endPic, 0, 0, 800, 600, 23, 0, 457, 343);
    fill(0, 120);
    rect(0, 0, 800, 600);
    fill(255);
    textAlign(CENTER);
    textSize(24);
    text("You found " + clues.length + " of 9 clues", 400, 100);
    textAlign(LEFT);
    textSize(16);
    for (let i = 0; i < clues.length; i++) {
      text("- " + clues[i], 100, 150 + i * 30);
    }
    button("Play again", 320, 500);
  } else if (screen == "pins") {
    // Pinned photos: pick two to compare side by side
    background(40);
    fill(255);
    textAlign(LEFT);
    textSize(18);
    text("Click two pinned photos to compare them side by side.", 20, 40);
    for (let k = 0; k < chosen.length; k++) {
      drawPhoto(pins[chosen[k]], 20 + k * 390, 70);
    }
    // small copies of every pinned photo, 6 to a row; the chosen ones get a yellow border
    for (let i = 0; i < pins.length; i++) {
      let x = 20 + (i % 6) * 130;
      let y = 330 + floor(i / 6) * 90;
      image(pins[i].pic, x, y, 120, 75);
      if (chosen.includes(i)) {
        noFill();
        stroke(255, 200, 0);
        strokeWeight(3);
        rect(x, y, 120, 75);
        noStroke();
      }
    }
    button(magnify ? "Stop zoom" : "Magnifier", 190, 530, 130);
    button("Back", 620, 530);
  }

  // The magnifier is drawn last so it sits on top of everything
  if (lens) drawLens();
  lens = null;
}

// Draws a yellow button, 160 wide (or w wide) and 50 tall, with its top-left corner at (x, y)
function button(label, x, y, w = 160) {
  fill(255, 200, 0);
  rect(x, y, w, 50);
  fill(0);
  textAlign(CENTER);
  textSize(20);
  text(label, x + w / 2, y + 32);
}

// Draws the top of the notebook page as the background, with text written on its lines
function drawNotebook(words) {
  background(30);
  image(notebook, 40, 20, 720, 560, 40, 40, 720, 560);
  fill(52, 46, 38);
  textAlign(LEFT);
  textSize(18);
  textLeading(39); // the gap between the page's ruled lines
  text(words, 150, 155, 590, 290);
}

// True if the mouse is inside the button drawn at (x, y)
function onButton(x, y, w = 160) {
  return mouseX > x && mouseX < x + w && mouseY > y && mouseY < y + 50;
}

// Loads a picture through an <img> tag rather than loadImage(),
// so it also works when index.html is opened straight from disk.
// The picture is blank until the file has loaded.
function loadPic(path, w, h) {
  let pic = createImage(w, h);
  let img = new Image();
  img.onload = () => pic.drawingContext.drawImage(img, 0, 0, w, h);
  img.src = path;
  return pic;
}

// The picture and label for camera k (0 or 1) as it is currently shown.
// While showOld is on, places that have one show Dr. Okafor's old photo instead.
function shown(k) {
  let place = cameras[k];
  if (showOld && old[place]) {
    return { pic: old[place].pic, label: "DR. OKAFOR - " + places[place] + " - " + old[place].when };
  }
  let frames = photos[night][place];
  return {
    pic: frames[frame[k]],
    label: "CAM - " + places[place] + " - NIGHT " + night + " - " + events[night - 1][place].time + " - FRAME " + (frame[k] + 1) + "/" + frames.length,
  };
}

// True if camera k is showing tonight's photo and took more than one frame
function hasFrames(k) {
  return !(showOld && old[cameras[k]]) && photos[night][cameras[k]].length > 1;
}

// Draws a photo ({ pic, label }) with its top-left corner at (x, y).
// The photos are 800x500 and are shown here at 370x231.
function drawPhoto(photo, x, y) {
  image(photo.pic, x, y, 370, 231);
  // a random part of the grain, so it flickers like a night-vision camera
  image(grain, x, y, 370, 231, random(370), random(231), 370, 231);
  // remember the photo under the mouse so the magnifier can zoom into it
  if (magnify && mouseX > x && mouseX < x + 370 && mouseY > y && mouseY < y + 231) {
    lens = { pic: photo.pic, x: x, y: y };
  }

  // label in a dark strip along the bottom of the photo
  fill(0, 150);
  rect(x, y + 211, 370, 20);
  fill(255);
  textAlign(LEFT);
  textSize(12);
  text(photo.label, x + 10, y + 226);
}

// Draws a 160x160 magnifier at the mouse, showing the photo under it 1.75 times bigger.
// It zooms into the full-size 800x500 photo, so the detail stays sharp.
function drawLens() {
  let scale = 800 / 370; // photo pixels per screen pixel
  let size = 160;
  let part = (size / 1.75) * scale; // how much of the photo fits in the magnifier
  let sx = (mouseX - lens.x) * scale - part / 2;
  let sy = (mouseY - lens.y) * scale - part / 2;
  image(lens.pic, mouseX - size / 2, mouseY - size / 2, size, size, sx, sy, part, part);
  noFill();
  stroke(255, 200, 0);
  strokeWeight(3);
  rect(mouseX - size / 2, mouseY - size / 2, size, size);
  noStroke();
}

// p5 calls this once per click. Each branch handles clicks for one screen.
function mousePressed() {
  if (screen == "title") {
    if (onButton(230, 350)) screen = "briefing";
    if (onButton(410, 350)) screen = "howto";
  } else if (screen == "howto") {
    if (onButton(320, 450)) screen = "title";
  } else if (screen == "briefing") {
    if (onButton(320, 450)) screen = "map";
  } else if (screen == "map") {
    // Clicking a place adds a camera there, or removes it if one is already there.
    // A click counts if it is within 20 pixels (the circle's radius) of the centre.
    for (let i = 0; i < 5; i++) {
      if (dist(mouseX, mouseY, placeX[i], placeY[i]) < 20) {
        if (cameras.includes(i)) {
          cameras.splice(cameras.indexOf(i), 1);
        } else if (cameras.length < 2) {
          cameras.push(i);
        }
      }
    }
    if (cameras.length == 2 && onButton(620, 530)) {
      screen = "night";
    }
  } else if (screen == "photos") {
    // which photo did they click (-1 means neither)
    let clicked = -1;
    if (mouseY > 100 && mouseY < 331) {
      if (mouseX > 20 && mouseX < 390) clicked = cameras[0];
      if (mouseX > 410 && mouseX < 780) clicked = cameras[1];
    }
    // Tell the player what the photo shows, and add its clue the first time it is found
    if (clicked != -1 && showOld && old[clicked]) {
      message = old[clicked].note;
    } else if (clicked != -1) {
      let event = events[night - 1][clicked];
      if (event.clue) {
        message = "Good eye! " + event.note;
        if (!clues.includes(event.clue)) clues.push(event.clue);
      } else {
        message = "Nothing wrong here. " + event.note;
      }
    }
    if ((old[cameras[0]] || old[cameras[1]]) && onButton(20, 530)) {
      showOld = !showOld;
    }
    for (let k = 0; k < 2; k++) {
      let x = 20 + k * 390;
      // Pin keeps the photo for comparing later (up to 12, and not the same one twice)
      let photo = shown(k);
      if (onButton(x, 340, 80) && pins.length < 12 && !pins.some((p) => p.pic == photo.pic)) {
        pins.push(photo);
      }
      // Next frame steps through the frames, going back to the first after the last
      if (hasFrames(k) && onButton(x + 90, 340, 130)) {
        frame[k] = (frame[k] + 1) % photos[night][cameras[k]].length;
      }
    }
    if (onButton(190, 530, 130)) magnify = !magnify;
    if (pins.length > 0 && onButton(330, 530, 130)) screen = "pins";
    // Next night / Finish button. Cameras stay where they were,
    // so the player can move them on the map.
    if (onButton(620, 530)) {
      message = "";
      showOld = false;
      if (night < 3) {
        night++;
        screen = "map";
      } else {
        screen = "end";
      }
    }
  } else if (screen == "end") {
    // Play again: reset everything and go back to the title
    if (onButton(320, 500)) {
      night = 1;
      cameras = [];
      clues = [];
      pins = [];
      chosen = [];
      magnify = false;
      screen = "title";
    }
  } else if (screen == "pins") {
    // Clicking a small photo chooses it (or un-chooses it).
    // Choosing a third replaces the one chosen first.
    for (let i = 0; i < pins.length; i++) {
      let x = 20 + (i % 6) * 130;
      let y = 330 + floor(i / 6) * 90;
      if (mouseX > x && mouseX < x + 120 && mouseY > y && mouseY < y + 75) {
        if (chosen.includes(i)) {
          chosen.splice(chosen.indexOf(i), 1);
        } else {
          chosen.push(i);
          if (chosen.length > 2) chosen.shift();
        }
      }
    }
    if (onButton(190, 530, 130)) magnify = !magnify;
    if (onButton(620, 530)) screen = "photos";
  }
}
