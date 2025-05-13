# Space Battle Game PRD (Revised - May 8, 2025)

## Overview

A 2v2 space battle game where each team consists of a pilot and a gunner. The game features real-time local multiplayer combat on a single machine, with joystick and SNES controller support, creating an immersive and competitive gaming experience for players in the same room.

## Core Features

### 1. Team-Based Gameplay
*   2v2 team structure.
*   Each team has one pilot and one gunner role.
*   Pilot controls ship movement with a joystick.
*   Gunner controls turret aiming and shooting with an SNES controller.

### 2. Ship Mechanics
*   **Circular Spaceship Design**:
    *   Both teams have identical circular ships.
    *   Turret mounted on the edge of the circle for a 360° firing range.
*   **Custom Color Selection for Each Team**:
    *   Available colors:
        *   Mint Green (`#4BD6B4`)
        *   Purple (`#9B6DFF`)
        *   Coral (`#FF7E67`)
        *   Light Blue (`#5BC0EB`)
    *   Selected during the controller configuration screen.
    *   Colors apply to ship aura/accents and projectiles.
    *   Team distinction primarily through the selected color scheme.
*   **Rotating Turret System**:
    *   Gunner controls turret rotation (e.g., using SNES R/L shoulder buttons).
*   **Shooting Mechanics**:
    *   *Turret*:
        *   Fires when the gunner presses a designated button (e.g., 'A' on SNES).
        *   Fires continuously if the gunner holds the fire button.
        *   Deals moderate damage.
    *   *Missile*:
        *   High damage with a 5-second recharge time.
        *   Fired by the gunner using B button.
*   **Health System with Destruction Mechanics**:
    *   Each ship has health points.
    *   Health represented by a health bar displayed above the ship.
    *   For now, only the health bar will indicate damage.
    *   Ship explodes (with appropriate visual effect) when health reaches 0.
    *   No automatic health regeneration (except via the Health Regen power-up).

### 3. Power-Up System
*   **Spawning**:
    *   A new random power-up attempts to spawn every 15 seconds at a random valid spawn location.
    *   There is no hard maximum limit on the number of power-ups that can be active in the arena simultaneously.
    *   Power-up spawn locations will be randomly generated within designated safe zones, avoiding immediate player spawn locations and maintaining a minimum distance from other active power-ups.
*   **Despawning**:
    *   Power-ups will despawn (disappear) if not collected within 20 seconds of appearing.
*   **Collection**:
    *   Power-up collection occurs through ship collision.
    *   Visual and audio feedback upon collection.
    *   Display remaining duration for active timed power-ups on the UI.
