import * as THREE from "three";
import { PLAYER_RADIUS, COLLISION_THRESHOLD_ENEMY, ENEMY_SEPARATION_FORCE, MAX_PLAYER_HEALTH } from "./config.js";

export class CollisionSystem {
  constructor(gameState, playerSystem) {
    this.gameState = gameState;
    this.playerSystem = playerSystem;
  }

  updateEnemyCollisions() {
    if (!this.gameState.player) return [];

    const currentTime = this.gameState.getElapsedTime();
    const damagedEnemies = [];

    // Debug logging
    if (this.gameState.enemies.some((e) => e === undefined)) {
      console.warn("Undefined enemies detected:", this.gameState.enemies);
    }

    for (let i = this.gameState.enemies.length - 1; i >= 0; i--) {
      const enemy = this.gameState.enemies[i];

      // More comprehensive check
      if (!enemy || !enemy.mesh || typeof enemy.update !== "function") {
        console.warn(`Invalid enemy at index ${i}:`, enemy);
        this.gameState.enemies.splice(i, 1); // Remove invalid enemy
        continue;
      }

      try {
        const damage = enemy.update(this.gameState.player, currentTime);
        if (damage > 0) {
          const gameOver = this.playerSystem.damagePlayer(damage);
          if (gameOver) {
            return damagedEnemies;
          }
        }

        // Enemy separation logic
        for (let j = this.gameState.enemies.length - 1; j >= 0; j--) {
          const otherEnemy = this.gameState.enemies[j];
          if (!otherEnemy || enemy === otherEnemy) continue;

          const distance = enemy.mesh.position.distanceTo(otherEnemy.mesh.position);
          if (distance < COLLISION_THRESHOLD_ENEMY) {
            const separationDirection = new THREE.Vector3().subVectors(enemy.mesh.position, otherEnemy.mesh.position).normalize();
            enemy.mesh.position.addScaledVector(separationDirection, ENEMY_SEPARATION_FORCE);
          }
        }
      } catch (error) {
        console.error(`Error updating enemy at index ${i}:`, error);
        this.gameState.enemies.splice(i, 1); // Remove problematic enemy
      }
    }

    return damagedEnemies;
  }

  updateItemCollisions() {
    for (let i = this.gameState.items.length - 1; i >= 0; i--) {
      const item = this.gameState.items[i];
      if (this.gameState.player.position.distanceTo(item.mesh.position) < PLAYER_RADIUS + 0.3) {
        const effects = item.applyEffect();

        // Only handle health effects now
        if (effects.health) {
          // Apply health effect
          this.gameState.playerHealth = Math.min(this.gameState.playerHealth + effects.health, this.gameState.playerAttributes.maxHealth);

          // Show a small floating text to indicate the health gain
          this.showHealthGainText(effects.health);
        }

        this.gameState.items.splice(i, 1);
      }
    }
  }

  showHealthGainText(amount) {
    // Create a div for the healing number
    const healElement = document.createElement("div");
    healElement.textContent = `+${amount} HP`;
    healElement.style.position = "absolute";
    healElement.style.fontWeight = "bold";
    healElement.style.fontSize = "16px";
    healElement.style.color = "#00ff00";
    healElement.style.textShadow = "1px 1px 2px black";
    healElement.style.zIndex = "100";
    document.body.appendChild(healElement);

    // Position near the player
    const playerScreenPos = this.getScreenPosition(this.gameState.player.position);
    healElement.style.left = `${playerScreenPos.x}px`;
    healElement.style.top = `${playerScreenPos.y - 30}px`;

    // Animate floating up and fading out
    let opacity = 1;
    let posY = parseInt(healElement.style.top);
    const fadeInterval = setInterval(() => {
      opacity -= 0.05;
      posY -= 1;
      healElement.style.opacity = opacity;
      healElement.style.top = `${posY}px`;

      if (opacity <= 0) {
        clearInterval(fadeInterval);
        document.body.removeChild(healElement);
      }
    }, 30);
  }

  getScreenPosition(position) {
    const vector = new THREE.Vector3();
    vector.setFromMatrixPosition(new THREE.Matrix4().setPosition(position));

    const widthHalf = window.innerWidth / 2;
    const heightHalf = window.innerHeight / 2;
    vector.project(window.gameState.camera);
    vector.x = vector.x * widthHalf + widthHalf;
    vector.y = -(vector.y * heightHalf) + heightHalf;

    return { x: vector.x, y: vector.y };
  }

  updateXpGemCollisions() {
    for (let i = this.gameState.xpGems.length - 1; i >= 0; i--) {
      const gem = this.gameState.xpGems[i];
      if (this.gameState.player.position.distanceTo(gem.mesh.position) < PLAYER_RADIUS + 0.3) {
        this.gameState.playerXp += gem.value;
        this.gameState.score += gem.value;
        this.gameState.scene.remove(gem.mesh);
        this.gameState.xpGems.splice(i, 1);
        this.playerSystem.checkLevelUp();
      }
    }
  }

  updateAllCollisions() {
    this.updateEnemyCollisions();
    this.updateItemCollisions();
    this.updateXpGemCollisions();
  }
}
