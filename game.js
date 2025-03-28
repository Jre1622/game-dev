import * as THREE from "three";
import { Gun } from "./gun.js";
import { Enemy } from "./enemy.js";
import { Item } from "./item.js";
import { XpGem } from "./xpGem.js";

// --- Configuration ---
const PLAYER_SPEED = 0.1;
const ENEMY_SPEED = 0.03;
const CAMERA_VIEW_HEIGHT = 15;
const GROUND_SIZE = 100;
const SPAWN_INTERVAL = 1.0;
const SPAWN_DISTANCE = 15;
const PLAYER_RADIUS = 0.5;
const ENEMY_RADIUS = 0.5;
const COLLISION_THRESHOLD_PLAYER = PLAYER_RADIUS + ENEMY_RADIUS;
const COLLISION_THRESHOLD_ENEMY = ENEMY_RADIUS + ENEMY_RADIUS;
const ENEMY_SEPARATION_FORCE = 0.02;
const PLAYER_KNOCKBACK_FORCE = 0.05;
const PLAYER_PUSH_FORCE = 0.06;
const MAX_PLAYER_HEALTH = 100;
const WAVE_DURATION = 30; // seconds
const WAVE_BREAK = 5; // seconds between waves
const BASE_ENEMIES_PER_WAVE = 5;

const enemyTypes = {
  basic: {
    name: "basic",
    health: 10,
    speed: 0.03,
    color: 0xff0000,
    radius: ENEMY_RADIUS,
    scoreValue: 10,
    damage: 10,
  },
  fast: {
    name: "fast",
    health: 5,
    speed: 0.05,
    color: 0x0000ff,
    radius: ENEMY_RADIUS,
    scoreValue: 15,
    damage: 5,
  },
  tank: {
    name: "tank",
    health: 20,
    speed: 0.02,
    color: 0x00ff00,
    radius: ENEMY_RADIUS,
    scoreValue: 20,
    damage: 15,
  },
};

// --- Global Game State ---
let scene, camera, renderer;
let player;
let groundPlane;
let enemies = [];
let keysPressed = {};
let clock = new THREE.Clock();
let lastSpawnTime = 0;
let mouseWorldPosition = new THREE.Vector3();
let raycaster = new THREE.Raycaster();
let pointer = new THREE.Vector2();
let playerGun;
let playerHealth = MAX_PLAYER_HEALTH;
let isGameOver = false;
let score = 0;
let currentWave = 1;
let waveTimer = 0;
let isWaveBreak = false;
let waveBreakTimer = 0;
let items = [];
let playerDamageBoost = 0;
let playerSpeedBoost = 0;
let xpGems = [];
let playerXp = 0;
let playerLevel = 1;
let gameStartTime = 0;
let elapsedTime = 0;
let audioListener, backgroundMusic;

// --- Initialization ---
function init() {
  setupScene();
  setupRenderer();
  setupCamera();
  setupGround();
  setupPlayer();
  setupGun();
  setupInputListeners();
  setupResizeListener();
  setupAudio();
  animate();
  console.log("Game Initialized with Modular Gun");
}

// --- Core Setup Functions ---
function setupScene() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1a1a1a);
}

function setupRenderer() {
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);
}

function setupCamera() {
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, CAMERA_VIEW_HEIGHT, 0);
  camera.lookAt(0, 0, 0);
}

function setupGround() {
  const groundGeometry = new THREE.PlaneGeometry(GROUND_SIZE, GROUND_SIZE);
  const groundMaterial = new THREE.MeshBasicMaterial({
    color: 0x333333,
    side: THREE.DoubleSide,
  });
  groundPlane = new THREE.Mesh(groundGeometry, groundMaterial);
  groundPlane.rotation.x = -Math.PI / 2;
  scene.add(groundPlane);
}

// --- Game Object Setup Functions ---
function setupPlayer() {
  const geometry = new THREE.SphereGeometry(PLAYER_RADIUS, 16, 16);
  const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
  player = new THREE.Mesh(geometry, material);
  player.position.set(0, PLAYER_RADIUS, 0);
  player.radius = PLAYER_RADIUS;
  scene.add(player);
}

