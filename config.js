export const PLAYER_SPEED = 0.1;
export const ENEMY_SPEED = 0.03;
export const CAMERA_VIEW_HEIGHT = 15;
export const GROUND_SIZE = 100;
export const SPAWN_INTERVAL = 1.0;
export const SPAWN_DISTANCE = 15;
export const PLAYER_RADIUS = 0.5;
export const ENEMY_RADIUS = 0.5;
export const COLLISION_THRESHOLD_PLAYER = PLAYER_RADIUS + ENEMY_RADIUS;
export const COLLISION_THRESHOLD_ENEMY = ENEMY_RADIUS + ENEMY_RADIUS;
export const ENEMY_SEPARATION_FORCE = 0.02;
export const PLAYER_KNOCKBACK_FORCE = 0.05;
export const PLAYER_PUSH_FORCE = 0.06;
export const MAX_PLAYER_HEALTH = 100;

export const enemyTypes = {
  basic: {
    name: "basic",
    health: 10,
    speed: 0.03,
    color: 0xff0000,
    radius: ENEMY_RADIUS,
    scoreValue: 10,
    damage: 10,
  },
  fast: {
    name: "fast",
    health: 5,
    speed: 0.05,
    color: 0x0000ff,
    radius: ENEMY_RADIUS,
    scoreValue: 15,
    damage: 5,
  },
  tank: {
    name: "tank",
    health: 20,
    speed: 0.02,
    color: 0x00ff00,
    radius: ENEMY_RADIUS,
    scoreValue: 20,
    damage: 15,
  },
};
