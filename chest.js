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
    // 1. Show a UI with 3 item choices
    // 2. Let the player select one
    // 3. Apply the chosen item effect

    // Change appearance to indicate it's open
    this.mesh.material.color.set(0x777777);

    // Return an array of the 3 options (for now just item types)
    return [
      { type: "health", name: "Health Pack", description: "Restore 20 HP" },
      { type: "damage", name: "Damage Boost", description: "+1 Damage" },
      { type: "speed", name: "Speed Boots", description: "+5% Speed" },
    ];
  }

  remove() {
    if (this.mesh && this.mesh.parent) {
      this.scene.remove(this.mesh);
    }
  }
}
