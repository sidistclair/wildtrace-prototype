// Wild Trace prototype
// TODO: a real report

// ---------- Look of the game (colours and fonts from the UI kit) ----------

const C = {
  bg: "#101c18",      // page background
  surface: "#192922", // panels
  raised: "#21352c",  // buttons and cards
  line: "#455b4c",    // borders
  text: "#f4f0e5",
  muted: "#b6c4b8",   // less important text
  accent: "#edc779",  // gold, used for the main action on each screen
  ink: "#17231c",     // dark text on gold or paper
  good: "#a9d4b4",
  paper: "#eee6d3",   // Dr. Okafor's notebook and the map labels
  paperInk: "#26382a",
};
// Single-word font names only (p5 can't take a list of fallback fonts)
const SERIF = "Georgia";
const SANS = "Arial";
const MONO = "monospace";

// ---------- Game data ----------

// Which screen is showing: "title", "briefing", "plan", "watch", "review" or "end"
let screen = "title";
let help = false; // true while the How to play window is open

// The 5 camera spots. The same index is used in every list,
// e.g. index 2 is the Wildlife Corridor.
let places = ["Old Forest", "Creek Crossing", "Wildlife Corridor", "Farm Edge", "Ridge Road"];
// Names used in the art files, e.g. assets/photos/N2-corridor-frame-1.jpg
let ids = ["forest", "creek", "corridor", "farm", "ridge"];
// Where each place is on the map, as a fraction of the map's width and height
let mapX = [0.24, 0.4, 0.69, 0.84, 0.6];
let mapY = [0.34, 0.63, 0.42, 0.78, 0.16];
// The map is drawn in this box on the plan and watch screens
const MAP = { x: 28, y: 195, w: 620, h: 432 };

let night = 1;              // current night, 1 to 3
let cameras = [null, null]; // the place each camera is at (null = not placed yet)
let timer = 0;              // frames since the night started
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
    { time: "23:50", note: "A dark pickup with a roof light bar and a dented tailgate drives the new road at night. Two hours later a gloved hand grabs the camera.", clue: "A mystery pickup is using the new road at night." },
  ],
  [ // night 3
    { time: "03:00", note: "Nothing. The forest is empty tonight.", clue: "" },
    { time: "04:05", note: "A person with a headlamp and a bright stripe on their sleeve kneels at the snare. Fifteen minutes later the snare is gone, leaving only holes.", clue: "A hunter with a headlamp is checking the snare." },
    { time: "23:10", note: "The doe and her fawn reach the finished fence and can't get through.", clue: "The finished fence stops the doe and fawn using the corridor." },
    { time: "03:30", note: "The doe and her fawn from the reserve are eating the farm's crops.", clue: "The doe and fawn have been pushed out to the farm." },
    { time: "04:20", note: "The same dark pickup, seen from behind. The plate reads K7R-418.", clue: "The pickup is back, and its plate is K7R-418." },
  ],
];
// How many frames each camera took: frameCounts[night - 1][place]
let frameCounts = [[2, 2, 2, 1, 1], [1, 2, 2, 2, 2], [2, 2, 2, 2, 1]];

// Dr. Okafor's old photos, shown in the briefing and compared with yours
let archive = [
  { file: "ARC-1", place: 0, when: "6 weeks ago", note: "Dr. Okafor's photo: the same fox, back when it lived in the forest." },
  { file: "ARC-2", place: 2, when: "6 weeks ago", note: "Dr. Okafor's photo: the doe and her fawn walking freely through the corridor, before the fence." },
  { file: "ARC-3", place: 4, when: "4 weeks ago", note: "Dr. Okafor's photo: the ridge before any road was built." },
  { file: "ARC-4", place: 4, when: "9 days ago", note: "Dr. Okafor's photo: headlights on the ridge at night, just before the camera stopped working." },
];
// Dr. Okafor's last notes, shown in the briefing
let notes = ["Corridor numbers dropping.", "Fox seen near the farm??", "Someone's been at my cameras."];

// ---------- Artwork ----------

let photos = {};   // photos[night][place][frame] is one frame from that place on that night
let maps = {};     // maps[night] is the painted reserve map for that night
let icons = {};    // icons["pin-light"] etc. from the UI kit
let titlePic, wordmark;
let grain;         // night-vision speckles laid over the photos

