import * as THREE from "three";
import { Enemy } from "./enemy.js";
import { Item } from "./item.js";
import { XpGem } from "./xpGem.js";
import { Chest } from "./chest.js";
import { SPAWN_DISTANCE, ENEMY_RADIUS, GROUND_SIZE, enemyTypes } from "./config.js";

export class SpawnSystem {
  constructor(gameState) {
    this.gameState = gameState;
    this.lastChestTime = 0;
    this.chestInterval = 60; // Spawn a chest every 60 seconds

    // Initialize collections
    if (!this.gameState.chests) {
      this.gameState.chests = [];
    }
  }

  spawnEnemy() {
    let position;
    let isValidPosition = false;
    let attempts = 0;

    // Try to find valid spawn position (max 5 attempts)
    while (!isValidPosition && attempts < 5) {
      const angle = Math.random() * Math.PI * 2;
      const distance = SPAWN_DISTANCE + Math.random() * 5;
      const x = this.gameState.player.position.x + Math.cos(angle) * distance;
      const z = this.gameState.player.position.z + Math.sin(angle) * distance;
      position = new THREE.Vector3(x, ENEMY_RADIUS, z);

      // Check if position is within ground bounds
      const halfGround = GROUND_SIZE / 2;
      isValidPosition = Math.abs(x) < halfGround && Math.abs(z) < halfGround;
      attempts++;
    }

    if (!isValidPosition) {
      console.warn("Failed to find valid spawn position after 5 attempts");
      return null;
    }

    // Randomly select enemy type from the available types in config
    const typeKeys = Object.keys(enemyTypes);
    const randomType = enemyTypes[typeKeys[Math.floor(Math.random() * typeKeys.length)]];
    const scaledStats = this.gameState.director.getEnemyStats(randomType);

    try {
      const enemy = new Enemy(this.gameState.scene, { ...randomType, ...scaledStats }, position);
      this.gameState.enemies.push(enemy);
      return enemy;
    } catch (error) {
      console.error("Failed to spawn enemy:", error);
      return null;
    }
  }

  spawnItem(position) {
    const itemTypes = ["health", "damage", "speed"];
    const type = itemTypes[Math.floor(Math.random() * itemTypes.length)];
    const item = new Item(this.gameState.scene, type, position);
    this.gameState.items.push(item);
    return item;
  }

  spawnXpGem(position, value) {
    if (!position || value <= 0) return null;

    try {
      const xpGem = new XpGem(this.gameState.scene, position, value);
      this.gameState.xpGems.push(xpGem);
      return xpGem;
    } catch (error) {
      console.error("Failed to spawn XP gem:", error);
      return null;
    }
  }

  spawnChest() {
    // Get a position near the player but not too close
    const angle = Math.random() * Math.PI * 2;
    const distance = 5 + Math.random() * 3; // 5-8 units away
    const x = this.gameState.player.position.x + Math.cos(angle) * distance;
    const z = this.gameState.player.position.z + Math.sin(angle) * distance;
    const position = new THREE.Vector3(x, 0.5, z);

    // Create a new chest
    const chest = new Chest(this.gameState.scene, position);
    this.gameState.chests.push(chest);

    console.log("Chest spawned at ", position);
    return chest;
  }

  updateChests(deltaTime) {
    if (!this.gameState.chests) return;

    const playerPosition = this.gameState.player.position;

    // Update and check all chests
    for (let i = this.gameState.chests.length - 1; i >= 0; i--) {
      const chest = this.gameState.chests[i];

      // Update chest animation
      chest.update(deltaTime);

      // Check if player is close enough to open the chest
      const distance = playerPosition.distanceTo(chest.position);
      if (distance < 1.5 && !chest.isOpen) {
        const itemOptions = chest.open();
        console.log("Chest opened! Options:", itemOptions);

        // For now, just give a random item from the options
        const randomOption = itemOptions[Math.floor(Math.random() * itemOptions.length)];
        this.spawnItem(chest.position.clone());

        // Remove chest after a delay
        setTimeout(() => {
          chest.remove();
          const index = this.gameState.chests.indexOf(chest);
          if (index > -1) {
            this.gameState.chests.splice(index, 1);
          }
        }, 1000);
      }
    }
  }

  checkSpawning() {
    const elapsedTime = this.gameState.getElapsedTime();
    const deltaTime = this.gameState.getDeltaTime();

    // Check if it's time to spawn enemies
    if (this.gameState.director.shouldSpawn(elapsedTime, this.gameState.lastSpawnTime)) {
      for (let i = 0; i < this.gameState.director.enemiesPerSpawn; i++) {
        this.spawnEnemy();
      }
      this.gameState.lastSpawnTime = elapsedTime;
    }

    // Check if it's time to spawn a chest
    if (elapsedTime - this.lastChestTime >= this.chestInterval) {
      this.spawnChest();
      this.lastChestTime = elapsedTime;
    }

    // Update and check chest interactions
    this.updateChests(deltaTime);

    // Random chance to spawn items (e.g., every 30 seconds with some randomness)
    if (Math.random() < 0.0002) {
      // Reduced chance since we now have chests
      const angle = Math.random() * Math.PI * 2;
      const distance = 3 + Math.random() * 3; // Spawn closer to player than enemies
      const x = this.gameState.player.position.x + Math.cos(angle) * distance;
      const z = this.gameState.player.position.z + Math.sin(angle) * distance;
      const position = new THREE.Vector3(x, 0.3, z);
      this.spawnItem(position);
    }
  }
}
