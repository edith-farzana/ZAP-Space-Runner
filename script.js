const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

const selectScreen = document.getElementById("select-screen");
const gameScreen = document.getElementById("game-screen");
const startButton = document.getElementById("start-button");
const restartButton = document.getElementById("restart-button");
const backButton = document.getElementById("back-button");
const overlay = document.getElementById("game-overlay");
const overlayTitle = document.getElementById("overlay-title");
const overlaySummary = document.getElementById("overlay-summary");
const scoreValue = document.getElementById("score-value");
const speedValue = document.getElementById("speed-value");
const menuHighScore = document.getElementById("menu-high-score");
const hudHighScore = document.getElementById("hud-high-score");
const heartContainer = document.getElementById("heart-container");

const STORAGE_KEY = "pixel-space-sprint-high-score";
const GAME_WIDTH = canvas.width;
const GAME_HEIGHT = canvas.height;
const PLAYER_SCALE = 4;
const PLAYER_SIZE = 48;
const BASE_SCROLL_SPEED = 250;
const BOOST_MULTIPLIER = 1.8;

const spriteCatalog = {
  spaceship: {
    label: "Spaceship",
    map: [
      "....CC....",
      "...CWWC...",
      "..CWWWWC..",
      ".CWWRRWWC.",
      "CWWRYYRWWC",
      ".CSSRSSSSC.",
      "..T....T..",
      ".T......T.",
      "T........T",
      ".........."
    ],
    colors: {
      C: "#7cf6ff",
      W: "#f4f2ff",
      R: "#ff7a48",
      Y: "#ffde75",
      S: "#8b9cff",
      T: "#4ff4d0"
    }
  },
  rocket: {
    label: "Rocket",
    map: [
      "....R.....",
      "...RRR....",
      "..RWWWR...",
      "..RWWWR...",
      ".RWWYYWWR.",
      ".RWWYYWWR.",
      "..RWWWR...",
      "..B...B...",
      ".O.....O..",
      ".........."
    ],
    colors: {
      R: "#ff6c62",
      W: "#fff6e5",
      Y: "#ffcb57",
      B: "#4f8dff",
      O: "#ff8f3d"
    }
  },
  angel: {
    label: "Angel of God",
    map: [
      "W....H....W",
      "WW..HH..WW.",
      "WWW.HH.WWW.",
      ".WWHGGHWW..",
      "..HGGGGH...",
      ".HGGYYGGH..",
      "..GGYYGG...",
      ".GG....GG..",
      "G........G.",
      "..........G"
    ],
    colors: {
      W: "#f5f0ff",
      H: "#cde9ff",
      G: "#ffd76a",
      Y: "#ff9e57"
    }
  }
};

const obstacleProfiles = [
  {
    type: "rock",
    width: 54,
    height: 48,
    drift: 28,
    bonusSpeed: 35,
    colorA: "#8b91a7",
    colorB: "#5a6277"
  },
  {
    type: "satellite",
    width: 72,
    height: 44,
    drift: 16,
    bonusSpeed: 28,
    colorA: "#a8e6ff",
    colorB: "#6c7bb8"
  },
  {
    type: "dust",
    width: 88,
    height: 52,
    drift: 10,
    bonusSpeed: 22,
    colorA: "rgba(255, 222, 117, 0.26)",
    colorB: "rgba(124, 246, 255, 0.16)"
  },
  {
    type: "planet",
    width: 92,
    height: 92,
    drift: 12,
    bonusSpeed: 18,
    colorA: "#6cd8ff",
    colorB: "#435dff"
  }
];

const state = {
  selectedCharacter: "spaceship",
  running: false,
  animationId: 0,
  lastTime: 0,
  score: 0,
  scoreAtRoundStart: 0,
  highScore: loadHighScore(),
  lives: 3,
  invulnerableTimer: 0,
  spawnTimer: 0,
  nextSpawnDelay: 0.95,
  flashTimer: 0,
  player: {
    x: 170,
    y: GAME_HEIGHT / 2,
    width: PLAYER_SIZE,
    height: PLAYER_SIZE
  },
  obstacles: [],
  keys: {
    up: false,
    down: false,
    boost: false
  },
  stars: createStars(),
  planets: createBackgroundPlanets()
};

