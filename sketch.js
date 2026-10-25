// Wild Trace prototype
// TODO: a real report, better drawings


let screen = "title";

// The 5 camera spots. The same index is used in all three lists,
let places = ["Forest", "Creek", "Corridor", "Farm", "Road"];
let placeX = [133, 135, 412, 630, 670];
let placeY = [195, 425, 330, 455, 212];


let cameras = []; // indexes of the places that have a camera (max 2)
let timer = 0;    // counts frames on the night screen
let message = ""; // feedback shown after clicking a photo
let night = 1;    // current night, 1 to 3
let found = false; // true once the player finds the fence photo

// pictures for the backgrounds and camera photos (asset folder)
let titleImg, howtoImg, briefingImg, nightImg, endImg;
let mapImgs = []; // one map per night, the fence gets longer each night
let camImgs = [null, null, null, null, null]; // camera photo per place, null = drawn instead

function preload() {
  titleImg = loadImage("assets/title.png");
  howtoImg = loadImage("assets/night-forest-leaves.png");
  briefingImg = loadImage("assets/construction-sunset.png");
  mapImgs[0] = loadImage("assets/map-1.jpeg");
  mapImgs[1] = loadImage("assets/map-2.jpeg");
  mapImgs[2] = loadImage("assets/map-3.png");
  nightImg = loadImage("assets/night-moon.png");
  endImg = loadImage("assets/night-lake.png");
  camImgs[0] = loadImage("assets/cam-forest.png");
  camImgs[1] = loadImage("assets/cam-creek.png");
  camImgs[2] = loadImage("assets/cam-corridor.png");
  camImgs[3] = loadImage("assets/cam-farm.png");
  camImgs[4] = loadImage("assets/cam-road.png");
}

function setup() {
  createCanvas(800, 600);
  // double resolution so the canvas stays sharp when scaled up
  pixelDensity(2);
}


