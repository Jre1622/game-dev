import * as THREE from "three";

// --- Configuration ---
const PLAYER_SPEED = 0.1;
const CAMERA_VIEW_HEIGHT = 15; // How many units tall the game view is
const GROUND_SIZE = 100; // How large the ground plane is

// --- Global Variables ---
let scene, camera, renderer;
let player;
let groundPlane;
let keysPressed = {};
let clock = new THREE.Clock(); // For potential future use (delta time)

// --- Initialization ---
function init() {
  // Scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1a1a1a); // Dark grey background

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // Setup Components
  setupCamera();
  setupGround();
  setupPlayer();
  setupInputListeners();
  setupResizeListener(); // Add resize listener

  // Start the game loop
  animate();
  console.log("Game Initialized (Modular)");
}

// --- Setup Functions ---
function setupCamera() {
  const aspect = window.innerWidth / window.innerHeight;
  const viewWidth = CAMERA_VIEW_HEIGHT * aspect;

  // Orthographic Camera for 2D top-down view
  camera = new THREE.OrthographicCamera(
    viewWidth / -2,
    viewWidth / 2, // left, right
    CAMERA_VIEW_HEIGHT / 2,
    CAMERA_VIEW_HEIGHT / -2, // top, bottom
    0.1,
    1000 // near, far clipping plane
  );

  // Position camera above the center, looking down
  camera.position.set(0, 50, 0); // Positioned high on the Y-axis
  camera.lookAt(0, 0, 0); // Looking down at the origin (XZ plane)
  camera.zoom = 1; // Adjust zoom if needed
  camera.updateProjectionMatrix();
}

function setupGround() {
  const groundGeometry = new THREE.PlaneGeometry(GROUND_SIZE, GROUND_SIZE);
  // Simple dark material for the ground
  const groundMaterial = new THREE.MeshBasicMaterial({ color: 0x333333 });
  groundPlane = new THREE.Mesh(groundGeometry, groundMaterial);

  // Rotate the plane to be flat on the XZ axis
  groundPlane.rotation.x = -Math.PI / 2;
  // groundPlane.position.y = -0.01; // Optional: slightly below y=0

  scene.add(groundPlane);

  // Optional: Add GridHelper for visual reference (on top of ground)
  const gridHelper = new THREE.GridHelper(GROUND_SIZE, GROUND_SIZE / 2, 0x555555, 0x555555);
  // gridHelper.position.y = 0.01; // Slightly above the ground plane
  scene.add(gridHelper);
}

function setupPlayer() {
  // Using a simple Box for now
  const playerGeometry = new THREE.BoxGeometry(1, 1, 1); // Width, Height, Depth
  const playerMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 }); // Bright Green
  player = new THREE.Mesh(playerGeometry, playerMaterial);

  // Position the player slightly above the ground plane (Y=0)
  // Since BoxGeometry origin is center, lift by half its height
  player.position.y = 0.5;

  scene.add(player);
}

function setupInputListeners() {
  document.addEventListener("keydown", (event) => {
    keysPressed[event.key.toLowerCase()] = true;
  });

  document.addEventListener("keyup", (event) => {
    keysPressed[event.key.toLowerCase()] = false;
  });
}

function setupResizeListener() {
  window.addEventListener("resize", () => {
    // Update camera aspect ratio
    const aspect = window.innerWidth / window.innerHeight;
    const viewWidth = CAMERA_VIEW_HEIGHT * aspect;
    camera.left = viewWidth / -2;
    camera.right = viewWidth / 2;
    camera.top = CAMERA_VIEW_HEIGHT / 2;
    camera.bottom = CAMERA_VIEW_HEIGHT / -2;
    camera.updateProjectionMatrix();

    // Update renderer size
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}

// --- Game Loop & Update Logic ---
function animate() {
  requestAnimationFrame(animate); // Loop

  // const deltaTime = clock.getDelta(); // Get time since last frame (for frame-rate independent movement) - Implement later if needed

  update(); // Update game state

  renderer.render(scene, camera); // Render the scene
}

function update() {
  // --- Player Movement ---
  let moveX = 0;
  let moveZ = 0;

  if (keysPressed["w"] || keysPressed["arrowup"]) {
    moveZ = -1; // Move "forward" in negative Z direction
  }
  if (keysPressed["s"] || keysPressed["arrowdown"]) {
    moveZ = 1; // Move "backward" in positive Z direction
  }
  if (keysPressed["a"] || keysPressed["arrowleft"]) {
    moveX = -1; // Move "left" in negative X direction
  }
  if (keysPressed["d"] || keysPressed["arrowright"]) {
    moveX = 1; // Move "right" in positive X direction
  }

  // Normalize diagonal movement speed
  const magnitude = Math.sqrt(moveX * moveX + moveZ * moveZ);
  if (magnitude > 0) {
    moveX = (moveX / magnitude) * PLAYER_SPEED;
    moveZ = (moveZ / magnitude) * PLAYER_SPEED;
  }

  // Apply movement
  player.position.x += moveX;
  player.position.z += moveZ;

  // --- Bounds Checking (Optional - keep player on the ground plane) ---
  const bound = GROUND_SIZE / 2 - 0.5; // Half ground size minus half player size
  player.position.x = Math.max(-bound, Math.min(bound, player.position.x));
  player.position.z = Math.max(-bound, Math.min(bound, player.position.z));

  // --- Camera Follow ---
  // Make the camera center follow the player's XZ position
  camera.position.x = player.position.x;
  camera.position.z = player.position.z;
  // Keep the camera looking down from its fixed height (camera.position.y is already set)
  // camera.lookAt(player.position.x, 0, player.position.z); // Ensure it looks at the player's ground position
  // No need to call lookAt every frame if camera Y is fixed and it moves parallel to XZ plane
}

// --- Start the application ---
init();
