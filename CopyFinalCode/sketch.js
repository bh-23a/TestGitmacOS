//  Face Garden (p5.js + MediaPipe + OOP Faces with BG + Sound) 

let FilesetResolver, FaceLandmarker;
let faceLandmarker = null;
let video;

// expression state
let currentExpression = "neutral";
let lastExpression = "neutral";
let currentFace = null;

// choose how sounds behave: "layer" (play all) or "random" (pick one)
const SOUND_MODE = "layer";

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

function getBlend(result, name) {
  try {
    const cats = result.faceBlendshapes?.[0]?.categories || [];
    let f = cats.find(c => c.categoryName === name);
    if (!f) {
      f = cats.find(c =>
        c.categoryName?.toLowerCase().includes(name.toLowerCase())
      );
    }
    return f ? f.score : 0;
  } catch {
    return 0;
  }
}

// full screen method
function mousePressed() {
    fullscreen(true);
}

// ===== Sound & image =====
let happySound, sadSound, angrySound;
let happySpeech, sadSpeech, angrySpeech1;
// let angrySpeech2; // if you add it later

let happySounds = [], sadSounds = [], angrySounds = [];
let happyImages = [], sadImages = [], angryImages = [];

function preload() {
  soundFormats('mp3', 'wav');

  // sounds (FX)
  happySound = loadSound('happyCut.mp3');
  sadSound   = loadSound('sadCut.mp3');
  angrySound = loadSound('angryCut.mp3');
  
  // kids speech
  happySpeech  = loadSound('Happy.mp3');
  sadSpeech    = loadSound('Sad.mp3');
  angrySpeech1 = loadSound('AngryE.mp3');
  // angrySpeech2 = loadSound('AngryJ.mp3');

  // group sounds per emotion (FX + speech)
  happySounds = [happySound, happySpeech];
  sadSounds   = [sadSound,   sadSpeech];
  angrySounds = [angrySound, angrySpeech1]; // add angrySpeech2 if you want

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

  userStartAudio(); // allow audio playback

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
  // Run detection to update currentExpression
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

  // If expression changed, swap the active face object
  if (currentExpression !== lastExpression) {
    // stop any currently playing sounds (all emotion sounds)
    const allSounds = [...happySounds, ...sadSounds, ...angrySounds];
    allSounds.forEach(s => {
      if (s && s.isPlaying()) s.stop();
    });

    if (currentExpression === "happy") {
      currentFace = new HappyFace(
        width / 2,
        height / 2,
        110,
        happyImages,
        happySounds
      );
    } else if (currentExpression === "sad") {
      currentFace = new SadFace(
        width / 2,
        height / 2,
        110,
        sadImages,
        sadSounds
      );
    } else if (currentExpression === "angry") {
      currentFace = new AngryFace(
        width / 2,
        height / 2,
        110,
        angryImages,
        angrySounds
      );
    } else {
      currentFace = null;
    }

    if (currentFace) {
      currentFace.activate();
    }

    lastExpression = currentExpression;
  }

  // Draw either the current face or neutral video/text
  if (currentFace) {
    currentFace.display();
  } else {
    // neutral: show live camera + welcome text
    image(video, 0, 0, width, height);
    fill(255);
    textAlign(CENTER, CENTER);
    text("Welcome to the Face Garden!", width / 2, height / 2);
  }
}

// Expression detection
function detectExpression(result) {
  const lm = result.faceLandmarks[0];

  // Blendshapes for smile/jaw
  const smileRaw = (
    getBlend(result, "mouthSmileLeft") + getBlend(result, "mouthSmileRight")
  ) * 0.5;
  const jawRaw =
    getBlend(result, "jawOpen") ||
    getBlend(result, "mouthOpen") ||
    getBlend(result, "jawDrop");

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
  const ANGRY_T = 0.32; // tweak if needed

  // Geometry
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

//  Base FaceExpression class (background + sounds array) 
class FaceExpression {
  constructor(x, y, size, bgImages, soundsArray) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.bgImages = bgImages || [];
    this.sounds = soundsArray || [];  // <--- now an array
    this.currentBg = null;
  }

  activate() {
    // pick a random background for expression
    if (this.bgImages.length > 0) {
      this.currentBg = random(this.bgImages);
    } else {
      this.currentBg = null;
    }

    // play associated sounds
    if (this.sounds.length > 0) {
      if (SOUND_MODE === "layer") {
        // play ALL sounds for this face
        this.sounds.forEach(s => {
          if (s && !s.isPlaying()) s.play();
        });
      } else if (SOUND_MODE === "random") {
        // play ONE random sound
        const s = random(this.sounds);
        if (s && !s.isPlaying()) s.play();
      }
    }
  }

  drawBackground() {
    if (this.currentBg) {
      image(this.currentBg, 0, 0, width, height);
    } else {
      // fallback if no bg: show video
      image(video, 0, 0, width, height);
    }
  }

  drawFace() {
    // to be overridden by subclasses
  }

  display() {
    this.drawBackground();
    this.drawFace();
  }
}

// Face subclasses

class HappyFace extends FaceExpression {
  drawFace() {
    push();
    translate(this.x, this.y);
    noStroke();
    fill(255, 220, 0);
    ellipse(0, 0, this.size);
    fill(0);
    ellipse(-this.size / 4, -this.size / 4, this.size / 10);
    ellipse( this.size / 4, -this.size / 4, this.size / 10);
    noFill();
    stroke(0);
    strokeWeight(4);
    arc(0, this.size / 6, this.size / 2, this.size / 3, 0, PI);
    pop();
  }
}

class SadFace extends FaceExpression {
  drawFace() {
    push();
    translate(this.x, this.y);
    noStroke();
    fill(100, 150, 255);
    ellipse(0, 0, this.size);
    fill(0);
    ellipse(-this.size / 4, -this.size / 4, this.size / 10);
    ellipse( this.size / 4, -this.size / 4, this.size / 10);
    noFill();
    stroke(0);
    strokeWeight(4);
    arc(0, this.size / 3, this.size / 2, this.size / 3, PI, TWO_PI);
    pop();
  }
}

class AngryFace extends FaceExpression {
  drawFace() {
    push();
    translate(this.x, this.y);
    noStroke();
    fill(255, 100, 100);
    ellipse(0, 0, this.size);

    // eyes
    fill(0);
    ellipse(-this.size / 4, -this.size / 4, this.size / 10);
    ellipse( this.size / 4, -this.size / 4, this.size / 10);

    // eyebrows
    stroke(0);
    strokeWeight(4);
    line(-this.size / 3, -this.size / 3, -this.size / 6, -this.size / 4);
    line( this.size / 3, -this.size / 3,  this.size / 6, -this.size / 4);

    // mouth (straight)
    line(-this.size / 4, this.size / 4, this.size / 4, this.size / 4);
    pop();
  }
}
