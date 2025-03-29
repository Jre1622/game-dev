import * as THREE from "three";

export class Enemy {
  constructor(scene, type, position) {
    this.type = type;
    this.health = type.health;
    this.maxHealth = type.health; // Store original max health
    this.speed = type.speed;
    this.color = type.color;
    this.radius = type.radius || 0.5; // Default radius
    this.scoreValue = type.scoreValue;
    this.damage = type.damage;

    // Create the enemy's mesh
    const geometry = new THREE.SphereGeometry(this.radius, 16, 16);
    const material = new THREE.MeshBasicMaterial({ color: this.color });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.copy(position);
    scene.add(this.mesh);

    // Track last time this enemy dealt damage
    this.lastDamageTime = 0;

    // Create health bar container
    this.healthBar = document.createElement("div");
    this.healthBar.style.position = "absolute";
    this.healthBar.style.width = "40px";
    this.healthBar.style.height = "6px";
    this.healthBar.style.backgroundColor = "#333333";
    this.healthBar.style.border = "1px solid #000";
    this.healthBar.style.borderRadius = "3px";
    this.healthBar.style.zIndex = "50";
    this.healthBar.style.pointerEvents = "none"; // Don't block mouse events

    // Create health bar fill
    this.healthBarFill = document.createElement("div");
    this.healthBarFill.style.height = "100%";
    this.healthBarFill.style.width = "100%";
    this.healthBarFill.style.backgroundColor = "#00ff00";
    this.healthBarFill.style.transition = "width 0.2s";
    this.healthBar.appendChild(this.healthBarFill);

    // Create enemy type/health text
    this.infoText = document.createElement("div");
    this.infoText.textContent = `${type.name} (${type.health})`;
    this.infoText.style.position = "absolute";
    this.infoText.style.color = "#ffffff";
    this.infoText.style.fontSize = "10px";
    this.infoText.style.textAlign = "center";
    this.infoText.style.width = "60px";
    this.infoText.style.textShadow = "1px 1px 1px #000";
    this.infoText.style.zIndex = "51";
    this.infoText.style.pointerEvents = "none"; // Don't block mouse events

    // Add elements to the DOM
    document.body.appendChild(this.healthBar);
    document.body.appendChild(this.infoText);
  }

  update(player, currentTime) {
    // Move towards the player
    const direction = new THREE.Vector3().subVectors(player.position, this.mesh.position).normalize();
    this.mesh.position.addScaledVector(direction, this.speed);

    // Update health bar position
    this.updateHealthBarPosition();

    // Check for collision with player and apply damage with cooldown
    const distanceToPlayer = this.mesh.position.distanceTo(player.position);
    if (
      distanceToPlayer < this.radius + player.radius &&
      currentTime - this.lastDamageTime > 0.1 // 0.1-second cooldown (was 0.25)
    ) {
      this.lastDamageTime = currentTime;
      return this.damage;
    }
    return 0;
  }

  updateHealthBarPosition() {
    if (!this.mesh || !window.gameState || !window.gameState.camera) return;

    // Project position to screen space
    const vector = new THREE.Vector3();
    vector.setFromMatrixPosition(this.mesh.matrixWorld);

    const widthHalf = window.innerWidth / 2;
    const heightHalf = window.innerHeight / 2;
    vector.project(window.gameState.camera);
    vector.x = vector.x * widthHalf + widthHalf;
    vector.y = -(vector.y * heightHalf) + heightHalf;

    // Position health bar above enemy
    const barWidth = 40;
    this.healthBar.style.left = `${vector.x - barWidth / 2}px`;
    this.healthBar.style.top = `${vector.y - 25}px`; // 25px above enemy

    // Position info text
    this.infoText.style.left = `${vector.x - 30}px`;
    this.infoText.style.top = `${vector.y - 40}px`; // Above health bar
  }