*   **Power-Up Types and Effects**:
    *   *Speed Boost*:
        *   Increases ship movement speed by 50% for 10 seconds.
        *   If a Speed Boost is collected while its effect is already active, its 10-second duration simply refreshes.
        *   Visual effect: Blue glow around ship.
    *   *Shield*:
        *   Provides temporary invincibility for up to 5 seconds. If it takes 50 total damage before those 5 seconds are up, it breaks early, and invincibility ends. If it doesn't take 50 damage within the 5 seconds, it expires then.
        *   Visual effect: Purple shield aura.
    *   *Super Shot*:
        *   Increases turret fire rate by 30% for 10 seconds.
        *   Visual effect: Orange glow on turret.
    *   *Missile Spread*:
        *   Fires 3 missiles in a spread pattern (this is an additional missile attack, separate from the gunner's standard missile).
        *   Can be used even if the regular missile is recharging.
        *   Visual effect: Red target marker appears.
    *   *Health Regen*:
        *   Restores 35% of maximum health instantly upon collection.
        *   Visual effect: Green healing aura.
    *   *EMP*:
        *   Disables the enemy ship's movement and turret controls for 2 seconds.
        *   Visual effect: Yellow electrical effect on the affected ship.

### 4. Game Objective
*   Each team has one ship.
*   The first team to destroy the opposing team's single ship wins the match.
*   The winner is displayed on screen (e.g., "Team X Wins!").

## User Experience

### User Personas
*   **Pilot**
    *   *Controls*: Joystick
    *   *Responsibilities*: Ship movement, strategic positioning, dodging enemy fire, collecting power-ups.
    *   *Skills*: Spatial awareness, quick reflexes, tactical thinking.
*   **Gunner**
    *   *Controls*: SNES controller
    *   *Responsibilities*: Turret rotation, aiming, firing turret and missiles, timing special shots (from power-ups).
    *   *Skills*: Precision aiming, timing, strategic weapon use.

### Key User Flows
*   **Game Setup**
    *   *Initial Offline Player Agreement*:
        *   Players decide on team roles (pilot/gunner).
        *   Players decide on team assignments (Team A/B).
        *   (This occurs socially before interacting with the game).
    *   *In-Game Controller Configuration*:
        *   A dedicated screen upon starting the game.
        *   Players assign physical controllers to ship/turret roles (e.g., Joystick 1 to Ship A Pilot, SNES 1 to Ship A Gunner).
        *   Confirmation of assignments.
        *   Team color selection (from predefined list: Mint Green, Purple, Coral, Light Blue). Visual preview of ship with color. System prevents both teams from selecting the same color.
        *   Ship name customization (up to 10 characters). Default names "Ship A" / "Ship B".
    *   *Game Start Sequence*:
        *   A brief countdown timer (e.g., 3-2-1-GO!).
        *   Ships spawn at randomized starting positions within the arena.
        *   Power-ups begin their spawn cycle after the match officially starts.
*   **Combat Phase**
    *   Pilots maneuver ships for offensive/defensive positioning.
    *   Gunners aim and fire turrets and missiles.
    *   Ships collect power-ups by flying through them.
    *   Teams manage ship health and try to destroy the enemy.
*   **End Game**
    *   Clear display of the winning team.
    *   Option to "Play Again" (restarts the match with current configurations).
    *   Option to "Return to Main Menu" (or controller config).

### UI/UX Considerations
*   Clear, easily readable health indicators for both ships.
*   Visible turret on each ship that rotates according to gunner input.
*   Clear visual feedback for turret firing (muzzle flash, projectiles) and missile firing.
*   Visual indicators for active power-ups on ships (e.g., glows, shield aura).
*   Clear icons/visuals for power-up items in the arena.
*   Animations for power-up collection.
*   On-screen display for remaining duration of timed power-ups.
*   Indicators for missile readiness.
*   Active power-up status indicators.
*   **Ship Identification**:
    *   Team color applied to ship accents/aura and projectiles.
    *   Name tags above ships displaying custom or default ship names in the team's chosen color. Tags should be legible, follow ships, and have a slight offset. Consider semi-transparency for tags.

## Game Environment
*   **Setting**: Outer space.
*   **Background**: Dark space with distant stars. A parallax scrolling effect for stars to enhance the sense of movement.
*   **Play Area Boundaries**: Screen edges act as solid, impassable walls. Ships cannot go off-screen.
*   **Obstacles**:
    *   3-5 randomly placed asteroids within the play area. These block movement and shots.
    *   Nebula clouds (1-2 areas) that slow down ships and projectiles passing through them.
*   **Visual Effects**:
    *   Dramatic lighting/particle effects for projectiles, impacts, and ship explosions.

## Phased Development Plan (Tailored to PRD)
This plan prioritizes getting the core 2v2 experience functional quickly.

### Phase 1: MVP - One Ship, Core Controls & Visuals
*   **Goal**: Get a single ship controllable by one pilot (joystick) and one gunner (SNES).
*   **Tasks**:
    *   Project Setup (choose engine: Godot, Unity, Bevy, etc.).
    *   Basic Input: Read joystick for movement, SNES D-pad for turret rotation, SNES button for turret fire.
    *   Ship Rendering: Draw a circular ship and a turret that visually rotates.
    *   Movement: Implement pilot-controlled ship movement within screen boundaries.
    *   Turret Firing: Implement gunner-controlled turret firing (projectiles appear).
    *   Basic Target Dummy: A static object to shoot at for testing.
    *   Collision: Projectile-target collision.

### Phase 2: Two-Team Combat & Game Loop
*   **Goal**: Full 2v2 gameplay with health, destruction, and win conditions.
*   **Tasks**:
    *   Second Ship & Controls: Add the second ship with its own pilot/gunner inputs.
    *   Health System: Implement health for both ships, damage from turret fire.
    *   Destruction: Ship explosion effect when HP is zero.
    *   Missile System: Implement gunner missile (B button, cooldown).
    *   Win Condition: First team to destroy the other wins.
    *   Basic Game Flow:
        *   Rudimentary Controller Assignment (can be hardcoded or simple console input initially).
        *   Start Game -> Combat -> "Team X Wins" message.
        *   Option to restart.
    *   Basic HUD: Health bars above ships.

### Phase 3: Configuration & UI Polish
*   **Goal**: Implement the full controller configuration and improve UI.
*   **Tasks**:
    *   Controller Configuration Screen:
        *   UI for assigning controllers to roles.
        *   Team color selection (Mint Green, Purple, Coral, Light Blue) with visual preview and duplicate prevention.
        *   Ship name customization.
    *   Apply Configurations: Ship visuals (aura/accents, projectile color) and name tags reflect choices.
    *   Enhanced HUD: Missile readiness indicators, ship name tags.
    *   Game Start Sequence: Countdown timer.
    *   End Game Screen: "Play Again" and "Return to Main Menu/Config" options.

### Phase 4: Power-Up Implementation (Iterative)
*   **Goal**: Integrate the full power-up system.
*   **Tasks**:
    *   Core Power-Up Logic: Spawning (random, timed, valid locations), despawning, collection (collision).
    *   Implement each power-up one by one (visuals, audio, game logic effect):
        *   Health Regen
        *   Speed Boost
        *   Shield
        *   Super Shot
        *   Missile Spread
        *   EMP
    *   UI for Power-Ups: Icons for active power-ups on HUD, duration timers.

### Phase 5: Environment & Final Polish
*   **Goal**: Add environmental elements and refine overall experience.
*   **Tasks**:
    *   Environmental Obstacles:
        *   Asteroids (block movement & shots).
        *   Nebula clouds (slowdown effect).
    *   Background: Parallax scrolling stars.
    *   Visual Effects: Enhance explosions, projectile impacts, muzzle flashes.
    *   Audio Integration: Implement all sound effects and background music.
    *   Testing & Balancing: Extensive playtesting to fine-tune gameplay, power-up balance, controls.

## Key Technical Considerations from PRD
*   **Input System Robustness**: This is paramount. Your chosen engine should have good support for multiple controllers. You'll spend significant time on the controller configuration screen and ensuring inputs are correctly mapped.
*   **State Synchronization (Local)**: Even without networking, ensuring the game state (who has what power-up, cooldowns, health) is consistently managed and reflected in the UI and game logic for both teams is key.
*   **Collision System**: Needs to be fairly comprehensive (ship/projectile, ship/asteroid, projectile/asteroid, ship/powerup). Most engines provide good primitives for this.
*   **Customization Logic**: Dynamically applying colors and names based on player choices will touch rendering and UI systems.

## Recommendations
*   **Start with the MVP (Phase 1)**: Get the absolute core of one pilot and one gunner controlling one ship and shooting. This will validate your input setup and basic mechanics quickly.
*   **Iterate and Test Constantly**: Especially with the controller setup, test with actual joysticks and SNES-like controllers as early and often as possible.
