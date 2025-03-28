import * as THREE from "three";
import { MAX_PLAYER_HEALTH } from "./config.js";

export class GameState {
  constructor() {
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.player = null;
    this.groundPlane = null;
    this.enemies = [];
    this.items = [];
    this.xpGems = [];
    this.playerGun = null;
    this.playerHealth = MAX_PLAYER_HEALTH;
    this.isGameOver = false;
    this.score = 0;
    this.playerDamageBoost = 0;
    this.playerSpeedBoost = 0;
    this.playerXp = 0;
    this.playerLevel = 1;
    this.elapsedTime = 0;
    this.keysPressed = {};
    this.clock = new THREE.Clock();
    this.lastSpawnTime = 0;
    this.mouseWorldPosition = new THREE.Vector3();
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.audioListener = null;
    this.backgroundMusic = null;
  }

  setupClock() {
    this.clock = new THREE.Clock();
    return this.clock;
  }

  getElapsedTime() {
    return this.clock.getElapsedTime();
  }

  getDeltaTime() {
    return this.clock.getDelta();
  }

  resetClock() {
    this.clock.start();
  }

  getXpToNextLevel(currentLevel) {
    // Base 100 XP + 20 per level
    return 100 + currentLevel * 20;
  }
}
