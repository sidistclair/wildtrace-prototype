// Wild Trace prototype
// TODO: a real report, better drawings

// Which screen is showing: "title", "howto", "briefing", "map", "night", "photos" or "end"
let screen = "title";

// The 5 camera spots. The same index is used in all three lists,
// e.g. index 2 is the Corridor at (500, 260).
let places = ["Forest", "Creek", "Corridor", "Farm", "Ridge Road"];
let placeX = [150, 280, 500, 650, 450];
let placeY = [180, 400, 260, 480, 100];
// Names used in the photo files, e.g. assets/photos/N2-corridor-frame-1.jpg
let ids = ["forest", "creek", "corridor", "farm", "ridge"];
let photos = {}; // photos[night][place] is that place's photo on that night

let cameras = []; // indexes of the places that have a camera (max 2)
let timer = 0;    // counts frames on the night screen
let message = ""; // feedback shown after clicking a photo
let night = 1;    // current night, 1 to 3
let clues = [];   // the clues the player has found so far
let showOld = false; // true while Dr. Okafor's old photos are showing

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
    { time: "20:30", note: "No animals, but there is a wire snare set on the path to the water.", clue: "Someone has set a snare by the creek." },
    { time: "00:30", note: "A badger reaches the half-built fence and has to turn back.", clue: "The new fence is cutting off the wildlife corridor." },
    { time: "02:31", note: "The fox from the forest, white-tipped tail and all, is raiding the farm's bins.", clue: "The forest fox has been pushed out to the farm." },
    { time: "23:50", note: "A dark pickup with a roof light bar and a dented tailgate drives the new road at night.", clue: "A mystery pickup is using the new road at night." },
  ],
  [ // night 3
    { time: "03:00", note: "Nothing. The forest is empty tonight.", clue: "" },
    { time: "04:05", note: "A person with a headlamp and a bright stripe on their sleeve kneels at the snare.", clue: "A hunter with a headlamp is checking the snare." },
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
  // Load the photo of every place on every night (15 in total)
  for (let n = 1; n <= 3; n++) {
    photos[n] = [];
    for (let i = 0; i < 5; i++) {
      photos[n][i] = loadPic("assets/photos/N" + n + "-" + ids[i] + "-frame-1.jpg", 800, 500);
    }
  }
  // Load Dr. Okafor's old photos
  for (let i = 0; i < 5; i++) {
    if (old[i]) old[i].pic = loadPic("assets/photos/" + old[i].file + "-frame-1.jpg", 800, 500);
  }
}

