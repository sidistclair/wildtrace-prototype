// Wild Trace prototype

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

// Which screen is showing: "title", "briefing", "plan", "watch", "review", "gear",
// "report", "results" or "end"
let screen = "title";
let help = false; // true while the How to play page is open
let askRestart = false; // true while "start over?" is showing

// The 5 camera spots. The same index is used in every list,
// e.g. index 2 is the Wildlife Corridor.
let places = ["Old Forest", "Creek Crossing", "Wildlife Corridor", "Farm Edge", "Ridge Road"];
let short = ["Forest", "Creek", "Corridor", "Farm", "Ridge"]; // for small captions
// Names used in the art files, e.g. assets/photos/N2-corridor-frame-1.jpg
let ids = ["forest", "creek", "corridor", "farm", "ridge"];
// Where each place is on the map, as a fraction of the map's width and height
let mapX = [0.24, 0.4, 0.69, 0.84, 0.6];
let mapY = [0.34, 0.63, 0.42, 0.78, 0.16];
// The paper map is pinned to the corkboard in this box
const MAP = { x: 70, y: 95, w: 760, h: 530 };
const RIDGE = 4;

let night = 1;              // current night, 1 to 3
let cameras = [null, null]; // the place each camera is at (null = not placed yet)
let lost = -1;              // the camera smashed on the ridge on night 2 (-1 = none)
let cleaned = [];           // the dirty-lens scenes the player has wiped clean, as "night-place"
let lostAt = -1;            // the place it was smashed at
let upgrades = [];          // the ids of the gear the player has picked
let timer = 0;              // frames since the night started
let flash = 0;              // brightness of a camera flash on the watch screen, fades to 0
let clues = [];             // the clues the player has flagged so far
let flags = [];             // the scenes the player has flagged, as "night-place"
let seen = [];              // the photos the player has taken, as "night-place"
let pins = [];              // pinned photos, each { key, pic }

// The review screen
let current = 0;        // which camera's photo is showing (0 or 1)
let frame = [0, 0];     // which frame each camera's photo is on
let message = "";       // what the player learned from the last photo they flagged
let comparing = false;  // true while an earlier photo is shown next to the current one
let earlier = 0;        // which earlier photo is being compared
let inspecting = false; // true while the photos zoom in under the mouse

// The case report
const SLOTS = 6;        // how many photos the player can use as evidence
const SW = 101;         // size of an evidence slot (6 fit across the report)
const SH = 74;
let tray = [];          // every photo the player can pick, pinned first: { id, pic, caption, tags, pinned }
let slots = [];         // slots[i] is the photo id in evidence slot i, or null
let links = [];         // links[i] lists the claims the photo in slot i supports
let selected = -1;      // the slot whose claims are being ticked (-1 = none)
let order = [];         // the claims in the order they are shown (shuffled for every report)
let confirming = false; // true while the "ready to submit?" check is showing
let notice = "";        // a short warning on the report, e.g. when all slots are full
let results = [];       // results[claim] once submitted: { status, text, linked }
let attempts = 0;       // how many times the report has been submitted
let history = [];       // every submitted report, oldest first: { slots, links, results }
let writeStart = 0;     // the frame the handwriting animation started on

// Mouse
let click = false;      // true for the one frame after a click (a press and release without dragging)
let hovering = false;   // true when the mouse is over something clickable
let pressSource = null; // what could be dragged from where the mouse was pressed
let pressX = 0, pressY = 0;
let dragging = null;    // the camera being dragged: { cam: k }

// What each camera sees: events[night - 1][place].
// note describes the photo. clue is filled in when the photo shows something wrong,
// and tag is the short name written on its polaroid on the results board.
// tags[frame] is a hidden list of what each frame shows. The player never sees these;
// the case report checks them to decide what the linked photos prove.
// The same animals keep coming back: the fox (F1) has a white-tipped tail,
// and the doe (D2) has a pale mark on her shoulder and a spotted fawn.
let events = [
  [ // night 1
    { time: "22:14", note: "A doe with a pale shoulder mark grazes with her spotted fawn. A fox with a white-tipped tail trots past.", clue: "",
      tags: [["doe", "reserve"], ["fox", "reserve"]] },
    { time: "05:40", note: "An otter by the water, then the doe and her fawn come down to drink.", clue: "",
      tags: [["reserve", "water"], ["doe", "reserve", "water"]] },
    { time: "01:10", note: "The fox and a badger travel along the corridor. Later a buck walks through.", clue: "",
      tags: [["fox", "reserve", "corridor-use"], ["reserve", "corridor-use"]] },
    { time: "23:55", note: "Just the farm dog sniffing around the bins.", clue: "",
      tags: [["farm-dog", "farm"]] },
    { time: "14:20", note: "Daytime. Workers from Ridgeline Developments mark out a road next to their yellow truck.", clue: "A construction crew is marking out a new road on the ridge.", tag: "road crew",
      tags: [["new-road", "crew", "daylight"]] },
  ],
  [ // night 2
    { time: "21:48", note: "The doe and her fawn walk along a new fence at the forest edge, pacing back and forth for a way through.", clue: "The fence now runs along the forest edge too, and the doe and fawn can't get through.", tag: "forest fence",
      tags: [["doe", "reserve", "fence"], ["doe", "reserve", "fence"]] },
    { time: "20:30", note: "No animals, but there is a wire snare set on the path to the water. Later the doe and her fawn walk right past it.", clue: "Someone has set a snare by the creek.", tag: "snare!",
      tags: [["snare", "water"], ["snare", "doe", "reserve", "water"]] },
    { time: "00:30", note: "A badger reaches the half-built fence and has to turn back.", clue: "The new fence is cutting off the wildlife corridor.", tag: "fence",
      tags: [["fence"], ["fence", "fence-blocking"]] },
    { time: "02:31", note: "The fox from the forest, white-tipped tail and all, is raiding the farm's bins.", clue: "The forest fox has been pushed out to the farm.", tag: "fox at farm",
      tags: [["fox", "farm"], ["fox", "farm"]] },
    { time: "23:50", note: "A dark pickup with a roof light bar and a dented tailgate drives the new road at night. Two hours later a gloved hand with a bright stripe on its sleeve grabs the camera.", clue: "A mystery pickup is using the new road at night.", tag: "night pickup",
      tags: [["new-road", "night-vehicle"], ["gloved-hand"]] },
  ],
  [ // night 3
    { time: "03:00", note: "Nothing. The forest is empty tonight.", clue: "",
      tags: [[], []] },
    { time: "04:05", note: "A person with a headlamp and a bright stripe on their sleeve kneels at the snare. Fifteen minutes later the snare is gone, leaving only holes.", clue: "A hunter with a headlamp is checking the snare.", tag: "hunter",
      tags: [["snare", "hunter", "water"], ["water"]] },
    { time: "23:10", note: "The doe and her fawn reach the finished fence and can't get through.", clue: "The finished fence stops the doe and fawn using the corridor.", tag: "fence closed",
      tags: [["fence", "doe", "reserve"], ["fence", "fence-blocking", "doe", "reserve"]] },
    { time: "03:30", note: "The doe and her fawn from the reserve are eating the farm's crops.", clue: "The doe and fawn have been pushed out to the farm.", tag: "deer at farm",
      tags: [["doe", "farm"], ["doe", "farm"]] },
    { time: "04:20", note: "The same dark pickup, seen from behind. The plate reads K7R-418.", clue: "The pickup is back, and its plate is K7R-418.", tag: "K7R-418",
      tags: [["new-road", "night-vehicle"]] },
  ],
  [ // night 4
    { time: "22:40", note: "The fox with the white-tipped tail squeezes under the forest fence, then trots off towards the farm.", clue: "The forest fox is heading out towards the farm.", tag: "fox leaving",
      tags: [["fox", "reserve", "fence"], ["fox", "reserve"]] },
    { time: "21:15", note: "A new snare on the path to the water. The doe and her fawn stop, then walk the long way round it.", clue: "Another snare has been set by the creek.", tag: "new snare",
      tags: [["snare", "water"], ["snare", "doe", "reserve", "water"]] },
    { time: "01:50", note: "The fox reaches the finished fence, sniffs along it, and has to turn back.", clue: "The fence turns the fox back too.", tag: "fox blocked",
      tags: [["fence", "fox", "reserve"], ["fence", "fence-blocking", "fox", "reserve"]] },
    { time: "03:05", note: "The farm dog barks at the fox, which is raiding the hen house.", clue: "The forest fox is raiding the farm's hen house.", tag: "hen house",
      tags: [["fox", "farm", "farm-dog"], ["fox", "farm"]] },
    { time: "23:30", note: "The dark pickup parks on the new road with its lights off. Someone with a headlamp walks from it into the trees.", clue: "The pickup's driver walks into the reserve at night.", tag: "driver",
      tags: [["new-road", "night-vehicle"], ["new-road", "hunter"]] },
  ],
  [ // night 5
    { time: "02:00", note: "Nothing. The forest is still empty.", clue: "",
      tags: [[], []] },
    { time: "05:10", note: "The hunter with the striped sleeve checks the new snare at dawn, then heads back up towards the ridge.", clue: "The hunter is back checking snares at the creek.", tag: "hunter again",
      tags: [["snare", "hunter", "water"], ["hunter", "water"]] },
    { time: "00:15", note: "No animals come through the corridor at all. Only the fence.", clue: "",
      tags: [["fence"], ["fence"]] },
    { time: "04:00", note: "The doe and her fawn are back in the farm's vegetable patch until the farmer chases them off.", clue: "The doe and fawn keep coming back to the farm.", tag: "farm again",
      tags: [["doe", "farm"], ["doe", "farm"]] },
    { time: "23:55", note: "Two dark pickups on the new road now. One of them is K7R-418.", clue: "More night traffic on the new road, including K7R-418.", tag: "two pickups",
      tags: [["new-road", "night-vehicle"]] },
  ],
];
// How many frames each camera took: frameCounts[night - 1][place]
let frameCounts = [[2, 2, 2, 1, 1], [2, 2, 2, 2, 2], [2, 2, 2, 2, 1], [2, 2, 2, 2, 2], [2, 2, 2, 2, 1]];
// Scenes where the camera comes back with a dirty lens, which the player has to wipe clean
// before they can look properly ("night-place": what's on it)
const DIRTY = { "1-3": "slobber", "2-1": "mud", "3-2": "droppings", "4-3": "slobber", "5-1": "mud" };
// How many nights the survey lasts (one for each list in events)
const NIGHTS = events.length;

// Dr. Okafor's old photos, shown in the journal and compared with yours
let archive = [
  { file: "ARC-1", place: 0, when: "6 weeks ago", note: "Dr. Okafor's photo: the same fox, back when it lived in the forest.", tags: ["fox", "reserve"] },
  { file: "ARC-2", place: 2, when: "6 weeks ago", note: "Dr. Okafor's photo: the doe and her fawn walking freely through the corridor, before the fence.", tags: ["doe", "reserve", "corridor-use"] },
  { file: "ARC-3", place: 4, when: "4 weeks ago", note: "Dr. Okafor's photo: the ridge before any road was built.", tags: [] },
  { file: "ARC-4", place: 4, when: "9 days ago", note: "Dr. Okafor's photo: headlights on the ridge at night, just before the camera stopped working.", tags: ["night-vehicle"] },
];
// Dr. Okafor's last notes, written in the journal
let notes = ["Corridor numbers dropping.", "Fox seen near the farm??", "Someone's been at my cameras."];

// The gear the ranger station can send. The player picks one after night 1 and one after night 2.
// The spare camera is only offered to a player whose camera was smashed on the ridge.
let gear = [
  { id: "lens", name: "Zoom lens", icon: "zoom", text: "Unlocks the ZOOM key, so you can look at small details in a photo up close." },
  { id: "app", name: "Photo matcher", icon: "compare", text: "Unlocks the COMPARE key: your photo side by side with older photos of the same place." },
  { id: "motion", name: "Motion sensor log", icon: "pin", text: "Each evening the map shows where something moved last night at spots you didn't watch." },
  { id: "scope", name: "Field ID scope", icon: "eye", text: "Point at anything in a photo to outline it and see what it is." },
];
const REPAIR = { id: "repair", name: "Repair kit", icon: "camera", text: "Rewire the smashed camera so you have 2 cameras again tonight." };

