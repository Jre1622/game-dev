# JS Survivor Clone (VS x RoR2 Inspired)

A top-down survival game inspired by **Vampire Survivors** and **Risk of Rain 2**, built with HTML, CSS, JavaScript, and Three.js. Aiming for the satisfying auto-combat and upgrade loop of VS, combined with the exciting item stacking, synergies, and potential for character depth found in RoR2.

## Project Goal

Create a compelling top-down survival experience featuring:

- Intense wave-based combat against scaling hordes.
- Satisfying character progression through **stacking items** and level-up upgrades.
- Engaging combat incorporating unique features like mouse-based aiming.
- Potential for distinct character kits and procedural world generation.

## Technology Stack

- HTML5
- CSS3
- JavaScript (ES6+)
- [Three.js](https://threejs.org/) (for WebGL rendering)

## Setup (Updated)

1. Clone the repository
2. Open `index.html` directly in a modern browser (no build step needed)
3. For development, consider using a simple static server like:
   ```bash
   npx serve
   ```

## Current Focus (MVP)

1. Core gameplay loop (movement, shooting, enemies)
2. Basic upgrade system
3. Simple UI for health/ammo

## Core Development Plan (MVP++)

1.  **Environment & Player Movement (Done):**

    - Basic Three.js scene setup (Orthographic Camera).
    - Ground plane/grid.
    - Keyboard (WASD/Arrows) player movement.
    - Camera follows player.

2.  **Enemy Spawning & Basic AI:**

    - Create simple enemy visuals (e.g., colored cubes/spheres).
    - Spawn enemies periodically outside the camera view.
    - Basic "move towards player" AI.
    - Increase spawn rate/enemy count over time (difficulty scaling).

3.  **Core Combat Loop - Mouse Aiming:**

    - **Player Aiming:** Track mouse position; orient player/weapon towards cursor.
    - **Basic Weapon:** Simple auto-firing projectile weapon aiming at the cursor.
    - **Collision Detection:** Projectile-Enemy and Player-Enemy collisions.
    - **Health System:** Basic HP for player and enemies.

4.  **Experience & Leveling:**

    - Enemies drop experience gems.
    - Player collects gems by proximity.
    - Track player XP and level.

5.  **Upgrade System (VS Style - Initial):**

    - Upon level-up, pause and present 2-3 upgrade choices (like VS).
    - Initial upgrades focus on core stats (Damage, Speed, Health, Fire Rate).

6.  **Basic UI:**
    - Display Health, Level/XP, Timer.
    - Level Up / Upgrade selection screen.

## Creative Enhancements & Future Ideas (RoR2 / VS Blend)

- **World Structure:**

  - **Endless Procedural World (VS/RoR2 Hybrid):** Generate terrain chunks infinitely. Could incorporate RoR2-style interactables (shrines, chests) or events within the endless VS format.
  - **Stage-Based (RoR2 Style):** Survive for a time/clear waves, find/activate a "teleporter", fight a boss while it charges, then move to a new, potentially harder stage.
  - **Large Fixed Arena:** A large map with distinct zones, secrets, or interactables.

- **Items & Synergies (RoR2 Focus):**

  - **Item Drops:** Enemies have a chance to drop items directly (like RoR2) in addition to XP gems.
  - **Stacking Effects:** Items provide stat boosts or unique effects that _stack_ additively or multiplicatively (e.g., attack speed per stack, chance for chain lightning per stack). Design for powerful, emergent synergies.
  - **Item Tiers:** Common (White), Uncommon (Green), Legendary (Red) items with increasing impact.
  - **Equipment:** One powerful active-use item on a cooldown (like RoR2 Equipment slot).
  - **Lunar Items (RoR2 Style):** Introduce powerful items with significant drawbacks, potentially found in hidden areas or from specific challenges.

- **Combat & Abilities:**

  - **Diverse Weapons/Skills:** Expand beyond simple projectiles (AoE, piercing, orbiting, melee, beams, **deployables like drones/turrets**).
  - **Character Kits (RoR2 Style):** Design distinct characters with unique base stats and potentially 3-4 core abilities (Primary fire, Secondary fire, Utility, Special) alongside the passive item upgrades.
  - **Active Abilities:** Implement character-specific skills or equipment abilities triggered by key presses with cooldowns.

- **Enemy Variety & AI:**

  - **Diverse Behaviors:** Implement RoR2-like enemy archetypes (fast melee swarmers, ranged attackers, tanky bruisers, flying units, support units that heal/buff others).
  - **Elite Enemies:** Introduce elite versions with enhanced stats and special modifiers (e.g., burning, freezing, overloading).
  - **Bosses:** Stage-ending bosses (if using stage structure) or timed bosses (in endless mode) with unique mechanics.

- **Player Progression & Meta-Progression:**

  - **Character Selection:** Unlock different characters with unique kits/starting items.
  - **Meta-Upgrades (RoR2/VS):** Earn persistent currency during runs to unlock new items, characters, or permanent starting bonuses between runs.

- **Visuals & Polish:**

  - Replace primitives with sprites or models.
  - Add particle effects, shaders, sound effects, music.

- **Other Mechanics:**
  - **Interactables:** Shrines (of Chance, Combat, Mountain), Chests, Scrappers (RoR2 inspired).
  - **Environmental Hazards:** Damaging zones, obstacles.
  - **Hidden Realms/Challenges:** Secret areas or objectives that offer unique rewards (like Lunar items or specific unlocks).

```
game-dev
├─ README.md
├─ ai-gun-shot.mp3
├─ enemy.js
├─ game.js
├─ gun.js
├─ index.html
├─ item.js
├─ package-lock.json
├─ package.json
└─ styles.css

```
