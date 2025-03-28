import * as THREE from "three";

export class Item {
  constructor(scene, type, position, variant = "Medium Health Pack") {
    this.type = type;
    this.scene = scene;
    this.variant = variant; // Store the variant name for health packs

    // Create mesh based on item type (only health items now)
    const geometry = new THREE.SphereGeometry(0.3, 16, 16);
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 }); // Green for health

    // Show different sizes visually
    let scale = 1;
    if (variant === "Small Health Pack") {
      scale = 0.8;
    } else if (variant === "Large Health Pack") {
      scale = 1.2;
    }

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.copy(position);
    this.mesh.scale.set(scale, scale, scale);

    // Add simple hover animation
    this.startY = position.y;
    this.animationOffset = Math.random() * Math.PI * 2; // Random start phase

    scene.add(this.mesh);
  }

  update(deltaTime) {
    // Simple floating animation
    if (this.mesh) {
      this.animationOffset += deltaTime * 2;
      this.mesh.position.y = this.startY + Math.sin(this.animationOffset) * 0.1;
    }
  }

  applyEffect() {
    const effects = {};

    // Different health amounts based on variant
    if (this.type === "health") {
      switch (this.variant) {
        case "Small Health Pack":
          effects.health = 10;
          break;
        case "Large Health Pack":
          effects.health = 30;
          break;
        case "Medium Health Pack":
        default:
          effects.health = 20;
          break;
      }
    }

    this.scene.remove(this.mesh);
    return effects;
  }
}
