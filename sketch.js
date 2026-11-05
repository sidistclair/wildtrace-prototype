// Wild Trace prototype
// TODO: a real report

// ---------- Fonts and colours ----------

// Loaded from Google Fonts in index.html
const MARKER = "Permanent Marker"; // big titles, stamps and sticky notes
const HAND = "Caveat";             // handwriting in the journal and on the map
const TYPE = "Special Elite";      // typewriter labels
const PIXEL = "VT323";             // the trail camera's screen

const INK = "#2b2b2b";     // pencil and marker on paper
const BLUE = "#26406b";    // pen ink in Dr. Okafor's journal
const PAPER = "#f3ead4";
const STICKY = "#f6d860";  // yellow sticky notes
const SCREEN = "#a6f5a0";  // green text on the camera screen

// ---------- Game data ----------

// Which screen is showing: "title", "briefing", "plan", "watch", "review" or "end"
let screen = "title";
let help = false; // true while the How to play page is open

// The 5 camera spots. The same index is used in every list,
// e.g. index 2 is the Wildlife Corridor.
let places = ["Old Forest", "Creek Crossing", "Wildlife Corridor", "Farm Edge", "Ridge Road"];
// Names used in the art files, e.g. assets/photos/N2-corridor-frame-1.jpg
let ids = ["forest", "creek", "corridor", "farm", "ridge"];
// Where each place is on the map, as a fraction of the map's width and height
let mapX = [0.24, 0.4, 0.69, 0.84, 0.6];
let mapY = [0.34, 0.63, 0.42, 0.78, 0.16];
// The paper map is pinned to the corkboard in this box
const MAP = { x: 70, y: 95, w: 760, h: 530 };

let night = 1;              // current night, 1 to 3
let cameras = [null, null]; // the place each camera is at (null = not placed yet)
let timer = 0;              // frames since the night started
let flash = 0;              // brightness of a camera flash on the watch screen, fades to 0
let clues = [];             // the clues the player has found so far
let seen = [];              // the photos the player has taken, as "night-place"
let pins = [];              // pinned photos, each { key, pic }

// The review screen
let current = 0;        // which camera's photo is showing (0 or 1)
let frame = [0, 0];     // which frame each camera's photo is on
let message = "";       // what the player learned from the last photo they flagged
let comparing = false;  // true while an earlier photo is shown next to the current one
let earlier = 0;        // which earlier photo is being compared
let inspecting = false; // true while the photos zoom in under the mouse

// Mouse
let click = false;    // true for the one frame after a click
let hovering = false; // true when the mouse is over something clickable

// What each camera sees: events[night - 1][place].
// note describes the photo. clue is filled in when the photo shows something wrong,
// and tag is the short name written on its polaroid on the results board.
// The same animals keep coming back: the fox (F1) has a white-tipped tail,
// and the doe (D2) has a pale mark on her shoulder and a spotted fawn.
let events = [
  [ // night 1
    { time: "22:14", note: "A doe with a pale shoulder mark grazes with her spotted fawn. A fox with a white-tipped tail trots past.", clue: "" },
    { time: "05:40", note: "An otter by the water, then the doe and her fawn come down to drink.", clue: "" },
    { time: "01:10", note: "The fox and a badger travel along the corridor. Later a buck walks through.", clue: "" },
    { time: "23:55", note: "Just the farm dog sniffing around the bins.", clue: "" },
    { time: "14:20", note: "Daytime. Workers from Ridgeline Developments mark out a road next to their yellow truck.", clue: "A construction crew is marking out a new road on the ridge.", tag: "road crew" },
  ],
  [ // night 2
    { time: "21:48", note: "The doe and her fawn again.", clue: "" },
    { time: "20:30", note: "No animals, but there is a wire snare set on the path to the water. Later the doe and her fawn walk right past it.", clue: "Someone has set a snare by the creek.", tag: "snare!" },
    { time: "00:30", note: "A badger reaches the half-built fence and has to turn back.", clue: "The new fence is cutting off the wildlife corridor.", tag: "fence" },
    { time: "02:31", note: "The fox from the forest, white-tipped tail and all, is raiding the farm's bins.", clue: "The forest fox has been pushed out to the farm.", tag: "fox at farm" },
    { time: "23:50", note: "A dark pickup with a roof light bar and a dented tailgate drives the new road at night. Two hours later a gloved hand grabs the camera.", clue: "A mystery pickup is using the new road at night.", tag: "night pickup" },
  ],
  [ // night 3
    { time: "03:00", note: "Nothing. The forest is empty tonight.", clue: "" },
    { time: "04:05", note: "A person with a headlamp and a bright stripe on their sleeve kneels at the snare. Fifteen minutes later the snare is gone, leaving only holes.", clue: "A hunter with a headlamp is checking the snare.", tag: "hunter" },
    { time: "23:10", note: "The doe and her fawn reach the finished fence and can't get through.", clue: "The finished fence stops the doe and fawn using the corridor.", tag: "fence closed" },
    { time: "03:30", note: "The doe and her fawn from the reserve are eating the farm's crops.", clue: "The doe and fawn have been pushed out to the farm.", tag: "deer at farm" },
    { time: "04:20", note: "The same dark pickup, seen from behind. The plate reads K7R-418.", clue: "The pickup is back, and its plate is K7R-418.", tag: "K7R-418" },
  ],
];
// How many frames each camera took: frameCounts[night - 1][place]
let frameCounts = [[2, 2, 2, 1, 1], [1, 2, 2, 2, 2], [2, 2, 2, 2, 1]];

