const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const scoreLeftEl = document.getElementById("scoreLeft");
const scoreRightEl = document.getElementById("scoreRight");
const overlay = document.getElementById("overlay");
const startBtn = document.getElementById("startBtn");

const state = {
  running: false,
  paused: false,
  winningScore: 7,
  leftScore: 0,
  rightScore: 0,
  particles: [],
};

const paddle = {
  width: 14,
  height: 96,
  speed: 6,
};

const left = {
  x: 36,
  y: canvas.height / 2,
  vy: 0,
};

const right = {
  x: canvas.width - 36,
  y: canvas.height / 2,
  vy: 0,
};

const ball = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  radius: 10,
  vx: 6,
  vy: 2.6,
  speed: 6,
};

const keys = new Set();

function resetBall(direction = 1) {
  ball.x = canvas.width / 2;
  ball.y = canvas.height / 2;
  const angle = (Math.random() * 0.6 - 0.3) + (Math.random() > 0.5 ? 0.12 : -0.12);
  ball.speed = 6;
  ball.vx = Math.cos(angle) * ball.speed * direction;
  ball.vy = Math.sin(angle) * ball.speed;
}

function resetRound() {
  left.y = canvas.height / 2;
  right.y = canvas.height / 2;
  left.vy = 0;
  right.vy = 0;
  resetBall(Math.random() > 0.5 ? 1 : -1);
}

function fullReset() {
  state.leftScore = 0;
  state.rightScore = 0;
  updateScore();
  resetRound();
}

function updateScore() {
  scoreLeftEl.textContent = state.leftScore;
  scoreRightEl.textContent = state.rightScore;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function addParticles(x, y, color) {
  for (let i = 0; i < 10; i += 1) {
    state.particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 3,
      vy: (Math.random() - 0.5) * 3,
      life: 1,
      color,
    });
  }
}

function updateParticles() {
  state.particles = state.particles.filter((p) => p.life > 0.05);
  state.particles.forEach((p) => {
    p.x += p.vx;
    p.y += p.vy;
    p.life *= 0.92;
  });
}

function drawParticles() {
  state.particles.forEach((p) => {
    ctx.globalAlpha = p.life;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
}

function drawNet() {
  ctx.strokeStyle = "rgba(255,255,255,0.15)";
  ctx.setLineDash([8, 10]);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(canvas.width / 2, 20);
  ctx.lineTo(canvas.width / 2, canvas.height - 20);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawPaddle(p) {
  ctx.fillStyle = "#f6f1ea";
  ctx.fillRect(p.x - paddle.width / 2, p.y - paddle.height / 2, paddle.width, paddle.height);
}

function drawBall() {
  ctx.fillStyle = "#ff6f3c";
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowColor = "rgba(255,111,60,0.6)";
  ctx.shadowBlur = 18;
  ctx.fill();
  ctx.shadowBlur = 0;
}

function updatePaddles() {
  left.y = clamp(left.y + left.vy, paddle.height / 2, canvas.height - paddle.height / 2);
  right.y = clamp(right.y + right.vy, paddle.height / 2, canvas.height - paddle.height / 2);
}

function updateBall() {
  ball.x += ball.vx;
  ball.y += ball.vy;

  if (ball.y - ball.radius <= 0 || ball.y + ball.radius >= canvas.height) {
    ball.vy *= -1;
    addParticles(ball.x, ball.y, "#ffd166");
  }

  const leftHit = ball.x - ball.radius <= left.x + paddle.width / 2 &&
    ball.y >= left.y - paddle.height / 2 &&
    ball.y <= left.y + paddle.height / 2;

  const rightHit = ball.x + ball.radius >= right.x - paddle.width / 2 &&
    ball.y >= right.y - paddle.height / 2 &&
    ball.y <= right.y + paddle.height / 2;

  if (leftHit && ball.vx < 0) {
    ball.vx *= -1;
    ball.vy += (ball.y - left.y) * 0.04;
    ball.speed += 0.25;
    ball.vx = Math.sign(ball.vx) * ball.speed;
    addParticles(ball.x, ball.y, "#3c91ff");
  }

  if (rightHit && ball.vx > 0) {
    ball.vx *= -1;
    ball.vy += (ball.y - right.y) * 0.04;
    ball.speed += 0.25;
    ball.vx = Math.sign(ball.vx) * ball.speed;
    addParticles(ball.x, ball.y, "#ff6f3c");
  }

  if (ball.x < -40) {
    state.rightScore += 1;
    updateScore();
    addParticles(canvas.width / 2, canvas.height / 2, "#3c91ff");
    resetBall(1);
  }

  if (ball.x > canvas.width + 40) {
    state.leftScore += 1;
    updateScore();
    addParticles(canvas.width / 2, canvas.height / 2, "#ff6f3c");
    resetBall(-1);
  }
}

function drawFrame() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, "#11172f");
  gradient.addColorStop(1, "#2b1b36");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawNet();
  drawPaddle(left);
  drawPaddle(right);
  drawBall();
  drawParticles();
}

function checkWin() {
  if (state.leftScore >= state.winningScore || state.rightScore >= state.winningScore) {
    state.running = false;
    overlay.classList.remove("hidden");
    const winner = state.leftScore > state.rightScore ? "Player One" : "Player Two";
    overlay.querySelector("h2").textContent = `${winner} wins!`;
    overlay.querySelector("p").textContent = "Press R to restart";
    overlay.querySelector("button").textContent = "Play Again";
    return true;
  }
  return false;
}

function loop() {
  if (!state.running) {
    drawFrame();
    return;
  }

  if (!state.paused) {
    updatePaddles();
    updateBall();
    updateParticles();
  }

  drawFrame();

  if (!checkWin()) {
    requestAnimationFrame(loop);
  }
}

function startGame() {
  state.running = true;
  state.paused = false;
  overlay.classList.add("hidden");
  overlay.querySelector("h2").textContent = "Ready?";
  overlay.querySelector("p").textContent = "Player One: W/S";
  overlay.querySelector("button").textContent = "Start";
  requestAnimationFrame(loop);
}

function togglePause() {
  if (!state.running) return;
  state.paused = !state.paused;
}

function handleKeyDown(event) {
  keys.add(event.key);

  if (event.key === " " || event.key === "Spacebar") {
    togglePause();
  }

  if (event.key.toLowerCase() === "r") {
    fullReset();
    startGame();
  }
}

function handleKeyUp(event) {
  keys.delete(event.key);
}

function applyInput() {
  left.vy = 0;
  right.vy = 0;

  if (keys.has("w") || keys.has("W")) {
    left.vy = -paddle.speed;
  }
  if (keys.has("s") || keys.has("S")) {
    left.vy = paddle.speed;
  }
  if (keys.has("ArrowUp")) {
    right.vy = -paddle.speed;
  }
  if (keys.has("ArrowDown")) {
    right.vy = paddle.speed;
  }

  requestAnimationFrame(applyInput);
}

startBtn.addEventListener("click", () => {
  fullReset();
  startGame();
});

document.addEventListener("keydown", handleKeyDown);

document.addEventListener("keyup", handleKeyUp);

applyInput();
resetRound();
loop();
