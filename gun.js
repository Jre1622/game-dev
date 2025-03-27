import * as THREE from "three";

// --- Configuration ---
const BULLET_SPEED = 0.3;
const CLIP_SIZE = 6;
const RELOAD_TIME = 1.5;
const BULLET_RADIUS = 0.1;
const BULLET_MAX_DISTANCE = 30;
const BULLET_COLOR = 0xffff00;
const COLLISION_THRESHOLD_BULLET_ENEMY_FACTOR = 1.0;

export class Gun {
  constructor(scene, enemyRadius = 0.5) {
    this.scene = scene;
    this.bullets = [];
    this.currentAmmo = CLIP_SIZE;
    this.isReloading = false;
    this.reloadStartTime = 0;
    this.collisionThreshold = (BULLET_RADIUS + enemyRadius) * COLLISION_THRESHOLD_BULLET_ENEMY_FACTOR;
    this.bulletGeometry = new THREE.SphereGeometry(BULLET_RADIUS, 8, 4);
    this.bulletMaterial = new THREE.MeshBasicMaterial({ color: BULLET_COLOR });

    // Add audio components
    this.audioListener = new THREE.AudioListener();
    this.shootSound = new THREE.Audio(this.audioListener);
    const audioLoader = new THREE.AudioLoader();
    audioLoader.load("ai-gun-shot.mp3", (buffer) => {
      this.shootSound.setBuffer(buffer);
      this.shootSound.setVolume(0.7); // Adjust volume as needed
    });
  }

  tryShoot(elapsedTime, playerPosition, aimDirection) {
    if (this.isReloading || this.currentAmmo <= 0) {
      return false;
    }

    console.log("Gun Firing! Ammo left:", this.currentAmmo - 1);
    this._spawnBullet(playerPosition, aimDirection);
    this.currentAmmo--;

    // Play shoot sound
    if (this.shootSound.isPlaying) {
      this.shootSound.stop();
    }
    this.shootSound.play();

    if (this.currentAmmo === 0) {
      this._startReload(elapsedTime);
    }
    return true;
  }

  update(elapsedTime, enemies) {
    this._handleReload(elapsedTime);
    return this._updateBullets(enemies);
  }

  _handleReload(elapsedTime) {
    if (this.isReloading) {
      if (elapsedTime - this.reloadStartTime >= RELOAD_TIME) {
        this.currentAmmo = CLIP_SIZE;
        this.isReloading = false;
        console.log(`Reload Complete - Ammo: ${this.currentAmmo}`);
      }
    }
  }

  _startReload(elapsedTime) {
    if (!this.isReloading) {
      this.isReloading = true;
      this.reloadStartTime = elapsedTime;
      console.log(`Reloading...`);
    }
  }

  _spawnBullet(playerPosition, direction) {
    if (direction.lengthSq() < 0.0001) {
      console.warn("Aiming direction is zero in spawnBullet.");
      return;
    }

    const normalizedDirection = direction.clone().normalize();
    const bullet = new THREE.Mesh(this.bulletGeometry, this.bulletMaterial);

    bullet.userData = {
      direction: normalizedDirection,
      spawnPosition: playerPosition.clone(),
    };

    const PLAYER_RADIUS = 0.5;
    bullet.position.copy(playerPosition).addScaledVector(normalizedDirection, PLAYER_RADIUS + BULLET_RADIUS + 0.1);
    bullet.position.y = PLAYER_RADIUS;

    this.scene.add(bullet);
    this.bullets.push(bullet);
  }

  _updateBullets(enemies) {
    const enemiesHit = new Set();
    const bulletsToRemoveIndices = [];

    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i];
      if (!bullet || !bullet.userData || !bullet.userData.direction || !bullet.userData.spawnPosition) {
        console.error("Gun: Invalid bullet data at index", i);
        bulletsToRemoveIndices.push(i);
        continue;
      }

      const direction = bullet.userData.direction;
      const spawnPos = bullet.userData.spawnPosition;
      let removeBullet = false;

      bullet.position.x += direction.x * BULLET_SPEED;
      bullet.position.z += direction.z * BULLET_SPEED;

      if (bullet.position.distanceTo(spawnPos) > BULLET_MAX_DISTANCE) {
        removeBullet = true;
      }

      if (!removeBullet) {
        for (let j = enemies.length - 1; j >= 0; j--) {
          const enemy = enemies[j];
          if (!enemy || !enemy.mesh || typeof enemy.takeDamage !== "function") {
            console.warn("Invalid enemy in bullet collision check:", enemy);
            continue;
          }

          const distance = bullet.position.distanceTo(enemy.mesh.position);
          if (distance < this.collisionThreshold) {
            if (enemy.takeDamage(10)) {
              enemiesHit.add(j);
            }
            removeBullet = true;
            break;
          }
        }
      }

      if (removeBullet) {
        bulletsToRemoveIndices.push(i);
      }
    }

    bulletsToRemoveIndices.sort((a, b) => b - a);
    bulletsToRemoveIndices.forEach((index) => {
      if (this.bullets[index]) {
        this.scene.remove(this.bullets[index]);
        this.bullets.splice(index, 1);
      }
    });

    return Array.from(enemiesHit);
  }
}
