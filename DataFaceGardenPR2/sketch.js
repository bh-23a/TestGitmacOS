// Array of faces.
let faces = []; 

function setup() {
  createCanvas(400, 400);
  
  // Generate 20 flowers.
  facePower(); 
}

function draw() {
  background('black');
  
  // Call your new function.
  updateAndDrawFaces();
}

function mousePressed() {
  let face = createFace();

  // reassign x to be mouseX
  face.x = mouseX; 
  
  // reassign y to be mouseY
  face.y = mouseY;

  // add the flower to the flowers array
  faces.push(face);
}

function updateAndDrawFaces() {
  for (let face of faces) {

    // Draw the face.
    drawSmiley(face);

    // Apply wilting effect
    face.size *= 0.99;

    // Reduce lifespan
    face.lifespan -= 1;
    
    if (face.lifespan <= 0) {
      // Save index of the face.
      let i = faces.indexOf(face);
      
      // Remove wilted flower.
      faces.splice(i, 1);
    }
  }
}

// Function to create 20 faces.
function facePower(){
  for(let i = 0; i < 70; i+=1){
     faces.push(createFace());
    // Create a face in a random location.
    //let face1 = createFace();
    
    // Add the flower to the flowers array.
    //faces.push(face1);
  }
}

function createFace() {
  let expressions = ["happy", "sad", "surprised"];
  return {
    x: random(20,380),
    y: random(20,380),
    size: random(20, 75),
    lifespan: random(300,550),
    color: color(random(255), random(250), random(260))
  };
  
}

function drawSmiley(face) {
  noStroke();
  fill(face.color);
  
  // Face circle
  ellipse(face.x, face.y, face.size);

  // Eyes
  fill(0);
  let eyeOffsetX = face.size / 4;
  let eyeOffsetY = face.size / 6;
  ellipse(face.x - eyeOffsetX, face.y - eyeOffsetY, face.size / 8);
  ellipse(face.x + eyeOffsetX, face.y - eyeOffsetY, face.size / 8);
  
  // Mouth
  stroke(0);
  strokeWeight(3);
  noFill();
  
  // Different face expressions
  
}