// Dr. Okafor's old photos, shown in the journal and compared with yours
let archive = [
  { file: "ARC-1", place: 0, when: "6 weeks ago", note: "Dr. Okafor's photo: the same fox, back when it lived in the forest." },
  { file: "ARC-2", place: 2, when: "6 weeks ago", note: "Dr. Okafor's photo: the doe and her fawn walking freely through the corridor, before the fence." },
  { file: "ARC-3", place: 4, when: "4 weeks ago", note: "Dr. Okafor's photo: the ridge before any road was built." },
  { file: "ARC-4", place: 4, when: "9 days ago", note: "Dr. Okafor's photo: headlights on the ridge at night, just before the camera stopped working." },
];
// Dr. Okafor's last notes, written in the journal
let notes = ["Corridor numbers dropping.", "Fox seen near the farm??", "Someone's been at my cameras."];

// ---------- Artwork ----------

let photos = {};  // photos[night][place][frame] is one frame from that place on that night
let maps = {};    // maps[night] is the painted reserve map for that night
let icons = {};   // icons for the trail camera's keys
let titlePic;
// Textures drawn once in setup()
let wood, cork, camo, grain, scanlines;

function setup() {
  // The game is always drawn at 1280x720. style.css scales it to fit the window.
  createCanvas(1280, 720);
  // Draw at double resolution so the canvas stays sharp when scaled up
  pixelDensity(2);
  // Ask the browser to download the fonts now, so they are ready when they are first drawn
  for (let f of [MARKER, HAND, TYPE, PIXEL]) document.fonts.load('20px "' + f + '"');

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
  for (let a of archive) a.pic = loadPic("assets/photos/" + a.file + "-frame-1.jpg", 800, 500);
  for (let n = 1; n <= 3; n++) maps[n] = loadPic("assets/map/night-" + n + ".jpg", 1720, 1200);
  titlePic = loadPic("assets/screens/title-background.jpg", 1920, 1080);
  for (let name of ["left", "right", "zoom", "pin", "compare", "warning", "camera"]) {
    icons[name] = loadPic("assets/ui/icons/" + name + "-light.png", 96, 96);
  }
  makeTextures();
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

// Draws the wood, cork, camouflage, grain and scanline textures once,
// so draw() only has to copy them onto the screen
function makeTextures() {
  // Wooden desk: planks 120 pixels tall, with grain made from noise
  wood = createGraphics(1280, 720);
  wood.pixelDensity(1);
  wood.noStroke();
  for (let y = 0; y < 720; y++) {
    let plank = floor(y / 120);
    let c = map(noise(y * 0.07, plank * 9), 0, 1, 55, 115);
    wood.fill(c * 1.3, c * 0.88, c * 0.56);
    wood.rect(0, y, 1280, 1);
    if (y % 120 == 0) {
      wood.fill(30, 18, 10);
      wood.rect(0, y, 1280, 3);
    }
  }
  // Corkboard: brown base with thousands of darker and lighter specks
  cork = createGraphics(1280, 720);
  cork.pixelDensity(1);
  cork.background(181, 135, 86);
  cork.noStroke();
  for (let i = 0; i < 40000; i++) {
    let c = random(110, 215);
    cork.fill(c, c * 0.72, c * 0.45, 170);
    cork.circle(random(1280), random(720), random(1, 3.5));
  }
  // Camouflage for the trail camera's body
  camo = createGraphics(880, 672);
  camo.pixelDensity(1);
  camo.background("#46503a");
  camo.noStroke();
  for (let i = 0; i < 90; i++) {
    camo.fill(random(["#2f3727", "#5d6743", "#3b4530", "#6e6c4c"]));
    camo.ellipse(random(880), random(672), random(80, 200), random(50, 120));
  }
  // Night-vision grain: random light and dark speckles. It is bigger than the photos
  // so drawPhoto() can show a different part of it every frame, which makes it flicker.
  grain = createGraphics(1200, 750);
  grain.pixelDensity(1);
  for (let i = 0; i < 30000; i++) {
    grain.stroke(random(255), random(20, 70));
    grain.point(random(1200), random(750));
  }
  // Thin dark lines across the camera screen
  scanlines = createGraphics(640, 400);
  scanlines.pixelDensity(1);
  scanlines.stroke(0, 45);
  for (let y = 0; y < 400; y += 3) scanlines.line(0, y, 640, y);
}

// ---------- Main loop ----------

// p5 calls draw() about 60 times a second
function draw() {
  hovering = false;
  noStroke();
  // While the How to play page is open, clicks only reach the page
  let realClick = click;
  if (help) click = false;

  if (screen == "title") drawTitle();
  else if (screen == "briefing") drawBriefing();
  else if (screen == "plan") drawPlan();
  else if (screen == "watch") drawWatch();
  else if (screen == "review") drawReview();
  else if (screen == "end") drawEnd();

  click = realClick;
  if (help) {
    hovering = false;
    drawHelp();
  } else if (screen != "title" && helpButton(1236, 40)) {
    help = true;
  }
  // A hand cursor shows what can be clicked
  cursor(hovering ? HAND : ARROW);
  click = false;
}

// p5 calls this once per click. The click is handled by the buttons in the next draw().
function mousePressed() {
  click = true;
}

// Keyboard shortcuts (listed on the How to play page)
function keyPressed() {
  if (keyCode == ESCAPE) {
    help = false;
    comparing = false;
  }
  if (help) return;
  if (screen == "plan" && key >= "1" && key <= "5") placeCamera(int(key) - 1);
  if (screen == "watch" && key == " ") startReview();
  if (screen == "review") {
    if (keyCode == LEFT_ARROW) stepFrame(-1);
    if (keyCode == RIGHT_ARROW) stepFrame(1);
    if (keyCode == UP_ARROW || keyCode == DOWN_ARROW) chooseCamera(1 - current);
    let k = key.toLowerCase();
    if (k == "f") flagPhoto();
    if (k == "p") togglePin();
    if (k == "c" && earlierPhotos().length > 0) toggleCompare();
    if (k == "v") inspecting = !inspecting;
  }
}

// ---------- Screens ----------

// Title: the forest painting seen through a camera's viewfinder
function drawTitle() {
  image(titlePic, 0, 0, 1280, 720);
  // darken the left side so the title stands out
  for (let x = 0; x < 900; x += 4) {
    fill(5, 12, 8, map(x, 0, 900, 200, 0));
    rect(x, 0, 4, 720);
  }
  viewfinder("CAM 1", "IR NIGHT MODE");

  shadowOn(8);
  push();
  translate(90, 330);
  rotate(-0.04);
  txt("WILD TRACE", 0, 0, 118, "#f4efe2", MARKER);
  pop();
  shadowOff();
  txt("three nights. two cameras. one missing researcher.", 98, 392, 38, "#e9e2cf", HAND);

  if (noteButton("Start", 96, 450, 200, 84)) screen = "briefing";
  if (noteButton("How to play", 326, 456, 250, 84, PAPER, 0.03)) help = true;
}

// Briefing: Dr. Okafor's journal lying open on the desk
function drawBriefing() {
  desk();
  // the two pages and the shadow of the spine
  shadowOn(20);
  fill(PAPER);
  rect(70, 40, 1130, 580, 6);
  shadowOff();
  fill(0, 30);
  rect(625, 40, 30, 580);
  stroke(70, 110, 170, 60);
  for (let y = 120; y < 600; y += 34) {
    line(90, y, 620, y);
    line(660, y, 1180, y);
  }
  stroke(200, 70, 70, 90);
  line(130, 40, 130, 620);
  noStroke();

  // Left page: the notes
  txt("Field notes — Dr. A. Okafor", 145, 106, 36, BLUE, HAND, LEFT, BOLD);
  for (let i = 0; i < notes.length; i++) txt(notes[i], 150, 182 + i * 68, 32, BLUE, HAND);
  push();
  translate(150, 392);
  rotate(-0.03);
  txt("NEED PROOF BEFORE THE HEARING!", 0, 0, 34, "#a3312b", HAND, LEFT, BOLD);
  fill("#a3312b");
  rect(0, 8, 430, 3);
  pop();
  // a coffee ring
  noFill();
  stroke(110, 70, 30, 50);
  strokeWeight(7);
  arc(540, 540, 150, 150, 0.4, 5.6);
  strokeWeight(1);
  noStroke();
  // a sticky note left for the player
  stickyNote(160, 430, 280, 170, -0.04, "Okafor is missing.\nTake the 2 cameras.\n3 nights until the hearing.");

  // Right page: Okafor's old photos taped in
  let spots = [[790, 205, -0.05], [1065, 215, 0.04], [795, 455, 0.03], [1070, 450, -0.04]];
  for (let i = 0; i < 4; i++) {
    let [x, y, r] = spots[i];
    polaroid(archive[i].pic, x, y, 220, r, places[archive[i].place] + " · " + archive[i].when);
    tape(x, y - 100, r + 0.1);
  }

  if (noteButton("Take the cameras →", 930, 628, 300, 72)) screen = "plan";
}

// Plan: the paper map pinned to a corkboard, with the cameras on the desk next to it
function drawPlan() {
  desk();
  // the corkboard in its wooden frame
  shadowOn(16);
  fill("#4a2e1a");
  rect(30, 24, 850, 672, 6);
  shadowOff();
  image(cork, 44, 38, 822, 644, 0, 0, 822, 644);

  // the map, pinned at the corners, and a label taped above it
  shadowOn(10);
  fill(PAPER);
  rect(MAP.x - 8, MAP.y - 8, MAP.w + 16, MAP.h + 16);
  shadowOff();
  image(maps[night], MAP.x, MAP.y, MAP.w, MAP.h);
  for (let [x, y] of [[MAP.x + 6, MAP.y + 4], [MAP.x + MAP.w - 6, MAP.y + 4], [MAP.x + 6, MAP.y + MAP.h - 4], [MAP.x + MAP.w - 6, MAP.y + MAP.h - 4]]) {
    pushpin(x, y, "#c0392b");
  }
  paperLabel("Where should the cameras go?", 450, 64, -0.01);

  // the 5 places: a pin and a handwritten tag, or a camera if one is there
  let focus = -1; // the place whose old photo is shown on the desk
  for (let i = 0; i < 5; i++) {
    if (mapSpot(i)) placeCamera(i);
    if (inside(...spotBox(i))) focus = i;
  }

  // Right side of the desk: the calendar, the cameras and Okafor's photo of a place
  calendar(925, 40, -0.03);
  for (let k = 0; k < 2; k++) deskCamera(k);
  if (focus == -1) focus = cameras[1] != null ? cameras[1] : cameras[0] != null ? cameras[0] : -1;
  let old = focus == -1 ? [] : archive.filter((a) => a.place == focus);
  if (focus == -1) {
    stickyNote(930, 380, 300, 180, 0.03, "Point at a place on the map to see Okafor's old photo of it.", PAPER);
  } else if (old.length == 0) {
    stickyNote(930, 380, 300, 180, 0.03, places[focus] + ":\nno photos from here yet. Yours will be the first!", PAPER);
  } else {
    let a = old[old.length - 1];
    polaroid(a.pic, 1080, 470, 270, 0.03, places[focus] + " · " + a.when);
    tape(1080, 362, 0.08);
  }

  let placed = cameras.filter((c) => c != null).length;
  if (noteButton(placed < 2 ? "Place " + (2 - placed) + " more" : "Set the cameras →", 930, 628, 300, 72, STICKY, -0.02, placed < 2)) {
    timer = 0;
    screen = "watch";
  }
}

// Watch: the night passes on a glowing clock while the cameras record
function drawWatch() {
  // the forest at night, very dark and blue
  image(titlePic, 0, 0, 1280, 720);
  fill(4, 8, 24, 215);
  rect(0, 0, 1280, 720);

  // The night runs from 20:00 to 06:00 in 180 frames (about 3 seconds)
  timer++;
  let progress = constrain(timer / 180, 0, 1);
  let minutes = 20 * 60 + progress * 600;
  let h = floor(minutes / 60) % 24;
  let m = floor(minutes % 60);

  txt("night " + night, 640, 150, 54, "#d8d2c0", HAND, CENTER, BOLD);
  // the clock, with a green glow
  drawingContext.shadowColor = "rgba(120, 255, 140, 0.7)";
  drawingContext.shadowBlur = 24;
  txt(nf(h, 2) + ":" + nf(m, 2), 640, 330, 190, SCREEN, PIXEL, CENTER);
  shadowOff();
  // a row of dots from dusk to dawn
  for (let i = 0; i <= 20; i++) {
    fill(i / 20 <= progress ? SCREEN : color(80, 110, 90));
    circle(440 + i * 20, 380, 7);
  }
  txt("20:00", 400, 410, 26, "#8fa797", PIXEL, CENTER);
  txt("06:00", 880, 410, 26, "#8fa797", PIXEL, CENTER);

  // A readout for each camera. It flashes when that camera takes its photo.
  for (let k = 0; k < 2; k++) {
    let x = 330 + k * 340;
    let t = events[night - 1][cameras[k]].time.split(":");
    let since = (int(t[0]) * 60 + int(t[1]) - 20 * 60 + 1440) % 1440; // minutes after 20:00
    let snap = abs(minutes - 20 * 60 - since) < 25;
    if (snap && flash < 10) flash = 120;
    fill(snap ? color(240, 255, 240, 230) : color(10, 20, 14, 220));
    stroke(80, 120, 90);
    rect(x, 470, 300, 90, 10);
    noStroke();
    let col = snap ? "#10200f" : SCREEN;
    txt("CAM " + (k + 1), x + 20, 504, 30, col, PIXEL);
    txt(places[cameras[k]].toUpperCase(), x + 20, 540, 26, col, PIXEL);
    if (snap) {
      txt("CLICK!", x + 280, 504, 30, "#10200f", PIXEL, RIGHT);
    } else if (frameCount % 60 < 40) {
      fill("#ff4a3d");
      circle(x + 230, 495, 12);
      txt("REC", x + 280, 504, 26, "#ff8a80", PIXEL, RIGHT);
    }
  }
  // the whole screen lights up for a moment when a photo is taken
  if (flash > 0) {
    fill(255, flash * 0.5);
    rect(0, 0, 1280, 720);
    flash -= 12;
  }

  if (deviceButton("SKIP TO MORNING ▸▸", 1000, 630, 240) || timer > 180) startReview();
}

// Review: the trail camera on the desk, showing the night's photos on its screen
function drawReview() {
  desk();
  let place = cameras[current];
  let list = earlierPhotos();
  let pinned = isPinned();
  let n = photos[night][place].length;

  // the camera's body
  shadowOn(26);
  fill("#46503a");
  rect(24, 24, 880, 672, 48);
  shadowOff();
  drawingContext.save();
  drawingContext.beginPath();
  drawingContext.roundRect(24, 24, 880, 672, 48);
  drawingContext.clip();
  image(camo, 24, 24);
  drawingContext.restore();
  txt("WILDTRACE TC-2   TRAIL CAMERA", 70, 66, 15, "rgba(255,255,255,0.6)", TYPE);

  // the screen
  fill(12);
  rect(60, 80, 688, 440, 18);
  fill(0);
  rect(84, 100, 640, 400);
  if (comparing) {
    // the current photo and an earlier one side by side
    let e = list[earlier];
    drawPhoto(currentPic(), 84, 200, 318, 199);
    drawPhoto(e.pic, 406, 200, 318, 199);
    screenText("NOW · NIGHT " + night, 94, 190);
    screenText("THEN · " + e.title.toUpperCase(), 416, 190);
    screenText(e.note, 94, 440, 24, 620);
  } else {
    drawPhoto(currentPic(), 84, 100, 640, 400);
  }
  image(scanlines, 84, 100);
  // the information along the top and bottom of the screen
  if (frameCount % 60 < 40) {
    fill("#ff4a3d");
    circle(104, 120, 12);
  }
  screenText("PLAYBACK  CAM " + (current + 1), 116, 128);
  screenText(places[place].toUpperCase(), 712, 128, 26, 0, RIGHT);
  screenText("NIGHT " + night + "  " + events[night - 1][place].time, 96, 488);
  screenText("FRAME " + (frame[current] + 1) + "/" + n + "   BAT ▮▮▮▯", 712, 488, 26, 0, RIGHT);
  if (pinned) screenText("[ PINNED ]", 404, 128, 26, 0, CENTER, "#ffd866");
  if (inspecting) screenText("ZOOM 1.75x", 404, 488, 26, 0, CENTER, "#ffd866");

  // the keys under the screen
  if (deviceKey("left", "PREV", 84, 556, frame[current] == 0)) stepFrame(-1);
  if (deviceKey("right", "NEXT", 192, 556, frame[current] == n - 1)) stepFrame(1);
  if (deviceKey("zoom", "ZOOM", 300, 556, false, inspecting)) inspecting = !inspecting;
  if (deviceKey("pin", "PIN", 408, 556, false, pinned)) togglePin();
  if (deviceKey("compare", "COMPARE", 516, 556, list.length == 0, comparing)) toggleCompare();
  // a speaker grille
  fill(0, 90);
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) circle(670 + i * 14, 576 + j * 14, 6);

  // the camera switch and the big red flag button on the right
  txt("CAMERA", 822, 108, 14, "rgba(255,255,255,0.7)", TYPE, CENTER);
  for (let k = 0; k < 2; k++) {
    if (deviceKey("camera", "CAM " + (k + 1), 776, 122 + k * 96, false, k == current)) chooseCamera(k);
  }
  if (flagButton(822, 410)) flagPhoto();

  // Next to the camera: the calendar and a sticky note with what the player has learned
  calendar(940, 40, 0.03);
  let tonight = events[night - 1];
  let hint = !tonight[cameras[0]].clue && !tonight[cameras[1]].clue
    ? "Hmm... nothing looks wrong at these places tonight. Try other spots next night."
    : "Look closely at both cameras. Hit the red FLAG button if something looks wrong.";
  stickyNote(925, 220, 320, 330, -0.02, message || hint);
  if (message.startsWith("Good")) stamp("EVIDENCE", 1150, 520, -0.2, color(190, 40, 40, 220), 30);

  let last = night == 3;
  if (noteButton(last ? "Open the case →" : "Next night →", 940, 628, 290, 72)) {
    if (last) {
      screen = "end";
    } else {
      night++;
      screen = "plan";
    }
  }
}