function draw() {
  if (screen == "title") {
    // Title screen: game name plus Start and How to play buttons
    image(titleImg, 0, 0, 800, 600); // the picture already has the game name on it
    button("Start", 230, 350);
    button("How to play", 410, 350);
  } else if (screen == "howto") {
    // How to play: the rules, then Back to the title
    image(howtoImg, 0, 0, 800, 600);
    fill(255);
    textAlign(LEFT);
    textSize(20);
    text("1. Click 2 places on the map to put your cameras.\n2. Start the night and wait for the photos.\n3. Click the photo that shows what's wrong.\n4. You have 3 nights, and you can move your cameras each night.", 60, 150);
    button("Back", 320, 450);
  } else if (screen == "briefing") {
    // Briefing: the story before the first night
    image(briefingImg, 0, 0, 800, 600);
    fill(0, 150); // dark layer so the white text can be read over the bright sky
    rect(0, 0, 800, 600);
    fill(255);
    textAlign(LEFT);
    textSize(20);
    text("A new fence and road are being built through the reserve.\nThe rangers think the animals are in trouble.\nYou have 3 nights to catch the problem on camera.", 60, 200);
    button("Continue", 320, 450);
  } else if (screen == "map") {
    // Map: the player picks 2 places for the cameras
    // tonight's map picture, it shows the fence, the road and the place names
    // (night is 1 to 3 and lists start at 0, so night 1 is mapImgs[0])
    image(mapImgs[night - 1], 0, 0, 800, 600);
    // reset the outline so the circles below draw normally
    stroke(0);
    strokeWeight(1);
    fill(255); // white so it shows up on the dark map
    textAlign(LEFT);
    textSize(20);
    text("Night " + night + ": click 2 places to put your cameras", 20, 30);
 
    // Draw each place as a circle (its name is already on the map picture).
    // Places with a camera are yellow, the rest are white.
    for (let i = 0; i < 5; i++) {
      if (cameras.includes(i)) {
        fill(255, 200, 0);
      } else {
        fill(255);
      }
      ellipse(placeX[i], placeY[i], 40, 40);
    }
 
    // Only let the night start once both cameras are placed
    if (cameras.length == 2) {
      button("Start night", 620, 530);}
  } else if (screen == "night") {
    // Night: a short pause before the photos
    image(nightImg, 0, 0, 800, 600);
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
    text("Which photo shows the fence blocking the animals?", 20, 40);
    drawPhoto(cameras[0], 20, 100);
    drawPhoto(cameras[1], 410, 100);
    // Feedback from the last photo the player clicked
    fill(255);
    textAlign(CENTER);
    textSize(20);
    text(message, 400, 450);
    // Hint so the player isn't stuck when no camera can see the fence
    if (!cameras.includes(2)) {
      text("Tip: the fence is being built at the Corridor.", 400, 490);
    }
    // After the last night the button goes to the end screen instead
    button(night < 3 ? "Next night" : "Finish", 620, 530);
  } else if (screen == "end") {
    // End: did the player find the fence on any night?
    image(endImg, 0, 0, 800, 600);
    fill(255);
    textAlign(CENTER);
    textSize(24);
    if (found) {
      text("You proved the fence cut off the corridor!", 400, 250);
    } else {
      text("You never caught the fence on camera.", 400, 250);
    }
    button("Play again", 320, 400);
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

// Draws the camera photo for one place, with its top-left corner at (x, y).
// place is an index into the places list.
function drawPhoto(place, x, y) {
  // Use the camera picture if there is one. The corridor picture has the fence
  // in it, so on night 1 (before the fence gets there) it is drawn instead.
  if (camImgs[place]) {
    image(camImgs[place], x, y, 370, 250);
    // the picture says "NIGHT 2", so cover that and write the real night
    noStroke();
    fill(22, 36, 31);
    rect(x + 14, y + 14, 160, 22);
    fill(220);
    textAlign(LEFT);
    textSize(12);
    text("CAM - " + places[place].toUpperCase() + " - NIGHT " + night, x + 22, y + 30);
    stroke(0); // put the outline back for everything drawn after
    return;
  }
 
  // dark green photo background
  fill(50, 70, 50);
  rect(x, y, 370, 250);
 
  if (place == 0) {
    // forest
    fill(30, 90, 40);
    ellipse(x + 80, y + 80, 100, 100);
    ellipse(x + 280, y + 70, 120, 120);
    fill(150, 110, 70);
    ellipse(x + 180, y + 180, 80, 40); // deer
  } else if (place == 1) {
    // creek
    fill(60, 110, 180);
    rect(x, y + 170, 370, 50);
    fill(150, 110, 70);
    ellipse(x + 180, y + 160, 80, 40); // deer
  } else if (place == 2) {
    // corridor, fenced from night 2
    if (night > 1) {
      stroke(200);
      strokeWeight(3);
      // 8 fence posts
      for (let i = 0; i < 8; i++) {
        line(x + 20 + i * 45, y + 100, x + 20 + i * 45, y + 200);
      }
      // 2 wires across the posts
      line(x, y + 130, x + 370, y + 130);
      line(x, y + 170, x + 370, y + 170);
      stroke(0);
      strokeWeight(1);
    }
    fill(90);
    ellipse(x + 150, y + 210, 70, 30); // badger
  } else if (place == 3) {
    // farm
    fill(160, 50, 40);
    rect(x + 220, y + 60, 110, 90); // barn
    fill(220, 120, 40);
    ellipse(x + 120, y + 190, 60, 25); // fox
  } else if (place == 4) {
    // road
    fill(110);
    rect(x, y + 160, 370, 60);
    fill(20);
    rect(x + 120, y + 130, 130, 50); // truck
    fill(255, 255, 150);
    ellipse(x + 250, y + 150, 20, 15); // headlight
  }
 
  // camera label along the bottom of the photo
  fill(255);
  textAlign(LEFT);
  textSize(12);
  text("CAM - " + places[place] + " - NIGHT " + night, x + 10, y + 242);
}



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
    if (mouseY > 100 && mouseY < 350) {
      if (mouseX > 20 && mouseX < 390) clicked = cameras[0];
      if (mouseX > 410 && mouseX < 780) clicked = cameras[1];
    }
    // The right answer is the Corridor photo, but only from night 2,
    // since the fence doesn't reach the corridor on night 1
    if (clicked == 2) {
      message = "Yes! The fence cuts off the corridor (habitat fragmentation)";
      found = true;
    } else if (clicked != -1) {
      message = "Hmm, that photo doesn't show the fence";
    }
    // Next night / Finish button. Cameras stay where they were,
    // so the player can move them on the map.
    if (onButton(620, 530)) {
      message = "";
      if (night < 3) {
        night++;
        screen = "map";
      } else {
        screen = "end";
      }
    }
  } else if (screen == "end") {
    // Play again: reset everything and go back to the title
    if (onButton(320, 400)) {
      night = 1;
      cameras = [];
      found = false;
      screen = "title";
    }
  }
}
