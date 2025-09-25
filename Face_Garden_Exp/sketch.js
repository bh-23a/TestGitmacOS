// Array of faces.
let faces = []; 

function setup() {
  createCanvas(400, 400);
  facePower();  // Generate faces
}

function draw() {
  background('black');
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

// ==========================
// Classes
// ==========================
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
  
  // class AngryFace extends Face TBD
}



// Factory function to return a random type of face
function createFace() {
  let x = random(20, 380);
  let y = random(20, 380);
  let size = random(20, 75);
  let lifespan = random(300, 550);
  let col = color(random(255), random(250), random(260));

  let choice = random(["happy", "sad", "surprised"]);
  if (choice === "happy") return new HappyFace(x, y, size, lifespan, col);
  if (choice === "sad") return new SadFace(x, y, size, lifespan, col);
  return new SurprisedFace(x, y, size, lifespan, col);
}