function loadHighScore() {
  try {
    return Number.parseInt(window.localStorage.getItem(STORAGE_KEY) || "0", 10) || 0;
  } catch (error) {
    return 0;
  }
}

function saveHighScore() {
  try {
    window.localStorage.setItem(STORAGE_KEY, String(state.highScore));
  } catch (error) {
    // Ignore storage issues and keep the game playable.
  }
}

function createStars() {
  return Array.from({ length: 64 }, () => ({
    x: Math.random() * GAME_WIDTH,
    y: Math.random() * GAME_HEIGHT,
    size: Math.random() > 0.75 ? 4 : 2,
    layer: Math.random() > 0.55 ? 1.2 : 0.6
  }));
}

function createBackgroundPlanets() {
  return Array.from({ length: 4 }, (_, index) => ({
    x: 260 + index * 220,
    y: 90 + Math.random() * 320,
    radius: 18 + Math.random() * 24,
    hue: index % 2 === 0 ? "#ffc46a" : "#67b8ff",
    alpha: 0.18 + Math.random() * 0.18
  }));
}

function updateHighScoreLabels() {
  menuHighScore.textContent = state.highScore;
  hudHighScore.textContent = state.highScore;
}

function renderHearts() {
  heartContainer.innerHTML = "";
  for (let index = 0; index < 3; index += 1) {
    const heart = document.createElement("span");
    heart.className = `heart${index >= state.lives ? " lost" : ""}`;
    heart.setAttribute("aria-hidden", "true");
    heartContainer.appendChild(heart);
  }
}

function setSelectedCharacter(characterKey) {
  state.selectedCharacter = characterKey;
  document.querySelectorAll(".character-card").forEach((card) => {
    card.classList.toggle("selected", card.dataset.character === characterKey);
  });
}

function showScreen(target) {
  selectScreen.classList.toggle("screen-active", target === "select");
  gameScreen.classList.toggle("screen-active", target === "game");
}

function drawPreview(canvasNode, sprite) {
  const previewContext = canvasNode.getContext("2d");
  previewContext.imageSmoothingEnabled = false;
  previewContext.clearRect(0, 0, canvasNode.width, canvasNode.height);
  drawSprite(previewContext, sprite, 18, 16, 6);
}

function drawSprite(targetContext, sprite, x, y, scale) {
  sprite.map.forEach((row, rowIndex) => {
    row.split("").forEach((pixel, columnIndex) => {
      if (pixel === ".") {
        return;
      }
      targetContext.fillStyle = sprite.colors[pixel];
      targetContext.fillRect(x + columnIndex * scale, y + rowIndex * scale, scale, scale);
    });
  });
}

function startGame() {
  state.running = true;
  state.lastTime = 0;
  state.score = 0;
  state.scoreAtRoundStart = state.highScore;
  state.lives = 3;
  state.invulnerableTimer = 0;
  state.flashTimer = 0;
  state.spawnTimer = 0;
  state.nextSpawnDelay = 0.9;
  state.player.y = GAME_HEIGHT / 2;
  state.obstacles = [];

  scoreValue.textContent = "0";
  speedValue.textContent = "100%";
  renderHearts();
  updateHighScoreLabels();
  overlay.classList.add("hidden");
  showScreen("game");

  if (state.animationId) {
    cancelAnimationFrame(state.animationId);
  }
  state.animationId = requestAnimationFrame(gameLoop);
}

function endGame() {
  state.running = false;
  cancelAnimationFrame(state.animationId);
  state.animationId = 0;

  const roundedScore = Math.floor(state.score);
  const isRecord = roundedScore > state.scoreAtRoundStart;
  overlayTitle.textContent = isRecord ? "New High Score" : "Game Over";
  overlaySummary.textContent = isRecord
    ? `You reached ${roundedScore} points and set a new all-time record.`
    : `Your final score is ${roundedScore}. High score: ${state.highScore}.`;
  overlay.classList.remove("hidden");
}

function createObstacle() {
  const profile = obstacleProfiles[Math.floor(Math.random() * obstacleProfiles.length)];
  const margin = 48;
  const y = margin + Math.random() * (GAME_HEIGHT - profile.height - margin * 2);

  state.obstacles.push({
    ...profile,
    x: GAME_WIDTH + 40,
    y,
    wobble: Math.random() * Math.PI * 2,
    pulse: 0.4 + Math.random() * 0.8,
    hit: false
  });
}

