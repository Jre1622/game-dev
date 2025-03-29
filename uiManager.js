import { MAX_PLAYER_HEALTH, PLAYER_SPEED } from "./config.js";
import { CLIP_SIZE } from "./gun.js";

export class UIManager {
  constructor(gameState) {
    this.gameState = gameState;
    this.levelUpNotification = null;
    this.levelUpTimer = null;
    this.bulletIndicators = []; // Store references to bullet indicators
  }

  updateHealthBar() {
    const healthBar = document.getElementById("health-bar");
    const healthValue = document.getElementById("health-value");

    if (healthBar && healthValue) {
      const currentHealth = Math.round(this.gameState.playerHealth);
      const maxHealth = Math.round(this.gameState.playerAttributes.maxHealth);
      const healthPercentage = Math.max(0, (currentHealth / maxHealth) * 100);

      healthBar.style.width = `${healthPercentage}%`;
      healthBar.style.backgroundColor = healthPercentage > 50 ? "#0f0" : healthPercentage > 20 ? "#ff0" : "#f00";
      healthValue.textContent = `${currentHealth}/${maxHealth}`;
    }
  }

  updateScoreDisplay() {
    const scoreElement = document.getElementById("score");
    const waveElement = document.getElementById("wave-info");
    const statsElement = document.getElementById("player-stats");

    if (scoreElement) scoreElement.textContent = `Score: ${this.gameState.score}`;
    if (waveElement) waveElement.textContent = `Wave: ${this.gameState.director.enemiesPerSpawn}`;
    if (statsElement) {
      // Check if there are any boosts to display
      const hasDamageBoost = this.gameState.playerDamageBoost > 0;
      const hasSpeedBoost = this.gameState.playerSpeedBoost > 0;

      // Simplified damage calculation - just the base damage stat
      const baseGunDamage = 10;
      const attrDamage = this.gameState.playerAttributes.baseDamage - 1; // Subtract 1 because starting value is 1
      const totalBaseDamage = baseGunDamage + attrDamage;
      const itemDamage = this.gameState.playerDamageBoost;

      // Calculate speed as percentage of base speed
      const speedPercent = Math.round((this.gameState.playerAttributes.moveSpeed / PLAYER_SPEED) * 100);

      statsElement.innerHTML = `
        <div>Damage: ${Math.round(totalBaseDamage)}${hasDamageBoost ? ` + ${itemDamage} (items)` : ""}</div>
        <div>Speed: ${speedPercent}%${hasSpeedBoost ? ` + ${Math.round((this.gameState.playerSpeedBoost / PLAYER_SPEED) * 100)}% (items)` : ""}</div>
        <div>Crit Chance: ${this.gameState.playerAttributes.critChance.toFixed(0)}%</div>
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

  updateXpText() {
    const xpText = document.getElementById("xp-text");
    if (xpText) {
      const xpNeeded = this.gameState.getXpToNextLevel(this.gameState.playerLevel);
      xpText.textContent = `${Math.round(this.gameState.playerXp)}/${xpNeeded}`;
    }
  }

  showLevelUpNotification() {
    // Clear any existing notification
    if (this.levelUpTimer) {
      clearTimeout(this.levelUpTimer);
    }

    if (!this.levelUpNotification) {
      this.levelUpNotification = document.createElement("div");
      this.levelUpNotification.id = "level-up-notification";
      this.levelUpNotification.style.position = "absolute";
      this.levelUpNotification.style.top = "20%";
      this.levelUpNotification.style.left = "50%";
      this.levelUpNotification.style.transform = "translate(-50%, -50%)";
      this.levelUpNotification.style.backgroundColor = "rgba(0, 255, 0, 0.8)";
      this.levelUpNotification.style.color = "white";
      this.levelUpNotification.style.padding = "10px 20px";
      this.levelUpNotification.style.borderRadius = "5px";
      this.levelUpNotification.style.fontWeight = "bold";
      this.levelUpNotification.style.fontSize = "18px";
      this.levelUpNotification.style.zIndex = "1000";
      this.levelUpNotification.style.display = "none";
      document.body.appendChild(this.levelUpNotification);
    }

    if (this.gameState.lastLevelUpAttribute) {
      const { name, amount } = this.gameState.lastLevelUpAttribute;
      let displayName, displayAmount;

      switch (name) {
        case "maxHealth":
          displayName = "Health";
          displayAmount = `+5`;
          break;
        case "moveSpeed":
          displayName = "Speed";
          displayAmount = `+1%`;
          break;
        case "baseDamage":
          displayName = "Damage";
          displayAmount = `+1`;
          break;
        case "critChance":
          displayName = "Critical Chance";
          displayAmount = `+1%`;
          break;
        default:
          displayName = name;
          displayAmount = `+${amount}`;
      }

      this.levelUpNotification.textContent = `Level Up! +1 ${displayName}: ${displayAmount}`;
      this.levelUpNotification.style.display = "block";

      // Hide notification after 3 seconds
      this.levelUpTimer = setTimeout(() => {
        this.levelUpNotification.style.display = "none";
      }, 3000);
    }
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

  updateAmmoDisplay() {
    const gun = this.gameState.playerGun;
    if (!gun) return;

    const ammoContainer = document.getElementById("ammo-container");
    if (!ammoContainer) return;

    // Check if clip size has changed
    const currentClipSize = gun.maxAmmo;

    // First time setup or clip size changed - recreate bullet indicators
    if (this.bulletIndicators.length === 0 || this.bulletIndicators.length !== currentClipSize) {
      // Clear container and references
      ammoContainer.innerHTML = "";
      this.bulletIndicators = [];

      // Create indicators based on current clip size
      for (let i = 0; i < currentClipSize; i++) {
        const bullet = document.createElement("div");
        bullet.className = i < gun.currentAmmo ? "bullet-indicator loaded" : "bullet-indicator empty";
        ammoContainer.appendChild(bullet);
        this.bulletIndicators.push(bullet);
      }
    } else {
      // Just update existing bullets
      for (let i = 0; i < this.bulletIndicators.length; i++) {
        if (gun.isReloading) {
          // All bullets pulse during reload
          this.bulletIndicators[i].className = "bullet-indicator empty reloading";
        } else if (i < gun.currentAmmo) {
          // Loaded bullets
          this.bulletIndicators[i].className = "bullet-indicator loaded";
        } else {
          // Empty bullets
          this.bulletIndicators[i].className = "bullet-indicator empty";
        }
      }
    }
  }

  updateAllUI() {
    this.updateHealthBar();
    this.updateScoreDisplay();
    this.updateTimer();
    this.updateLevelUI();
    this.updateXpText();
    this.updateAmmoDisplay();

    // Show level up notification if attribute was just boosted
    if (this.gameState.lastLevelUpAttribute) {
      this.showLevelUpNotification();
      this.gameState.lastLevelUpAttribute = null; // Clear after showing
    }
  }
}