// Results: every clue pinned to a corkboard, stamped FOUND or MISSED
function drawEnd() {
  background("#4a2e1a");
  image(cork, 16, 16, 1248, 688, 0, 0, 1248, 688);

  // the case file card
  shadowOn(10);
  fill(250);
  rect(40, 30, 500, 96);
  shadowOff();
  fill("#c0392b");
  rect(40, 60, 500, 2);
  txt("CASE FILE: WILLOWMERE", 60, 52, 22, INK, TYPE);
  txt("What did your cameras catch?", 60, 108, 36, INK, HAND, LEFT, BOLD);
  pushpin(290, 38, "#2e6fb5");

  // one polaroid per clue, with a red string joining the ones the player found
  let all = [];
  for (let n = 1; n <= 3; n++) {
    for (let p = 0; p < 5; p++) if (events[n - 1][p].clue) all.push({ e: events[n - 1][p], pic: photos[n][p][0] });
  }
  let spots = all.map((c, i) => [110 + (i < 5 ? i : i - 5 + 0.5) * 175, i < 5 ? 260 : 505, ((i * 7) % 5 - 2) * 0.02]);
  stroke(190, 30, 30);
  strokeWeight(3);
  noFill();
  let prev = null;
  for (let i = 0; i < all.length; i++) {
    if (!clues.includes(all[i].e.clue)) continue;
    let [x, y] = spots[i];
    if (prev) bezier(prev[0], prev[1] - 95, prev[0], prev[1] - 40, x, y - 40, x, y - 95);
    prev = [x, y];
  }
  noStroke();
  strokeWeight(1);
  let hovered = null;
  for (let i = 0; i < all.length; i++) {
    let [x, y, r] = spots[i];
    let got = clues.includes(all[i].e.clue);
    polaroid(all[i].pic, x, y, 150, r, all[i].e.tag, !got);
    pushpin(x, y - 95, got ? "#c0392b" : "#777");
    stamp(got ? "FOUND" : "MISSED", x, y - 10, r - 0.25, got ? color(40, 130, 60, 230) : color(190, 40, 40, 220), 24);
    if (inside(x - 85, y - 95, 170, 190)) hovered = all[i].e.clue;
  }
  // the full clue for the polaroid under the mouse
  fill(250);
  rect(40, 650, 860, 44);
  txt(hovered || "Point at a photo to read the clue.", 56, 680, 18, hovered ? INK : "#888", TYPE);

  // the score card
  let n = clues.length;
  shadowOn(12);
  push();
  translate(1070, 225);
  rotate(0.02);
  fill(250);
  rect(-150, -180, 300, 330);
  shadowOff();
  txt(n + "/" + all.length, 0, -70, 96, INK, MARKER, CENTER);
  txt("clues found", 0, -28, 32, INK, HAND, CENTER, BOLD);
  let outcome = n == all.length
    ? "The hearing stops the building and orders a wildlife crossing. Rangers start night patrols."
    : n >= 5 ? "The hearing hears about some of the damage, but part of the story stayed hidden."
      : "With so few clues, construction carries on. Try watching different spots next time.";
  txtBox(outcome, -130, -10, 260, 150, 26, BLUE, HAND);
  pop();
  pushpin(1070, 54, "#e0a526");

  // the player's pinned photos
  txt(pins.length ? "your pins:" : "you didn't pin any photos", 960, 400, 30, "#2b1a0e", HAND, LEFT, BOLD);
  for (let i = 0; i < min(pins.length, 3); i++) {
    polaroid(pins[i].pic, 1000 + i * 95, 485, 96, (i - 1) * 0.06, "");
  }

  if (noteButton("Play again ↺", 950, 610, 280, 76)) {
    night = 1;
    cameras = [null, null];
    clues = [];
    seen = [];
    pins = [];
    screen = "title";
  }
}

