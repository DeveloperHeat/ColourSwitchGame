const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = 400;
canvas.height = 600;

const paddleWidth = 100;
const paddleHeight = 20;
const paddleY = canvas.height - 40;
let paddleX = canvas.width / 2 - paddleWidth / 2;

const colors = [
  {
    name: "red",
    paddleGradient: (ctx, x, y, w, h) => {
      const gradient = ctx.createLinearGradient(x, y, x, y + h);
      gradient.addColorStop(0, "#ff6b6b");
      gradient.addColorStop(1, "#ee4444");
      return gradient;
    },
    shapeGradient: (ctx, x, y, size) => {
      const gradient = ctx.createLinearGradient(x, y, x, y + size);
      gradient.addColorStop(0, "#ff6b6b");
      gradient.addColorStop(1, "#ee4444");
      return gradient;
    },
  },
  {
    name: "blue",
    paddleGradient: (ctx, x, y, w, h) => {
      const gradient = ctx.createLinearGradient(x, y, x, y + h);
      gradient.addColorStop(0, "#6bb9ff");
      gradient.addColorStop(1, "#448eee");
      return gradient;
    },
    shapeGradient: (ctx, x, y, size) => {
      const gradient = ctx.createLinearGradient(x, y, x, y + size);
      gradient.addColorStop(0, "#6bb9ff");
      gradient.addColorStop(1, "#448eee");
      return gradient;
    },
  },
];
let currentColor = 0; // 0: red, 1: blue

const shapes = [];
let score = 0;
let highScore = localStorage.getItem("highScore") || 0; // Load high score
let speed = 1;
let spawnRate = 80; // How many frames between shape spawns
let gameRunning = false;

// Sound Effects
const catchSound = new Audio("sounds/catch.wav"); // Path to your catch sound file
const gameOverSound = new Audio("sounds/gameover.wav"); // Path to your game over sound file
const switchSound = new Audio("sounds/switch.wav"); // Path to your switch sound file

document.getElementById("highScore").textContent = "High Score: " + highScore; // Display initial high score
document.getElementById("startBtn").addEventListener("click", startGame);
document.getElementById("restartBtn").addEventListener("click", () => {
  document.getElementById("gameOverScreen").classList.add("hidden");
  startGame();
});

document.addEventListener("keydown", (e) => {
  if (!gameRunning) return;

  if (e.code === "ArrowLeft") {
    paddleX -= 20;
    if (paddleX < 0) paddleX = 0;
  }
  if (e.code === "ArrowRight") {
    paddleX += 20;
    if (paddleX + paddleWidth > canvas.width)
      paddleX = canvas.width - paddleWidth;
  }
  if (e.code === "Space") {
    e.preventDefault(); // Stop scrolling/focus
    currentColor = (currentColor + 1) % colors.length;
    switchSound.play(); // Play sound on color switch
  }
});

// Touch controls for paddle movement and color change
let touchStartX = 0;
let touchStartY = 0;

canvas.addEventListener("touchstart", (e) => {
  if (!gameRunning) return;
  e.preventDefault(); // Prevent scrolling
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
});

canvas.addEventListener("touchmove", (e) => {
  if (!gameRunning) return;
  e.preventDefault(); // Prevent scrolling
  const touchCurrentX = e.touches[0].clientX;
  const deltaX = touchCurrentX - touchStartX;

  // Adjust paddle position based on touch movement
  paddleX += deltaX * 0.8; // Multiplier to make it more responsive

  // Keep paddle within canvas bounds
  if (paddleX < 0) paddleX = 0;
  if (paddleX + paddleWidth > canvas.width)
    paddleX = canvas.width - paddleWidth;

  touchStartX = touchCurrentX; // Update start position for next move event
});

canvas.addEventListener("touchend", (e) => {
  if (!gameRunning) return;
  // Determine if it was a tap for color change
  const touchEndX = e.changedTouches[0].clientX;
  const touchEndY = e.changedTouches[0].clientY;
  const tapThreshold = 10; // Pixels for a "tap"

  if (
    Math.abs(touchEndX - touchStartX) < tapThreshold &&
    Math.abs(touchEndY - touchStartY) < tapThreshold
  ) {
    currentColor = (currentColor + 1) % colors.length;
    switchSound.play(); // Play sound on color switch
  }
});

