//for compiling before preload
let FilesetResolver, FaceLandmarker;


let faceLandmarker;
let video;
let results = [];
let runningMode = "VIDEO";

// initalize current expression
let currentExpression = "neutral";

// preload mediapipe model
async function preload() {
  // Dynamically import the ES module
  const vision = await import(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.10/vision_bundle.mjs"
  );

  // Destructure what you need
  ({ FilesetResolver, FaceLandmarker } = vision);

  const fileset = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.10/wasm"
  );

  faceLandmarker = await FaceLandmarker.createFromOptions(fileset, {
    baseOptions: {
      modelAssetPath:
        "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task"
,
    },
    runningMode: "VIDEO",
  });
}

function setup() {
  createCanvas(640, 480);
  video = createCapture(VIDEO);
  video.size(width, height);
  video.hide();
}

function draw() {
  image(video, 0, 0, width, height);

  if (faceLandmarker && video.loadedmetadata) {
    faceLandmarker.detectForVideo(video.elt, millis(), (res) => {
      results = res.faceLandmarks;
      if (results && results.length > 0) {
        detectExpression(results[0]);
      }
    });
  }

  // draw face based on expression
  if (currentExpression === "happy") {
    new HappyFace(width / 2, height / 2, 100).display();
  } else if (currentExpression === "sad") {
    new SadFace(width / 2, height / 2, 100).display();
  } else if (currentExpression === "angry") {
    new AngryFace(width / 2, height / 2, 100).display();
  } else {
    fill(255);
    textAlign(CENTER, CENTER);
    text("Welcome to the Face Garden!", width / 2, height / 2);
  }
}

// Simple detection (based on mouth landmarks)
function detectExpression(landmarks) {
  const topLip = landmarks[13]; // approximate
  const bottomLip = landmarks[14];
  const nose = landmarks[1];
  const leftMouth = landmarks[61];
  const rightMouth = landmarks[291];

  const mouthOpen = dist(
    topLip.x * width,
    topLip.y * height,
    bottomLip.x * width,
    bottomLip.y * height
  );
  const mouthWidth = dist(
    leftMouth.x * width,
    leftMouth.y * height,
    rightMouth.x * width,
    rightMouth.y * height
  );

  // expression marks
  if (mouthSmileLeft > .8842 && mouthSmileRight > .9000) {
    currentExpression = "happy";
  } //else if (mouthOpen < 10 && mouthWidth < 100) {
    currentExpression = "sad";
  //} else if (nose.y * height < topLip.y * height - 20) {
    currentExpression = "angry";
  //} else {
    //currentExpression = "neutral";
 // }
}

//  Face Classes
class HappyFace {
  constructor(x, y, s) {
    this.x = x;
    this.y = y;
    this.s = s;
  }

  display() {
    push();
    translate(this.x, this.y);
    noStroke();
    fill(255, 220, 0);
    ellipse(0, 0, this.s);

    fill(0);
    ellipse(-this.s / 4, -this.s / 4, this.s / 10);
    ellipse(this.s / 4, -this.s / 4, this.s / 10);

    noFill();
    stroke(0);
    strokeWeight(4);
    arc(0, this.s / 6, this.s / 2, this.s / 3, 0, PI);
    pop();
  }
}

class SadFace extends HappyFace {
  display() {
    push();
    translate(this.x, this.y);
    noStroke();
    fill(100, 150, 255);
    ellipse(0, 0, this.s);

    fill(0);
    ellipse(-this.s / 4, -this.s / 4, this.s / 10);
    ellipse(this.s / 4, -this.s / 4, this.s / 10);

    noFill();
    stroke(0);
    strokeWeight(4);
    arc(0, this.s / 3, this.s / 2, this.s / 3, PI, TWO_PI);
    pop();
  }
}

class AngryFace extends HappyFace {
  display() {
    push();
    translate(this.x, this.y);
    noStroke();
    fill(255, 100, 100);
    ellipse(0, 0, this.s);

    // eyes
    fill(0);
    ellipse(-this.s / 4, -this.s / 4, this.s / 10);
    ellipse(this.s / 4, -this.s / 4, this.s / 10);

    // eyebrows
    stroke(0);
    strokeWeight(4);
    line(-this.s / 3, -this.s / 3, -this.s / 6, -this.s / 4);
    line(this.s / 3, -this.s / 3, this.s / 6, -this.s / 4);

    // mouth (straight)
    line(-this.s / 4, this.s / 4, this.s / 4, this.s / 4);
    pop();
  }
}