// The How to play page, drawn over whatever screen is showing
function drawHelp() {
  fill(0, 160);
  rect(0, 0, 1280, 720);
  push();
  translate(640, 360);
  rotate(-0.015);
  shadowOn(30);
  fill(PAPER);
  rect(-360, -300, 720, 600, 4);
  shadowOff();
  stroke(70, 110, 170, 60);
  for (let y = -200; y < 280; y += 40) line(-330, y, 330, y);
  noStroke();
  txt("How to play", -320, -230, 54, INK, MARKER);
  let steps = [
    "1. Each evening, pin your 2 cameras to places on the map.",
    "2. Wait for morning, or skip ahead.",
    "3. Check the photos on the trail camera: flip frames, zoom, and compare with older photos.",
    "4. Hit the red FLAG button when something looks wrong. 9 clues to find in 3 nights!",
  ];
  let y = -168;
  for (let s of steps) {
    txtBox(s, -320, y, 640, 90, 30, BLUE, HAND, 40);
    y += s.length > 60 ? 80 : 40;
  }
  txt("keys:  ← → frames   ↑ ↓ camera   F flag   P pin   C compare   V zoom   Esc close", -320, 200, 15, INK, TYPE);
  pop();
  if (noteButton("Got it!", 790, 560, 180, 66)) help = false;
}

