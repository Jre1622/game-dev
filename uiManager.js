import { MAX_PLAYER_HEALTH, PLAYER_SPEED } from "./config.js";

export class UIManager {
  constructor(gameState) {
    this.gameState = gameState;
  }

  updateHealthBar() {
    const healthBar = document.getElementById("health-bar");
    const healthText = document.getElementById("health-text");
    if (healthBar && healthText) {
      const healthPercentage = Math.max(0, (this.gameState.playerHealth / MAX_PLAYER_HEALTH) * 100);
      healthBar.style.width = `${healthPercentage}%`;
      healthBar.style.backgroundColor = healthPercentage > 50 ? "#0f0" : healthPercentage > 20 ? "#ff0" : "#f00";
      healthText.textContent = `${Math.round(healthPercentage)}%`;
    }
  }

  updateScoreDisplay() {
    const scoreElement = document.getElementById("score");
    const waveElement = document.getElementById("wave-info");
    const statsElement = document.getElementById("player-stats");

    if (scoreElement) scoreElement.textContent = `Score: ${this.gameState.score}`;
    if (waveElement) waveElement.textContent = `Wave: ${this.gameState.director.enemiesPerSpawn}`;
    if (statsElement) {
      statsElement.innerHTML = `
        <div>Damage: +${this.gameState.playerDamageBoost}</div>
        <div>Speed: +${Math.round((this.gameState.playerSpeedBoost / PLAYER_SPEED) * 100)}%</div>
      `;
    }
  }

  updateTimer() {
    this.gameState.elapsedTime = this.gameState.getElapsedTime();
    const minutes = Math.floor(this.gameState.elapsedTime / 60)
      .toString()
      .padStart(2, "0");
    const seconds = Math.floor(this.gameState.elapsedTime % 60)
      .toString()
      .padStart(2, "0");
    document.getElementById("timer").textContent = `${minutes}:${seconds}`;
  }

  updateLevelUI() {
    const xpNeeded = this.gameState.getXpToNextLevel(this.gameState.playerLevel);
    const progress = (this.gameState.playerXp / xpNeeded) * 100;
    document.getElementById("level-progress").style.width = `${Math.min(progress, 100)}%`;
    document.getElementById("level-text").textContent = `Lvl ${this.gameState.playerLevel}`;
  }

  showGameOver() {
    // Set final stats
    const finalScoreElement = document.getElementById("final-score");
    const finalTimeElement = document.getElementById("final-time");

    if (finalScoreElement) finalScoreElement.textContent = this.gameState.score;

    if (finalTimeElement) {
      const minutes = Math.floor(this.gameState.elapsedTime / 60)
        .toString()
        .padStart(2, "0");
      const seconds = Math.floor(this.gameState.elapsedTime % 60)
        .toString()
        .padStart(2, "0");
      finalTimeElement.textContent = `${minutes}:${seconds}`;
    }

    // Show game over UI
    document.getElementById("game-over").style.display = "block";

    // Setup restart button
    const restartButton = document.getElementById("restart-button");
    if (restartButton) {
      restartButton.addEventListener("click", () => {
        window.location.reload();
      });
    }
  }

  updateAllUI() {
    this.updateHealthBar();
    this.updateScoreDisplay();
    this.updateTimer();
    this.updateLevelUI();
  }
}