// The claims in the case report. Three are true and two are false, and they are shown in a
// random order with nothing saying which is which. check() looks at the hidden tags of the
// photos linked to a true claim and returns "proven", "partly" or "none" with an explanation.
// A false claim is never supported, whatever is linked to it.
let claims = [
  {
    text: "The new fence has cut off the wildlife corridor.", truth: true, check: checkFence,
    concept: "Habitat fragmentation",
    explain: "A corridor links two patches of habitat. Cut it, and animals get stuck away from food, water and mates.",
  },
  {
    text: "Animals pushed out of the reserve are causing trouble at the farm.", truth: true, check: checkFarm,
    concept: "Human-wildlife conflict",
    explain: "Animals that lose their home or their path move, often towards people. Then they raid crops and bins, and both sides lose.",
  },
  {
    text: "The new road is letting poachers into the reserve.", truth: true, check: checkRoad,
    concept: "Access",
    explain: "Roads let people reach wild places quickly, at night, with nobody watching. That makes poaching easier.",
  },
  {
    text: "The construction crew is setting the snares.", truth: false,
    why: "The crew's yellow truck only appears in daylight and never near a snare. The night pickup is a different truck.",
  },
  {
    text: "The animals left because the creek is drying up.", truth: false,
    why: "There is water in every Creek Crossing photo.",
  },
];

// Each check gets the tag lists of the photos linked to the claim

// Proven by an animal actually turned back by the fence
function checkFence(photos) {
  let any = (t) => photos.some((p) => p.includes(t));
  if (any("fence-blocking")) return { status: "proven", text: "Proven. An animal was turned back by the fence, so the corridor is cut." };
  if (any("fence")) return { status: "partly", text: "Partly supported. You showed the fence, but not an animal actually turned back by it." };
  if (any("corridor-use")) return { status: "partly", text: "Partly supported. You showed animals using the corridor, but not the fence stopping them." };
  return { status: "none", text: "Not supported. A photo of an animal turned back by the corridor fence would prove it." };
}

// Proven by the same animal at home in the reserve and later at the farm
function checkFarm(photos) {
  let animals = [["fox", "the fox with the white-tipped tail"], ["doe", "the doe and her fawn"]];
  let home = [], away = [];
  for (let [a, name] of animals) {
    if (photos.some((p) => p.includes(a) && p.includes("reserve"))) home.push(name);
    if (photos.some((p) => p.includes(a) && p.includes("farm"))) away.push(name);
  }
  let both = home.find((name) => away.includes(name));
  if (both) return { status: "proven", text: "Proven. The same animal, " + both + ", lived in the reserve and now turns up at the farm." };
  if (home.length && away.length) return { status: "partly", text: "Partly supported. Your reserve and farm photos show different animals. You need the same animal in both places." };
  if (away.length) return { status: "partly", text: "Partly supported. You showed " + away[0] + " at the farm, but not the same animal at home in the reserve." };
  if (home.length) return { status: "partly", text: "Partly supported. You showed " + home[0] + " in the reserve, but not at the farm." };
  return { status: "none", text: "Not supported. You needed the same animal at home in the reserve, then at the farm." };
}

// Proven by the new road, a vehicle at night and a snare, all together
function checkRoad(photos) {
  let needs = [["new-road", "the new road"], ["night-vehicle", "a vehicle at night"], ["snare", "a snare"]];
  let missing = needs.filter(([t]) => !photos.some((p) => p.includes(t))).map(([t, name]) => name);
  if (missing.length == 0) return { status: "proven", text: "Proven. The new road, a vehicle driving it at night and snares in the reserve add up." };
  let list = missing.length == 1 ? missing[0] : missing.slice(0, -1).join(", ") + " and " + missing[missing.length - 1];
  if (missing.length < 3) return { status: "partly", text: "Partly supported. Still missing: " + list + "." };
  return { status: "none", text: "Not supported. You needed " + list + "." };
}

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

  // Load every frame from every place on every night (5 scenes a night).
  // Photos that don't exist yet just stay blank.
  for (let n = 1; n <= NIGHTS; n++) {
    photos[n] = [];
    for (let i = 0; i < 5; i++) {
      photos[n][i] = [];
      for (let f = 1; f <= frameCounts[n - 1][i]; f++) {
        photos[n][i].push(loadPic("assets/photos/N" + n + "-" + ids[i] + "-frame-" + f + ".jpg", 800, 500));
      }
    }
  }
  for (let a of archive) a.pic = loadPic("assets/photos/" + a.file + "-frame-1.jpg", 800, 500);
  for (let n = 1; n <= NIGHTS; n++) maps[n] = loadPic("assets/map/night-" + n + ".jpg", 1720, 1200);
  titlePic = loadPic("assets/screens/title-background.jpg", 1920, 1080);
  for (let name of ["left", "right", "zoom", "pin", "compare", "warning", "camera", "eye"]) {
    icons[name] = loadPic("assets/ui/icons/" + name + "-light.png", 96, 96);
  }
  makeTextures();
  saved = loadSave();
  // save one last time when the tab is closed or hidden
  window.addEventListener("pagehide", autosave);
}

// The map for a night. A night without its own map painting yet uses the latest one that exists.
function mapFor(n) {
  for (let m = n; m > 1; m--) if (maps[m].loaded) return maps[m];
  return maps[1];
}

// Loads a picture through an <img> tag rather than loadImage(),
// so it also works when index.html is opened straight from disk.
// The picture is blank until the file has loaded.
function loadPic(path, w, h) {
  let pic = createImage(w, h);
  let img = new Image();
  img.onload = () => {
    pic.drawingContext.drawImage(img, 0, 0, w, h);
    pic.loaded = true;
  };
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
  if (help || askRestart) click = false;

  if (screen == "title") drawTitle();
  else if (screen == "briefing") drawBriefing();
  else if (screen == "plan") drawPlan();
  else if (screen == "watch") drawWatch();
  else if (screen == "review") drawReview();
  else if (screen == "gear") drawGear();
  else if (screen == "report") drawReport();
  else if (screen == "results") drawResults();
  else if (screen == "end") drawEnd();
  else if (screen == "wires") drawWires();

  click = realClick;
  if (help) {
    hovering = false;
    drawHelp();
  } else if (askRestart) {
    hovering = false;
    drawRestart();
  } else if (screen != "title") {
    if (helpButton(1236, 40)) help = true;
    if (helpButton(1184, 40, "↺")) askRestart = true;
  }
  // save the game twice a second if anything changed
  if (frameCount % 30 == 0) autosave();
  // A hand cursor shows what can be clicked. ("pointer" is spelt out because
  // our HAND font name hides p5's HAND cursor constant.)
  cursor(dragging ? "grabbing" : hovering ? "pointer" : ARROW);
  click = false;
}

// When the mouse goes down, remember what is under it in case the player drags it
function mousePressed() {
  pressSource = help || askRestart ? null : dragSourceAt();
  pressX = mouseX;
  pressY = mouseY;
  dragging = null;
}

// Moving more than a few pixels with the mouse down starts a drag
function mouseDragged() {
  if (pressSource && !dragging && dist(mouseX, mouseY, pressX, pressY) > 6) dragging = pressSource;
}

// Letting go either drops what is being dragged, or counts as a click.
// The click is handled by the buttons in the next draw().
function mouseReleased() {
  if (dragging) drop();
  else click = true;
  dragging = null;
  pressSource = null;
}

