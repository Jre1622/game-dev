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
        if (effects.health) {
          this.gameState.playerHealth = Math.min(this.gameState.playerHealth + effects.health, MAX_PLAYER_HEALTH);
        }
        if (effects.damageBoost) {
          this.gameState.playerDamageBoost += effects.damageBoost;
        }
        if (effects.speedBoost) {
          this.gameState.playerSpeedBoost += effects.speedBoost;
        }
        this.gameState.items.splice(i, 1);
      }
    }
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
