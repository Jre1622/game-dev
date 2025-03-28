import * as THREE from "three";
import { Gun } from "./gun.js";
import { Director } from "./director.js";
import { ENEMY_RADIUS } from "./config.js";

// Import our new modules
import { GameState } from "./gameState.js";
import { UIManager } from "./uiManager.js";
import { PlayerSystem } from "./playerSystem.js";
import { CollisionSystem } from "./collisionSystem.js";
import { SceneManager } from "./sceneManager.js";
import { SpawnSystem } from "./spawnSystem.js";
import { InputHandler } from "./inputHandler.js";

// Main game instance and systems
let gameState, uiManager, playerSystem, collisionSystem, sceneManager, spawnSystem, inputHandler;

// --- Initialization ---
function init() {
  // Create the game state to hold all data
  gameState = new GameState();

  // Make gameState globally accessible for UI elements that need to project positions
  window.gameState = gameState;

  // Initialize all systems with the shared gameState
  uiManager = new UIManager(gameState);
  sceneManager = new SceneManager(gameState);
  playerSystem = new PlayerSystem(gameState);
  collisionSystem = new CollisionSystem(gameState, playerSystem);
  spawnSystem = new SpawnSystem(gameState);
  inputHandler = new InputHandler(gameState);

  // Connect systems that need to interact with each other
  playerSystem.setUIManager(uiManager);

  // Setup the game environment
  sceneManager.setupScene();
  sceneManager.setupRenderer();
  sceneManager.setupCamera();
  sceneManager.setupGround();

  // Setup the player and weapons
  playerSystem.setupPlayer();
  setupGun();

  // Setup user input
  inputHandler.setupInputListeners();
  sceneManager.setupResizeListener();

  // Setup audio
  sceneManager.setupAudio();

  // Setup game director
  gameState.director = new Director();

  // Start the game loop
  gameState.setupClock();
  animate();
  console.log("Game Initialized with Modular Structure");
}

// --- Game Object Setup Functions ---
function setupGun() {
  gameState.playerGun = new Gun(gameState.scene, gameState, ENEMY_RADIUS);
}

// --- Main Game Loop & Update ---
function animate() {
  requestAnimationFrame(animate);
  update();
  gameState.renderer.render(gameState.scene, gameState.camera);
}

function update() {
  if (gameState.isGameOver) return;

  // Get the frame time delta
  const deltaTime = gameState.getDeltaTime();
  const elapsedTime = gameState.getElapsedTime();

  // Update director
  gameState.director.update(deltaTime);

  // Update mouse position and player movement
  sceneManager.updateMouseWorldPosition();
  playerSystem.updatePlayerMovement();

  // Check for spawning new entities
  spawnSystem.checkSpawning();

  // Update items (floating animation)
  gameState.items.forEach((item) => {
    if (item.update) item.update(deltaTime);
  });

  // Update collisions
  collisionSystem.updateAllCollisions();

  // Update gun and bullets
  if (gameState.playerGun) {
    const hitEnemyIndices = gameState.playerGun.update(elapsedTime, gameState.enemies) || [];
    hitEnemyIndices.sort((a, b) => b - a);
    hitEnemyIndices.forEach((index) => {
      const enemy = gameState.enemies[index];
      // Spawn XP gem from defeated enemy
      spawnSystem.spawnXpGem(enemy.mesh.position, enemy.scoreValue);
      // Remove enemy
      gameState.enemies.splice(index, 1);
    });
  }

  // Update camera
  sceneManager.updateCameraFollow();

  // Update UI elements
  uiManager.updateAllUI();
}

// --- Start the application ---
init();
