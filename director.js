import { enemyTypes } from "./config.js";

export class Director {
  constructor() {
    this.elapsedTime = 0;
    this.spawnInterval = 2.5; // Start slower (every 2.5 seconds)
    this.minSpawnInterval = 0.35; // Slightly slower fastest spawn interval
    this.enemiesPerSpawn = 1; // Starting enemies
    this.maxEnemiesPerSpawn = 8; // Maximum enemies per spawn
    this.enemyStatMultiplier = 1.0; // Global enemy stat multiplier
    this.enemyTypes = enemyTypes; // Store enemy types

    // Extended phase timings for 15-20 min gameplay
    this.PHASE_1_END = 180; // 3 minutes - Learning phase
    this.PHASE_2_END = 480; // 8 minutes - Early game
    this.PHASE_3_END = 780; // 13 minutes - Mid game
    this.PHASE_4_END = 1080; // 18 minutes - Late game
    // After PHASE_4_END - End game (maximum difficulty)
  }

  update(deltaTime) {
    this.elapsedTime += deltaTime;
    this._adjustDifficulty();
  }

  _adjustDifficulty() {
    // Phase 1: Gentle introduction (0-3 min)
    if (this.elapsedTime < this.PHASE_1_END) {
      const phaseProgress = this.elapsedTime / this.PHASE_1_END;
      this.spawnInterval = this._lerp(2.5, 2.0, phaseProgress);
      this.enemiesPerSpawn = 1;
      this.enemyStatMultiplier = this._lerp(1.0, 1.15, phaseProgress);
    }
    // Phase 2: Early game challenge (3-8 min)
    else if (this.elapsedTime < this.PHASE_2_END) {
      const phaseProgress = (this.elapsedTime - this.PHASE_1_END) / (this.PHASE_2_END - this.PHASE_1_END);
      this.spawnInterval = this._lerp(2.0, 1.2, phaseProgress);
      this.enemiesPerSpawn = 1 + Math.floor(phaseProgress * 2); // 1 to 3 enemies
      this.enemyStatMultiplier = this._lerp(1.15, 1.5, phaseProgress);
    }
    // Phase 3: Mid game intensity (8-13 min)
    else if (this.elapsedTime < this.PHASE_3_END) {
      const phaseProgress = (this.elapsedTime - this.PHASE_2_END) / (this.PHASE_3_END - this.PHASE_2_END);
      this.spawnInterval = this._lerp(1.2, 0.8, phaseProgress);
      this.enemiesPerSpawn = 3 + Math.floor(phaseProgress * 2); // 3 to 5 enemies
      this.enemyStatMultiplier = this._lerp(1.5, 2.0, phaseProgress);
    }
    // Phase 4: Late game challenge (13-18 min)
    else if (this.elapsedTime < this.PHASE_4_END) {
      const phaseProgress = (this.elapsedTime - this.PHASE_3_END) / (this.PHASE_4_END - this.PHASE_3_END);
      this.spawnInterval = this._lerp(0.8, 0.5, phaseProgress);
      this.enemiesPerSpawn = 5 + Math.floor(phaseProgress * 2); // 5 to 7 enemies
      this.enemyStatMultiplier = this._lerp(2.0, 2.8, phaseProgress);
    }
    // Phase 5: End game (maximum difficulty) (18+ min)
    else {
      const overtime = Math.min(1, (this.elapsedTime - this.PHASE_4_END) / 300); // Cap scaling after 5 more minutes
      this.spawnInterval = this._lerp(0.5, this.minSpawnInterval, overtime);
      this.enemiesPerSpawn = 7 + Math.floor(overtime * (this.maxEnemiesPerSpawn - 7));
      this.enemyStatMultiplier = 2.8 + overtime * 1.2; // Keep scaling up to 4.0
    }
  }

  _lerp(start, end, t) {
    return start * (1 - t) + end * t;
  }

  getEnemyStats(baseStats) {
    return {
      health: Math.round(baseStats.health * this.enemyStatMultiplier),
      speed: baseStats.speed * this._lerp(1, 1.3, (this.enemyStatMultiplier - 1.0) / 3.0),
      damage: Math.round(baseStats.damage * this._lerp(1, 1.5, (this.enemyStatMultiplier - 1.0) / 3.0)),
      scoreValue: Math.round(baseStats.scoreValue * this.enemyStatMultiplier),
    };
  }

  shouldSpawn(currentTime, lastSpawnTime) {
    return currentTime - lastSpawnTime >= this.spawnInterval;
  }
}
