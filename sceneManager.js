import * as THREE from "three";
import { CAMERA_VIEW_HEIGHT, GROUND_SIZE } from "./config.js";

export class SceneManager {
  constructor(gameState) {
    this.gameState = gameState;
  }

  setupScene() {
    this.gameState.scene = new THREE.Scene();
    this.gameState.scene.background = new THREE.Color(0x1a1a1a);
    return this.gameState.scene;
  }

  setupRenderer() {
    this.gameState.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.gameState.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.gameState.renderer.domElement);
    return this.gameState.renderer;
  }

  setupCamera() {
    this.gameState.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.gameState.camera.position.set(0, CAMERA_VIEW_HEIGHT, 0);
    this.gameState.camera.lookAt(0, 0, 0);
    return this.gameState.camera;
  }

  setupGround() {
    const groundGeometry = new THREE.PlaneGeometry(GROUND_SIZE, GROUND_SIZE);
    const groundMaterial = new THREE.MeshBasicMaterial({
      color: 0x333333,
      side: THREE.DoubleSide,
    });
    this.gameState.groundPlane = new THREE.Mesh(groundGeometry, groundMaterial);
    this.gameState.groundPlane.rotation.x = -Math.PI / 2;
    this.gameState.scene.add(this.gameState.groundPlane);
    return this.gameState.groundPlane;
  }

  updateCameraFollow() {
    if (this.gameState.player) {
      this.gameState.camera.position.set(this.gameState.player.position.x, CAMERA_VIEW_HEIGHT, this.gameState.player.position.z);
      this.gameState.camera.lookAt(this.gameState.player.position.x, 0, this.gameState.player.position.z);
    }
  }

  setupResizeListener() {
    window.addEventListener("resize", () => {
      if (this.gameState.camera && this.gameState.renderer) {
        this.gameState.camera.aspect = window.innerWidth / window.innerHeight;
        this.gameState.camera.updateProjectionMatrix();
        this.gameState.renderer.setSize(window.innerWidth, window.innerHeight);
      }
    });
  }

  setupAudio() {
    this.gameState.audioListener = new THREE.AudioListener();
    this.gameState.camera.add(this.gameState.audioListener);

    this.gameState.backgroundMusic = new THREE.Audio(this.gameState.audioListener);
    const audioLoader = new THREE.AudioLoader();
    audioLoader.load("replicate-prediction-jmzwr3ywedrj40cnv1nr29e18w.mp3", (buffer) => {
      this.gameState.backgroundMusic.setBuffer(buffer);
      this.gameState.backgroundMusic.setLoop(true);
      this.gameState.backgroundMusic.setVolume(0.5); // Adjust volume as needed
      this.gameState.backgroundMusic.play();
    });
  }

  updateMouseWorldPosition() {
    if (!this.gameState.camera || !this.gameState.groundPlane) return;
    this.gameState.raycaster.setFromCamera(this.gameState.pointer, this.gameState.camera);
    const intersects = this.gameState.raycaster.intersectObject(this.gameState.groundPlane);
    if (intersects.length > 0) {
      this.gameState.mouseWorldPosition.copy(intersects[0].point);
      this.gameState.mouseWorldPosition.y = 0.5; // PLAYER_RADIUS from config
    }
  }
}
