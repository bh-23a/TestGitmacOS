//  Face Garden (p5.js + MediaPipe Tasks) 

let FilesetResolver, FaceLandmarker;
let faceLandmarker = null;
let video;
let currentExpression = "neutral";

// Smoothing helper
const smoothers = {};
function ema(key, value, alpha = 0.45) {
  if (!(key in smoothers)) smoothers[key] = value;
  smoothers[key] = alpha * value + (1 - alpha) * smoothers[key];
  return smoothers[key];
}

function dPix(a, b) {
  return dist(a.x * width, a.y * height, b.x * width, b.y * height);
}

// Avoid p5's built-in blend() name
function getBlend(result, name) {
  try {
    const cats = result.faceBlendshapes?.[0]?.categories || [];
    // exact match first, then substring fallback
    let f = cats.find(c => c.categoryName === name);
    if (!f) f = cats.find(c => c.categoryName?.toLowerCase().includes(name.toLowerCase()));
    return f ? f.score : 0;
  } catch { return 0; }
}

function setup() {
  createCanvas(640, 480);

  // Camera
  video = createCapture(VIDEO, () => {
    if (video && video.elt) video.elt.play();
  });
  video.size(width, height);
  video.hide();

  // Load model
  initFaceLandmarker();
}

async function initFaceLandmarker() {
  const vision = await import(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.10/vision_bundle.mjs"
  );

  ({ FilesetResolver, FaceLandmarker } = vision);

  const fileset = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.10/wasm"
  );

  faceLandmarker = await FaceLandmarker.createFromOptions(fileset, {
    baseOptions: {
      modelAssetPath:
        "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
    },
    runningMode: "VIDEO",
    numFaces: 1,
    outputFaceBlendshapes: true, // used for angry/happy, etc.
  });
}

function draw() {
  image(video, 0, 0, width, height);

  if (faceLandmarker && video?.elt && video.elt.readyState >= 2) {
    const result = faceLandmarker.detectForVideo(video.elt, performance.now());
    if (result && result.faceLandmarks && result.faceLandmarks.length > 0) {
      detectExpression(result); // NOTE: param name is 'result', not 'res'
    } else {
      currentExpression = "neutral";
    }
  }

  // Draw based on current expression
  if (currentExpression === "happy") {
    new HappyFace(width / 2, height / 2, 110).display();
  } else if (currentExpression === "sad") {
    new SadFace(width / 2, height / 2, 110).display();
  } else if (currentExpression === "angry") {
    new AngryFace(width / 2, height / 2, 110).display();
  } else {
    fill(255);
    textAlign(CENTER, CENTER);
    text("Welcome to the Face Garden!", width / 2, height / 2);
  }
}

// Expression detection (angry via browDown + mouthPress) 
function detectExpression(result) {
  const lm = result.faceLandmarks[0];

  // Blendshapes for smile/jaw
  const smileRaw = (
    getBlend(result, "mouthSmileLeft") + getBlend(result, "mouthSmileRight")
  ) * 0.5;
  const jawRaw =
    getBlend(result, "jawOpen") || getBlend(result, "mouthOpen") || getBlend(result, "jawDrop");

  const smile = ema("smile", smileRaw, 0.45);
  const jaw   = ema("jaw",   jawRaw,   0.45);

  //  Angry via browDown + mouthPress 
  // 0.5,0.55
  const browDownAvg = ema(
    "browDown",
    (getBlend(result, "browDownLeft") + getBlend(result, "browDownRight")) * 0.8,
    0.85
  );
  const mouthPressAvg = ema(
    "mouthPress",
    (getBlend(result, "mouthPressLeft") + getBlend(result, "mouthPressRight")) * 0.5,
    0.55
  );

  // Simple angry score & thresholds (tweak if needed)
  const angryScore = ema("angryScore",
    0.6 * browDownAvg + 0.4 * mouthPressAvg - 0.25 * smile - 0.10 * jaw,
    0.6
  );
  const ANGRY_T = 0.32; // try 0.28–0.40 depending on camera/lighting

  //  Geometry fallback for happy/sad 
  const L_EYE = 33, R_EYE = 263;
  const TOP_LIP = 13, BOT_LIP = 14;
  const LMOUTH = 61, RMOUTH = 291;

  const eyeW = dPix(lm[L_EYE], lm[R_EYE]) || 1;
  const openN = ema("openN", dPix(lm[TOP_LIP], lm[BOT_LIP]) / eyeW, 0.45);
  const wideN = ema("wideN", dPix(lm[LMOUTH], lm[RMOUTH]) / eyeW, 0.45);

  // Decide expression (priority: happy > angry > sad > neutral)
  let expr = "neutral";

  // Happy if clear smile or very wide+open mouth
  if (smile > 0.45 || (wideN > 1.25 && openN > 0.30)) {
    expr = "happy";
  }
  // Angry if browDown + mouthPress strong 
  else if (angryScore > ANGRY_T && smile < 0.40 && jaw < 0.35) {
    expr = "angry";
  }
  // Sad if mouth is narrow and closed
  else if (openN < 0.25 && wideN < 1.05) {
    expr = "sad";
  }
  // else neutral

  currentExpression = expr;
}

//  Face classes 
class HappyFace {
  constructor(x, y, s) { this.x = x; this.y = y; this.s = s; }
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
    line(this.s / 3, -this.s / 3,  this.s / 6, -this.s / 4);

    // mouth (straight)
    line(-this.s / 4, this.s / 4, this.s / 4, this.s / 4);
    pop();
  }
}
// background effects and sound effects