function updatePlayer(delta, boostMultiplier) {
  const moveSpeed = 310;
  if (state.keys.up) {
    state.player.y -= moveSpeed * delta;
  }
  if (state.keys.down) {
    state.player.y += moveSpeed * delta;
  }
  state.player.y += Math.sin(performance.now() / 170) * 0.22;

  const minY = 20;
  const maxY = GAME_HEIGHT - state.player.height - 20;
  state.player.y = Math.max(minY, Math.min(maxY, state.player.y));

  const pointsGain = delta * 28 * boostMultiplier;
  state.score += pointsGain;
  const roundedScore = Math.floor(state.score);
  scoreValue.textContent = roundedScore;

  if (roundedScore > state.highScore) {
    state.highScore = roundedScore;
    saveHighScore();
    updateHighScoreLabels();
  }
}

function updateObstacles(delta, speed) {
  state.spawnTimer += delta;
  const difficultyAdjust = Math.min(state.score / 1400, 0.35);
  if (state.spawnTimer >= state.nextSpawnDelay - difficultyAdjust) {
    state.spawnTimer = 0;
    state.nextSpawnDelay = 0.62 + Math.random() * 0.55;
    createObstacle();
  }

  state.obstacles = state.obstacles.filter((obstacle) => obstacle.x + obstacle.width > -120);

  state.obstacles.forEach((obstacle) => {
    obstacle.wobble += delta * obstacle.pulse;
    obstacle.x -= (speed + obstacle.bonusSpeed) * delta;
    obstacle.y += Math.sin(obstacle.wobble) * obstacle.drift * delta;

    if (!obstacle.hit && isColliding(playerHitbox(), obstacleHitbox(obstacle))) {
      obstacle.hit = true;
      registerHit();
    }
  });
}

function registerHit() {
  if (state.invulnerableTimer > 0) {
    return;
  }
  state.lives -= 1;
  state.invulnerableTimer = 1.25;
  state.flashTimer = 0.35;
  renderHearts();

  if (state.lives <= 0) {
    endGame();
  }
}

function playerHitbox() {
  return {
    x: state.player.x + 10,
    y: state.player.y + 10,
    width: state.player.width - 18,
    height: state.player.height - 18
  };
}

function obstacleHitbox(obstacle) {
  return {
    x: obstacle.x + 8,
    y: obstacle.y + 8,
    width: obstacle.width - 16,
    height: obstacle.height - 16
  };
}

