import * as THREE from "three";
import { PLAYER_RADIUS } from "./config.js";

export class InputHandler {
  constructor(gameState) {
    this.gameState = gameState;
  }

  setupInputListeners() {
    window.addEventListener("pointermove", (event) => this.onPointerMove(event));
    window.addEventListener("pointerdown", (event) => this.onPointerDown(event));
    window.addEventListener("keydown", (event) => {
      this.gameState.keysPressed[event.key.toLowerCase()] = true;
    });
    window.addEventListener("keyup", (event) => {
      this.gameState.keysPressed[event.key.toLowerCase()] = false;
    });
  }

  onPointerMove(event) {
    this.gameState.pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.gameState.pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
  }

  onPointerDown(event) {
    if (event.button === 0 && this.gameState.playerGun && !this.gameState.isGameOver) {
      const aimDirection = this.gameState.mouseWorldPosition.clone().sub(this.gameState.player.position);
      this.gameState.playerGun.tryShoot(this.gameState.getElapsedTime(), this.gameState.player.position, aimDirection);
    }
  }
}