function setup() {
  // The game is always drawn at 1280x720. style.css scales it to fit the window.
  createCanvas(1280, 720);
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
  for (let a of archive) a.pic = loadPic("assets/photos/" + a.file + "-frame-1.jpg", 800, 500);
  for (let n = 1; n <= 3; n++) maps[n] = loadPic("assets/map/night-" + n + ".jpg", 1720, 1200);
  titlePic = loadPic("assets/screens/title-background.jpg", 1920, 1080);
  wordmark = loadPic("assets/ui/brand-wordmark.png", 600, 96);
  // Light icons go on dark backgrounds, ink icons on gold buttons and paper
  let light = ["arrow", "camera", "check", "clock", "close", "compare", "eye", "help", "keyboard",
    "left", "right", "minus", "moon", "pin", "restart", "warning", "zoom"];
  for (let name of light) icons[name + "-light"] = loadPic("assets/ui/icons/" + name + "-light.png", 96, 96);
  for (let name of ["arrow"].concat(ids)) icons[name + "-ink"] = loadPic("assets/ui/icons/" + name + "-ink.png", 96, 96);

  // Night-vision grain: random light and dark speckles. It is bigger than any photo
  // so drawPhoto() can show a different part of it every frame, which makes it flicker.
  grain = createGraphics(1200, 750);
  grain.pixelDensity(1);
  for (let i = 0; i < 30000; i++) {
    grain.stroke(random(255), random(20, 70));
    grain.point(random(1200), random(750));
  }
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

// ---------- Main loop ----------

// p5 calls draw() about 60 times a second
function draw() {
  hovering = false;
  noStroke();
  // While the How to play window is open, clicks only reach the window
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
  }
  // A hand cursor shows what can be clicked
  cursor(hovering ? HAND : ARROW);
  click = false;
}

// p5 calls this once per click. The click is handled by the buttons in the next draw().
function mousePressed() {
  click = true;
}

// Keyboard shortcuts (listed in the footer of each screen)
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

function drawTitle() {
  // The 1920x1080 painting fills the 16:9 canvas exactly
  image(titlePic, 0, 0, 1280, 720);
  // Fade the painting to dark on the left and bottom so the text is easy to read
  for (let x = 0; x < 1024; x += 4) {
    fill(10, 20, 15, map(x, 0, 1024, 250, 20));
    rect(x, 0, 4, 720);
  }
  for (let y = 480; y < 720; y += 4) {
    fill(10, 20, 15, map(y, 480, 720, 0, 200));
    rect(0, y, 1280, 4);
  }

  image(wordmark, 40, 28, 200, 32);
  if (iconButton("help", 1196, 22)) help = true;

  eyebrow("WILLOWMERE RESERVE · A FIELD INVESTIGATION", 64, 180);
  textLeading(66);
  txt("Every trace\ntells a story.", 64, 250, 64, C.text, SERIF);
  textLeading(28);
  txt("Two cameras. Three nights. Find the evidence that\ncould change the future of the reserve.", 64, 400, 17, C.muted);
  if (button("Begin investigation", 64, 470, 220, "primary", "arrow")) screen = "briefing";
  if (button("How to play", 296, 470, 130, "ghost")) help = true;
  icon("clock", 64, 552);
  txt("5–10 minutes", 94, 567, 13, C.muted);
  icon("camera", 210, 552);
  txt("Camera-trap mystery", 240, 567, 13, C.muted);

  fill(C.line);
  rect(0, 668, 1280, 1);
  txt("A fictional reserve. No animals were harmed.", 40, 698, 12, C.muted);
  txt("Observe carefully. Build your own case.", 1240, 698, 12, C.muted, SANS, NORMAL, RIGHT);
}

function drawBriefing() {
  header(0);
  pageTitle("YOUR ASSIGNMENT", "Pick up where Dr. Okafor left off.",
    "Dr. Okafor, who ran the wildlife survey, has gone missing. You have two camera traps and three nights before the hearing.");

  // Dr. Okafor's field notes on a paper card
  fill(C.paper);
  rect(28, 195, 584, 432, 14);
  eyebrow("FIELD NOTES / A. OKAFOR", 52, 228, "#536745");
  textLeading(36);
  txt("“Need proof before\nthe hearing.”", 52, 278, 30, C.paperInk, SERIF);
  for (let i = 0; i < notes.length; i++) {
    let y = 370 + i * 48;
    txt(notes[i], 52, y, 19, C.paperInk, SERIF, ITALIC);
    if (i < notes.length - 1) {
      fill("#aab29b");
      rect(52, y + 18, 536, 1);
    }
  }
  txt("These are questions to investigate, not conclusions.", 52, 600, 13, "#52634e");

  // Dr. Okafor's old photos
  txt("The archive", 636, 212, 17, C.text, SANS, BOLD);
  txt("Dr. Okafor's photos", 1252, 212, 13, C.muted, SANS, NORMAL, RIGHT);
  for (let i = 0; i < archive.length; i++) {
    let x = 636 + (i % 2) * 312;
    let y = 228 + floor(i / 2) * 170;
    photoCard(archive[i].pic, x, y, 304, 108, places[archive[i].place], archive[i].when, false);
  }
  txt("Use these as a baseline when you look at your own photos.", 636, 588, 13, C.muted);

  footer("Plan → watch → review. Repeat for three nights.");
  if (button("Place the cameras", 1252 - 200, 661, 200, "primary", "arrow")) screen = "plan";
}