// Keyboard shortcuts (listed on the How to play page)
function keyPressed() {
  if (keyCode == ESCAPE) {
    help = false;
    askRestart = false;
    comparing = false;
    dragging = null;
    pressSource = null;
    confirming = false;
    selected = -1;
    if (wires) wires.sel = -1;
  }
  if (help || askRestart) return;
  if (screen == "plan" && key >= "1" && key <= "5") placeCamera(int(key) - 1);
  if (screen == "watch" && key == " ") startReview();
  if (screen == "review") {
    if (keyCode == LEFT_ARROW) stepFrame(-1);
    if (keyCode == RIGHT_ARROW) stepFrame(1);
    if (keyCode == UP_ARROW || keyCode == DOWN_ARROW) {
      let a = active();
      chooseCamera(a[(a.indexOf(current) + 1) % a.length]);
    }
    let k = key.toLowerCase();
    // flag, pin, compare and zoom wait until a dirty lens has been wiped
    if (isDirty()) return;
    if (k == "f") flagPhoto();
    if (k == "p") togglePin();
    if (k == "c" && has("app") && earlierPhotos().length > 0) toggleCompare();
    if (k == "v" && has("lens")) inspecting = !inspecting;
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
  txt(["", "one", "two", "three", "four", "five", "six", "seven"][NIGHTS] + " nights. two cameras. one missing researcher.", 98, 392, 38, "#e9e2cf", HAND);

  if (saved) {
    // a game in progress: carry on, or start again (which asks first)
    let where = ["report", "results", "end"].includes(saved.screen) ? "the case" : "night " + saved.night;
    if (noteButton("Continue: " + where, 96, 450, 320, 84)) resumeGame(saved);
    if (noteButton("New game", 446, 456, 210, 84, PAPER, 0.03)) askRestart = true;
    if (noteButton("How to play", 686, 462, 230, 84, PAPER, -0.02)) help = true;
  } else {
    if (noteButton("Start", 96, 450, 200, 84)) screen = "briefing";
    if (noteButton("How to play", 326, 456, 250, 84, PAPER, 0.03)) help = true;
  }
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
  stickyNote(160, 430, 280, 170, -0.04, "Okafor is missing.\nTake the 2 cameras.\n" + NIGHTS + " nights until the hearing.");

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
  image(mapFor(night), MAP.x, MAP.y, MAP.w, MAP.h);
  for (let [x, y] of [[MAP.x + 6, MAP.y + 4], [MAP.x + MAP.w - 6, MAP.y + 4], [MAP.x + 6, MAP.y + MAP.h - 4], [MAP.x + MAP.w - 6, MAP.y + MAP.h - 4]]) {
    pushpin(x, y, "#c0392b");
  }
  paperLabel(active().length == 1 ? "Where should your last camera go?" : "Where should the cameras go?", 450, 64, -0.01);

  // With the motion sensor log, show tracks at the spots nobody watched last night
  // where something happened
  if (has("motion") && night > 1) {
    for (let p = 0; p < 5; p++) {
      if (seen.includes(night - 1 + "-" + p) || !events[night - 2][p].clue) continue;
      tracks(MAP.x + mapX[p] * MAP.w - 6, MAP.y + mapY[p] * MAP.h + 36);
    }
  }

  // the 5 places: a pin and a handwritten tag, or a camera if one is there
  let focus = -1; // the place whose old photo is shown on the desk
  for (let i = 0; i < 5; i++) {
    if (mapSpot(i)) placeCamera(i);
    if (inside(...spotBox(i))) focus = i;
  }

  // Right side of the desk: the calendar, the cameras and Okafor's photo of a place
  calendar(925, 40, -0.03);
  for (let k = 0; k < 2; k++) deskCamera(k);
  if (focus == -1) {
    for (let k of active()) if (cameras[k] != null) focus = cameras[k];
  }
  let old = focus == -1 ? [] : archive.filter((a) => a.place == focus);
  if (loose != -1) {
    stickyNote(930, 380, 300, 180, 0.03, "CAM " + (loose + 1) + " got knocked over and its wires came loose. Click it to fix it!");
  } else if (focus == -1) {
    stickyNote(930, 380, 300, 180, 0.03, "Drag a camera onto the map, or click a place. Point at a place to see Okafor's old photo.", PAPER);
  } else if (old.length == 0) {
    stickyNote(930, 380, 300, 180, 0.03, places[focus] + ":\nno photos from here yet. Yours will be the first!", PAPER);
  } else {
    let a = old[old.length - 1];
    polaroid(a.pic, 1080, 470, 270, 0.03, places[focus] + " · " + a.when);
    tape(1080, 362, 0.08);
  }

  let need = active().length;
  let placed = active().filter((k) => cameras[k] != null).length;
  if (noteButton(placed < need ? "Place " + (need - placed) + " more" : need == 1 ? "Set the camera →" : "Set the cameras →", 930, 628, 300, 72, STICKY, -0.02, placed < need)) {
    timer = 0;
    screen = "watch";
  }

  // the camera being dragged follows the mouse
  if (dragging && dragging.cam != null) trailCamera(mouseX, mouseY, 0.8, dragging.cam + 1);
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

  // A readout for each working camera. It flashes when that camera takes its photo.
  let list = active();
  for (let j = 0; j < list.length; j++) {
    let k = list[j];
    let x = 640 - list.length * 170 + 20 + j * 340;
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
  views = [];
  if (comparing) {
    // the current photo and an earlier one side by side
    let e = list[earlier];
    drawPhoto(currentPic(), 84, 200, 318, 199, currentKey());
    drawPhoto(e.pic, 406, 200, 318, 199, e.key);
    screenText("NOW · NIGHT " + night, 94, 190);
    screenText("THEN · " + e.title.toUpperCase(), 416, 190);
    screenText(e.note, 94, 440, 24, 620);
  } else {
    drawPhoto(currentPic(), 84, 100, 640, 400, currentKey());
    drawLens();
  }
  image(scanlines, 84, 100);
  let dirty = isDirty();
  // the Field ID scope outlines whatever is under the mouse (not through a dirty lens)
  if (has("scope") && !dirty && !help && !askRestart) drawScope();
  // the information along the top and bottom of the screen
  if (frameCount % 60 < 40) {
    fill("#ff4a3d");
    circle(104, 120, 12);
  }
  screenText("PLAYBACK  CAM " + (current + 1), 116, 128);
  screenText(places[place].toUpperCase(), 712, 128, 26, 0, RIGHT);
  screenText("NIGHT " + night + "  " + events[night - 1][place].time, 96, 488);
  screenText("FRAME " + (frame[current] + 1) + "/" + n + "   BAT ▮▮▮▯", 712, 488, 26, 0, RIGHT);
  let marks = (pinned ? "[ PINNED ] " : "") + (isFlagged() ? "[ FLAGGED ]" : "");
  if (marks) screenText(marks.trim(), 96, 160, 26, 0, LEFT, "#ffd866");
  if (inspecting) screenText("ZOOM 1.75x", 404, 488, 26, 0, CENTER, "#ffd866");
  // the camera that is about to be smashed sent these photos just in time
  if (current == doomed()) screenText("!! SIGNAL LOST AFTER THIS UPLOAD !!", 404, 196, 26, 0, CENTER, "#ff6b5e");

  // the keys under the screen. Zoom and compare need gear from the ranger station.
  if (deviceKey("left", "PREV", 84, 556, frame[current] == 0)) stepFrame(-1);
  if (deviceKey("right", "NEXT", 192, 556, frame[current] == n - 1)) stepFrame(1);
  if (deviceKey("zoom", has("lens") ? "ZOOM" : "NO LENS", 300, 556, !has("lens") || dirty, inspecting)) inspecting = !inspecting;
  if (deviceKey("pin", "PIN", 408, 556, dirty, pinned)) togglePin();
  if (deviceKey("compare", has("app") ? "COMPARE" : "NO APP", 516, 556, !has("app") || list.length == 0 || dirty, comparing)) toggleCompare();
  // a speaker grille
  fill(0, 90);
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) circle(670 + i * 14, 576 + j * 14, 6);

  // the camera switch and the big red flag button on the right
  txt("CAMERA", 822, 108, 14, "rgba(255,255,255,0.7)", TYPE, CENTER);
  for (let k = 0; k < 2; k++) {
    if (deviceKey("camera", k == lost ? "LOST" : "CAM " + (k + 1), 776, 122 + k * 96, k == lost, k == current)) chooseCamera(k);
  }
  if (flagButton(822, 410, isFlagged(), dirty)) flagPhoto();

  // Next to the camera: the calendar and a sticky note with what the player has learned
  calendar(940, 40, 0.03);
  let tonight = events[night - 1];
  let hint = !active().some((k) => tonight[cameras[k]].clue)
    ? "Hmm... nothing looks wrong at these places tonight. Try other spots next night."
    : "Look closely at each camera. Hit the red FLAG button if something looks wrong.";
  stickyNote(925, 220, 320, 330, -0.02, dirty ? dirtNote() : message || hint);
  if (message.startsWith("Good")) stamp("EVIDENCE", 1150, 520, -0.2, color(190, 40, 40, 220), 30);

  let last = night == NIGHTS;
  if (noteButton(last ? "Build the case →" : "Next night →", 940, 628, 290, 72)) {
    if (last) {
      startReport();
    } else {
      // whoever drives the ridge road at night smashes a camera left there on night 2
      if (night == 2) {
        lost = doomed();
        if (lost != -1) {
          lostAt = cameras[lost];
          cameras[lost] = null;
        }
      }
      screen = "gear";
    }
  }
}

// Gear: a supply drop from the ranger station between nights. The player picks one item.
function drawGear() {
  desk();
  paperLabel("Supply drop from the ranger station: pick one", 640, 70, -0.01);
  let left = gear.filter((g) => !has(g.id));
  if (lost != -1) left.push(REPAIR); // offered at every drop until the camera is fixed
  // nothing left to give: straight on to the next night
  if (left.length == 0) {
    nextNight();
    return;
  }
  // up to 3 cards fit at full size; with 4 they are spaced closer and shrunk to fit
  let dx = min(380, 1200 / left.length);
  let s = min(1, (dx - 20) / 320);
  for (let i = 0; i < left.length; i++) {
    let x = 640 + (i - (left.length - 1) / 2) * dx;
    if (gearCard(left[i], x, 320, i % 2 ? 0.02 : -0.02, s)) {
      if (left[i] == REPAIR) {
        startWires(lost, "gear"); // fix it first; the puzzle goes on to the next night
      } else {
        upgrades.push(left[i].id);
        nextNight();
      }
    }
  }
  // the bad news after night 2
  if (lost != -1 && night == 2) {
    stickyNote(380, 540, 520, 150, -0.02, "Bad news: CAM " + (lost + 1) + " was smashed on Ridge Road right after it caught that gloved hand. You have 1 camera left.");
  }
}

// Case report: pick up to 5 photos as evidence, then tick the claims each one supports
function drawReport() {
  desk();
  // While the confirmation is showing, clicks only reach it
  let realClick = click;
  if (confirming) click = false;

  // Left: every photo the player has, pinned ones first
  txt("Your photos", 50, 62, 36, "#f0e6cc", MARKER);
  txt(pins.length ? "pinned photos first" : "click one to use it", 255, 60, 24, "#d8ccb0", HAND, LEFT, BOLD);
  let hovered = null;
  for (let i = 0; i < tray.length; i++) {
    let [x, y] = gridPos(i);
    let t = tray[i];
    let used = slots.indexOf(t.id);
    let g = gridLayout();
    let hot = inside(x - g.w / 2 - 8, y - g.dy / 2 + 6, g.w + 16, g.dy - 12);
    if (hot) {
      hovering = true;
      hovered = t;
      if (click) pickPhoto(t.id);
    }
    if (used != -1 && used == selected) {
      fill(STICKY);
      rect(x - g.w / 2 - 10, y - g.dy / 2 + 4, g.w + 20, g.dy - 8, 6);
    }
    polaroid(t.pic, x, y, g.w, ((i * 5) % 3 - 1) * 0.03, t.caption, used != -1);
    if (t.pinned) pushpin(x, y - g.dy / 2 + 10, "#c0392b");
    if (used != -1) slotBadge(used, x, y - 6, g.w * 0.3);
  }

  // Right: the report form
  shadowOn(20);
  fill(PAPER);
  rect(560, 20, 690, 680, 4);
  shadowOff();
  txt("CASE REPORT: WILLOWMERE RESERVE", 590, 60, 22, INK, TYPE);
  txt("Evidence: your " + SLOTS + " strongest photos", 590, 96, 28, BLUE, HAND, LEFT, BOLD);

  // the evidence slots
  for (let i = 0; i < SLOTS; i++) {
    let [sx, sy] = slotPos(i);
    let id = slots[i];
    let hot = inside(sx, sy, SW, SH);
    let remove = id && dist(mouseX, mouseY, sx + SW - 14, sy + 14) < 12;
    if (hot || remove) hovering = true;
    if (id) {
      shadowOn(6);
      fill(250);
      rect(sx - 4, sy - 4, SW + 8, SH + 8, 2);
      shadowOff();
      image(trayItem(id).pic, sx, sy, SW, SH);
    } else {
      fill(0, 12);
      rect(sx, sy, SW, SH, 4);
      noFill();
      stroke(BLUE);
      drawingContext.setLineDash([6, 5]);
      rect(sx, sy, SW, SH, 4);
      drawingContext.setLineDash([]);
      noStroke();
      txt("empty", sx + SW / 2, sy + SH / 2 + 8, 22, "rgba(38,64,107,0.5)", HAND, CENTER);
    }
    if (i == selected) {
      noFill();
      stroke(STICKY);
      strokeWeight(5);
      rect(sx - 6, sy - 6, SW + 12, SH + 12, 4);
      strokeWeight(1);
      noStroke();
    }
    slotBadge(i, sx + 4, sy + 4, 24);
    if (id) {
      // the remove button
      fill(remove ? "#c0392b" : "rgba(0,0,0,0.55)");
      circle(sx + SW - 14, sy + 14, 22);
      txt("✕", sx + SW - 14, sy + 20, 15, "#fff", TYPE, CENTER);
      // a warning dot when the photo isn't linked to any claim yet
      if (links[i].length == 0) txt("not linked", sx + SW / 2, sy + SH + 22, 18, "#a3312b", HAND, CENTER, BOLD);
    }
    if (click) {
      if (remove) removeSlot(i);
      else if (hot) selected = selected == i ? -1 : i;
    }
  }

  // the claims, with a box to tick for the selected photo
  let ready = selected != -1 && slots[selected];
  txt(ready ? "Tick every claim that photo " + (selected + 1) + " supports:"
    : "Select a photo in a slot, then tick the claims it supports.", 590, 236, 26, ready ? "#a3312b" : BLUE, HAND, LEFT, BOLD);
  let budget = (frameCount - writeStart) * 1.5; // how many letters have been written so far
  for (let r = 0; r < order.length; r++) {
    let c = order[r];
    let y = 256 + r * 66;
    let hot = ready && inside(580, y, 650, 60);
    if (hot) {
      hovering = true;
      fill(246, 216, 96, 60);
      rect(580, y, 650, 60, 4);
      if (click) toggleLink(selected, c);
    }
    stroke(70, 110, 170, 60);
    line(580, y + 62, 1230, y + 62);
    noStroke();
    // the tick box
    let ticked = ready && links[selected].includes(c);
    fill(ready ? 255 : "rgba(255,255,255,0.4)");
    stroke(ready ? BLUE : "rgba(38,64,107,0.3)");
    strokeWeight(2);
    rect(592, y + 16, 28, 28, 4);
    strokeWeight(1);
    noStroke();
    if (ticked) txt("✓", 606, y + 42, 32, "#a3312b", MARKER, CENTER);
    writeText(claims[c].text, 638, y + 26, 440, 25, BLUE, HAND, 26, budget);
    budget -= claims[c].text.length;
    // which slots back this claim
    let backing = [];
    for (let i = 0; i < SLOTS; i++) if (slots[i] && links[i].includes(c)) backing.push(i);
    for (let j = 0; j < backing.length; j++) slotBadge(backing[j], 1104 + (j % 4) * 30, y + 18 + floor(j / 4) * 26, 24);
  }
  if (click && budget < 0) writeStart = -100000;

  if (notice) txtBox(notice, 590, 600, 340, 80, 24, "#a3312b", HAND, 26);
  if (noteButton("Submit report →", 950, 620, 270, 66)) {
    confirming = true;
    selected = -1;
  }

  // a closer look at the photo under the mouse, over the report
  if (hovered && !confirming) {
    polaroid(hovered.pic, 905, 410, 460, 0.01, hovered.caption);
    if (hovered.pinned) pushpin(905, 248, "#c0392b");
  }

  click = realClick;
  if (confirming) drawConfirm();
}

// The "ready to submit?" check over the report
function drawConfirm() {
  fill(0, 150);
  rect(0, 0, 1280, 720);
  let used = slots.filter((id) => id).length;
  let loose = [];
  for (let i = 0; i < SLOTS; i++) if (slots[i] && links[i].length == 0) loose.push(i + 1);
  push();
  translate(640, 340);
  rotate(-0.01);
  shadowOn(30);
  fill(PAPER);
  rect(-330, -200, 660, 400, 4);
  shadowOff();
  txt("Ready to submit?", -290, -130, 46, INK, MARKER);
  txt("You used " + used + " of " + SLOTS + " photos.", -290, -60, 34, BLUE, HAND, LEFT, BOLD);
  let warn = used == 0 ? "You haven't picked any evidence yet."
    : loose.length == 0 ? "Every photo is linked to at least one claim."
      : loose.length == 1 ? "Photo " + loose[0] + " isn't linked to any claim, so it won't count."
        : "Photos " + loose.join(", ") + " aren't linked to any claim, so they won't count.";
  txtBox(warn, -290, -30, 580, 100, 30, used == 0 || loose.length ? "#a3312b" : BLUE, HAND, 32);
  pop();
  if (noteButton("Go back", 360, 430, 220, 70, PAPER, 0.02)) confirming = false;
  if (noteButton("Submit →", 700, 430, 220, 70)) {
    confirming = false;
    submitReport();
  }
}

// Results: how each claim held up, with the science behind the true ones
function drawResults() {
  desk();
  shadowOn(20);
  fill(PAPER);
  rect(30, 20, 1220, 680, 4);
  shadowOff();
  let proven = claims.filter((cl, c) => cl.truth && results[c].status == "proven").length;
  txt("The verdict", 60, 82, 54, INK, MARKER);
  txt(proven + " of 3 true claims proven" + (attempts > 1 ? "  ·  attempt " + attempts : ""), 1190, 80, 22, INK, TYPE, RIGHT);

  let looks = {
    proven: ["PROVEN", color(40, 130, 60, 230)],
    partly: ["PARTLY SUPPORTED", color(200, 120, 20, 230)],
    none: ["NOT SUPPORTED", color(190, 40, 40, 220)],
  };
  let budget = (frameCount - writeStart) * 3;
  for (let r = 0; r < order.length; r++) {
    let c = order[r];
    let cl = claims[c];
    let res = results[c];
    let y = 105 + r * 102;
    stroke(70, 110, 170, 60);
    line(60, y + 100, 1220, y + 100);
    noStroke();
    // shrink a long claim so it doesn't run into the right column
    let title = r + 1 + ". " + cl.text;
    textFont(HAND);
    textStyle(BOLD);
    textSize(26);
    txt(title, 60, y + 30, min(26, (26 * 620) / textWidth(title)), INK, HAND, LEFT, BOLD);
    writeText(res.text, 60, y + 54, 530, 21, BLUE, HAND, 21, budget);
    budget -= res.text.length;
    let heading = cl.truth ? cl.concept : "Why it's false";
    let body = cl.truth ? cl.explain : cl.why;
    txt(heading, 800, y + 30, 24, INK, HAND, LEFT, BOLD);
    writeText(body, 800, y + 54, 420, 21, BLUE, HAND, 21, budget);
    budget -= body.length;
    // the stamp lands once the row has been written
    if (budget > 0) {
      if (cl.truth) stamp(looks[res.status][0], 705, y + 50, -0.12, looks[res.status][1], 18);
      else stamp("FALSE CLAIM", 705, y + 50, -0.12, res.linked ? color(190, 40, 40, 220) : color(40, 130, 60, 230), 18);
    }
  }
  let end = ending(proven);
  writeText(end, 60, 642, proven < 3 ? 560 : 840, 25, "#a3312b", HAND, 26, budget, BOLD);
  budget -= end.length;
  if (click && budget < 0) writeStart = -100000;

  // not a full case yet: the player can go back and improve the report
  if (proven < 3 && noteButton("← Revise my report", 640, 628, 270, 64, PAPER, 0.02)) reviseReport();
  if (noteButton("See the clue board →", 930, 628, 290, 64)) screen = "end";
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
  for (let n = 1; n <= NIGHTS; n++) {
    for (let p = 0; p < 5; p++) if (events[n - 1][p].clue) all.push({ e: events[n - 1][p], pic: photos[n][p][0] });
  }
  // up to 10 clues in two rows of big polaroids, more in three rows of smaller ones
  let rows = all.length <= 10 ? 2 : 3;
  let cols = ceil(all.length / rows);
  let pw = rows == 2 ? 136 : 100;   // polaroid width
  let ph = (pw * 5) / 8 + 48;       // polaroid height
  let dx = min(160, 780 / cols);
  let spots = all.map((c, i) => {
    let row = floor(i / cols);
    let col = i % cols;
    let y = rows == 2 ? [260, 505][row] : [225, 380, 535][row];
    return [70 + pw / 2 + col * dx + (row % 2) * dx * 0.25, y, ((i * 7) % 5 - 2) * 0.02];
  });
  stroke(190, 30, 30);
  strokeWeight(3);
  noFill();
  let prev = null;
  for (let i = 0; i < all.length; i++) {
    if (!clues.includes(all[i].e.clue)) continue;
    let [x, y] = spots[i];
    if (prev) bezier(prev[0], prev[1] - ph / 2, prev[0], prev[1] - 40, x, y - 40, x, y - ph / 2);
    prev = [x, y];
  }
  noStroke();
  strokeWeight(1);
  let hovered = null;
  for (let i = 0; i < all.length; i++) {
    let [x, y, r] = spots[i];
    let got = clues.includes(all[i].e.clue);
    polaroid(all[i].pic, x, y, pw, r, all[i].e.tag, !got);
    pushpin(x, y - ph / 2, got ? "#c0392b" : "#777");
    stamp(got ? "FOUND" : "MISSED", x, y - 10, r - 0.25, got ? color(40, 130, 60, 230) : color(190, 40, 40, 220), pw * 0.18);
    if (inside(x - pw / 2 - 8, y - ph / 2, pw + 16, ph)) hovered = all[i].e.clue;
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
  txt("clues flagged", 0, -28, 32, INK, HAND, CENTER, BOLD);
  let summary = n == all.length
    ? "You caught every clue in the reserve. Nothing got past your cameras."
    : "The dark photos are clues your cameras missed. Try watching different spots next time.";
  txtBox(summary, -130, -10, 260, 150, 26, BLUE, HAND);
  pop();
  pushpin(1070, 54, "#e0a526");

  // the player's pinned photos
  txt(pins.length ? "your pins:" : "no pinned photos", 960, 400, 30, "#2b1a0e", HAND, LEFT, BOLD);
  for (let i = 0; i < min(pins.length, 3); i++) {
    polaroid(pins[i].pic, 1000 + i * 95, 485, 96, (i - 1) * 0.06, "");
  }

  if (noteButton("Play again ↺", 950, 610, 280, 76)) {
    clearSave();
    newGame();
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
    "1. Each evening, drag your cameras onto the map.",
    "2. Wait for morning, or skip ahead.",
    "3. Check the photos on the trail camera. New gear unlocks zoom and compare.",
    "4. Hit the red FLAG button when something looks wrong. Hit it again to take the flag back.",
    "5. After night " + NIGHTS + ", pick your " + SLOTS + " best photos and tick the claims each one proves.",
  ];
  let y = -168;
  for (let s of steps) {
    txtBox(s, -320, y, 640, 90, 30, BLUE, HAND, 40);
    y += s.length > 60 ? 80 : 40;
  }
  txt("keys:  1-5 place   ← → frames   ↑ ↓ camera   F flag   P pin   C compare   V zoom", -320, 200, 15, INK, TYPE);
  pop();
  if (noteButton("Got it!", 790, 560, 180, 66)) help = false;
}

// ---------- Cameras ----------

// The cameras that still work (one is smashed after night 2)
function active() {
  return [0, 1].filter((k) => k != lost);
}

// On night 2, the camera that will be smashed: the one on the ridge, or -1 if none is there
function doomed() {
  if (night != 2 || screen != "review") return -1;
  return cameras.indexOf(RIDGE);
}

function has(id) {
  return upgrades.includes(id);
}

// Puts the next free camera at a place, or takes it back if a camera is already there
function placeCamera(i) {
  let k = cameras.indexOf(i);
  if (k != -1) {
    cameras[k] = null;
  } else {
    let free = active().find((c) => cameras[c] == null && c != loose);
    if (free != undefined) cameras[free] = i;
  }
}

// The place on the map under the mouse, or -1
function spotAt() {
  for (let i = 0; i < 5; i++) if (inside(...spotBox(i))) return i;
  for (let i = 0; i < 5; i++) {
    if (dist(mouseX, mouseY, MAP.x + mapX[i] * MAP.w, MAP.y + mapY[i] * MAP.h) < 50) return i;
  }
  return -1;
}

// What the player could start dragging from where the mouse is
function dragSourceAt() {
  if (screen == "wires" && !wires.done.every((d) => d)) {
    let i = wireAt();
    if (i != -1) return { wire: i };
  }
  if (screen == "plan") {
    for (let k of active()) {
      if (cameras[k] == null && k != loose && inside(1110 + k * 90 - 36, 74, 72, 92)) return { cam: k };
      if (cameras[k] != null) {
        let [x, y] = spotBox(cameras[k]);
        if (inside(...spotBox(cameras[k])) || dist(mouseX, mouseY, x + 18, y - 12) < 26) return { cam: k };
      }
    }
  }
  return null;
}

// Drops whatever is being dragged
function drop() {
  if (dragging.wire != null) connect(dragging.wire, plugAt());
  if (dragging.cam != null) {
    // a camera: onto a place (swapping with a camera already there), or back to the desk
    let k = dragging.cam;
    let s = spotAt();
    if (s == -1) {
      cameras[k] = null;
    } else {
      let other = cameras.indexOf(s);
      if (other != -1 && other != k) cameras[other] = cameras[k];
      cameras[k] = s;
    }
  }
}

// ---------- Review actions (used by the keys and the keyboard) ----------

// Moves to the end of the night: remembers which photos were taken and resets the review tools
function startReview() {
  for (let k of active()) seen.push(night + "-" + cameras[k]);
  openReview();
}

// Opens the review on the first working camera's first frame
function openReview() {
  frame = [0, 0];
  flash = 0;
  inspecting = false;
  chooseCamera(active()[0]);
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
// Flagging a scene that is already flagged takes the flag (and its clue) back off.
function flagPhoto() {
  let scene = night + "-" + cameras[current];
  let event = events[night - 1][cameras[current]];
  if (flags.includes(scene)) {
    flags.splice(flags.indexOf(scene), 1);
    if (event.clue) clues.splice(clues.indexOf(event.clue), 1);
    message = "Flag removed.";
    return;
  }
  flags.push(scene);
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

function isFlagged() {
  return flags.includes(night + "-" + cameras[current]);
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

// The name of the photo on screen, e.g. "N2-farm-1" (used to look up its outlines)
function currentKey() {
  return "N" + night + "-" + ids[cameras[current]] + "-" + (frame[current] + 1);
}

// Earlier photos of the place the current camera is at, newest first:
// the player's own photos from earlier nights, then Dr. Okafor's
function earlierPhotos() {
  let place = cameras[current];
  let list = [];
  for (let n = night - 1; n >= 1; n--) {
    if (seen.includes(n + "-" + place)) {
      list.push({ pic: photos[n][place][0], key: "N" + n + "-" + ids[place] + "-1", title: "Night " + n, note: "YOUR PHOTO FROM NIGHT " + n });
    }
  }
  for (let i = archive.length - 1; i >= 0; i--) {
    let a = archive[i];
    if (a.place == place) list.push({ pic: a.pic, key: a.file, title: "Okafor " + a.when, note: a.note.replace("Dr. Okafor's photo: ", "").toUpperCase() });
  }
  return list;
}

// ---------- Case report ----------

// Opens a fresh report: a full photo grid, empty slots and the claims in a random order
function startReport() {
  buildTray();
  slots = Array(SLOTS).fill(null);
  links = slots.map(() => []);
  selected = -1;
  confirming = false;
  notice = "";
  order = shuffle(claims.map((cl, c) => c));
  attempts = 0;
  history = [];
  writeStart = frameCount;
  screen = "report";
}

// Fills the photo grid with every frame the player took plus Okafor's photos, pinned photos first
function buildTray() {
  let mine = [];
  for (let s of seen) {
    let [n, p] = s.split("-").map(Number);
    let count = photos[n][p].length;
    for (let f = 1; f <= count; f++) {
      mine.push({
        id: s + ":" + f,
        pinKey: n + "-" + p + "-" + (f - 1),
        pic: photos[n][p][f - 1],
        caption: "N" + n + " " + short[p] + (count > 1 ? " " + f + "/" + count : ""),
        tags: events[n - 1][p].tags[f - 1],
      });
    }
  }
  for (let a of archive) {
    mine.push({ id: a.file, pinKey: null, pic: a.pic, caption: "Okafor · " + short[a.place], tags: a.tags });
  }
  // pinned photos first, in the order they were pinned
  let pinned = [];
  for (let pin of pins) {
    let t = mine.find((m) => m.pinKey == pin.key);
    if (t && !pinned.includes(t)) pinned.push(t);
  }
  for (let t of mine) t.pinned = pinned.includes(t);
  tray = pinned.concat(mine.filter((t) => !t.pinned));
}

// Goes back to the report from the results, keeping every photo and tick
function reviseReport() {
  selected = -1;
  confirming = false;
  notice = "Your photos and ticks are still here. Change what you need, then submit again.";
  writeStart = -100000; // the claims are already written out
  screen = "report";
}

// The photo grid: 4 across, or 5 smaller ones across when there are more than 16 photos
function gridLayout() {
  return tray.length > 16 ? { cols: 5, w: 80, dx: 100, dy: 96, x: 82, y: 130 } : { cols: 4, w: 100, dx: 125, dy: 116, x: 100, y: 140 };
}

function gridPos(i) {
  let g = gridLayout();
  return [g.x + (i % g.cols) * g.dx, g.y + floor(i / g.cols) * g.dy];
}

function slotPos(i) {
  return [590 + i * (SW + 10), 116];
}

function trayItem(id) {
  return tray.find((t) => t.id == id);
}

// Clicking a photo: if it is already in a slot, select that slot. Otherwise put it in the
// selected slot if that is empty, or the next free slot, and select it.
function pickPhoto(id) {
// The photo grid: 4 across, or 5 smaller ones across when there are more than 16 photos
function gridLayout() {
  return tray.length > 16 ? { cols: 5, w: 80, dx: 100, dy: 96, x: 82, y: 130 } : { cols: 4, w: 100, dx: 125, dy: 116, x: 100, y: 140 };
}

  notice = "";
  let at = slots.indexOf(id);
  if (at != -1) {
    selected = at;
    return;
  }
  let free = selected != -1 && !slots[selected] ? selected : slots.indexOf(null);
  if (free == -1) {
    notice = "All " + SLOTS + " slots are full. Remove a photo (✕) to make room.";
    return;
  }
  slots[free] = id;
  links[free] = [];
  selected = free;
}

function removeSlot(i) {
  slots[i] = null;
  links[i] = [];
  notice = "";
}

function toggleLink(i, c) {
  let k = links[i].indexOf(c);
  if (k == -1) links[i].push(c);
  else links[i].splice(k, 1);
}

// A small numbered circle for an evidence slot
function slotBadge(i, x, y, d) {
  fill("#a3312b");
  circle(x, y, d);
  txt(i + 1, x, y + d * 0.28, d * 0.75, "#fff", MARKER, CENTER);
}

// Checks every claim against the hidden tags of the photos linked to it
function submitReport() {
  results = claims.map((cl, c) => {
    let photosFor = [];
    for (let i = 0; i < SLOTS; i++) if (slots[i] && links[i].includes(c)) photosFor.push(trayItem(slots[i]).tags);
    let linked = photosFor.length;
    if (cl.truth) return { ...cl.check(photosFor), linked };
    let text = linked
      ? "Not supported. You linked " + linked + (linked == 1 ? " photo" : " photos") + " to it, but it's false: that's jumping to a conclusion."
      : "Not supported, and you rightly linked nothing to it.";
    return { status: "none", text, linked };
  });
  attempts++;
  history.push({ slots: slots.slice(), links: links.map((l) => l.slice()), results: results.map((r) => ({ ...r })) });
  writeStart = frameCount;
  screen = "results";
}

// The ending depends on how many of the 3 true claims were proven
function ending(proven) {
  let jumped = claims.some((cl, c) => !cl.truth && results[c].linked);
  let s = proven == 3 ? "Full case! The hearing stops the building and orders a wildlife crossing. Rangers start night patrols."
    : proven > 0 ? "Partial case. The hearing pauses the fence, but wants more proof before it acts on the rest."
      : "Not enough evidence. The building carries on.";
  if (jumped) s += " Linking photos to false claims made them doubt parts of your report.";
  return s;
}

// ---------- Field ID scope ----------
// A supply drop perk. Pointing at something in a photo draws a white outline around it,
// with its name and (for living things) its scientific name.

// What each kind of thing is called: [name, the line underneath]
const SPECIES = {
  fox: ["Red fox", "Vulpes vulpes"],
  doe: ["White-tailed deer, doe", "Odocoileus virginianus"],
  fawn: ["White-tailed deer, fawn", "Odocoileus virginianus"],
  buck: ["White-tailed deer, buck", "Odocoileus virginianus"],
  otter: ["Eurasian otter", "Lutra lutra"],
  badger: ["European badger", "Meles meles"],
  dog: ["Farm dog", "Canis familiaris"],
  worker: ["Road crew worker", "Homo sapiens"],
  hunter: ["Person with headlamp", "Homo sapiens"],
  hand: ["Gloved hand", "Homo sapiens"],
  snare: ["Wire snare", "illegal trap · steel wire"],
  holes: ["Stake holes", "where the snare was"],
  fence: ["New fence", "steel mesh · man-made"],
  coop: ["Hen house", "timber and wire · man-made"],
  bins: ["Rubbish bins", "plastic · man-made"],
  crewTruck: ["Ridgeline Developments truck", "construction vehicle"],
  pickup: ["Dark pickup truck", "roof light bar, dented tailgate"],
  glare: ["Headlights", "a vehicle on the ridge"],
};

// The outline of everything in each photo, traced by hand in the photo's 800x500 pixels:
// OUTLINES["N2-farm-1"] lists [kind, x1, y1, x2, y2, ...]. Photos that don't exist yet have none.
const COOP = ["coop", 500, 215, 535, 180, 600, 180, 625, 215, 740, 225, 740, 330, 500, 330];
const BINS = ["bins", 488, 335, 605, 330, 612, 342, 618, 330, 728, 330, 725, 455, 715, 465, 600, 470, 497, 470];
const BINS_KNOCKED = ["bins", 478, 395, 545, 385, 628, 385, 632, 330, 735, 330, 732, 430, 690, 440, 620, 472, 478, 472];
const CORRIDOR_FENCE = ["fence", 385, 200, 400, 188, 470, 188, 500, 183, 775, 183, 775, 282, 470, 287, 385, 287];
const FINISHED_FENCE = ["fence", 60, 188, 100, 183, 360, 183, 400, 188, 760, 183, 760, 290, 60, 290];
const CREEK_SNARE = ["snare", 378, 340, 400, 338, 410, 380, 455, 383, 462, 343, 478, 343, 482, 405, 470, 425, 400, 425, 380, 405];
const OUTLINES = {
  "N1-forest-1": [
    ["fox", 150, 395, 175, 350, 230, 320, 300, 305, 370, 300, 385, 275, 400, 282, 408, 300, 432, 330, 415, 340, 395, 345, 380, 400, 345, 400, 330, 370, 300, 375, 290, 400, 250, 398, 240, 370, 205, 385, 170, 400],
    ["doe", 505, 295, 520, 265, 545, 225, 575, 205, 640, 195, 668, 205, 680, 240, 670, 330, 655, 330, 645, 265, 620, 260, 600, 330, 585, 330, 570, 270, 545, 265, 525, 305],
    ["fawn", 430, 300, 445, 265, 470, 250, 505, 255, 515, 275, 510, 330, 498, 330, 490, 295, 465, 300, 450, 330, 440, 328],
  ],
  "N1-forest-2": [
    ["fox", 380, 410, 400, 370, 450, 330, 520, 310, 600, 300, 615, 280, 635, 290, 640, 315, 660, 335, 640, 345, 620, 350, 600, 400, 580, 420, 560, 400, 520, 385, 500, 420, 470, 420, 455, 395, 420, 410],
    ["doe", 525, 185, 545, 185, 565, 195, 560, 220, 600, 225, 650, 230, 660, 250, 650, 300, 640, 330, 625, 330, 620, 290, 580, 285, 565, 330, 550, 330, 545, 270, 535, 230, 528, 210],
    ["fawn", 440, 255, 455, 250, 460, 270, 495, 275, 500, 300, 495, 330, 485, 330, 480, 305, 460, 305, 455, 330, 445, 330, 447, 290],
  ],
  "N1-creek-1": [
    ["doe", 335, 360, 340, 330, 365, 280, 395, 230, 430, 210, 500, 210, 520, 220, 525, 260, 505, 300, 510, 355, 495, 358, 480, 300, 440, 300, 415, 355, 400, 358, 385, 310, 360, 345, 350, 368],
    ["fawn", 540, 355, 545, 335, 565, 300, 590, 280, 640, 275, 655, 290, 658, 360, 645, 360, 635, 320, 600, 322, 590, 360, 578, 360, 570, 330, 555, 355],
    ["otter", 150, 300, 160, 285, 200, 282, 240, 287, 248, 297, 230, 305, 170, 306],
  ],
  "N1-creek-2": [
    ["doe", 355, 195, 372, 198, 390, 195, 388, 225, 400, 240, 470, 240, 500, 255, 505, 300, 500, 360, 488, 362, 480, 320, 440, 315, 415, 360, 400, 362, 390, 320, 375, 280, 365, 240, 360, 215],
    ["fawn", 540, 355, 545, 335, 565, 300, 590, 280, 640, 275, 655, 290, 658, 360, 645, 360, 635, 320, 600, 322, 590, 360, 578, 360, 570, 330, 555, 355],
  ],
  "N1-corridor-1": [
    ["fox", 415, 345, 430, 310, 470, 285, 530, 275, 580, 265, 595, 248, 610, 258, 625, 295, 605, 300, 600, 320, 620, 360, 605, 362, 580, 330, 540, 340, 520, 360, 500, 360, 490, 330, 455, 345, 430, 350],
    ["badger", 205, 410, 215, 375, 240, 360, 290, 360, 320, 375, 332, 392, 320, 405, 300, 415, 270, 425, 225, 425],
  ],
  "N1-corridor-2": [
    ["buck", 310, 150, 370, 150, 368, 185, 355, 210, 390, 215, 500, 215, 530, 225, 540, 270, 530, 290, 550, 365, 535, 365, 505, 300, 470, 300, 465, 365, 440, 365, 430, 300, 395, 300, 370, 360, 350, 362, 365, 290, 345, 260, 320, 245, 300, 230, 315, 200, 320, 175],
  ],
  "N1-farm-1": [
    ["dog", 380, 385, 400, 350, 420, 320, 470, 310, 510, 295, 535, 285, 548, 300, 535, 330, 510, 340, 500, 390, 480, 390, 470, 355, 440, 355, 430, 390, 410, 390, 400, 370],
    COOP, BINS,
  ],
  "N1-ridge-1": [
    ["crewTruck", 258, 240, 300, 230, 380, 215, 410, 195, 550, 192, 565, 215, 665, 220, 660, 330, 620, 355, 580, 345, 370, 340, 330, 358, 290, 345, 258, 300],
    ["worker", 185, 215, 205, 195, 220, 210, 250, 240, 262, 265, 255, 300, 235, 300, 240, 395, 170, 395, 165, 240],
    ["worker", 665, 210, 690, 195, 705, 205, 740, 240, 755, 290, 760, 395, 690, 395, 655, 300, 650, 250],
  ],
  "N2-forest-1": [
    ["doe", 510, 195, 530, 192, 545, 205, 555, 230, 530, 235, 515, 275, 505, 300, 525, 360, 510, 362, 490, 310, 460, 300, 445, 360, 425, 362, 430, 310, 400, 300, 370, 300, 355, 280, 365, 255, 400, 240, 480, 235, 505, 215],
    ["fawn", 240, 355, 260, 315, 290, 300, 325, 295, 335, 275, 352, 285, 355, 300, 345, 315, 340, 360, 325, 362, 315, 330, 290, 330, 275, 362, 255, 365],
  ],
  "N2-creek-1": [CREEK_SNARE],
  "N2-creek-2": [
    CREEK_SNARE,
    ["doe", 500, 195, 520, 190, 530, 210, 545, 245, 620, 245, 650, 265, 645, 300, 645, 360, 630, 362, 625, 320, 570, 315, 560, 365, 545, 365, 535, 315, 520, 275, 505, 240],
    ["fawn", 650, 265, 665, 260, 670, 280, 715, 285, 720, 310, 715, 355, 700, 355, 695, 330, 670, 330, 662, 355, 650, 355, 655, 310],
  ],
  "N2-corridor-1": [
    ["badger", 300, 385, 310, 355, 340, 338, 400, 345, 420, 365, 425, 375, 405, 390, 330, 395],
    CORRIDOR_FENCE,
  ],
  "N2-corridor-2": [
    ["badger", 180, 380, 195, 362, 235, 350, 285, 355, 305, 385, 290, 400, 200, 400],
    CORRIDOR_FENCE,
  ],
  "N2-farm-1": [
    ["fox", 355, 410, 375, 370, 420, 320, 470, 295, 530, 290, 580, 300, 615, 345, 630, 370, 615, 385, 560, 385, 540, 420, 500, 420, 470, 410, 430, 405, 395, 420, 370, 425],
    COOP, BINS_KNOCKED,
  ],
  "N2-farm-2": [
    ["fox", 250, 440, 270, 400, 310, 370, 350, 345, 400, 330, 440, 300, 445, 262, 465, 280, 490, 262, 510, 290, 500, 335, 490, 445, 465, 450, 450, 400, 400, 410, 360, 450, 330, 445, 320, 415, 285, 440],
    COOP, BINS_KNOCKED,
  ],
  "N2-ridge-1": [
    ["pickup", 210, 250, 260, 235, 300, 215, 340, 195, 420, 185, 510, 195, 540, 240, 605, 280, 590, 360, 540, 365, 450, 385, 400, 385, 345, 350, 250, 370, 215, 345],
  ],
  "N2-ridge-2": [
    ["hand", 20, 240, 100, 225, 150, 250, 110, 100, 150, 90, 260, 170, 255, 20, 300, 10, 360, 180, 450, 20, 500, 30, 500, 220, 620, 200, 740, 175, 790, 200, 800, 500, 330, 500, 250, 420, 80, 320, 15, 270],
  ],
  "N3-creek-1": [
    ["hunter", 480, 280, 500, 268, 520, 278, 550, 290, 585, 310, 600, 350, 600, 395, 560, 420, 500, 420, 470, 410, 465, 370, 480, 340, 475, 300],
    ["snare", 378, 338, 398, 338, 405, 385, 455, 378, 462, 352, 470, 360, 465, 402, 395, 404, 380, 395],
  ],
  "N3-creek-2": [
    ["holes", 375, 425, 400, 412, 455, 410, 480, 422, 460, 440, 395, 440],
  ],
  "N3-corridor-1": [
    ["doe", 415, 280, 440, 265, 495, 260, 505, 240, 500, 215, 512, 208, 525, 220, 538, 210, 545, 225, 535, 250, 530, 275, 515, 395, 500, 398, 495, 340, 445, 340, 440, 398, 425, 398, 415, 330],
    ["fawn", 265, 355, 285, 330, 330, 328, 355, 315, 375, 318, 385, 330, 365, 340, 355, 390, 340, 395, 330, 360, 300, 360, 285, 395, 270, 395],
    FINISHED_FENCE,
  ],
  "N3-corridor-2": [
    ["doe", 318, 265, 335, 240, 345, 215, 365, 212, 372, 240, 380, 265, 470, 275, 520, 300, 525, 330, 545, 395, 530, 398, 500, 345, 460, 350, 430, 395, 410, 398, 420, 350, 400, 320, 380, 345, 355, 398, 340, 396, 365, 330, 350, 290],
    ["fawn", 535, 330, 548, 312, 560, 325, 610, 330, 645, 345, 658, 395, 645, 398, 630, 370, 590, 370, 575, 398, 560, 398, 560, 360, 545, 345],
    FINISHED_FENCE,
  ],
  "N3-farm-1": [
    ["doe", 215, 250, 230, 215, 300, 210, 350, 220, 390, 245, 420, 300, 450, 345, 455, 385, 430, 390, 410, 370, 400, 385, 385, 390, 380, 340, 350, 320, 320, 330, 295, 385, 280, 385, 285, 340, 265, 330, 250, 385, 230, 385, 235, 330, 218, 290],
    ["fawn", 130, 330, 150, 305, 185, 300, 215, 310, 240, 335, 250, 380, 235, 385, 225, 360, 200, 360, 185, 390, 170, 390, 160, 350, 140, 390, 130, 388],
    COOP, BINS,
  ],
  "N3-farm-2": [
    ["doe", 380, 215, 388, 195, 400, 205, 405, 235, 385, 250, 370, 290, 380, 385, 365, 388, 355, 340, 320, 340, 310, 385, 295, 388, 295, 330, 275, 300, 280, 260, 320, 255, 360, 250, 370, 230],
    ["fawn", 160, 330, 175, 315, 200, 320, 220, 318, 235, 330, 225, 388, 210, 388, 205, 360, 185, 360, 180, 390, 165, 390],
    COOP, BINS,
  ],
  "N3-ridge-1": [
    ["pickup", 240, 215, 255, 190, 430, 188, 440, 210, 450, 245, 455, 330, 445, 385, 410, 385, 400, 370, 280, 370, 265, 385, 230, 385, 225, 330, 230, 245],
  ],
  "ARC-1": [
    ["fox", 305, 250, 325, 262, 345, 248, 360, 250, 365, 290, 380, 300, 440, 305, 480, 320, 510, 350, 535, 395, 510, 405, 470, 395, 445, 385, 400, 385, 375, 370, 372, 395, 355, 395, 340, 370, 330, 395, 320, 392, 310, 310, 300, 290],
  ],
  "ARC-2": [
    ["doe", 370, 290, 385, 262, 430, 255, 520, 250, 540, 225, 548, 205, 560, 215, 585, 240, 565, 250, 545, 265, 530, 300, 555, 385, 545, 390, 510, 330, 490, 320, 470, 388, 455, 390, 460, 330, 420, 320, 395, 388, 380, 388, 390, 330],
    ["fawn", 225, 330, 245, 315, 290, 320, 315, 305, 320, 290, 335, 285, 348, 300, 335, 320, 320, 350, 330, 390, 315, 392, 300, 355, 270, 350, 250, 390, 235, 392, 240, 355],
  ],
  "ARC-4": [
    ["glare", 715, 180, 735, 120, 790, 110, 800, 130, 800, 260, 760, 250, 725, 230],
  ],
};

let views = []; // the photos drawn on the camera screen this frame, and which part of each is shown

// True if the photo point (px, py) is inside the outline pts
function inOutline(pts, px, py) {
  let hit = false;
  for (let i = 1, j = pts.length - 2; i < pts.length; j = i, i += 2) {
    let [xi, yi, xj, yj] = [pts[i], pts[i + 1], pts[j], pts[j + 1]];
    if (yi > py != yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
}

// The size of an outline, so the smallest one under the mouse wins (an animal in front of a fence)
function outlineArea(pts) {
  let a = 0;
  for (let i = 1, j = pts.length - 2; i < pts.length; j = i, i += 2) a += (pts[j] + pts[i]) * (pts[j + 1] - pts[i + 1]);
  return abs(a / 2);
}

// Finds the thing under the mouse in the photos on screen and outlines it
function drawScope() {
  for (let v of views) {
    if (!inside(v.x, v.y, v.w, v.h)) continue;
    // where the mouse is in the photo's own 800x500 pixels
    let px = v.sx + ((mouseX - v.x) * v.sw) / v.w;
    let py = v.sy + ((mouseY - v.y) * v.sh) / v.h;
    let hits = (OUTLINES[v.key] || []).filter((o) => inOutline(o, px, py));
    if (hits.length == 0) return;
    hits.sort((a, b) => outlineArea(a) - outlineArea(b));
    outlineThing(hits[0], v);
    return;
  }
}

// Draws one outline as a smooth glowing white line, with its name tag above it
function outlineThing(o, v) {
  let toX = (x) => v.x + ((x - v.sx) * v.w) / v.sw;
  let toY = (y) => v.y + ((y - v.sy) * v.h) / v.sh;
  let n = (o.length - 1) / 2;
  // keep the outline and the tag inside the photo
  drawingContext.save();
  drawingContext.beginPath();
  drawingContext.rect(v.x, v.y, v.w, v.h);
  drawingContext.clip();
  noFill();
  stroke(255);
  strokeWeight(3);
  strokeJoin(ROUND);
  drawingContext.shadowColor = "rgba(255, 255, 255, 0.9)";
  drawingContext.shadowBlur = 10;
  // a closed curve through every point: the first and last points are repeated
  // so the curve joins up smoothly. Tightness 0.4 stops it bulging out between points.
  curveTightness(0.4);
  beginShape();
  for (let i = -1; i <= n + 1; i++) {
    let k = (i + n) % n;
    curveVertex(toX(o[1 + k * 2]), toY(o[2 + k * 2]));
  }
  endShape();
  curveTightness(0);
  shadowOff();
  noStroke();
  strokeWeight(1);

  // the name tag, centred above the outline (or below it if there's no room)
  let xs = [], ys = [];
  for (let k = 0; k < n; k++) {
    xs.push(toX(o[1 + k * 2]));
    ys.push(toY(o[2 + k * 2]));
  }
  let [name, latin] = SPECIES[o[0]];
  textFont(PIXEL);
  textSize(26);
  let w = textWidth(name);
  textFont(TYPE);
  textSize(13);
  w = max(w, textWidth(latin)) + 24;
  let cx = constrain((min(xs) + max(xs)) / 2, v.x + w / 2 + 4, v.x + v.w - w / 2 - 4);
  let top = min(ys) - 58 > v.y + 4 ? min(ys) - 58 : min(max(ys) + 8, v.y + v.h - 54);
  fill(0, 0, 0, 170);
  rect(cx - w / 2, top, w, 50, 6);
  txt(name, cx, top + 23, 26, "#ffffff", PIXEL, CENTER);
  txt(latin, cx, top + 41, 13, "rgba(255,255,255,0.8)", TYPE, CENTER, ITALIC);
  drawingContext.restore();
}

// ---------- Mini game: clean the lens ----------
// Some scenes come back with a dirty lens (see DIRTY). The photo is smeared until the player
// rubs it clean by holding the mouse down and dragging across the camera screen.

let lens = null; // the dirt on the photo being shown: { scene, g, cells, wiped, fade }
const LENS_X = 84;  // where the photo sits on the camera screen
const LENS_Y = 100;
const CELL = 32;    // the dirt is tracked on a grid of 32-pixel squares

// The scene on the camera screen, as "night-place"
function sceneKey() {
  return night + "-" + cameras[current];
}

// True while the photo on screen still has a dirty lens
function isDirty() {
  return !!DIRTY[sceneKey()] && !cleaned.includes(sceneKey());
}

// A small random number generator that always gives the same numbers for the same seed,
// so a scene's dirt looks the same every time it is shown
function seededRandom(seed) {
  let h = 2166136261;
  for (let ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return (lo, hi) => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    let r = ((h ^= h >>> 16) >>> 0) / 4294967296;
    return lo + r * (hi - lo);
  };
}

// Draws the dirt for a scene into its own picture, and works out which grid squares it covers
function makeLens(scene) {
  let type = DIRTY[scene];
  let rnd = seededRandom(scene);
  let g = createGraphics(640, 400);
  g.pixelDensity(1);
  g.noStroke();
  let blobs = []; // [x, y, radius] of every big splat, used to find the dirty squares
  // a murky film over the whole photo, so nothing is clear until it is wiped
  g.background(type == "mud" ? color(80, 55, 30, 120) : type == "slobber" ? color(200, 220, 185, 130) : color(225, 222, 210, 110));
  if (type == "mud") {
    for (let i = 0; i < 13; i++) {
      let x = rnd(40, 600), y = rnd(30, 370), r = rnd(55, 105);
      blobs.push([x, y, r]);
      g.fill(92 + rnd(-15, 15), 62, 32, 235);
      g.ellipse(x, y, r * 2, r * rnd(1.5, 2));
      for (let j = 0; j < 8; j++) g.circle(x + rnd(-1.4, 1.4) * r, y + rnd(-1.4, 1.4) * r, rnd(8, 26)); // splashes
      g.rect(x + rnd(-r / 2, r / 2), y, rnd(6, 12), rnd(30, 80), 6); // a drip
      g.fill(130, 95, 55, 160);
      g.ellipse(x - r * 0.3, y - r * 0.3, r * 0.6, r * 0.4); // a wet shine
    }
  } else if (type == "slobber") {
    for (let i = 0; i < 17; i++) {
      let x = rnd(30, 610), y = rnd(30, 370), r = rnd(50, 95);
      blobs.push([x, y, r]);
      g.fill(205, 222, 185, 205);
      g.ellipse(x, y, r * 2.2, r * 1.6);
      g.fill(235, 245, 225, 150);
      g.ellipse(x + rnd(-20, 20), y + rnd(-20, 20), r * 1.2, r * 0.7);
      g.stroke(255, 200);
      g.strokeWeight(2);
      g.noFill();
      for (let j = 0; j < 5; j++) g.circle(x + rnd(-r, r), y + rnd(-r / 2, r / 2), rnd(6, 16)); // bubbles
      g.noStroke();
    }
  } else {
    // bird droppings: white splats with grey middles and a streak running down
    for (let i = 0; i < 12; i++) {
      let x = rnd(50, 590), y = rnd(30, 330), r = rnd(55, 100);
      blobs.push([x, y, r], [x, y + r, r * 0.6]);
      g.fill(238, 236, 225, 245);
      g.ellipse(x, y, r * 2, r * 1.8);
      g.rect(x - r * 0.35, y, r * 0.7, r * 1.4, r * 0.35);
      for (let j = 0; j < 7; j++) g.circle(x + rnd(-1.5, 1.5) * r, y + rnd(-1.3, 1.3) * r, rnd(8, 22));
      g.fill(150, 145, 130, 220);
      g.ellipse(x + rnd(-10, 10), y + rnd(-10, 10), r * 0.7, r * 0.6);
    }
  }
  // the grid squares whose middle is under a splat
  let cells = [];
  for (let cy = 0; cy < 400 / CELL; cy++) {
    for (let cx = 0; cx < 640 / CELL; cx++) {
      let mx = cx * CELL + CELL / 2, my = cy * CELL + CELL / 2;
      if (blobs.some(([x, y, r]) => dist(mx, my, x, y) < r)) cells.push(cy * 100 + cx);
    }
  }
  return { scene, type, g, cells, wiped: new Set(), fade: 255 };
}

// Rubs the lens along the line from the last mouse position to this one
function wipe(x1, y1, x2, y2) {
  let g = lens.g;
  g.erase();
  g.stroke(0);
  g.strokeWeight(76);
  g.line(x1, y1, x2, y2);
  g.noErase();
  g.noStroke();
  // mark every grid square the cloth went over
  let steps = max(1, ceil(dist(x1, y1, x2, y2) / 10));
  for (let s = 0; s <= steps; s++) {
    let x = lerp(x1, x2, s / steps), y = lerp(y1, y2, s / steps);
    for (let c of lens.cells) {
      let mx = (c % 100) * CELL + CELL / 2, my = floor(c / 100) * CELL + CELL / 2;
      if (dist(x, y, mx, my) < 44) lens.wiped.add(c);
    }
  }
}

// How clean the lens is, from 0 to 1
function lensClean() {
  return lens.cells.length ? lens.wiped.size / lens.cells.length : 1;
}

// Draws the dirt over the photo and lets the player rub it off.
// Once it is 85% clean the rest fades away by itself.
function drawLens() {
  let scene = sceneKey();
  if (isDirty()) {
    if (!lens || lens.scene != scene) {
      if (lens) lens.g.remove();
      lens = makeLens(scene);
    }
    let over = inside(LENS_X, LENS_Y, 640, 400);
    if (over && mouseIsPressed && !help && !askRestart) {
      wipe(constrain(pmouseX, LENS_X, LENS_X + 640) - LENS_X, constrain(pmouseY, LENS_Y, LENS_Y + 400) - LENS_Y, mouseX - LENS_X, mouseY - LENS_Y);
      if (lensClean() >= 0.85) {
        cleaned.push(scene);
        message = "Lens clean! Now take a good look at the photo.";
      }
    }
    image(lens.g, LENS_X, LENS_Y);
    // how to clean it, blinking, with how clean it is so far
    if (frameCount % 70 < 50) screenText("DIRTY LENS: HOLD AND RUB TO WIPE", 404, 300, 30, 0, CENTER, "#ffd866");
    screenText("CLEAN " + floor(lensClean() * 100) + "%", 404, 336, 26, 0, CENTER, "#ffd866");
    // a cloth under the mouse
    if (over) {
      hovering = true;
      push();
      translate(mouseX + 6, mouseY + 6);
      rotate(-0.3 + (mouseIsPressed ? sin(frameCount * 0.6) * 0.15 : 0));
      shadowOn(6);
      fill("#8ec5e8");
      rect(-26, -20, 52, 40, 6);
      shadowOff();
      stroke(255, 160);
      strokeWeight(2);
      for (let i = -12; i <= 12; i += 8) line(-22, i, 22, i);
      noStroke();
      strokeWeight(1);
      pop();
    }
  } else if (lens && lens.scene == scene) {
    // just cleaned: the last bits of dirt fade out
    tint(255, lens.fade);
    image(lens.g, LENS_X, LENS_Y);
    noTint();
    lens.fade -= 15;
    if (lens.fade <= 0) {
      lens.g.remove();
      lens = null;
    }
  }
}

// Why the lens is dirty, for the sticky note next to the camera
function dirtNote() {
  let type = DIRTY[sceneKey()];
  let why = type == "mud" ? "Splat! Mud got on the lens." : type == "slobber" ? "Ew! The farm dog licked the lens." : "A bird pooped on the lens!";
  return why + " Hold the mouse down and rub across the screen to wipe it clean.";
}

// ---------- Mini game: reconnect the wires ----------
// Used to fix the camera smashed on the ridge (with the repair kit) and the camera
// whose wires come loose before night 4. Drag each loose wire to the plug of the same
// colour, or click a wire and then its plug.

const WIRE_COLOURS = [
  { name: "red", col: "#d64541", mark: "●" },
  { name: "blue", col: "#3a7bd5", mark: "▲" },
  { name: "yellow", col: "#f2c94c", mark: "■" },
  { name: "green", col: "#4caf50", mark: "★" },
];
const LOOSE_NIGHT = 4; // the night a camera's wires come loose

let wires = null; // the puzzle being played: { cam, back, left, right, done, sel, wrongAt, wrongPlug }
let loose = -1;   // the camera whose wires came loose (-1 = none)

// Opens the wires puzzle for camera k. back is where to go afterwards: "plan" or "gear".
function startWires(k, back) {
  let left = shuffle([0, 1, 2, 3]);
  let right = shuffle([0, 1, 2, 3]);
  while (right.every((c, i) => c == left[i])) right = shuffle([0, 1, 2, 3]); // never already matched
  wires = { cam: k, back, left, right, done: [false, false, false, false], sel: -1, wrongAt: -100, wrongPlug: -1 };
  screen = "wires";
}

function wireEnd(i) {
  return [400, 210 + i * 92];
}

function plugPos(j) {
  return [880, 210 + j * 92];
}

// The plug under the mouse, or -1
function plugAt() {
  for (let j = 0; j < 4; j++) if (dist(mouseX, mouseY, ...plugPos(j)) < 42) return j;
  return -1;
}

// The loose wire end under the mouse that isn't plugged in yet, or -1
function wireAt() {
  for (let i = 0; i < 4; i++) if (!wires.done[i] && dist(mouseX, mouseY, ...wireEnd(i)) < 36) return i;
  return -1;
}

// Tries to plug wire i into plug j
function connect(i, j) {
  wires.sel = -1;
  if (j == -1) return;
  if (wires.right[j] == wires.left[i]) {
    wires.done[i] = true;
  } else {
    wires.wrongAt = frameCount;
    wires.wrongPlug = j;
  }
}

// A thick wire with a little sag, from (x1, y1) to (x2, y2)
function wireLine(x1, y1, x2, y2, col) {
  noFill();
  stroke(0, 90);
  strokeWeight(20);
  bezier(x1, y1, x1 + 120, y1 + 40, x2 - 120, y2 + 40, x2, y2);
  stroke(col);
  strokeWeight(14);
  bezier(x1, y1, x1 + 120, y1 + 40, x2 - 120, y2 + 40, x2, y2);
  stroke(255, 70);
  strokeWeight(4);
  bezier(x1, y1 - 3, x1 + 120, y1 + 37, x2 - 120, y2 + 37, x2, y2 - 3);
  noStroke();
  strokeWeight(1);
}

function drawWires() {
  desk();
  let all = wires.done.every((d) => d);
  paperLabel(all ? "CAM " + (wires.cam + 1) + " is working again!" : "Fix CAM " + (wires.cam + 1) + ": plug each wire into the same colour", 640, 52, -0.01);

  // the camera with its back panel open
  shadowOn(26);
  fill("#46503a");
  rect(220, 92, 840, 560, 40);
  shadowOff();
  drawingContext.save();
  drawingContext.beginPath();
  drawingContext.roundRect(220, 92, 840, 560, 40);
  drawingContext.clip();
  image(camo, 220, 92);
  drawingContext.restore();
  fill("#15181a");
  rect(270, 140, 740, 470, 14);
  // the circuit board behind the plugs
  fill("#1f5130");
  rect(820, 160, 170, 430, 8);
  stroke(200, 170, 80, 120);
  for (let y = 175; y < 580; y += 22) line(830, y, 980, y + 8);
  noStroke();
  // the status light
  fill(all ? "#55ff77" : frameCount % 40 < 20 ? "#ff4a3d" : "#5a1a16");
  circle(300, 172, 18);
  txt(all ? "POWER OK" : "NO POWER", 318, 179, 22, all ? "#9dffa9" : "#ff8a80", PIXEL);

  // the plugs, with their colour and a symbol (for colour-blind players)
  for (let j = 0; j < 4; j++) {
    let [x, y] = plugPos(j);
    let c = WIRE_COLOURS[wires.right[j]];
    let wrong = j == wires.wrongPlug && frameCount - wires.wrongAt < 25;
    shadowOn(6);
    fill(wrong ? "#ff4a3d" : "#2a2f33");
    rect(x - 34, y - 26, 68, 52, 8);
    shadowOff();
    fill(c.col);
    rect(x - 26, y - 18, 52, 36, 6);
    fill(0, 140);
    circle(x - 10, y, 10);
    circle(x + 10, y, 10);
    txt(c.mark, x + 52, y + 9, 26, c.col, "sans-serif", CENTER);
    if (wrong) txt("zzt!", x, y - 34, 24, "#ff8a80", MARKER, CENTER);
  }

  // the wires: plugged in, being dragged, or hanging loose
  let held = dragging && dragging.wire != null ? dragging.wire : -1;
  for (let i = 0; i < 4; i++) {
    let [x, y] = wireEnd(i);
    let c = WIRE_COLOURS[wires.left[i]];
    // the wire comes out of the camera's broken connector on the left
    fill("#2a2f33");
    rect(280, y - 20, 50, 40, 6);
    stroke(c.col);
    strokeWeight(14);
    line(330, y, x - 10, y);
    noStroke();
    strokeWeight(1);
    txt(c.mark, 300, y + 9, 22, c.col, "sans-serif", CENTER);
    if (wires.done[i]) {
      let j = wires.right.indexOf(wires.left[i]);
      wireLine(x, y, plugPos(j)[0] - 30, plugPos(j)[1], c.col);
    } else if (i == held) {
      wireLine(x, y, mouseX, mouseY, c.col);
      fill("#c98a4b");
      circle(mouseX, mouseY, 18); // the copper tip
    } else {
      let hot = !all && dist(mouseX, mouseY, x, y) < 36;
      if (hot) hovering = true;
      if (i == wires.sel) {
        fill(255, 230, 120, 120);
        circle(x, y, 54);
      }
      fill("#c98a4b");
      circle(x, y, hot ? 26 : 20);
      stroke(255, 120);
      strokeWeight(2);
      line(x + 8, y - 6, x + 18, y - 12); // frayed copper strands
      line(x + 9, y, x + 20, y);
      line(x + 8, y + 6, x + 18, y + 12);
      noStroke();
      strokeWeight(1);
    }
  }

  // clicking: pick up a wire, then click its plug
  if (click && !all) {
    let i = wireAt();
    if (i != -1) wires.sel = i;
    else if (wires.sel != -1) connect(wires.sel, plugAt());
  }
  if (!all && wires.sel != -1 && plugAt() != -1) hovering = true;

  if (all) {
    stamp("FIXED", 640, 380, -0.15, color(40, 130, 60, 230), 44);
    if (noteButton(wires.back == "gear" ? "Next night →" : "Back to the map →", 940, 640, 290, 66)) finishWires();
  } else {
    stickyNote(1070, 440, 200, 170, 0.03, wires.sel != -1 ? "Now click the plug that matches." : "Drag each wire to the plug that matches.");
  }
}

// The camera works again: back to wherever the puzzle was opened from
function finishWires() {
  let back = wires.back;
  wires = null;
  if (back == "gear") {
    lost = -1; // the smashed camera is repaired
    lostAt = -1;
    nextNight(true);
  } else {
    loose = -1;
    screen = "plan";
  }
}

// On to the next night's map. Before night 4 something knocks a camera's wires loose
// (not straight after a repair, so the player doesn't fix wires twice in a row).
function nextNight(justRepaired = false) {
  night++;
  if (night == LOOSE_NIGHT && !justRepaired) {
    loose = active()[0];
    cameras[loose] = null;
  }
  screen = "plan";
}

// ---------- Saving ----------
// The game saves itself in the browser (localStorage) whenever something changes, so a player
// can close the tab and carry on later. It only lasts on the same device and browser.

const SAVE_KEY = "wildtrace-save-1";
let saved = null;   // the saved game found when the page loaded, or null
let lastSave = "";  // what was last written, so it is only written again when something changed

// Everything needed to carry on later, or null before the game has really started
function saveState() {
  if (screen == "title" || screen == "briefing") return null;
  let atReport = ["report", "results", "end"].includes(screen);
  return {
    version: 1,
    // a night that was cut short starts again from the map, and a wires puzzle starts again
    screen: screen == "watch" ? "plan" : screen == "wires" ? wires.back : screen,
    night, cameras, lost, lostAt, upgrades, clues, flags, seen, cleaned, loose,
    pins: pins.map((p) => p.key),
    report: atReport ? { slots, links, order, results, attempts, history } : null,
  };
}

function autosave() {
  let state = saveState();
  if (!state) return;
  let json = JSON.stringify(state);
  if (json == lastSave) return;
  lastSave = json;
  try {
    localStorage.setItem(SAVE_KEY, json);
  } catch (e) {
    // storage is blocked (e.g. a private window): the game still works, it just isn't saved
  }
}

function loadSave() {
  try {
    let state = JSON.parse(localStorage.getItem(SAVE_KEY));
    return state && state.version == 1 ? state : null;
  } catch (e) {
    return null;
  }
}

function clearSave() {
  saved = null;
  lastSave = "";
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch (e) {}
}

// Puts a saved game back exactly where it was left
function resumeGame(state) {
  newGame();
  ({ night, cameras, lost, lostAt, upgrades, clues, flags, seen } = state);
  cleaned = state.cleaned || [];
  loose = state.loose == undefined ? -1 : state.loose;
  pins = state.pins.map((key) => {
    let [n, p, f] = key.split("-").map(Number);
    return { key, pic: photos[n][p][f] };
  });
  if (state.report) {
    buildTray();
    ({ slots, links, order, results, attempts, history } = state.report);
    writeStart = -100000; // the claims are already written out
  }
  if (state.screen == "review") openReview();
  screen = state.screen;
}

// Clears everything and goes back to the title screen
function newGame() {
  night = 1;
  cameras = [null, null];
  lost = -1;
  lostAt = -1;
  upgrades = [];
  clues = [];
  flags = [];
  seen = [];
  pins = [];
  cleaned = [];
  loose = -1;
  wires = null;
  if (lens) lens.g.remove();
  lens = null;
  inspecting = false;
  help = false;
  askRestart = false;
  selected = -1;
  confirming = false;
  notice = "";
  screen = "title";
}

// "Start over?", over whatever screen is showing (also used by New game on the title screen)
function drawRestart() {
  fill(0, 150);
  rect(0, 0, 1280, 720);
  push();
  translate(640, 340);
  rotate(-0.01);
  shadowOn(30);
  fill(PAPER);
  rect(-330, -170, 660, 340, 4);
  shadowOff();
  txt("Start over?", -290, -100, 46, INK, MARKER);
  txtBox("Your cameras, photos, flags and case report will all be erased. This can't be undone.", -290, -60, 580, 120, 30, "#a3312b", HAND, 32);
  pop();
  if (noteButton("Keep playing", 360, 430, 240, 70, PAPER, 0.02)) askRestart = false;
  if (noteButton("Start over", 700, 430, 220, 70)) {
    let fromTitle = screen == "title";
    clearSave();
    newGame();
    if (fromTitle) screen = "briefing"; // New game on the title screen goes straight in
  }
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

// Splits text into lines that fit in w pixels, using the current font and size
function wrapLines(s, w) {
  let lines = [];
  for (let para of s.split("\n")) {
    let line = "";
    for (let word of para.split(" ")) {
      let test = line ? line + " " + word : word;
      if (line && textWidth(test) > w) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    }
    lines.push(line);
  }
  return lines;
}

// Handwriting that appears one letter at a time, with a pencil at the end while it is writing.
// shown is how many letters to show; the first line's baseline is at y.
function writeText(s, x, y, w, size, col, font, leading, shown, style = NORMAL) {
  if (shown <= 0) return;
  textFont(font);
  textStyle(style);
  textSize(size);
  textAlign(LEFT, BASELINE);
  fill(col);
  let lines = wrapLines(s, w);
  let left = floor(shown);
  for (let i = 0; i < lines.length; i++) {
    let part = lines[i].slice(0, left);
    text(part, x, y + i * leading);
    if (left < lines[i].length) {
      pencil(x + textWidth(part), y + i * leading);
      return;
    }
    left -= lines[i].length + 1; // +1 for the space between lines
    if (left <= 0 && i < lines.length - 1) {
      pencil(x, y + (i + 1) * leading);
      return;
    }
  }
}

// A yellow pencil with its tip at (x, y)
function pencil(x, y) {
  push();
  translate(x + 2, y - 4);
  rotate(-0.8);
  shadowOn(4);
  fill("#f2b53a");
  rect(12, -4, 40, 8);
  shadowOff();
  fill("#e8c9a0");
  triangle(12, -4, 12, 4, 0, 0);
  fill(INK);
  triangle(4, -1.4, 4, 1.4, 0, 0);
  fill("#e98b8b");
  rect(52, -4, 8, 8, 0, 2, 2, 0);
  pop();
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
  let hot = !off && !dragging && inside(x, y, w, h);
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

// A gear card in the supply drop, drawn at scale s. Returns true if it was clicked.
function gearCard(g, x, y, rot, s = 1) {
  let hot = inside(x - 160 * s, y - 180 * s, 320 * s, 360 * s);
  if (hot) hovering = true;
  push();
  translate(x, y);
  rotate(rot);
  scale(hot ? s * 1.04 : s);
  shadowOn(hot ? 22 : 12);
  fill(250);
  rect(-160, -180, 320, 360, 4);
  shadowOff();
  fill("#1d2219");
  circle(0, -95, 110);
  image(icons[g.icon], -28, -123, 56, 56);
  txt(g.name, 0, 4, 30, INK, MARKER, CENTER);
  txtBox(g.text, -135, 24, 270, 150, 26, BLUE, HAND, 28);
  pop();
  tape(x, y - 182 * s, rot + 0.05);
  return hot && click;
}

// A round paper tag with a symbol on it: ? opens How to play, ↺ starts over
function helpButton(x, y, symbol = "?") {
  let hot = dist(mouseX, mouseY, x, y) < 22;
  if (hot) hovering = true;
  shadowOn(8);
  fill(hot ? "#fff6dc" : PAPER);
  circle(x, y, 44);
  shadowOff();
  txt(symbol, x, y + 11, symbol == "?" ? 30 : 28, INK, symbol == "?" ? MARKER : TYPE, CENTER);
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

// Animal tracks drawn on the map by the motion sensor log
function tracks(x, y) {
  fill(70, 45, 25, 210);
  for (let i = 0; i < 3; i++) {
    let px = x + i * 16;
    let py = y + (i % 2) * 8;
    ellipse(px, py, 8, 10);
    circle(px - 4, py - 7, 3.5);
    circle(px, py - 8.5, 3.5);
    circle(px + 4, py - 7, 3.5);
  }
  txt("movement!", x + 48, y + 6, 24, "#a3312b", HAND, LEFT, BOLD);
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
  txt("of " + NIGHTS, 0, 66, 22, "#666", HAND, CENTER, BOLD);
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
  let draggingCam = dragging && dragging.cam != null;
  let hot = draggingCam ? spotAt() == i : inside(x, y, w, h);
  if (hot) hovering = true;
  let k = cameras.indexOf(i);
  if (draggingCam && dragging.cam == k) k = -1; // the camera is in the player's hand
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
// Clicking a placed camera's outline takes it back off the map. A smashed camera is crossed out.
function deskCamera(k) {
  let x = 1110 + k * 90;
  let y = 120;
  let hot = inside(x - 36, y - 46, 72, 92);
  if (k == lost) {
    trailCamera(x, y, 1, k + 1);
    fill(0, 130);
    rect(x - 32, y - 42, 64, 84, 10);
    stroke("#c0392b");
    strokeWeight(5);
    line(x - 24, y - 34, x + 24, y + 34);
    line(x + 24, y - 34, x - 24, y + 34);
    noStroke();
    strokeWeight(1);
    txt("smashed", x, y + 76, 26, "#ff8a80", HAND, CENTER, BOLD);
  } else if (k == loose) {
    // knocked over, with its wires hanging out: click to fix it
    if (hot) hovering = true;
    push();
    translate(x, y);
    rotate(0.35 + (hot ? sin(frameCount * 0.3) * 0.04 : 0));
    trailCamera(0, 0, hot ? 1.06 : 1, k + 1);
    pop();
    for (let i = 0; i < 4; i++) {
      noFill();
      stroke(WIRE_COLOURS[i].col);
      strokeWeight(5);
      bezier(x - 10 + i * 7, y + 30, x - 20 + i * 9, y + 55, x + i * 12, y + 45, x - 30 + i * 18, y + 62);
    }
    noStroke();
    strokeWeight(1);
    if (frameCount % 30 < 15) {
      fill("#ffe066");
      star(x + 22, y + 38, 4, 9);
    }
    txt("fix me!", x, y + 90, 26, "#ffd866", HAND, CENTER, BOLD);
    if (hot && click) startWires(k, "plan");
  } else if (cameras[k] == null && !(dragging && dragging.cam == k)) {
    if (hot) hovering = true;
    trailCamera(x, y, hot ? 1.06 : 1, k + 1);
    txt(hot ? "drag me" : "cam " + (k + 1), x, y + 76, 28, "#f0e6cc", HAND, CENTER, BOLD);
  } else {
    if (hot) hovering = true;
    noFill();
    stroke(240, 230, 200, hot ? 230 : 120);
    strokeWeight(2);
    drawingContext.setLineDash([6, 6]);
    rect(x - 32, y - 42, 64, 84, 10);
    drawingContext.setLineDash([]);
    noStroke();
    strokeWeight(1);
    let label = dragging && dragging.cam == k ? "drop on map" : hot ? "take back" : "on map";
    txt(label, x, y + 76, 24, "#d8ccb0", HAND, CENTER, BOLD);
    if (hot && click) cameras[k] = null;
  }
}

// A small star (a spark), centred at (x, y)
function star(x, y, r1, r2) {
  beginShape();
  for (let a = 0; a < TWO_PI; a += PI / 5) {
    let r = (round(a / (PI / 5)) % 2) ? r1 : r2;
    vertex(x + cos(a - HALF_PI) * r, y + sin(a - HALF_PI) * r);
  }
  endShape(CLOSE);
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

// The big red FLAG button on the side of the camera. on means the photo is already flagged:
// the button glows amber and pressing it again takes the flag back. Returns true if it was clicked.
function flagButton(x, y, on = false, off = false) {
  let hot = !off && dist(mouseX, mouseY, x, y) < 58;
  if (off) drawingContext.globalAlpha = 0.4;
  if (hot) hovering = true;
  fill(on ? "#ffb030" : 15); // an amber ring while flagged
  circle(x, y, 132);
  shadowOn(8);
  fill(hot ? "#e0483c" : "#b8322a");
  circle(x, y, 112);
  shadowOff();
  fill(255, 40);
  ellipse(x - 14, y - 22, 60, 30);
  image(icons.warning, x - 16, y - 34, 32, 32);
  txt(on ? "UNFLAG" : "FLAG", x, y + 26, on ? 22 : 30, "#fff", MARKER, CENTER);
  txt(on ? "FLAGGED:\nPRESS TO UNDO" : "SOMETHING'S\nWRONG", x, y + 88, 13, "rgba(255,255,255,0.8)", TYPE, CENTER);
  drawingContext.globalAlpha = 1;
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
// key names the photo (e.g. "N2-farm-1") so the Field ID scope can find what is in it.
function drawPhoto(pic, x, y, w, h, key = "") {
  // the part of the 800x500 photo that is shown
  let sx = 0, sy = 0, sw = 800, sh = 500;
  if (inspecting && inside(x, y, w, h)) {
    sw = 800 / 1.75;
    sh = 500 / 1.75;
    sx = map(mouseX, x, x + w, 0, 800 - sw);
    sy = map(mouseY, y, y + h, 0, 500 - sh);
  }
  image(pic, x, y, w, h, sx, sy, sw, sh);
  views.push({ key, x, y, w, h, sx, sy, sw, sh });
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