// ---------- Review actions (used by the keys and the keyboard) ----------

// Moves to the end of the night: remembers which photos were taken and resets the review tools
function startReview() {
  for (let k = 0; k < 2; k++) seen.push(night + "-" + cameras[k]);
  frame = [0, 0];
  flash = 0;
  chooseCamera(0);
  screen = "review";
}

function chooseCamera(k) {
  current = k;
  message = "";
  comparing = false;
  earlier = 0;
}

function stepFrame(d) {
  frame[current] = constrain(frame[current] + d, 0, photos[night][cameras[current]].length - 1);
}

// Tells the player what the photo shows, and adds its clue the first time it is found
function flagPhoto() {
  let event = events[night - 1][cameras[current]];
  if (event.clue) {
    message = "Good eye! " + event.note;
    if (!clues.includes(event.clue)) clues.push(event.clue);
  } else {
    message = "Nothing wrong here. " + event.note;
  }
}

function togglePin() {
  let key = night + "-" + cameras[current] + "-" + frame[current];
  let i = pins.findIndex((p) => p.key == key);
  if (i == -1) pins.push({ key: key, pic: currentPic() });
  else pins.splice(i, 1);
}

function isPinned() {
  return pins.some((p) => p.key == night + "-" + cameras[current] + "-" + frame[current]);
}