function drawPlan() {
  header(1);
  let placed = cameras.filter((c) => c != null).length;
  pageTitle("EVENING / NIGHT " + night, "Where will you watch tonight?",
    "Select a place on the map to put your next camera there. Select it again to take the camera back.");
  badge(placed + " of 2 cameras placed", 1252, 150);

  // The painted map for tonight, with a label for every place
  image(maps[night], MAP.x, MAP.y, MAP.w, MAP.h);
  let focus = -1; // the place whose notes are shown on the right
  for (let i = 0; i < 5; i++) {
    if (mapLabel(i)) placeCamera(i);
    if (inside(...labelBox(i))) focus = i;
  }
  let next = cameras.indexOf(null);
  let caption = next == -1 ? "Both cameras placed" : "Select a place for camera " + (next + 1);
  paperChip(caption, MAP.x + 12, MAP.y + MAP.h - 40);

  // Camera cards: click a placed camera to take it back
  panel(668, 195, 584, 200);
  txt("Your cameras", 688, 230, 17, C.text, SANS, BOLD);
  txt("2 available", 1232, 230, 13, C.muted, SANS, NORMAL, RIGHT);
  for (let k = 0; k < 2; k++) {
    let y = 248 + k * 70;
    let hot = cameras[k] != null && inside(688, y, 544, 60);
    if (hot) hovering = true;
    fill(C.raised);
    stroke(k == next ? C.accent : C.line);
    rect(688, y, 544, 60, 10);
    noStroke();
    if (k == next) {
      fill(C.accent);
      rect(688, y + 6, 3, 48);
    }
    fill("#344636");
    rect(702, y + 9, 42, 42, 9);
    icon("camera", 713, y + 20);
    numberBadge(k + 1, 740, y + 46);
    txt("Camera " + (k + 1), 760, y + 26, 15, C.text, SANS, BOLD);
    if (cameras[k] == null) {
      txt("Not placed yet", 760, y + 46, 12, C.muted);
    } else {
      txt(places[cameras[k]], 760, y + 46, 12, C.muted);
      icon(hot ? "close" : "check", 1196, y + 20);
      if (hot && click) cameras[k] = null;
    }
  }

  // Notes about the place under the mouse, or the last place picked
  if (focus == -1) focus = cameras[1] != null ? cameras[1] : cameras[0] != null ? cameras[0] : -1;
  panel(668, 415, 584, 212);
  eyebrow("LOCATION NOTEBOOK", 688, 446);
  if (focus == -1) {
    txtBox("Point at a place on the map to see what Dr. Okafor recorded there.", 688, 462, 540, 60, 14, C.muted);
  } else {
    txt(places[focus], 688, 482, 22, C.text, SERIF);
    let old = archive.filter((a) => a.place == focus);
    if (old.length == 0) {
      txtBox("Dr. Okafor has no photos from here. Your cameras will be the first.", 688, 498, 540, 60, 14, C.muted);
    } else {
      let a = old[old.length - 1];
      image(a.pic, 688, 500, 160, 100);
      txt("Dr. Okafor · " + a.when, 864, 516, 13, C.text, SANS, BOLD);
      txtBox(a.note.replace("Dr. Okafor's photo: ", ""), 864, 526, 368, 80, 13, C.muted);
    }
  }

  footer(placed < 2 ? "Place " + (2 - placed) + " more camera" + (placed == 0 ? "s" : "") + " to continue. Keys 1–5 pick a place."
    : "Both cameras are placed. Confirm to start the night.");
  if (button("Confirm placements", 1252 - 230, 661, 230, placed < 2 ? "primary-off" : "primary", "arrow")) {
    timer = 0;
    screen = "watch";
  }
}

