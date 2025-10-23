// ===== Face Garden (p5.js + MediaPipe Tasks) =====

// Globals
let FilesetResolver, FaceLandmarker;
let faceLandmarker = null;
let video;
let currentExpression = "neutral";

// ---- load MediaPipe in setup via async init ----
function setup() {
  createCanvas(640, 480);

  // Start webcam and ensure playback
  video = createCapture(VIDEO, () => {
    if (video && video.elt) video.elt.play();
  });
  video.size(width, height);
  video.hide();

  // Initialize the landmarker (async, non-blocking)
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
    outputFaceBlendshapes: false,
  });
}

function draw() {
  image(video, 0, 0, width, height);

  // Only run detection when:
  // - model loaded
  // - video element exists and has current data
  if (faceLandmarker && video?.elt && video.elt.readyState >= 2) {
    // Detect synchronously; no callback
    const res = faceLandmarker.detectForVideo(video.elt, performance.now());

    if (res && res.faceLandmarks && res.faceLandmarks.length > 0) {
      detectExpression(res.faceLandmarks[0]); // use first face
    } else {
      currentExpression = "neutral";
    }
  }

  // Draw based on current expression
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

// --- Simple expression heuristic from landmarks ---
function detectExpression(landmarks) {
  // Using FaceMesh-style indices from MediaPipe Tasks output
  const topLip = landmarks[13];      // upper inner lip
  const bottomLip = landmarks[14];   // lower inner lip
  const nose = landmarks[1];         // nose tip-ish
  const leftMouth = landmarks[61];   // mouth corner
  const rightMouth = landmarks[291]; // mouth corner
  const mouthSmileLeft = landmarks[430]; // 0.6718
  const mouthSmileRight = landmarks[323]; // 0.6711
  
        
  const mouthOpen = dist(
    topLip.x * width, topLip.y * height,
    bottomLip.x * width, bottomLip.y * height
  );
  const mouthWidth = dist(
    leftMouth.x * width, leftMouth.y * height,
    rightMouth.x * width, rightMouth.y * height
  );
  const mouthSmileDetect = dist(
    mouthSmileLeft.x * width, mouthSmileLeft.y * height,
    mouthSmileRight.x * width, mouthSmileRight.y * height
  );
  
  

  if (mouthSmileDetect > 753 && mouthWidth > 120) {
    currentExpression = "happy";
  } else if (mouthOpen < 10 && mouthWidth < 100) {
    currentExpression = "sad";
  } else if (nose.y * height < topLip.y * height - 20) {
    currentExpression = "angry";
  } else {
    currentExpression = "neutral";
  }
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

    fill(0);
    ellipse(-this.s / 4, -this.s / 4, this.s / 10);
    ellipse(this.s / 4, -this.s / 4, this.s / 10);

    stroke(0);
    strokeWeight(4);
    line(-this.s / 3, -this.s / 3, -this.s / 6, -this.s / 4);
    line(this.s / 3, -this.s / 3,  this.s / 6, -this.s / 4);

    line(-this.s / 4, this.s / 4, this.s / 4, this.s / 4);
    pop();
  }
}
