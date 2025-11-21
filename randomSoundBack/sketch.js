// ===== Face Garden (p5.js + MediaPipe Tasks + Audio + BG Images) =====

let FilesetResolver, FaceLandmarker;
let faceLandmarker = null;
let video;

// expression state
let currentExpression = "neutral";
let lastExpression = "neutral";

// background image for current expression
let currentBgImg = null;

// smoothing helper
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
    let f = cats.find(c => c.categoryName === name);
    if (!f) f = cats.find(c => c.categoryName?.toLowerCase().includes(name.toLowerCase()));
    return f ? f.score : 0;
  } catch {
    return 0;
  }
}

// ===== Sound & image assets =====
let happySound, sadSound, angrySound;
let happyImages = [], sadImages = [], angryImages = [];

function preload() {
  soundFormats('mp3', 'wav');
  // sounds
  happySound = loadSound('happyCut.mp3');
  sadSound   = loadSound('sadCut.mp3');
  angrySound = loadSound('angryCut.mp3');

  // image file lists
  const happyFiles = ['3.png', '4.png', '5.png', '7.png'];
  const sadFiles   = ['8.png', '9.png', '10.png', '11.png'];
  const angryFiles = ['13.png', '14.png', '15.png', '16.png'];

  // load images into arrays
  for (let f of happyFiles) {
    happyImages.push(loadImage(f));
  }
  for (let f of sadFiles) {
    sadImages.push(loadImage(f));
  }
  for (let f of angryFiles) {
    angryImages.push(loadImage(f));
  }
}

function setup() {
  createCanvas(640, 480);

  video = createCapture(VIDEO, () => {
    if (video && video.elt) video.elt.play();
  });
  video.size(width, height);
  video.hide();

  userStartAudio(); // enable audio on browsers

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
    outputFaceBlendshapes: true,
  });
}

function draw() {
  // 1) Run detection first to update currentExpression
  if (faceLandmarker && video?.elt && video.elt.readyState >= 2) {
    const result = faceLandmarker.detectForVideo(video.elt, performance.now());
    if (result && result.faceLandmarks && result.faceLandmarks.length > 0) {
      detectExpression(result);
    } else {
      currentExpression = "neutral";
    }
  } else {
    currentExpression = "neutral";
  }

  // 2) If expression changed, pick new bg + handle sound
  if (currentExpression !== lastExpression) {
    // stop any currently playing sounds
    [happySound, sadSound, angrySound].forEach(s => {
      if (s && s.isPlaying()) s.stop();
    });

    if (currentExpression === "happy") {
      if (happyImages.length > 0) {
        currentBgImg = random(happyImages);
      } else {
        currentBgImg = null;
      }
      if (happySound) happySound.play();

    } else if (currentExpression === "sad") {
      if (sadImages.length > 0) {
        currentBgImg = random(sadImages);
      } else {
        currentBgImg = null;
      }
      if (sadSound) sadSound.play();

    } else if (currentExpression === "angry") {
      if (angryImages.length > 0) {
        currentBgImg = random(angryImages);
      } else {
        currentBgImg = null;
      }
      if (angrySound) angrySound.play();

    } else {
      // neutral
      currentBgImg = null;
    }

    lastExpression = currentExpression;
  }

  // 3) Draw background (image if set, else live video)
  if (currentBgImg) {
    image(currentBgImg, 0, 0, width, height);
  } else {
    image(video, 0, 0, width, height);
  }

  // 4) Draw face / text on top
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

// ===== Expression detection (angry via browDown + mouthPress) =====
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

  // Angry via browDown + mouthPress
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

  const angryScore = ema(
    "angryScore",
    0.6 * browDownAvg + 0.4 * mouthPressAvg - 0.25 * smile - 0.10 * jaw,
    0.6
  );
  const ANGRY_T = 0.32;

  // Geometry fallback for happy/sad
  const L_EYE = 33, R_EYE = 263;
  const TOP_LIP = 13, BOT_LIP = 14;
  const LMOUTH = 61, RMOUTH = 291;

  const eyeW = dPix(lm[L_EYE], lm[R_EYE]) || 1;
  const openN = ema("openN", dPix(lm[TOP_LIP], lm[BOT_LIP]) / eyeW, 0.45);
  const wideN = ema("wideN", dPix(lm[LMOUTH], lm[RMOUTH]) / eyeW, 0.45);

  let expr = "neutral";

  if (smile > 0.45 || (wideN > 1.25 && openN > 0.30)) {
    expr = "happy";
  } else if (angryScore > ANGRY_T && smile < 0.40 && jaw < 0.35) {
    expr = "angry";
  } else if (openN < 0.25 && wideN < 1.05) {
    expr = "sad";
  }

  currentExpression = expr;
}

// ===== Face classes =====
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
    line(this.s / 3, -this.s / 3, this.s / 6, -this.s / 4);

    // mouth (straight)
    line(-this.s / 4, this.s / 4, this.s / 4, this.s / 4);
    pop();
  }
}
