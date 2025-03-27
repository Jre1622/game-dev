import * as THREE from "three";

export class Enemy {
  constructor(scene, type, position) {
    this.type = type;
    this.health = type.health;
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
  }

  update(player, currentTime) {
    // Move towards the player
    const direction = new THREE.Vector3().subVectors(player.position, this.mesh.position).normalize();
    this.mesh.position.addScaledVector(direction, this.speed);

    // Check for collision with player and apply damage with cooldown
    const distanceToPlayer = this.mesh.position.distanceTo(player.position);
    if (
      distanceToPlayer < this.radius + player.radius &&
      currentTime - this.lastDamageTime > 0.5 // 0.5-second cooldown
    ) {
      this.lastDamageTime = currentTime;
      return this.damage;
    }
    return 0;
  }

  takeDamage(amount) {
    this.health -= amount;
    this.flash();
    if (this.health <= 0) {
      this.mesh.parent.remove(this.mesh);
      return true; // Indicate enemy should be removed
    }
    return false;
  }

  flash() {
    const originalColor = this.mesh.material.color.getHex();
    this.mesh.material.color.set(0xffffff); // Flash white
    setTimeout(() => {
      this.mesh.material.color.set(originalColor);
    }, 100);
  }
}
