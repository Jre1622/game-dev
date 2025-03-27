import * as THREE from "three";
import { Gun } from "./gun.js";

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
  const geometry = new THREE.SphereGeometry(ENEMY_RADIUS, 16, 16);
  const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
  const enemy = new THREE.Mesh(geometry, material);
  const angle = Math.random() * Math.PI * 2;
  const distance = SPAWN_DISTANCE;
  enemy.position.set(player.position.x + Math.cos(angle) * distance, ENEMY_RADIUS, player.position.z + Math.sin(angle) * distance);
  scene.add(enemy);
  enemies.push(enemy);
}

function updateEnemies() {
  if (!player) return;
  enemies.forEach((enemy) => {
    const direction = new THREE.Vector3().subVectors(player.position, enemy.position).normalize();
    enemy.position.addScaledVector(direction, ENEMY_SPEED);

    const distanceToPlayer = enemy.position.distanceTo(player.position);
    if (distanceToPlayer < COLLISION_THRESHOLD_PLAYER) {
      playerHealth -= 10;
      flashPlayer();
      console.log(`Player took damage! Health: ${playerHealth}`);
      if (playerHealth <= 0) {
        console.log("Player died!");
        // TODO: Add game over logic
      }
    }
    enemies.forEach((otherEnemy) => {
      if (enemy !== otherEnemy) {
        const distance = enemy.position.distanceTo(otherEnemy.position);
        if (distance < COLLISION_THRESHOLD_ENEMY) {
          const separationDirection = new THREE.Vector3().subVectors(enemy.position, otherEnemy.position).normalize();
          enemy.position.addScaledVector(separationDirection, ENEMY_SEPARATION_FORCE);
        }
      }
    });
  });
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

  player.position.x += moveDirection.x * PLAYER_SPEED;
  player.position.z += moveDirection.z * PLAYER_SPEED;

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
  updateMouseWorldPosition();
  updatePlayerMovement();
  updateEnemies();

  if (playerGun) {
    const hitEnemyIndices = playerGun.update(elapsedTime, enemies) || [];
    removeHitEnemies(hitEnemyIndices);
  }

  if (shouldSpawnEnemy(elapsedTime)) {
    spawnEnemy();
    lastSpawnTime = elapsedTime;
  }

  updateCameraFollow();
  updateHealthBar();
}

function removeHitEnemies(indices) {
  if (!indices || !Array.isArray(indices)) return;

  indices
    .sort((a, b) => b - a)
    .forEach((index) => {
      if (enemies[index]) {
        scene.remove(enemies[index]);
        enemies.splice(index, 1);
      }
    });
}

function shouldSpawnEnemy(elapsedTime) {
  return elapsedTime - lastSpawnTime > SPAWN_INTERVAL;
}

// --- Start the application ---
init();