// p5 calls draw() about 60 times a second. Each branch draws one screen.
function draw() {
  if (screen == "title") {
    // Title screen: game name plus Start and How to play buttons
    background(10, 10, 40);
    fill(255);
    textAlign(CENTER);
    textSize(60);
    text("Wild Trace", 400, 220);
    button("Start", 230, 350);
    button("How to play", 410, 350);
  } else if (screen == "howto") {
    // How to play: the rules, then Back to the title
    background(40);
    fill(255);
    textAlign(LEFT);
    textSize(20);
    text("1. Click 2 places on the map to put your cameras.\n2. Start the night and wait for the photos.\n3. Click the photo that shows what's wrong.\n4. You have 3 nights, and you can move your cameras each night.", 60, 150);
    button("Back", 320, 450);
  } else if (screen == "briefing") {
    // Briefing: the story before the first night
    background(40);
    fill(255);
    textAlign(LEFT);
    textSize(20);
    text("Dr. Okafor, the researcher running the wildlife survey, has gone missing.\nA new fence and road are being built through the reserve.\nThe rangers think the animals are in trouble.\nYou have 3 nights to catch the problem on camera.\nCompare your photos with Dr. Okafor's old ones to spot what has changed.", 60, 180);
    button("Continue", 320, 450);
  } else if (screen == "map") {
    // Map: the player picks 2 places for the cameras
    background(100, 160, 90);
    // the fence grows north each night
    // (it starts at the bottom edge and ends at y = 420, 280 or 120)
    stroke(200);
    strokeWeight(4);
    line(500, 600, 500, [420, 280, 120][night - 1]);
    // the road goes from stakes to a dirt scar to finished
    if (night == 1) {
      // night 1: a row of stakes marking where the road will go
      stroke("sienna");
      for (let x = 0; x < 800; x += 40) line(x, 95, x, 105);
    } else {
      // night 2: brown dirt, night 3: grey finished road
      stroke(night == 2 ? "sienna" : "gray");
      strokeWeight(16);
      line(0, 100, 800, 100);
    }
    // reset the outline so the circles below draw normally
    stroke(0);
    strokeWeight(1);
    fill(0);
    textAlign(LEFT);
    textSize(20);
    text("Night " + night + ": click 2 places to put your cameras", 20, 30);

    // Draw each place as a circle with its name underneath.
    // Places with a camera are yellow, the rest are white.
    for (let i = 0; i < 5; i++) {
      if (cameras.includes(i)) {
        fill(255, 200, 0);
      } else {
        fill(255);
      }
      ellipse(placeX[i], placeY[i], 40, 40);
      fill(0);
      textAlign(CENTER);
      textSize(14);
      text(places[i], placeX[i], placeY[i] + 35);
    }

    // Only let the night start once both cameras are placed
    if (cameras.length == 2) {
      button("Start night", 620, 530);
    }
  } else if (screen == "night") {
    // Night: a short pause before the photos
    background(10, 10, 40);
    fill(255);
    textAlign(CENTER);
    textSize(40);
    text("Night " + night + "...", 400, 300);
    // 120 frames is about 2 seconds at 60 frames per second
    timer++;
    if (timer > 120) {
      timer = 0; // reset so the next night waits too
      screen = "photos";
    }
  } else if (screen == "photos") {
    // Photos: one photo from each camera, side by side
    background(40);
    fill(255);
    textAlign(LEFT);
    textSize(18);
    text("Click a photo if you think it shows something wrong in the reserve.", 20, 40);
    drawPhoto(cameras[0], 20, 100);
    drawPhoto(cameras[1], 410, 100);
    // Feedback from the last photo the player clicked, wrapped inside a 720x100 box
    fill(255);
    textAlign(CENTER);
    textSize(18);
    text(message, 40, 360, 720, 100);
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
    // After the last night the button goes to the end screen instead
    button(night < 3 ? "Next night" : "Finish", 620, 530);
  } else if (screen == "end") {
    // End: list every clue the player found
    background(10, 10, 40);
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
  }
}

// Draws a yellow 160x50 button with its top-left corner at (x, y)
function button(label, x, y) {
  fill(255, 200, 0);
  rect(x, y, 160, 50);
  fill(0);
  textAlign(CENTER);
  textSize(20);
  text(label, x + 80, y + 32);
}

// True if the mouse is inside the button drawn at (x, y)
function onButton(x, y) {
  return mouseX > x && mouseX < x + 160 && mouseY > y && mouseY < y + 50;
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

// Draws the photo for one place on the current night, with its top-left corner at (x, y).
// The photos are 800x500 and are shown here at 370x231.
// While showOld is on, places that have one show Dr. Okafor's old photo instead.
function drawPhoto(place, x, y) {
  let showingOld = showOld && old[place];
  image(showingOld ? old[place].pic : photos[night][place], x, y, 370, 231);

  // camera label in a dark strip along the bottom of the photo
  fill(0, 150);
  rect(x, y + 211, 370, 20);
  fill(255);
  textAlign(LEFT);
  textSize(12);
  if (showingOld) {
    text("DR. OKAFOR - " + places[place] + " - " + old[place].when, x + 10, y + 226);
  } else {
    text("CAM - " + places[place] + " - NIGHT " + night + " - " + events[night - 1][place].time, x + 10, y + 226);
  }
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
      screen = "title";
    }
  }
}