// Opens the comparison, or shows the next earlier photo if it is already open.
// Closes it after the last one.
function toggleCompare() {
  if (!comparing) {
    comparing = true;
    earlier = 0;
  } else if (earlier < earlierPhotos().length - 1) {
    earlier++;
  } else {
    comparing = false;
  }
}

function currentPic() {
  return photos[night][cameras[current]][frame[current]];
}

// Earlier photos of the place the current camera is at, newest first:
// the player's own photos from earlier nights, then Dr. Okafor's
function earlierPhotos() {
  let place = cameras[current];
  let list = [];
  for (let n = night - 1; n >= 1; n--) {
    if (seen.includes(n + "-" + place)) {
      list.push({ pic: photos[n][place][0], title: "Night " + n, note: "YOUR PHOTO FROM NIGHT " + n });
    }
  }
  for (let i = archive.length - 1; i >= 0; i--) {
    let a = archive[i];
    if (a.place == place) list.push({ pic: a.pic, title: "Okafor " + a.when, note: a.note.replace("Dr. Okafor's photo: ", "").toUpperCase() });
  }
  return list;
}

// Puts the next free camera at a place, or takes it back if a camera is already there
function placeCamera(i) {
  let k = cameras.indexOf(i);
  if (k != -1) cameras[k] = null;
  else if (cameras.indexOf(null) != -1) cameras[cameras.indexOf(null)] = i;
}

// ---------- Drawing helpers ----------

// Text in one call: txt("Hello", x, y, size, colour, font, align, style)
function txt(s, x, y, size, col, font, align = LEFT, style = NORMAL) {
  fill(col);
  textFont(font);
  textStyle(style);
  textSize(size);
  textAlign(align, BASELINE);
  text(s, x, y);
}

// Text that wraps inside a box
function txtBox(s, x, y, w, h, size, col, font, leading = size * 1.15) {
  fill(col);
  textFont(font);
  textStyle(NORMAL);
  textSize(size);
  textAlign(LEFT, TOP);
  textLeading(leading);
  text(s, x, y, w, h);
  textAlign(LEFT, BASELINE);
}

// Soft drop shadows under paper, photos and the camera
function shadowOn(blur) {
  drawingContext.shadowColor = "rgba(0, 0, 0, 0.5)";
  drawingContext.shadowBlur = blur;
  drawingContext.shadowOffsetY = blur / 3;
}

function shadowOff() {
  drawingContext.shadowColor = "rgba(0, 0, 0, 0)";
  drawingContext.shadowBlur = 0;
  drawingContext.shadowOffsetY = 0;
}

function inside(x, y, w, h) {
  return mouseX > x && mouseX < x + w && mouseY > y && mouseY < y + h;
}

// The wooden desk, darker towards the edges
function desk() {
  image(wood, 0, 0);
  noFill();
  strokeWeight(40);
  for (let i = 0; i < 12; i++) {
    stroke(0, 14);
    rect(-20 + i * 14, -20 + i * 14, 1320 - i * 28, 760 - i * 28);
  }
  noStroke();
  strokeWeight(1);
}

// A sticky note used as a button. Returns true if it was clicked.
// off makes it faded and unclickable.
function noteButton(label, x, y, w, h, col = STICKY, rot = -0.02, off = false) {
  let hot = !off && inside(x, y, w, h);
  if (hot) hovering = true;
  push();
  translate(x + w / 2, y + h / 2);
  rotate(rot);
  if (hot) scale(1.05); // lifts up a little under the mouse
  shadowOn(hot ? 18 : 10);
  fill(off ? "#c9be95" : col);
  rect(-w / 2, -h / 2, w, h, 2);
  shadowOff();
  fill(0, 18);
  rect(-w / 2, -h / 2, w, 12); // the sticky strip along the top
  // shrink the label if it is too wide for the note
  textFont(MARKER);
  textSize(h * 0.42);
  let size = min(h * 0.42, (h * 0.42 * (w - 36)) / textWidth(label));
  txt(label, 0, size * 0.3, size, off ? "#7d7560" : INK, MARKER, CENTER);
  pop();
  return hot && click;
}