function drawWatch() {
  header(2);
  pageTitle("OVERNIGHT / NIGHT " + night, "The reserve is awake.",
    "Your cameras are watching. Every photo could tell a different story.");

  // The night runs from 20:00 to 06:00 in 180 frames (about 3 seconds)
  timer++;
  let progress = constrain(timer / 180, 0, 1);
  let minutes = 20 * 60 + progress * 600;

  // Darkened map with a marker for each camera. A camera flashes when it takes its photo.
  image(maps[night], MAP.x, MAP.y, MAP.w, MAP.h);
  fill(5, 12, 8, 175);
  rect(MAP.x, MAP.y, MAP.w, MAP.h);
  for (let k = 0; k < 2; k++) {
    let x = MAP.x + mapX[cameras[k]] * MAP.w;
    let y = MAP.y + mapY[cameras[k]] * MAP.h;
    let t = events[night - 1][cameras[k]].time.split(":");
    let since = (int(t[0]) * 60 + int(t[1]) - 20 * 60 + 1440) % 1440; // minutes after 20:00
    let flash = abs(minutes - 20 * 60 - since) < 25;
    noFill();
    stroke(flash ? 255 : color(221, 201, 143, 150));
    strokeWeight(flash ? 4 : 1);
    circle(x, y, flash ? 90 : 70);
    strokeWeight(1);
    noStroke();
    let label = k + 1 + " · " + places[cameras[k]];
    textSize(13);
    let w = textWidth(label) + 52;
    fill(23, 39, 27, 230);
    stroke("#8f8b63");
    rect(x - w / 2, y - 18, w, 36, 8);
    noStroke();
    icon("camera", x - w / 2 + 12, y - 9, 18);
    txt(label, x - w / 2 + 38, y + 5, 13, C.accent);
  }

  // Field recorder: clock, progress bar and camera status
  panel(668, 195, 584, 432);
  eyebrow("FIELD RECORDER", 696, 230);
  let h = floor(minutes / 60) % 24;
  let m = floor(minutes % 60);
  txt(nf(h % 12 || 12, 2) + ":" + nf(m, 2), 696, 300, 54, C.text, MONO);
  txt(h < 12 ? "AM" : "PM", 870, 300, 20, C.muted, MONO);
  txt("Night " + night + " of 3", 696, 335, 15, C.muted);
  fill("#3c4f40");
  rect(696, 360, 528, 5, 3);
  fill(C.accent);
  rect(696, 360, 528 * progress, 5, 3);
  txt("20:00 · Dusk", 696, 392, 13, C.muted);
  txt("06:00 · Dawn", 1224, 392, 13, C.muted, SANS, NORMAL, RIGHT);
  for (let k = 0; k < 2; k++) {
    let y = 410 + k * 46;
    fill(C.line);
    rect(696, y, 528, 1);
    fill(C.good);
    circle(700, y + 24, 7);
    txt("Camera " + (k + 1) + " recording", 714, y + 29, 13, C.good);
  }
  fill(C.line);
  rect(696, 502, 528, 1);
  txtBox("A flash means a camera took a photo, not that it found a clue. Look at the photos in the morning.", 696, 518, 528, 60, 14, C.muted);

  footer("You can skip the wait without losing any photos. Space skips.");
  if (button("Skip to morning", 1252 - 200, 661, 200, "primary", "arrow") || timer > 180) startReview();
}

function drawReview() {
  header(3);
  pageTitle("MORNING / NIGHT " + night, "Look closer. Is anything wrong?",
    "Step through each photo, compare it with earlier ones, and flag anything that looks wrong.");

  // Left: one card per camera. Click a card to look at that camera's photo.
  txt("2 cameras", 28, 208, 13, C.text, SANS, BOLD);
  for (let k = 0; k < 2; k++) {
    let place = cameras[k];
    let n = photos[night][place].length;
    if (photoCard(photos[night][place][frame[k]], 28, 220 + k * 186, 190, 119, places[place],
      "Camera " + (k + 1) + " · " + n + " frame" + (n > 1 ? "s" : ""), k == current)) {
      chooseCamera(k);
    }
    // a pin icon on the card if any of its photos are pinned
    if (pins.some((p) => p.key.startsWith(night + "-" + place + "-"))) {
      fill(23, 35, 28, 220);
      circle(198, 240 + k * 186, 28);
      icon("pin", 189, 231 + k * 186, 18);
    }
  }

  let place = cameras[current];
  let pinned = isPinned();
  let list = earlierPhotos();

  if (comparing) {
    // Middle and right: the current photo next to an earlier photo of the same place
    let e = list[earlier];
    txt("Current · Night " + night, 236, 212, 14, C.text, SANS, BOLD);
    txt("Earlier · " + e.title, 756, 212, 14, C.text, SANS, BOLD);
    drawPhoto(currentPic(), 236, 224, 496, 310, hudText(), places[place].toUpperCase());
    drawPhoto(e.pic, 756, 224, 496, 310, e.hud, places[place].toUpperCase());
    if (button(pinned ? "Pinned" : "Pin evidence", 236, 576, 170, pinned ? "selected" : "secondary", "pin")) togglePin();
    if (button(inspecting ? "Stop zoom" : "Inspect", 418, 576, 140, inspecting ? "selected" : "secondary", "zoom")) inspecting = !inspecting;
    if (list.length > 1 && button("Next earlier", 570, 576, 170, "secondary", "left")) earlier = (earlier + 1) % list.length;
    if (button("Close comparison", 1252 - 210, 576, 210, "ghost", "compare")) comparing = false;
    footer(e.note);
  } else {
    // Middle: the photo, with frame buttons and the zoom underneath
    let n = photos[night][place].length;
    txt(places[place], 236, 212, 18, C.text, SANS, BOLD);
    badge("Camera " + (current + 1), 780, 192);
    drawPhoto(currentPic(), 236, 222, 544, 340, hudText(), places[place].toUpperCase());
    if (iconButton("left", 236, 598, frame[current] == 0)) stepFrame(-1);
    txt("Frame " + (frame[current] + 1) + " of " + n, 292, 625, 13, C.text);
    if (iconButton("right", 380, 598, frame[current] == n - 1)) stepFrame(1);
    if (button(inspecting ? "Stop zoom" : "Inspect photo", 780 - 170, 596, 170, inspecting ? "selected" : "secondary", "zoom")) {
      inspecting = !inspecting;
    }

    // Right: the evidence tools
    eyebrow("EVIDENCE TOOLS", 800, 208);
    txt("Is something wrong?", 800, 240, 22, C.text, SERIF);
    txtBox("Flag a photo if it shows a problem in the reserve. Pin the ones you want to keep.", 800, 252, 452, 44, 13, C.muted);
    if (button("Something's wrong here", 800, 300, 452, "secondary", "warning")) flagPhoto();
    if (button(pinned ? "Pinned" : "Pin evidence", 800, 356, 452, pinned ? "selected" : "secondary", "pin")) togglePin();
    if (button(list.length > 0 ? "Compare earlier" : "No earlier photo of this place", 800, 412,
      452, list.length > 0 ? "secondary" : "disabled", "compare")) {
      toggleCompare();
    }

    // What the last flag showed, or a hint if nothing has been flagged yet
    let tonight = events[night - 1];
    let hint = !tonight[cameras[0]].clue && !tonight[cameras[1]].clue
      ? "Nothing looks wrong at these places tonight. Try other places next night."
      : "Two frames can tell different parts of the same story.";
    let found = message.startsWith("Good");
    fill(message ? "#26372c" : C.surface);
    stroke(message ? "#637456" : C.line);
    rect(800, 476, 452, 128, 9);
    noStroke();
    icon(message && found ? "check" : "eye", 816, 492);
    txtBox(message || hint, 846, 490, 392, 108, 14, message ? (found ? C.good : C.text) : C.muted);

    footer("← → frames · ↑ ↓ cameras · F flag · P pin · C compare · V inspect");
  }

  let last = night == 3;
  if (button(last ? "See results" : "Plan night " + (night + 1), 1252 - 200, 661, 200, "primary", "arrow")) {
    if (last) {
      screen = "end";
    } else {
      night++;
      screen = "plan";
    }
  }
}