  takeDamage(amount, isCritical = false) {
    this.health -= amount;
    this.flash(isCritical);

    // Show damage number
    this.showDamageNumber(amount, isCritical);

    // Update health bar
    const healthPercent = Math.max(0, (this.health / this.maxHealth) * 100);
    this.healthBarFill.style.width = `${healthPercent}%`;

    // Change health bar color based on health percentage
    if (healthPercent > 60) {
      this.healthBarFill.style.backgroundColor = "#00ff00"; // Green
    } else if (healthPercent > 30) {
      this.healthBarFill.style.backgroundColor = "#ffff00"; // Yellow
    } else {
      this.healthBarFill.style.backgroundColor = "#ff0000"; // Red
    }

    if (this.health <= 0) {
      // Clean up DOM elements
      document.body.removeChild(this.healthBar);
      document.body.removeChild(this.infoText);

      this.mesh.parent.remove(this.mesh);
      return true; // Indicate enemy should be removed
    }
    return false;
  }

  showDamageNumber(amount, isCritical = false) {
    // Create a div for the damage number
    const damageElement = document.createElement("div");
    damageElement.textContent = Math.round(amount);
    damageElement.style.position = "absolute";
    damageElement.style.fontWeight = "bold";
    damageElement.style.fontSize = isCritical ? "24px" : "16px";
    damageElement.style.color = isCritical ? "#ff0000" : "#ffffff";
    damageElement.style.textShadow = isCritical ? "2px 2px 4px black" : "1px 1px 2px black";
    damageElement.style.zIndex = "100";

    // Add "CRIT!" text for critical hits
    if (isCritical) {
      const critText = document.createElement("div");
      critText.textContent = "CRIT!";
      critText.style.position = "absolute";
      critText.style.fontWeight = "bold";
      critText.style.fontSize = "12px";
      critText.style.color = "#ffff00";
      critText.style.textShadow = "1px 1px 2px black";
      critText.style.textAlign = "center";
      critText.style.width = "100%";
      critText.style.top = "-15px";
      damageElement.appendChild(critText);

      // Add a little shake animation
      let shakeOffset = 2;
      const shakeInterval = setInterval(() => {
        damageElement.style.marginLeft = `${Math.random() * shakeOffset - shakeOffset / 2}px`;
        damageElement.style.marginTop = `${Math.random() * shakeOffset - shakeOffset / 2}px`;
        shakeOffset *= 0.9;
        if (shakeOffset < 0.5) clearInterval(shakeInterval);
      }, 50);
    }

    document.body.appendChild(damageElement);

    // Get the screen position of the enemy
    const vector = new THREE.Vector3();
    vector.setFromMatrixPosition(this.mesh.matrixWorld);

    // Project the 3D position to 2D screen space
    const widthHalf = window.innerWidth / 2;
    const heightHalf = window.innerHeight / 2;
    vector.project(window.gameState.camera);
    vector.x = vector.x * widthHalf + widthHalf;
    vector.y = -(vector.y * heightHalf) + heightHalf;

    // Position the damage number
    damageElement.style.left = `${vector.x}px`;
    damageElement.style.top = `${vector.y - 30}px`;

    // Animate the damage number floating up and fading out
    let opacity = 1;
    let posY = parseInt(damageElement.style.top);
    const fadeInterval = setInterval(() => {
      opacity -= 0.05;
      posY -= isCritical ? 2 : 1; // Critical numbers float up faster
      damageElement.style.opacity = opacity;
      damageElement.style.top = `${posY}px`;

      if (opacity <= 0) {
        clearInterval(fadeInterval);
        document.body.removeChild(damageElement);
      }
    }, 30);
  }

  flash(isCritical = false) {
    const originalColor = this.mesh.material.color.getHex();
    this.mesh.material.color.set(isCritical ? 0xff0000 : 0xffffff); // Red flash for crits, white for normal

    if (isCritical) {
      // For critical hits, add a more dramatic flash effect
      this.mesh.scale.set(1.5, 1.5, 1.5); // Temporarily grow the enemy

      setTimeout(() => {
        this.mesh.scale.set(1, 1, 1); // Return to normal size
        this.mesh.material.color.set(originalColor);
      }, 150);
    } else {
      setTimeout(() => {
        this.mesh.material.color.set(originalColor);
      }, 100);
    }
  }
}
