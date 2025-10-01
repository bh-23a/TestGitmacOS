// Array of faces.
let faces = []; 

function setup() {
  createCanvas(400, 400);
  facePower();  // Generate faces
}

function draw() {
  background('lavender');
  updateAndDrawFaces();
}

function mousePressed() {
  let face = createFace();
  face.x = mouseX; 
  face.y = mouseY;
  faces.push(face);
}

function updateAndDrawFaces() {
  for (let face of faces) {
    // Draw the face.
    face.display();

    // Apply wilting effect
    face.size *= 0.99;

    // Reduce lifespan
    face.lifespan -= 1;
    
    if (face.lifespan <= 0) {
      let i = faces.indexOf(face);
      faces.splice(i, 1);
    }
  }
}

// Function to create multiple faces.
function facePower(){
  for(let i = 0; i < 70; i++){
    faces.push(createFace());
  }
}


// Classes for face expressions

class Face {
  constructor(x, y, size, lifespan, col) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.lifespan = lifespan;
    this.col = col;
  }

  displayBase() {
    noStroke();
    fill(this.col);
    ellipse(this.x, this.y, this.size);

    // Eyes
    fill(0);
    let eyeOffsetX = this.size / 4;
    let eyeOffsetY = this.size / 6;
    ellipse(this.x - eyeOffsetX, this.y - eyeOffsetY, this.size / 8);
    ellipse(this.x + eyeOffsetX, this.y - eyeOffsetY, this.size / 8);
  }
}

class HappyFace extends Face {
  display() {
    this.displayBase();
    noFill();
    stroke(255, 0, 255);
    strokeWeight(3);
    arc(this.x, this.y + this.size/6, this.size/2, this.size/3, 0, PI);     //smile
  }
}


class SadFace extends Face {
  display() {
    this.displayBase();
    noFill();
    stroke(255, 0, 255);
    strokeWeight(3);
    arc(this.x, this.y + this.size/2.5, this.size/2, this.size/3, PI, TWO_PI); // frown
  }
}

class SurprisedFace extends Face {
  display() {
    this.displayBase();
    fill(0);
    noStroke();
    ellipse(this.x, this.y + this.size/4, this.size/5); // round mouth
  }
}
  
  // class AngryFace extends Face TBD
  // New face class with soft eyebrows + neutral mouth
class EyebrowFace extends Face {
  display() {
    this.displayBase(); // head + eyes

    // Eyebrows
    let eyeOffsetX = this.size / 4;
    let eyeOffsetY = this.size / 6;
    let browY = this.y - eyeOffsetY - this.size * 0.12;
    let browWidth = this.size * 0.5;
    let browArch = this.size * 0.08;

    // Left eyebrow control points
    let lx1 = this.x - eyeOffsetX - browWidth * 0.5;
    let ly1 = browY;
    let lx2 = this.x - eyeOffsetX - browWidth * 0.15;
    let ly2 = browY - browArch;
    let lx3 = this.x - eyeOffsetX + browWidth * 0.15;
    let ly3 = browY - browArch;
    let lx4 = this.x - eyeOffsetX + browWidth * 0.5;
    let ly4 = browY;

    // Right eyebrow control points (mirror)
    let rx1 = this.x + eyeOffsetX - browWidth * 0.5;
    let ry1 = browY;
    let rx2 = this.x + eyeOffsetX - browWidth * 0.15;
    let ry2 = browY - browArch;
    let rx3 = this.x + eyeOffsetX + browWidth * 0.15;
    let ry3 = browY - browArch;
    let rx4 = this.x + eyeOffsetX + browWidth * 0.5;
    let ry4 = browY;

    // Soft base stroke
    noFill();
    strokeCap(ROUND);
    strokeWeight(max(4, this.size * 0.08));
    stroke(0, 100); // translucent underlayer
    bezier(lx1, ly1, lx2, ly2, lx3, ly3, lx4, ly4);
    bezier(rx1, ry1, rx2, ry2, rx3, ry3, rx4, ry4);

    // Sharper overlay stroke
    strokeWeight(max(1.5, this.size * 0.04));
    stroke(0, 180);
    bezier(lx1, ly1, lx2, ly2, lx3, ly3, lx4, ly4);
    bezier(rx1, ry1, rx2, ry2, rx3, ry3, rx4, ry4);

    // Neutral Mouth
    stroke(0);
    strokeWeight(3);
    line(this.x - this.size/5, this.y + this.size/4, 
         this.x + this.size/5, this.y + this.size/4);
  }

}


// Factory function to return a random type of face
function createFace() {
  let x = random(20, 380);
  let y = random(20, 380);
  let size = random(20, 75);
  let lifespan = random(300, 550);
  let col = color(random(255), random(250), random(260));

  let choice = random(["happy", "sad", "surprised", "eyebrows"]);
  if (choice === "happy") return new HappyFace(x, y, size, lifespan, col);
  if (choice === "sad") return new SadFace(x, y, size, lifespan, col);
  if (choice === "surprised") return new SurprisedFace(x, y, size, lifespan, col);
  if (choice === "eyebrows") return new EyebrowFace(x, y, size, lifespan, col);
}