function drawEnd() {
  header(4);
  let all = events.flat().filter((e) => e.clue).map((e) => e.clue);
  let n = clues.length;
  let headline = n == all.length ? "The reserve has a chance." : n >= 5 ? "A strong start." : "The trail went cold.";
  pageTitle("INVESTIGATION COMPLETE", headline, "Here is every clue in the reserve: the ones you found and the ones you missed.");

  // Left: the score, then every clue marked Found or Missed
  panel(28, 195, 600, 84);
  stroke("#829d7f");
  noFill();
  circle(70, 237, 64);
  noStroke();
  txt(n, 70, 247, 28, C.text, SANS, NORMAL, CENTER);
  let tier = n == all.length ? "FULL CASE" : n >= 5 ? "STRONG CASE" : n > 0 ? "PARTIAL CASE" : "NO CASE";
  eyebrow(tier, 120, 225);
  txt(n + " of " + all.length + " clues found", 120, 254, 20, C.text, SANS, BOLD);
  for (let i = 0; i < all.length; i++) {
    let y = 290 + i * 37;
    let got = clues.includes(all[i]);
    txt(all[i], 28, y + 23, 13, got ? C.text : C.muted);
    pill(got ? "Found" : "Missed", got ? "check" : "minus", 628, y + 5, got);
    fill(C.line);
    rect(28, y + 36, 600, 1);
  }

  // Right: what happens next, and the photos the player pinned
  panel(652, 195, 600, 432);
  eyebrow("THE OUTCOME", 676, 230);
  let title = n == all.length ? "Your evidence has an impact." : n >= 5 ? "Part of the story is clear." : "Not enough to change things.";
  let body = n == all.length
    ? "The hearing pauses the next phase of building and orders a wildlife crossing for the corridor. Rangers start night patrols on the new road."
    : n >= 5 ? "The hearing hears about some of the damage, but part of what happened in the reserve stayed hidden."
      : "With so few clues, the hearing lets construction carry on. Try watching different places next time.";
  txt(title, 676, 270, 26, C.text, SERIF);
  txtBox(body, 676, 286, 552, 80, 14, C.muted);
  txt("Pinned evidence", 676, 400, 15, C.text, SANS, BOLD);
  if (pins.length == 0) txt("You didn't pin any photos.", 676, 428, 13, C.muted);
  for (let i = 0; i < min(pins.length, 8); i++) {
    image(pins[i].pic, 676 + (i % 4) * 140, 414 + floor(i / 4) * 92, 130, 81);
  }

  footer("Play again to try different camera spots.");
  if (button("Play again", 1252 - 170, 661, 170, "ghost", "restart")) {
    night = 1;
    cameras = [null, null];
    clues = [];
    seen = [];
    pins = [];
    screen = "title";
  }
}