// A round paper tag with a question mark that opens How to play
function helpButton(x, y) {
  let hot = dist(mouseX, mouseY, x, y) < 22;
  if (hot) hovering = true;
  shadowOn(8);
  fill(hot ? "#fff6dc" : PAPER);
  circle(x, y, 44);
  shadowOff();
  txt("?", x, y + 11, 30, INK, MARKER, CENTER);
  return hot && click;
}

// A sticky note with handwriting on it
function stickyNote(x, y, w, h, rot, words, col = STICKY) {
  push();
  translate(x + w / 2, y + h / 2);
  rotate(rot);
  shadowOn(12);
  fill(col);
  rect(-w / 2, -h / 2, w, h, 2);
  shadowOff();
  fill(0, 15);
  rect(-w / 2, -h / 2, w, 14);
  txtBox(words, -w / 2 + 18, -h / 2 + 22, w - 36, h - 30, 30, INK, HAND, 32);
  pop();
}

// A strip of white paper with a marker label, taped up at one corner
function paperLabel(words, x, y, rot) {
  textFont(MARKER);
  textSize(26);
  let w = textWidth(words) + 40;
  push();
  translate(x, y);
  rotate(rot);
  shadowOn(6);
  fill(250);
  rect(-w / 2, -24, w, 48);
  shadowOff();
  txt(words, 0, 10, 26, INK, MARKER, CENTER);
  pop();
  tape(x - w / 2 + 10, y - 20, -0.6);
}

// A polaroid photo, centred at (x, y) and turned by rot.
// dim darkens the photo (used for missed clues).
function polaroid(pic, x, y, w, rot, caption, dim = false) {
  let ph = (w * 5) / 8;
  let h = ph + 8 + (caption ? 40 : 14);
  push();
  translate(x, y);
  rotate(rot);
  shadowOn(12);
  fill("#f8f5ee");
  rect(-w / 2 - 8, -h / 2, w + 16, h, 2);
  shadowOff();
  image(pic, -w / 2, -h / 2 + 8, w, ph);
  if (dim) {
    fill(10, 10, 10, 150);
    rect(-w / 2, -h / 2 + 8, w, ph);
  }
  if (caption) txt(caption, 0, h / 2 - 12, min(26, w / 6), INK, HAND, CENTER, BOLD);
  pop();
}

// A see-through strip of tape
function tape(x, y, rot) {
  push();
  translate(x, y);
  rotate(rot);
  fill(240, 232, 200, 160);
  rect(-40, -12, 80, 24);
  pop();
}

// A round pushpin with a shiny spot
function pushpin(x, y, col) {
  shadowOn(4);
  fill(col);
  circle(x, y, 16);
  shadowOff();
  fill(255, 120);
  circle(x - 3, y - 3, 5);
}

// A rubber stamp mark, on a pale patch so it reads on top of photos
function stamp(words, x, y, rot, col, size) {
  push();
  translate(x, y);
  rotate(rot);
  textFont(MARKER);
  textSize(size);
  let w = textWidth(words) + 24;
  fill(255, 255, 255, 200);
  stroke(col);
  strokeWeight(3);
  rect(-w / 2, -size * 0.8, w, size * 1.5, 6);
  noStroke();
  strokeWeight(1);
  txt(words, 0, size * 0.32, size, col, MARKER, CENTER);
  pop();
}

// A tear-off calendar showing tonight's night
function calendar(x, y, rot) {
  push();
  translate(x + 70, y + 75);
  rotate(rot);
  shadowOn(10);
  fill(250);
  rect(-70, -75, 140, 150, 4);
  shadowOff();
  fill("#c0392b");
  rect(-70, -75, 140, 36, 4, 4, 0, 0);
  txt("NIGHT", 0, -49, 20, "#fff", TYPE, CENTER);
  txt(night, 0, 40, 74, INK, MARKER, CENTER);
  txt("of 3", 0, 66, 22, "#666", HAND, CENTER, BOLD);
  pop();
}

// The box around a place on the map (its pin and its tag): [x, y, w, h]
function spotBox(i) {
  textFont(HAND);
  textStyle(BOLD);
  textSize(26);
  let x = MAP.x + mapX[i] * MAP.w;
  let y = MAP.y + mapY[i] * MAP.h;
  return [x - 16, y - 18, textWidth(places[i]) + 50, 36];
}

// Draws a place on the map: a pin and a handwritten paper tag, plus a camera if one is there.
// Returns true if it was clicked.
function mapSpot(i) {
  let [x, y, w, h] = spotBox(i);
  let hot = inside(x, y, w, h);
  if (hot) hovering = true;
  let k = cameras.indexOf(i);
  push();
  translate(x + 22, y + h / 2);
  rotate(((i % 3) - 1) * 0.03);
  shadowOn(hot ? 12 : 5);
  fill(k != -1 ? STICKY : hot ? "#fff6dc" : "#f7f1e1");
  rect(0, -16, w - 22, 32, 2);
  shadowOff();
  txt(places[i], 10, 9, 26, INK, HAND, LEFT, BOLD);
  pop();
  pushpin(x + 16, y + h / 2, "#c0392b");
  if (k != -1) trailCamera(x + 2, y - 30, 0.55, k + 1);
  return hot && click;
}

// The two cameras sitting on the desk. A placed camera leaves a dashed outline.
// Clicking a placed camera's outline takes it back off the map.
function deskCamera(k) {
  let x = 1110 + k * 90;
  let y = 120;
  if (cameras[k] == null) {
    trailCamera(x, y, 1, k + 1);
    txt("cam " + (k + 1), x, y + 76, 28, "#f0e6cc", HAND, CENTER, BOLD);
  } else {
    let hot = inside(x - 36, y - 46, 72, 92);
    if (hot) hovering = true;
    noFill();
    stroke(240, 230, 200, hot ? 230 : 120);
    strokeWeight(2);
    drawingContext.setLineDash([6, 6]);
    rect(x - 32, y - 42, 64, 84, 10);
    drawingContext.setLineDash([]);
    noStroke();
    strokeWeight(1);
    txt(hot ? "take back" : "on map", x, y + 76, 24, "#d8ccb0", HAND, CENTER, BOLD);
    if (hot && click) cameras[k] = null;
  }
}