function startGame() {
  document.getElementById("instructions").style.display = "none";
  shapes.length = 0;
  score = 0;
  speed = 1; // Initial speed
  spawnRate = 100; // Initial spawn rate
  paddleX = canvas.width / 2 - paddleWidth / 2;
  currentColor = 0;
  gameRunning = true;
  spawnTimer = 0;
  requestAnimationFrame(gameLoop);
}

function spawnShape() {
  const x = Math.random() * (canvas.width - 20);
  const colorIndex = Math.floor(Math.random() * colors.length);
  shapes.push({ x, y: -20, color: colorIndex });
}

function updateShapes() {
  for (let s of shapes) {
    s.y += speed;
  }
  // Check for missed shapes
  for (let i = shapes.length - 1; i >= 0; i--) {
    if (shapes[i].y > canvas.height) {
      gameOver(); // End the game if a shape is missed
      return;
    }
  }
}

function checkCollisions() {
  for (let i = shapes.length - 1; i >= 0; i--) {
    const s = shapes[i];
    if (
      s.y + 20 >= paddleY &&
      s.y <= paddleY + paddleHeight &&
      s.x + 20 >= paddleX &&
      s.x <= paddleX + paddleWidth
    ) {
      if (s.color === currentColor) {
        score++;
        catchSound.currentTime = 0; // Rewind to start if sound is already playing
        catchSound.play(); // Play sound on successful catch
        // Increase difficulty gradually
        if (score % 5 === 0) {
          // Every 5 points
          speed += 0.2; // Increase speed
          spawnRate = Math.max(20, spawnRate - 2); // Decrease spawn rate (make shapes spawn faster), with a minimum of 20
        }
      } else {
        gameOver();
        return;
      }
      shapes.splice(i, 1);
    }
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw paddle
  ctx.fillStyle = colors[currentColor].paddleGradient(
    ctx,
    paddleX,
    paddleY,
    paddleWidth,
    paddleHeight
  );
  ctx.beginPath();
  ctx.roundRect(paddleX, paddleY, paddleWidth, paddleHeight, 10); // Rounded corners
  ctx.fill();
  ctx.shadowColor = "rgba(0, 0, 0, 0.3)"; // Subtle outer shadow for paddle
  ctx.shadowBlur = 8;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 4;
  ctx.fillRect(paddleX, paddleY, paddleWidth, paddleHeight);
  ctx.shadowColor = "transparent"; // Reset shadow

  // Draw shapes
  for (let s of shapes) {
    ctx.fillStyle = colors[s.color].shapeGradient(ctx, s.x, s.y, 20);
    ctx.beginPath();
    ctx.roundRect(s.x, s.y, 20, 20, 5); // Rounded corners
    ctx.fill();
    ctx.shadowColor = "rgba(0, 0, 0, 0.2)"; // Subtle shadow for shapes
    ctx.shadowBlur = 5;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    ctx.fillRect(s.x, s.y, 20, 20);
    ctx.shadowColor = "transparent"; // Reset shadow
  }

  // Draw score
  ctx.fillStyle = "#fff";
  ctx.font = "20px 'Press Start 2P', cursive"; // Use the retro font for score
  ctx.fillText("Score: " + score, 10, 30);
}

let spawnTimer = 0;

function gameLoop() {
  if (!gameRunning) return;

  spawnTimer++;
  if (spawnTimer > spawnRate) {
    // Use spawnRate for controlling spawn frequency
    spawnShape();
    spawnTimer = 0;
  }

  updateShapes();
  checkCollisions();
  draw();
  requestAnimationFrame(gameLoop);
}

function gameOver() {
  gameRunning = false;
  gameOverSound.play(); // Play game over sound

  document.getElementById("finalScore").textContent = "Your Score: " + score;

  if (score > highScore) {
    highScore = score;
    localStorage.setItem("highScore", highScore); // Save new high score
    document.getElementById("highScore").textContent =
      "New High Score: " + highScore;
  } else {
    document.getElementById("highScore").textContent =
      "High Score: " + highScore;
  }

  document.getElementById("gameOverScreen").classList.remove("hidden");
}

const creditsBtn = document.getElementById("creditsBtn");
const creditsScreen = document.getElementById("creditsScreen");
const backBtn = document.getElementById("backBtn");
const instructions = document.getElementById("instructions");

creditsBtn.addEventListener("click", () => {
  instructions.classList.add("hidden");
  creditsScreen.classList.remove("hidden");
});

backBtn.addEventListener("click", () => {
  creditsScreen.classList.add("hidden");
  instructions.classList.remove("hidden");
});