// The How to play window, drawn over whatever screen is showing
function drawHelp() {
  fill(6, 16, 8, 217);
  rect(0, 0, 1280, 720);
  fill(C.surface);
  stroke("#6b7f68");
  rect(230, 130, 820, 460, 18);
  noStroke();
  txt("Follow the traces.", 262, 190, 32, C.text, SERIF);
  if (iconButton("close", 974, 158)) help = false;
  txt("Three nights to find out what is happening in the reserve. The photos hold the clues.", 262, 232, 14, C.muted);
  let steps = [
    ["Plan", "Choose 2 places on the map for your cameras. You can move them every night."],
    ["Watch", "Wait for morning, or skip ahead without losing any photos."],
    ["Review", "Step through frames, zoom in, and compare with earlier photos of the same place."],
    ["Flag clues", "Flag a photo when something looks wrong. There are 9 clues to find in 3 nights."],
  ];
  for (let i = 0; i < 4; i++) {
    let x = 262 + (i % 2) * 382;
    let y = 256 + floor(i / 2) * 100;
    fill(C.raised);
    rect(x, y, 370, 88, 10);
    fill(C.accent);
    circle(x + 30, y + 30, 30);
    txt(i + 1, x + 30, y + 35, 13, C.ink, SANS, BOLD, CENTER);
    txt(steps[i][0], x + 56, y + 32, 15, C.text, SANS, BOLD);
    txtBox(steps[i][1], x + 56, y + 40, 300, 44, 12, C.muted);
  }
  txt("← → frames · ↑ ↓ cameras · F flag · P pin · C compare · V inspect · Esc close", 262, 482, 12, C.muted);
  if (button("Got it", 1018 - 110, 516, 110, "primary")) help = false;
}

// ---------- Review actions (used by the buttons and the keyboard) ----------