// A small camouflaged trail camera, centred at (x, y), with its number on it
function trailCamera(x, y, s, number) {
  push();
  translate(x, y);
  scale(s);
  shadowOn(8);
  fill("#4b5537");
  rect(-32, -42, 64, 84, 10);
  shadowOff();
  fill("#353e28");
  ellipse(-12, -22, 30, 20);
  ellipse(14, 24, 34, 22);
  fill(20);
  rect(-20, -34, 40, 14, 3); // infrared panel
  fill(15);
  circle(0, 4, 30); // lens
  fill(60, 80, 90);
  circle(0, 4, 16);
  fill(255, 150);
  circle(-4, 0, 5);
  fill(250);
  circle(20, 30, 22);
  txt(number, 20, 37, 18, INK, MARKER, CENTER);
  pop();
}

// A rubber key on the trail camera with an icon and a printed label.
// lit shows an amber light when the key's mode is on. Returns true if it was clicked.
function deviceKey(iconName, label, x, y, off = false, lit = false) {
  let w = 92;
  let h = 58;
  let hot = !off && inside(x, y, w, h);
  if (hot) hovering = true;
  if (off) drawingContext.globalAlpha = 0.4;
  shadowOn(6);
  fill(hot ? "#2c3326" : "#1d2219");
  rect(x, y, w, h, 12);
  shadowOff();
  fill(255, 12);
  rect(x + 4, y + 3, w - 8, 10, 6); // shine on the rubber
  image(icons[iconName], x + w / 2 - 13, y + 14, 26, 26);
  if (lit) {
    fill("#ffb030");
    circle(x + w - 12, y + 12, 8);
  }
  txt(label, x + w / 2, y + h + 18, 13, "rgba(255,255,255,0.8)", TYPE, CENTER);
  drawingContext.globalAlpha = 1;
  return hot && click;
}

// The big red FLAG button on the side of the camera. Returns true if it was clicked.
function flagButton(x, y) {
  let hot = dist(mouseX, mouseY, x, y) < 58;
  if (hot) hovering = true;
  fill(15);
  circle(x, y, 132);
  shadowOn(8);
  fill(hot ? "#e0483c" : "#b8322a");
  circle(x, y, 112);
  shadowOff();
  fill(255, 40);
  ellipse(x - 14, y - 22, 60, 30);
  image(icons.warning, x - 16, y - 34, 32, 32);
  txt("FLAG", x, y + 26, 30, "#fff", MARKER, CENTER);
  txt("SOMETHING'S\nWRONG", x, y + 88, 13, "rgba(255,255,255,0.8)", TYPE, CENTER);
  return hot && click;
}

// A plain rectangular button in the camera's pixel font, for the dark watch screen
function deviceButton(label, x, y, w) {
  let hot = inside(x, y, w, 50);
  if (hot) hovering = true;
  fill(hot ? color(30, 60, 40) : color(10, 25, 16, 220));
  stroke(SCREEN);
  rect(x, y, w, 50, 6);
  noStroke();
  txt(label, x + w / 2, y + 33, 28, SCREEN, PIXEL, CENTER);
  return hot && click;
}

// Green pixel text on the camera screen, with a dark outline so it shows on any photo.
// If w is set, the text wraps inside a box that wide.
function screenText(s, x, y, size = 26, w = 0, align = LEFT, col = SCREEN) {
  drawingContext.shadowColor = "rgba(0, 0, 0, 0.9)";
  drawingContext.shadowBlur = 4;
  if (w) txtBox(s, x, y - size, w, 80, size, col, PIXEL, size);
  else txt(s, x, y, size, col, PIXEL, align);
  shadowOff();
}

// A camera photo with night-vision grain.
// While inspecting, the photo zooms in 1.75 times and follows the mouse.
function drawPhoto(pic, x, y, w, h) {
  if (inspecting && inside(x, y, w, h)) {
    let sw = 800 / 1.75;
    let sh = 500 / 1.75;
    let sx = map(mouseX, x, x + w, 0, 800 - sw);
    let sy = map(mouseY, y, y + h, 0, 500 - sh);
    image(pic, x, y, w, h, sx, sy, sw, sh);
  } else {
    image(pic, x, y, w, h);
  }
  // a random part of the grain, so it flickers like a night-vision camera
  image(grain, x, y, w, h, random(1200 - w), random(750 - h), w, h);
}

// The corner brackets, REC light and timestamp of a camera's viewfinder
function viewfinder(left, right) {
  stroke(255, 200);
  strokeWeight(3);
  noFill();
  for (let [x, y, dx, dy] of [[40, 40, 1, 1], [1240, 40, -1, 1], [40, 680, 1, -1], [1240, 680, -1, -1]]) {
    line(x, y, x + dx * 50, y);
    line(x, y, x, y + dy * 50);
  }
  noStroke();
  strokeWeight(1);
  if (frameCount % 60 < 40) {
    fill("#ff4a3d");
    circle(78, 82, 16);
  }
  screenText("REC  " + left, 96, 92, 34, 0, LEFT, "#f4f4f4");
  screenText(right, 1200, 92, 34, 0, RIGHT, "#f4f4f4");
  let s = floor(millis() / 1000);
  screenText("23:" + nf(58 + (floor(s / 60) % 2), 2) + ":" + nf(s % 60, 2), 78, 656, 34, 0, LEFT, "#f4f4f4");
  screenText("WILLOWMERE RESERVE   ▮▮▮▯", 1200, 656, 34, 0, RIGHT, "#f4f4f4");
}