function isColliding(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function gameLoop(timestamp) {
  if (!state.running) {
    return;
  }

  if (!state.lastTime) {
    state.lastTime = timestamp;
  }

  const delta = Math.min((timestamp - state.lastTime) / 1000, 0.033);
  state.lastTime = timestamp;

  const boostMultiplier = state.keys.boost ? BOOST_MULTIPLIER : 1;
  const speed = BASE_SCROLL_SPEED * boostMultiplier;
  speedValue.textContent = `${Math.round(boostMultiplier * 100)}%`;

  if (state.invulnerableTimer > 0) {
    state.invulnerableTimer = Math.max(0, state.invulnerableTimer - delta);
  }
  if (state.flashTimer > 0) {
    state.flashTimer = Math.max(0, state.flashTimer - delta);
  }

  updatePlayer(delta, boostMultiplier);
  updateObstacles(delta, speed);
  render(speed);

  if (state.running) {
    state.animationId = requestAnimationFrame(gameLoop);
  }
}

function render(speed) {
  ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  drawBackground(speed);
  drawTrails(speed);
  drawObstacles();
  drawPlayer();
  drawForegroundGlow();
}

function drawBackground(speed) {
  const sky = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
  sky.addColorStop(0, "#0d1839");
  sky.addColorStop(0.55, "#0a1230");
  sky.addColorStop(1, "#060912");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  state.planets.forEach((planet, index) => {
    const shift = (performance.now() * 0.01 * (0.2 + index * 0.08)) % (GAME_WIDTH + 160);
    const drawX = planet.x - shift;
    ctx.globalAlpha = planet.alpha;
    ctx.fillStyle = planet.hue;
    ctx.beginPath();
    ctx.arc(drawX, planet.y, planet.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(255,255,255,0.18)";
    ctx.fillRect(drawX - planet.radius * 0.2, planet.y - 2, planet.radius * 1.4, 4);
    ctx.globalAlpha = 1;
  });

  state.stars.forEach((star) => {
    star.x -= speed * 0.02 * star.layer;
    if (star.x < -10) {
      star.x = GAME_WIDTH + 10;
      star.y = Math.random() * GAME_HEIGHT;
    }
    ctx.fillStyle = star.layer > 1 ? "#ffffff" : "#8eefff";
    ctx.fillRect(Math.round(star.x), Math.round(star.y), star.size, star.size);
  });

  for (let band = 0; band < 6; band += 1) {
    ctx.fillStyle = `rgba(124, 246, 255, ${0.015 + band * 0.01})`;
    ctx.fillRect(0, GAME_HEIGHT - 90 + band * 14, GAME_WIDTH, 2);
  }
}

function drawTrails(speed) {
  const lines = 14;
  const intensity = state.keys.boost ? 0.36 : 0.18;
  for (let index = 0; index < lines; index += 1) {
    const y = 32 + index * 34 + Math.sin((performance.now() / 220) + index) * 6;
    const width = 120 + index * 18;
    const offset = (performance.now() * 0.32 * (speed / BASE_SCROLL_SPEED) + index * 50) % (GAME_WIDTH + width);
    ctx.fillStyle = `rgba(255, 255, 255, ${intensity})`;
    ctx.fillRect(GAME_WIDTH - offset, y, width, 2);
  }
}

function drawObstacles() {
  state.obstacles.forEach((obstacle) => {
    if (obstacle.type === "rock") {
      drawRock(obstacle);
      return;
    }
    if (obstacle.type === "satellite") {
      drawSatellite(obstacle);
      return;
    }
    if (obstacle.type === "dust") {
      drawDustCloud(obstacle);
      return;
    }
    drawPlanetObstacle(obstacle);
  });
}

function drawRock(obstacle) {
  ctx.fillStyle = obstacle.colorB;
  ctx.fillRect(obstacle.x + 10, obstacle.y + 6, obstacle.width - 18, obstacle.height - 10);
  ctx.fillStyle = obstacle.colorA;
  ctx.fillRect(obstacle.x + 4, obstacle.y + 12, obstacle.width - 8, obstacle.height - 22);
  ctx.fillStyle = "rgba(255,255,255,0.18)";
  ctx.fillRect(obstacle.x + 16, obstacle.y + 16, 10, 8);
  ctx.fillRect(obstacle.x + 32, obstacle.y + 24, 8, 6);
}

function drawSatellite(obstacle) {
  ctx.fillStyle = obstacle.colorB;
  ctx.fillRect(obstacle.x + 24, obstacle.y + 8, obstacle.width - 48, obstacle.height - 16);
  ctx.fillRect(obstacle.x + 8, obstacle.y + 12, 14, obstacle.height - 24);
  ctx.fillRect(obstacle.x + obstacle.width - 22, obstacle.y + 12, 14, obstacle.height - 24);
  ctx.fillStyle = obstacle.colorA;
  ctx.fillRect(obstacle.x + 30, obstacle.y + 14, obstacle.width - 60, obstacle.height - 28);
  ctx.fillRect(obstacle.x + 2, obstacle.y + 18, 18, obstacle.height - 36);
  ctx.fillRect(obstacle.x + obstacle.width - 20, obstacle.y + 18, 18, obstacle.height - 36);
  ctx.fillStyle = "#ffbf47";
  ctx.fillRect(obstacle.x + obstacle.width / 2 - 6, obstacle.y + obstacle.height / 2 - 6, 12, 12);
}

function drawDustCloud(obstacle) {
  ctx.fillStyle = obstacle.colorA;
  ctx.fillRect(obstacle.x + 6, obstacle.y + 10, obstacle.width - 16, obstacle.height - 20);
  ctx.fillStyle = obstacle.colorB;
  ctx.fillRect(obstacle.x, obstacle.y + 18, obstacle.width - 10, obstacle.height - 26);
  ctx.fillRect(obstacle.x + 20, obstacle.y + 4, obstacle.width - 28, obstacle.height - 22);
}

function drawPlanetObstacle(obstacle) {
  ctx.fillStyle = obstacle.colorB;
  ctx.beginPath();
  ctx.arc(obstacle.x + obstacle.width / 2, obstacle.y + obstacle.height / 2, obstacle.width / 2.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = obstacle.colorA;
  ctx.beginPath();
  ctx.arc(obstacle.x + obstacle.width / 2 - 6, obstacle.y + obstacle.height / 2 - 5, obstacle.width / 2.8, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(255, 239, 190, 0.45)";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.ellipse(obstacle.x + obstacle.width / 2, obstacle.y + obstacle.height / 2 + 2, obstacle.width / 1.4, obstacle.height / 5, 0.15, 0, Math.PI * 2);
  ctx.stroke();
}

function drawPlayer() {
  const sprite = spriteCatalog[state.selectedCharacter];
  const isBlinking = state.invulnerableTimer > 0 && Math.floor(state.invulnerableTimer * 12) % 2 === 0;
  if (isBlinking) {
    return;
  }

  const glowColors = {
    spaceship: "rgba(124, 246, 255, 0.3)",
    rocket: "rgba(255, 122, 72, 0.32)",
    angel: "rgba(255, 215, 106, 0.32)"
  };

  ctx.save();
  ctx.shadowBlur = 18;
  ctx.shadowColor = glowColors[state.selectedCharacter];
  drawSprite(ctx, sprite, state.player.x, state.player.y, PLAYER_SCALE);
  ctx.restore();

  if (state.selectedCharacter === "rocket" || state.selectedCharacter === "spaceship") {
    const flameLength = state.keys.boost ? 24 : 14;
    ctx.fillStyle = "#ffcb57";
    ctx.fillRect(state.player.x - flameLength, state.player.y + 19, flameLength - 6, 6);
    ctx.fillStyle = "#ff7a48";
    ctx.fillRect(state.player.x - flameLength - 6, state.player.y + 21, flameLength, 4);
  }

  if (state.selectedCharacter === "angel") {
    ctx.fillStyle = "rgba(255, 244, 170, 0.55)";
    ctx.fillRect(state.player.x + 14, state.player.y - 8, 14, 4);
  }
}

function drawForegroundGlow() {
  if (state.flashTimer <= 0) {
    return;
  }
  ctx.fillStyle = `rgba(255, 95, 122, ${state.flashTimer})`;
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
}

function bindEvents() {
  document.querySelectorAll(".character-card").forEach((card) => {
    card.addEventListener("click", () => setSelectedCharacter(card.dataset.character));
  });

  startButton.addEventListener("click", startGame);
  restartButton.addEventListener("click", startGame);
  backButton.addEventListener("click", () => {
    state.running = false;
    cancelAnimationFrame(state.animationId);
    state.animationId = 0;
    overlay.classList.add("hidden");
    showScreen("select");
  });

  window.addEventListener("keydown", (event) => {
    if (["ArrowUp", "ArrowDown", "ArrowRight", "Space"].includes(event.key)) {
      event.preventDefault();
    }

    if (event.key === "ArrowUp" || event.key.toLowerCase() === "w") {
      state.keys.up = true;
    }
    if (event.key === "ArrowDown" || event.key.toLowerCase() === "s") {
      state.keys.down = true;
    }
    if (event.key === "ArrowRight") {
      state.keys.boost = true;
    }
  });

  window.addEventListener("keyup", (event) => {
    if (event.key === "ArrowUp" || event.key.toLowerCase() === "w") {
      state.keys.up = false;
    }
    if (event.key === "ArrowDown" || event.key.toLowerCase() === "s") {
      state.keys.down = false;
    }
    if (event.key === "ArrowRight") {
      state.keys.boost = false;
    }
  });
}

function init() {
  Object.entries(spriteCatalog).forEach(([key, sprite]) => {
    const previewCanvas = document.querySelector(`[data-preview="${key}"]`);
    drawPreview(previewCanvas, sprite);
  });

  bindEvents();
  setSelectedCharacter(state.selectedCharacter);
  updateHighScoreLabels();
  renderHearts();
  render(BASE_SCROLL_SPEED);
}

init();