// Moves to the end of the night: remembers which photos were taken and resets the review tools
function startReview() {
  for (let k = 0; k < 2; k++) seen.push(night + "-" + cameras[k]);
  frame = [0, 0];
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

function toggleCompare() {
  comparing = !comparing;
  earlier = 0;
}

function currentPic() {
  return photos[night][cameras[current]][frame[current]];
}

// The text on the strip under the current photo
function hudText() {
  return "CAM " + (current + 1) + " · " + events[night - 1][cameras[current]].time + " · NIGHT " + night;
}

// Earlier photos of the place the current camera is at, newest first:
// the player's own photos from earlier nights, then Dr. Okafor's
function earlierPhotos() {
  let place = cameras[current];
  let list = [];
  for (let n = night - 1; n >= 1; n--) {
    if (seen.includes(n + "-" + place)) {
      list.push({ pic: photos[n][place][0], title: "Night " + n, hud: "NIGHT " + n + " · " + events[n - 1][place].time,
        note: "Your own photo of this place from night " + n + "." });
    }
  }
  for (let i = archive.length - 1; i >= 0; i--) {
    let a = archive[i];
    if (a.place == place) list.push({ pic: a.pic, title: "Dr. Okafor · " + a.when, hud: "DR. OKAFOR · " + a.when.toUpperCase(), note: a.note });
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

// Text in one call: txt("Hello", x, y, size, colour, font, style, align)
function txt(s, x, y, size = 14, col = C.text, font = SANS, style = NORMAL, align = LEFT) {
  fill(col);
  textFont(font);
  textStyle(style);
  textSize(size);
  textAlign(align, BASELINE);
  text(s, x, y);
}

// Text that wraps inside a box
function txtBox(s, x, y, w, h, size = 14, col = C.text) {
  fill(col);
  textFont(SANS);
  textStyle(NORMAL);
  textSize(size);
  textAlign(LEFT, TOP);
  textLeading(size * 1.5);
  text(s, x, y, w, h);
  textAlign(LEFT, BASELINE);
}

// Small gold capitals with wide letter spacing, used above titles
function eyebrow(s, x, y, col = C.accent) {
  drawingContext.letterSpacing = "2px";
  txt(s, x, y, 11, col, SANS, BOLD);
  drawingContext.letterSpacing = "0px";
}

function icon(name, x, y, size = 20, ink = false) {
  image(icons[name + (ink ? "-ink" : "-light")], x, y, size, size);
}

function panel(x, y, w, h) {
  fill(C.surface);
  stroke(C.line);
  rect(x, y, w, h, 14);
  noStroke();
}

function inside(x, y, w, h) {
  return mouseX > x && mouseX < x + w && mouseY > y && mouseY < y + h;
}

// Draws a 46-pixel-tall button and returns true if it was clicked.
// style is "primary" (gold), "secondary", "ghost" (no fill), "selected" (gold outline),
// "disabled", or "primary-off" (a faded gold button that can't be clicked yet).
// Gold buttons show their icon after the label, the others before it.
function button(label, x, y, w, style = "secondary", iconName = null) {
  let h = 46;
  let off = style == "disabled" || style == "primary-off";
  let gold = style.startsWith("primary");
  let hot = !off && inside(x, y, w, h);
  if (hot) hovering = true;
  let look = {
    primary: [C.accent, C.accent, C.ink],
    secondary: [C.raised, C.line, C.text],
    ghost: [C.bg, C.line, C.text],
    selected: ["#3d3b27", C.accent, C.accent],
    disabled: [C.raised, C.line, C.muted],
  }[gold ? "primary" : style];
  if (off) drawingContext.globalAlpha = 0.52;
  fill(look[0]);
  stroke(look[1]);
  rect(x, y, w, h, 9);
  noStroke();
  if (hot) {
    fill(255, 25); // lighter while the mouse is over it
    rect(x, y, w, h, 9);
  }
  textFont(SANS);
  textStyle(BOLD);
  textSize(14);
  let tw = textWidth(label);
  let iw = iconName ? 29 : 0;
  let left = x + (w - tw - iw) / 2;
  if (gold) {
    txt(label, left, y + 28, 14, look[2], SANS, BOLD);
    if (iconName) icon(iconName, left + tw + 9, y + 13, 20, true);
  } else {
    if (iconName) icon(iconName, left, y + 13);
    txt(label, left + iw, y + 28, 14, look[2], SANS, BOLD);
  }
  drawingContext.globalAlpha = 1;
  return hot && click;
}

// A 44x44 square button with just an icon. Returns true if it was clicked.
function iconButton(name, x, y, off = false) {
  let hot = !off && inside(x, y, 44, 44);
  if (hot) hovering = true;
  if (off) drawingContext.globalAlpha = 0.4;
  fill(hot ? C.raised : C.bg);
  stroke(C.line);
  rect(x, y, 44, 44, 10);
  noStroke();
  icon(name, x + 12, y + 12);
  drawingContext.globalAlpha = 1;
  return hot && click;
}

// A small rounded label, right-aligned at x
function badge(s, x, y) {
  textFont(SANS);
  textStyle(NORMAL);
  textSize(12);
  let w = textWidth(s) + 26;
  noFill();
  stroke(C.line);
  rect(x - w, y, w, 30, 15);
  noStroke();
  txt(s, x - w / 2, y + 20, 12, C.text, SANS, NORMAL, CENTER);
}

// A status label on the results screen, right-aligned at x
function pill(s, iconName, x, y, good) {
  let w = 112;
  fill(good ? "#203b2c" : C.bg);
  stroke(good ? "#3e6a4d" : C.line);
  rect(x - w, y, w, 28, 14);
  noStroke();
  icon(iconName, x - w + 14, y + 5, 18);
  txt(s, x - w + 40, y + 19, 13, good ? C.good : C.muted, SANS, BOLD);
}

// A small gold circle with a number in it
function numberBadge(n, x, y) {
  fill(C.accent);
  circle(x, y, 16);
  txt(n, x, y + 4, 10, C.ink, MONO, BOLD, CENTER);
}

// A label on paper, like the ones on the map
function paperChip(s, x, y) {
  textFont(SANS);
  textStyle(NORMAL);
  textSize(12);
  fill(C.paper);
  rect(x, y, textWidth(s) + 20, 28, 6);
  txt(s, x + 10, y + 19, 12, C.paperInk);
}

// The box of a place's label on the map: [x, y, w, h]
function labelBox(i) {
  textFont(SANS);
  textStyle(BOLD);
  textSize(12);
  let w = textWidth(places[i]) + (cameras.includes(i) ? 86 : 64);
  let x = MAP.x + mapX[i] * MAP.w;
  let y = MAP.y + mapY[i] * MAP.h;
  return [x - w / 2, y - 17, w, 34];
}

// Draws a place's label on the map: its number key, its icon, its name,
// and the camera number if a camera is there. Returns true if it was clicked.
function mapLabel(i) {
  let [x, y, w, h] = labelBox(i);
  let hot = inside(x, y, w, h);
  if (hot) hovering = true;
  let k = cameras.indexOf(i);
  if (k != -1) {
    // gold ring around places with a camera
    fill(C.accent);
    rect(x - 4, y - 4, w + 8, h + 8, 11);
  }
  fill(hot ? "#ffe0a1" : "#f0e9d7");
  stroke("#384c36");
  rect(x, y, w, h, 9);
  rect(x + 8, y + 8, 18, 18, 4);
  noStroke();
  txt(i + 1, x + 17, y + 22, 10, C.paperInk, MONO, NORMAL, CENTER);
  icon(ids[i], x + 32, y + 8, 18, true);
  txt(places[i], x + 56, y + 22, 12, C.paperInk, SANS, BOLD);
  if (k != -1) {
    fill("#243d2b");
    circle(x + w - 15, y + 17, 20);
    txt(k + 1, x + w - 15, y + 21, 11, "#ffdc96", MONO, BOLD, CENTER);
  }
  return hot && click;
}

// A photo with a caption underneath, used for camera and archive cards.
// selected cards get a gold border. Returns true if the card was clicked.
function photoCard(pic, x, y, w, ph, title, sub, selected) {
  let h = ph + 52;
  let hot = inside(x, y, w, h);
  if (hot && screen == "review") hovering = true;
  fill(C.surface);
  stroke(selected ? C.accent : C.line);
  strokeWeight(selected ? 2 : 1);
  rect(x, y, w, h, 10);
  noStroke();
  strokeWeight(1);
  // crop the 8:5 photo to the card's shape from the middle
  let sh = (800 * ph) / w;
  image(pic, x + 1, y + 1, w - 2, ph, 0, (500 - sh) / 2, 800, sh);
  txt(title, x + 12, y + ph + 22, 14, C.text);
  txt(sub, x + 12, y + ph + 40, 11, C.muted);
  return hot && click;
}

// A camera photo with the night-vision grain and an info strip underneath.
// While inspecting, the photo zooms in 1.75 times and follows the mouse.
function drawPhoto(pic, x, y, w, h, hudLeft, hudRight) {
  fill("#07110b");
  rect(x, y, w, h + 30);
  if (inspecting && inside(x, y, w, h)) {
    let sw = 800 / 1.75;
    let sh = 500 / 1.75;
    let sx = map(mouseX, x, x + w, 0, 800 - sw);
    let sy = map(mouseY, y, y + h, 0, 500 - sh);
    image(pic, x, y, w, h, sx, sy, sw, sh);
    fill(23, 35, 28, 220);
    rect(x + 10, y + 10, 92, 26, 13);
    txt("1.75× zoom", x + 56, y + 27, 11, C.accent, SANS, BOLD, CENTER);
  } else {
    image(pic, x, y, w, h);
  }
  // a random part of the grain, so it flickers like a night-vision camera
  image(grain, x, y, w, h, random(1200 - w), random(750 - h), w, h);
  fill("#0d1812");
  rect(x, y + h, w, 30);
  txt(hudLeft, x + 12, y + h + 20, 11, "#c7d2c6", MONO);
  txt(hudRight, x + w - 12, y + h + 20, 11, "#c7d2c6", MONO, NORMAL, RIGHT);
  noFill();
  stroke(C.line);
  rect(x, y, w, h + 30, 4);
  noStroke();
}

// The bar along the top: the wordmark, the steps of a night, the night counter and help
function header(step) {
  background(C.bg);
  image(wordmark, 28, 22, 200, 32);
  let steps = ["Plan", "Watch", "Review", "Results"];
  textFont(SANS);
  textStyle(NORMAL);
  textSize(13);
  let total = 3 * 50;
  for (let s of steps) total += 31 + textWidth(s);
  let x = 640 - total / 2;
  for (let i = 0; i < 4; i++) {
    let active = i + 1 == step;
    if (active) fill(C.accent);
    else noFill();
    stroke(active ? C.accent : C.line);
    circle(x + 11, 38, 23);
    noStroke();
    txt(i + 1, x + 11, 42, 11, active ? C.ink : C.muted, SANS, NORMAL, CENTER);
    txt(steps[i], x + 31, 43, 13, active ? C.text : C.muted, SANS, active ? BOLD : NORMAL);
    x += 31 + textWidth(steps[i]) + 12;
    if (i < 3) {
      fill(C.line);
      rect(x, 38, 26, 1);
      x += 38;
    }
  }
  // night counter
  let label = "Night " + night + " / 3";
  textStyle(NORMAL);
  textSize(13);
  let w = textWidth(label) + 58;
  noFill();
  stroke(C.line);
  rect(1196 - 10 - w, 16, w, 44, 22);
  noStroke();
  icon("moon", 1196 - 10 - w + 16, 28);
  txt(label, 1196 - 10 - w + 44, 43, 13, C.text);
  if (iconButton("help", 1208, 16)) help = true;
  fill(C.line);
  rect(0, 75, 1280, 1);
}

// The small label, big title and one-line description at the top of each screen
function pageTitle(small, title, sub) {
  eyebrow(small, 28, 108);
  txt(title, 28, 146, 32, C.text, SERIF);
  txt(sub, 28, 172, 13, C.muted);
}

// The bar along the bottom with a hint on the left (the screen adds its button on the right)
function footer(hint) {
  fill(C.line);
  rect(0, 648, 1280, 1);
  icon("keyboard", 28, 674);
  txtBox(hint, 58, 674, 900, 40, 13, C.muted);
}
