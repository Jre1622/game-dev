import * as THREE from "three";

export class XpGem {
  constructor(scene, position, value) {
    this.value = value;
    this.mesh = new THREE.Mesh(new THREE.SphereGeometry(0.2), new THREE.MeshBasicMaterial({ color: 0xffff00 }));
    this.mesh.position.copy(position);
    scene.add(this.mesh);
  }
}
