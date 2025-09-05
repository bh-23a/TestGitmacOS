import processing.core.PApplet;
public class Prototype1 extends PApplet {
    public static void main (String[] args) {
        PApplet.main("Prototype1");
    }

    public void settings() {
        size(600, 600); // sketch window size
    }

    class Emotion {
        String eyes;
        String mouth;
        int col;

        Emotion(String e, String m, int c) {
            eyes = e;
            mouth = m;
            col = c;
        }
    }

    String[] eyesOptions = {"open", "droop", "narrow"};
    String[] mouthOptions = {"smile", "frown", "flat"};
    int[] colorOptions = {
            color(255, 217, 61),   // yellow
            color(108, 91, 123),   // purple
            color(232, 74, 95),    // red
            color(120, 200, 255)   // blue
    };

    int eyeIndex = 0;
    int mouthIndex = 0;
    int colorIndex = 0;

    Emotion currentFace;

    public void setup() {
//        size(600, 400);
        currentFace = new Emotion(eyesOptions[0], mouthOptions[0], colorOptions[0]);
    }

    public void draw() {
        background(240);

        // Instructions
        fill(0);
        textAlign(CENTER);
        textSize(16);
        text("Customize Your Pixel Face", width/2, 30);
        text("Press [E] to change eyes, [M] for mouth, [C] for color", width/2, 55);

        // Draw current face
        drawFace(currentFace, width/2, height/2);

        // Show labels of current selection
        text("Eyes: " + currentFace.eyes, width/2, height - 80);
        text("Mouth: " + currentFace.mouth, width/2, height - 60);
        text("Color: #" + hex(currentFace.col, 6), width/2, height - 40);
    }

    void drawFace(Emotion e, float x, float y) {
        pushMatrix();
        translate(x, y);

        // Head
        fill(e.col);
        rect(-40, -40, 80, 80);

        // Eyes
        fill(0);
        if (e.eyes.equals("open")) {
            rect(-20, -10, 8, 8);
            rect(12, -10, 8, 8);
        } else if (e.eyes.equals("droop")) {
            rect(-20, -8, 8, 3);
            rect(12, -8, 8, 3);
        } else if (e.eyes.equals("narrow")) {
            rect(-20, -12, 8, 3);
            rect(12, -12, 8, 3);
        }

        // Mouth
        if (e.mouth.equals("smile")) {
            rect(-15, 15, 30, 4);
            rect(-15, 19, 5, 5);
            rect(10, 19, 5, 5);
        } else if (e.mouth.equals("frown")) {
            rect(-15, 20, 30, 4);
        } else if (e.mouth.equals("flat")) {
            rect(-15, 17, 30, 3);
        }

        popMatrix();
    }

    public void keyPressed() {
        if (key == 'e' || key == 'E') {
            eyeIndex = (eyeIndex + 1) % eyesOptions.length;
            currentFace.eyes = eyesOptions[eyeIndex];
        } else if (key == 'm' || key == 'M') {
            mouthIndex = (mouthIndex + 1) % mouthOptions.length;
            currentFace.mouth = mouthOptions[mouthIndex];
        } else if (key == 'c' || key == 'C') {
            colorIndex = (colorIndex + 1) % colorOptions.length;
            currentFace.col = colorOptions[colorIndex];
        }
    }

}
