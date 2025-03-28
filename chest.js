import * as THREE from "three";

export class Chest {
  constructor(scene, position) {
    this.scene = scene;
    this.position = position.clone();
    this.isOpen = false;

    // Create the chest mesh
    const geometry = new THREE.BoxGeometry(1, 0.8, 0.6);
    const material = new THREE.MeshBasicMaterial({ color: 0xd4af37 });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.copy(position);

    // Add a simple animation to make it noticeable
    this.startY = position.y;
    this.animationOffset = 0;

    // Add to scene
    scene.add(this.mesh);
  }

  update(deltaTime) {
    // Simple floating animation
    this.animationOffset += deltaTime * 2;
    this.mesh.position.y = this.startY + Math.sin(this.animationOffset) * 0.1;

    // Simple rotation
    this.mesh.rotation.y += deltaTime * 0.5;
  }

  open() {
    if (this.isOpen) return;

    this.isOpen = true;
    console.log("Chest opened!");

    // In the future, this should:
    // 1. Show a UI with chest contents
    // 2. Apply the effect
    // Note: We're focusing only on health items now, as stats are gained through level-ups

    // Change appearance to indicate it's open
    this.mesh.material.color.set(0x777777);

    // Just return health options with different amounts
    return [
      { type: "health", name: "Small Health Pack", description: "Restore 10 HP" },
      { type: "health", name: "Medium Health Pack", description: "Restore 20 HP" },
      { type: "health", name: "Large Health Pack", description: "Restore 30 HP" },
    ];
  }

  remove() {
    if (this.mesh && this.mesh.parent) {
      this.scene.remove(this.mesh);
    }
  }
}
