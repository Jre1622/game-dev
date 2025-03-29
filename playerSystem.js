import * as THREE from "three";
import { PLAYER_RADIUS, GROUND_SIZE, MAX_PLAYER_HEALTH, PLAYER_SPEED } from "./config.js";

export class PlayerSystem {
  constructor(gameState) {
    this.gameState = gameState;
    this.uiManager = null; // Will be set after UIManager is created
  }

  setUIManager(uiManager) {
    this.uiManager = uiManager;
  }

  setupPlayer() {
    const geometry = new THREE.SphereGeometry(PLAYER_RADIUS, 16, 16);
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    this.gameState.player = new THREE.Mesh(geometry, material);
    this.gameState.player.position.set(0, PLAYER_RADIUS, 0);
    this.gameState.player.radius = PLAYER_RADIUS;
    this.gameState.scene.add(this.gameState.player);
  }

  updatePlayerMovement() {
    if (!this.gameState.player) return;

    const moveDirection = new THREE.Vector3();

    if (this.gameState.keysPressed["w"] || this.gameState.keysPressed["ArrowUp"]) {
      moveDirection.z -= 1;
    }
    if (this.gameState.keysPressed["s"] || this.gameState.keysPressed["ArrowDown"]) {
      moveDirection.z += 1;
    }
    if (this.gameState.keysPressed["a"] || this.gameState.keysPressed["ArrowLeft"]) {
      moveDirection.x -= 1;
    }
    if (this.gameState.keysPressed["d"] || this.gameState.keysPressed["ArrowRight"]) {
      moveDirection.x += 1;
    }

    if (moveDirection.length() > 0) {
      moveDirection.normalize();
    }

    const currentSpeed = this.gameState.playerAttributes.moveSpeed + (this.gameState.playerSpeedBoost || 0);
    this.gameState.player.position.x += moveDirection.x * currentSpeed;
    this.gameState.player.position.z += moveDirection.z * currentSpeed;

    const halfGround = GROUND_SIZE / 2;
    this.gameState.player.position.x = Math.max(-halfGround, Math.min(halfGround, this.gameState.player.position.x));
    this.gameState.player.position.z = Math.max(-halfGround, Math.min(halfGround, this.gameState.player.position.z));
  }

  damagePlayer(amount) {
    this.gameState.playerHealth -= amount;
    this.flashPlayer();

    // Show damage number
    this.showDamageNumber(amount);

    console.log(`Player took damage! Health: ${this.gameState.playerHealth}`);
    if (this.gameState.playerHealth <= 0) {
      this.gameState.isGameOver = true;
      console.log("Game Over!");

      // Show game over UI if uiManager is available
      if (this.uiManager) {
        this.uiManager.showGameOver();
      }

      return true;
    }
    return false;
  }

  showDamageNumber(amount) {
    if (!this.gameState.player) return;

    // Create a div for the damage number
    const damageElement = document.createElement("div");
    damageElement.textContent = `-${Math.round(amount)}`;
    damageElement.style.position = "absolute";
    damageElement.style.fontWeight = "bold";
    damageElement.style.fontSize = "20px";
    damageElement.style.color = "#ff3333";
    damageElement.style.textShadow = "1px 1px 2px black";
    damageElement.style.zIndex = "100";
    document.body.appendChild(damageElement);

    // Get the screen position of the player
    const vector = new THREE.Vector3();
    vector.setFromMatrixPosition(this.gameState.player.matrixWorld);

    // Project the 3D position to 2D screen space
    const widthHalf = window.innerWidth / 2;
    const heightHalf = window.innerHeight / 2;
    vector.project(window.gameState.camera);
    vector.x = vector.x * widthHalf + widthHalf;
    vector.y = -(vector.y * heightHalf) + heightHalf;

    // Add some random offset so multiple hits don't stack exactly
    const randomOffsetX = (Math.random() - 0.5) * 50;
    const randomOffsetY = (Math.random() - 0.5) * 30;

    // Position the damage number
    damageElement.style.left = `${vector.x + randomOffsetX}px`;
    damageElement.style.top = `${vector.y + randomOffsetY}px`;

    // Animate the damage number floating up and fading out
    let opacity = 1;
    let posY = parseInt(damageElement.style.top);
    const fadeInterval = setInterval(() => {
      opacity -= 0.05;
      posY -= 1;
      damageElement.style.opacity = opacity;
      damageElement.style.top = `${posY}px`;

      if (opacity <= 0) {
        clearInterval(fadeInterval);
        document.body.removeChild(damageElement);
      }
    }, 30);
  }

  flashPlayer() {
    if (this.gameState.player) {
      const originalColor = this.gameState.player.material.color.getHex();
      this.gameState.player.material.color.set(0xff0000);
      setTimeout(() => {
        this.gameState.player.material.color.set(originalColor);
      }, 100);
    }
  }

  checkLevelUp() {
    const xpNeeded = this.gameState.getXpToNextLevel(this.gameState.playerLevel);
    if (this.gameState.playerXp >= xpNeeded) {
      this.gameState.playerXp -= xpNeeded; // Carry over excess XP instead of resetting to 0
      this.gameState.playerLevel++;

      // Apply random attribute boost
      this.applyRandomAttributeBoost();

      console.log(`Leveled up to ${this.gameState.playerLevel}!`);
      return true;
    }
    return false;
  }

  applyRandomAttributeBoost() {
    // Define attributes and their boost values (simplified to flat increases)
    const attributeBoosts = {
      maxHealth: 5, // +5 health points
      moveSpeed: PLAYER_SPEED * 0.01, // +1% speed (0.001 is 1% of 0.1)
      baseDamage: 1, // +1 damage point
      critChance: 1, // +1% crit chance
    };

    // Get all available attributes
    const attributes = Object.keys(attributeBoosts);

    // Select a random attribute to boost
    const randomIndex = Math.floor(Math.random() * attributes.length);
    const selectedAttribute = attributes[randomIndex];
    const boostAmount = attributeBoosts[selectedAttribute];

    // Apply the boost to the selected attribute
    this.gameState.playerAttributes[selectedAttribute] += boostAmount;

    // Store the last boosted attribute for UI display
    this.gameState.lastLevelUpAttribute = {
      name: selectedAttribute,
      amount: boostAmount,
    };

    // Special handling for maxHealth (heal player when max health increases)
    if (selectedAttribute === "maxHealth") {
      this.gameState.playerHealth += boostAmount;
    }

    console.log(`Attribute boost: ${selectedAttribute} +${boostAmount}`);
  }
}