function setupGun() {
  playerGun = new Gun(scene, ENEMY_RADIUS);
}

// --- Listener Setup ---
function setupInputListeners() {
  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("keydown", (event) => {
    keysPressed[event.key.toLowerCase()] = true;
  });
  window.addEventListener("keyup", (event) => {
    keysPressed[event.key.toLowerCase()] = false;
  });
}

function onPointerMove(event) {
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

function onPointerDown(event) {
  if (event.button === 0 && playerGun) {
    const aimDirection = mouseWorldPosition.clone().sub(player.position);
    playerGun.tryShoot(clock.getElapsedTime(), player.position, aimDirection);
  }
}

function setupResizeListener() {
  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}

// --- Weapon & Bullet Logic ---
function updateMouseWorldPosition() {
  if (!camera || !groundPlane) return;
  raycaster.setFromCamera(pointer, camera);
  const intersects = raycaster.intersectObject(groundPlane);
  if (intersects.length > 0) {
    mouseWorldPosition.copy(intersects[0].point);
    mouseWorldPosition.y = PLAYER_RADIUS;
  }
}

// --- Enemy Logic ---
function spawnEnemy() {
  // Calculate spawn position outside view
  const angle = Math.random() * Math.PI * 2;
  const distance = SPAWN_DISTANCE + Math.random() * 5;
  const x = Math.cos(angle) * distance;
  const z = Math.sin(angle) * distance;
  const position = new THREE.Vector3(x, ENEMY_RADIUS, z);

  // Randomly select enemy type
  const typeKeys = Object.keys(enemyTypes);
  const randomType = enemyTypes[typeKeys[Math.floor(Math.random() * typeKeys.length)]];

  try {
    const enemy = new Enemy(scene, randomType, position);
    enemies.push(enemy);
    return enemy;
  } catch (error) {
    console.error("Failed to spawn enemy:", error);
    return null;
  }
}

function damagePlayer(amount) {
  playerHealth -= amount;
  flashPlayer();
  console.log(`Player took damage! Health: ${playerHealth}`);
  if (playerHealth <= 0) {
    isGameOver = true;
    document.getElementById("game-over").style.display = "block";
    console.log("Game Over!");
  }
}

function updateEnemies() {
  if (!player) return;
  const currentTime = clock.getElapsedTime();

  // Debug logging
  if (enemies.some((e) => e === undefined)) {
    console.warn("Undefined enemies detected:", enemies);
  }

  for (let i = enemies.length - 1; i >= 0; i--) {
    const enemy = enemies[i];

    // More comprehensive check
    if (!enemy || !enemy.mesh || typeof enemy.update !== "function") {
      console.warn(`Invalid enemy at index ${i}:`, enemy);
      enemies.splice(i, 1); // Remove invalid enemy
      continue;
    }

    try {
      const damage = enemy.update(player, currentTime);
      if (damage > 0) {
        damagePlayer(damage);
      }

      // Enemy separation logic
      for (let j = enemies.length - 1; j >= 0; j--) {
        const otherEnemy = enemies[j];
        if (!otherEnemy || enemy === otherEnemy) continue;

        const distance = enemy.mesh.position.distanceTo(otherEnemy.mesh.position);
        if (distance < COLLISION_THRESHOLD_ENEMY) {
          const separationDirection = new THREE.Vector3().subVectors(enemy.mesh.position, otherEnemy.mesh.position).normalize();
          enemy.mesh.position.addScaledVector(separationDirection, ENEMY_SEPARATION_FORCE);
        }
      }
    } catch (error) {
      console.error(`Error updating enemy at index ${i}:`, error);
      enemies.splice(i, 1); // Remove problematic enemy
    }
  }
}

function flashPlayer() {
  if (player) {
    const originalColor = player.material.color.getHex();
    player.material.color.set(0xff0000);
    setTimeout(() => {
      player.material.color.set(originalColor);
    }, 100);
  }
}

function updateHealthBar() {
  const healthBar = document.getElementById("health-bar");
  const healthText = document.getElementById("health-text");
  if (healthBar && healthText) {
    const healthPercentage = Math.max(0, (playerHealth / MAX_PLAYER_HEALTH) * 100);
    healthBar.style.width = `${healthPercentage}%`;
    healthBar.style.backgroundColor = healthPercentage > 50 ? "#0f0" : healthPercentage > 20 ? "#ff0" : "#f00";
    healthText.textContent = `${Math.round(healthPercentage)}%`;
  }
}

// --- Player & Camera Update Logic ---
function updatePlayerMovement() {
  if (!player) return;

  const moveDirection = new THREE.Vector3();

  if (keysPressed["w"] || keysPressed["ArrowUp"]) {
    moveDirection.z -= 1;
  }
  if (keysPressed["s"] || keysPressed["ArrowDown"]) {
    moveDirection.z += 1;
  }
  if (keysPressed["a"] || keysPressed["ArrowLeft"]) {
    moveDirection.x -= 1;
  }
  if (keysPressed["d"] || keysPressed["ArrowRight"]) {
    moveDirection.x += 1;
  }

  if (moveDirection.length() > 0) {
    moveDirection.normalize();
  }

  const currentSpeed = PLAYER_SPEED + (playerSpeedBoost || 0);
  player.position.x += moveDirection.x * currentSpeed;
  player.position.z += moveDirection.z * currentSpeed;

  const halfGround = GROUND_SIZE / 2;
  player.position.x = Math.max(-halfGround, Math.min(halfGround, player.position.x));
  player.position.z = Math.max(-halfGround, Math.min(halfGround, player.position.z));
}

function updateCameraFollow() {
  if (player) {
    camera.position.set(player.position.x, CAMERA_VIEW_HEIGHT, player.position.z);
    camera.lookAt(player.position.x, 0, player.position.z);
  }
}

// --- Main Game Loop & Update ---
function animate() {
  requestAnimationFrame(animate);
  const elapsedTime = clock.getElapsedTime();
  update(elapsedTime);
  renderer.render(scene, camera);
}

function update(elapsedTime) {
  if (isGameOver) return;

  updateWaveSystem(elapsedTime);
  updateMouseWorldPosition();
  updatePlayerMovement();
  updateEnemies();
  updateItems();
  updateXpGems();

  if (playerGun) {
    const hitEnemyIndices = playerGun.update(elapsedTime, enemies) || [];
    hitEnemyIndices.sort((a, b) => b - a);
    hitEnemyIndices.forEach((index) => {
      spawnXpGem(enemies[index].mesh.position, enemies[index].scoreValue);
      enemies.splice(index, 1);
    });
  }

  updateCameraFollow();
  updateHealthBar();
  updateScoreDisplay();
  updateTimer();
  updateLevelUI();
}

function updateScoreDisplay() {
  const scoreElement = document.getElementById("score");
  const waveElement = document.getElementById("wave-info");
  const statsElement = document.getElementById("player-stats");

  if (scoreElement) scoreElement.textContent = `Score: ${score}`;
  if (waveElement) waveElement.textContent = `Wave: ${currentWave}${isWaveBreak ? " (Break)" : ""}`;
  if (statsElement) {
    statsElement.innerHTML = `
      <div>Damage: +${playerDamageBoost}</div>
      <div>Speed: +${Math.round((playerSpeedBoost / PLAYER_SPEED) * 100)}%</div>
    `;
  }
}

function updateWaveSystem(elapsedTime) {
  if (isWaveBreak) {
    waveBreakTimer += clock.getDelta();
    if (waveBreakTimer >= WAVE_BREAK) {
      isWaveBreak = false;
      waveBreakTimer = 0;
      currentWave++;
      console.log(`Starting Wave ${currentWave}`);
    }
    return;
  }

  waveTimer += clock.getDelta();
  if (waveTimer >= WAVE_DURATION) {
    isWaveBreak = true;
    waveTimer = 0;
    console.log(`Wave ${currentWave} complete! Preparing next wave...`);
    return;
  }

  // Spawn enemies during wave
  if (shouldSpawnEnemy(elapsedTime)) {
    const enemiesToSpawn = Math.min(currentWave, 3); // Cap at 3 enemies per spawn
    for (let i = 0; i < enemiesToSpawn; i++) {
      spawnEnemy();
    }
    lastSpawnTime = elapsedTime;
  }
}

function shouldSpawnEnemy(elapsedTime) {
  return elapsedTime - lastSpawnTime > SPAWN_INTERVAL;
}

function updateItems() {
  for (let i = items.length - 1; i >= 0; i--) {
    const item = items[i];
    if (player.position.distanceTo(item.mesh.position) < PLAYER_RADIUS + 0.3) {
      const effects = item.applyEffect();
      if (effects.health) {
        playerHealth = Math.min(playerHealth + effects.health, MAX_PLAYER_HEALTH);
      }
      if (effects.damageBoost) {
        playerDamageBoost += effects.damageBoost;
      }
      if (effects.speedBoost) {
        playerSpeedBoost += effects.speedBoost;
      }
      items.splice(i, 1);
    }
  }
}

function spawnItem(position) {
  const itemTypes = ["health", "damage", "speed"];
  const type = itemTypes[Math.floor(Math.random() * itemTypes.length)];
  const item = new Item(scene, type, position);
  items.push(item);
}

function spawnXpGem(position, value) {
  if (!position || value <= 0) return;

  try {
    const xpGem = new XpGem(scene, position, value);
    xpGems.push(xpGem);
  } catch (error) {
    console.error("Failed to spawn XP gem:", error);
  }
}

function updateXpGems() {
  for (let i = xpGems.length - 1; i >= 0; i--) {
    const gem = xpGems[i];
    if (player.position.distanceTo(gem.mesh.position) < PLAYER_RADIUS + 0.3) {
      playerXp += gem.value;
      score += gem.value;
      scene.remove(gem.mesh);
      xpGems.splice(i, 1);
      checkLevelUp();
    }
  }
}

function checkLevelUp() {
  const xpNeeded = getXpToNextLevel(playerLevel);
  if (playerXp >= xpNeeded) {
    playerXp -= xpNeeded; // Carry over excess XP instead of resetting to 0
    playerLevel++;
    playerHealth = Math.min(playerHealth + 10, MAX_PLAYER_HEALTH);
    playerDamageBoost += 1;
    console.log(`Leveled up to ${playerLevel}!`);
  }
}

function getXpToNextLevel(currentLevel) {
  // Base 100 XP + 20 per level (same as before)
  return 100 + currentLevel * 20;
}

function updateTimer() {
  elapsedTime = clock.getElapsedTime();
  const minutes = Math.floor(elapsedTime / 60)
    .toString()
    .padStart(2, "0");
  const seconds = Math.floor(elapsedTime % 60)
    .toString()
    .padStart(2, "0");
  document.getElementById("timer").textContent = `${minutes}:${seconds}`;
}

function updateLevelUI() {
  const xpNeeded = getXpToNextLevel(playerLevel);
  const progress = (playerXp / xpNeeded) * 100;
  document.getElementById("level-progress").style.width = `${Math.min(progress, 100)}%`;
  document.getElementById("level-text").textContent = `Lvl ${playerLevel}`;
}

function setupAudio() {
  audioListener = new THREE.AudioListener();
  camera.add(audioListener);

  backgroundMusic = new THREE.Audio(audioListener);
  const audioLoader = new THREE.AudioLoader();
  audioLoader.load("replicate-prediction-jmzwr3ywedrj40cnv1nr29e18w.mp3", (buffer) => {
    backgroundMusic.setBuffer(buffer);
    backgroundMusic.setLoop(true);
    backgroundMusic.setVolume(0.5); // Adjust volume as needed
    backgroundMusic.play();
  });
}

// --- Start the application ---
init();
