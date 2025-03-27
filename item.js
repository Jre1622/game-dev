import * as THREE from "three";

export class Item {
  constructor(scene, type, position) {
    this.type = type;
    this.scene = scene;

    // Create mesh based on item type
    const geometry = new THREE.SphereGeometry(0.3, 16, 16);
    let material;

    switch (type) {
      case "health":
        material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        break;
      case "damage":
        material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        break;
      case "speed":
        material = new THREE.MeshBasicMaterial({ color: 0x0000ff });
        break;
      default:
        material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    }

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.copy(position);
    scene.add(this.mesh);
  }

  applyEffect(player) {
    const effects = {};
    switch (this.type) {
      case "health":
        effects.health = 20;
        break;
      case "damage":
        effects.damageBoost = 1;
        break;
      case "speed":
        effects.speedBoost = 0.05;
        break;
    }
    this.scene.remove(this.mesh);
    return effects;
  }
}
