class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    init(data) {
        console.log('GameScene init() called.');
        this.controllerAssignments = (data && data.controllerAssignments) ? data.controllerAssignments : { pilot1: 1, gunner1: 0, pilot2: 2, gunner2: 3 };
        this.teamColors = (data && data.teamColors) ? data.teamColors : { team1: { name: 'Default Mint Green', hex: '#4BD6B4' }, team2: { name: 'Default Purple', hex: '#9B6DFF' }};
        this.shipNames = (data && data.shipNames) ? data.shipNames : { team1: "Team 1", team2: "Team 2" };

        this.pilot1Pad = null; this.gunner1Pad = null; this.pilot2Pad = null; this.gunner2Pad = null;
        if (this.input.gamepad) {
            if (this.controllerAssignments.pilot1 !== null) this.pilot1Pad = this.input.gamepad.getPad(this.controllerAssignments.pilot1);
            if (this.controllerAssignments.gunner1 !== null) this.gunner1Pad = this.input.gamepad.getPad(this.controllerAssignments.gunner1);
            if (this.controllerAssignments.pilot2 !== null) this.pilot2Pad = this.input.gamepad.getPad(this.controllerAssignments.pilot2);
            if (this.controllerAssignments.gunner2 !== null) this.gunner2Pad = this.input.gamepad.getPad(this.controllerAssignments.gunner2);
        } else { console.error("Gamepad plugin not available in GameScene init."); }
        console.log('GameScene Pad references after init:', {
            pilot1: this.pilot1Pad ? `Pad ${this.pilot1Pad.index}` : 'Not Assigned/Found',
            gunner1: this.gunner1Pad ? `Pad ${this.gunner1Pad.index}` : 'Not Assigned/Found',
            pilot2: this.pilot2Pad ? `Pad ${this.pilot2Pad.index}` : 'Not Assigned/Found',
            gunner2: this.gunner2Pad ? `Pad ${this.gunner2Pad.index}` : 'Not Assigned/Found'
        });
    }

    preload() {
        console.log('GameScene preload() called.');
        let graphics = this.add.graphics();
        graphics.fillStyle(0x808080, 1); graphics.lineStyle(2, 0xffffff, 1); graphics.fillCircle(32, 32, 30); graphics.strokeCircle(32, 32, 30); graphics.generateTexture('ship_placeholder_texture', 64, 64); graphics.clear();
        graphics.fillStyle(0xaaaaaa, 1); graphics.lineStyle(1, 0xffffff, 1); graphics.fillRect(0, 0, 10, 30); graphics.strokeRect(0, 0, 10, 30); graphics.generateTexture('turret_placeholder_texture', 10, 30); graphics.clear();
        graphics.fillStyle(0xffff00, 1); graphics.fillCircle(5, 5, 5); graphics.generateTexture('projectile_placeholder_texture', 10, 10); graphics.clear();
        graphics.fillStyle(0xff0000, 1); graphics.fillRect(0, 0, 8, 16); graphics.generateTexture('missile_placeholder_texture', 8, 16); graphics.clear();
        graphics.fillStyle(0xffffff, 1); graphics.fillRect(0, 0, 24, 24); graphics.lineStyle(1, 0xaaaaaa, 1); graphics.strokeRect(0,0, 24,24); graphics.generateTexture('powerup_placeholder_texture', 24, 24); graphics.clear();
        // Asteroid Texture (Greyish, irregular circle-ish)
        // graphics.fillStyle(0x888888, 1); graphics.lineStyle(1, 0xcccccc, 1); graphics.fillCircle(30, 30, Phaser.Math.Between(25, 30)); graphics.strokeCircle(30, 30, Phaser.Math.Between(25, 30)); graphics.generateTexture('asteroid_placeholder_texture', 60, 60); graphics.clear();

        // Star textures
        graphics.fillStyle(0xffffff, 0.6); graphics.fillCircle(1, 1, 1); graphics.generateTexture('star_slow', 2, 2); graphics.clear(); // Dim, small
        graphics.fillStyle(0xffffff, 0.8); graphics.fillCircle(1.5, 1.5, 1.5); graphics.generateTexture('star_medium', 3, 3); graphics.clear(); // Medium
        graphics.fillStyle(0xffffff, 1.0); graphics.fillCircle(2, 2, 2); graphics.generateTexture('star_fast', 4, 4); graphics.clear(); // Bright, slightly larger

        graphics.destroy();
    }

    create() {
        console.log('GameScene create() called.');
        this.cameras.main.setBackgroundColor('#000033');
        this.gameplayActive = false; this.gameOver = false;

        this.shipSpeed = 200; this.projectileDamage = 10; this.missileDamage = 50;
        this.missileFireRate = 5000; this.projectileSpeed = 450; this.fireRate = 200;
        this.missileSpeed = 300;
        // this.MIN_ASTEROIDS = 5; // Increased for meteor shower
        // this.MAX_ASTEROIDS = 8; // Increased for meteor shower
        // this.ASTEROID_SPEED_MIN = 30; // Increased speed
        // this.ASTEROID_SPEED_MAX = 100; // Increased speed

        this.STAR_LAYER_SPEEDS = { slow: 0.15, medium: 0.35, fast: 0.6 };
        this.STAR_LAYER_COUNTS = { slow: 30, medium: 50, fast: 80 };

        ['winMessageText', 'playAgainText', 'returnToConfigText', 'ship1NameTag', 'ship2NameTag',
         'missileStatus1Text', 'missileStatus2Text', 'speedBoostTimerText1', 'speedBoostTimerText2',
         'shieldStatusText1', 'shieldStatusText2', 'turretBoostTimerText1', 'turretBoostTimerText2',
         'empStatusText1', 'empStatusText2', 'missileSpreadStatusText1', 'missileSpreadStatusText2'
        ].forEach(prop => {
            if (this[prop]) { this[prop].destroy(); this[prop] = null; }
        });

        this.ship = this.physics.add.sprite(100, this.cameras.main.height / 2, 'ship_placeholder_texture');
        Object.assign(this.ship, {
            maxHealth: 200, health: 200, teamId: 1, // Doubled health
            originalSpeed: this.shipSpeed, currentSpeed: this.shipSpeed, speedBoostEndTime: 0,
            shieldActive: false, shieldHealth: 0, shieldMaxHealth: 50, shieldEndTime: 0,
            originalFireRate: this.fireRate, currentFireRate: this.fireRate, turretBoostEndTime: 0, nextTurretFire: 0,
            isEmpDisabled: false, empDisableEndTime: 0,
            missileSpreadActive: false
        });
        this.ship.setCollideWorldBounds(true).setCircle(30).setActive(true).setVisible(true);
        if(this.ship.body) this.ship.body.enable = true;
        try { this.ship.originalTint = Phaser.Display.Color.HexStringToColor(this.teamColors.team1.hex).color; this.ship.setTint(this.ship.originalTint); } catch (e) { this.ship.originalTint = 0xffffff; }

        this.ship1NameTag = this.add.text(this.ship.x, this.ship.y - 55, (this.shipNames.team1 || "Team 1"), { fontSize: '16px', fill: (this.teamColors.team1.hex || '#FFFFFF'), align: 'center', backgroundColor: 'rgba(0,0,0,0.4)' }).setOrigin(0.5);
        this.turret = this.add.sprite(this.ship.x, this.ship.y, 'turret_placeholder_texture').setOrigin(0.5, 0.75).setActive(true).setVisible(true);
        this.turretAngle = -Math.PI / 2; this.shipRadius = 30; this.turretOffset = this.shipRadius * 0.9; this.turretRotationSpeed = Phaser.Math.DegToRad(3);
        this.nextMissileFireTime1 = 0;

        this.projectiles = this.physics.add.group({ defaultKey: 'projectile_placeholder_texture', maxSize: 30, runChildUpdate: true });
        this.missiles = this.physics.add.group({ defaultKey: 'missile_placeholder_texture', maxSize: 10, runChildUpdate: true });
        this.powerUps = this.physics.add.group();
        this.powerUpSpawnInterval = 10000; this.powerUpLifespan = 20000; this.nextPowerUpSpawnTime = 0; // Spawn every 10 seconds
        this.availablePowerUpTypes = ['health_regen', 'speed_boost', 'shield', 'turret_boost', 'emp', 'missile_spread'];
        console.log('Available power-up types in create:', this.availablePowerUpTypes);

        this.ship2 = this.physics.add.sprite(this.cameras.main.width - 100, this.cameras.main.height / 2, 'ship_placeholder_texture');
        Object.assign(this.ship2, {
            maxHealth: 200, health: 200, teamId: 2, // Doubled health
            originalSpeed: this.shipSpeed, currentSpeed: this.shipSpeed, speedBoostEndTime: 0,
            shieldActive: false, shieldHealth: 0, shieldMaxHealth: 50, shieldEndTime: 0,
            originalFireRate: this.fireRate, currentFireRate: this.fireRate, turretBoostEndTime: 0, nextTurretFire: 0,
            isEmpDisabled: false, empDisableEndTime: 0,
            missileSpreadActive: false
        });
        this.ship2.setCollideWorldBounds(true).setCircle(30).setActive(true).setVisible(true);
        if(this.ship2.body) this.ship2.body.enable = true;
        try { this.ship2.originalTint = Phaser.Display.Color.HexStringToColor(this.teamColors.team2.hex).color; this.ship2.setTint(this.ship2.originalTint); } catch (e) { this.ship2.originalTint = 0xffffff; }

        this.ship2NameTag = this.add.text(this.ship2.x, this.ship2.y - 55, (this.shipNames.team2 || "Team 2"), { fontSize: '16px', fill: (this.teamColors.team2.hex || '#FFFFFF'), align: 'center', backgroundColor: 'rgba(0,0,0,0.4)' }).setOrigin(0.5);
        this.turret2 = this.add.sprite(this.ship2.x, this.ship2.y, 'turret_placeholder_texture').setOrigin(0.5, 0.75).setActive(true).setVisible(true);
        this.turret2Angle = -Math.PI / 2; this.nextMissileFireTime2 = 0;

        this.healthBarWidth = 50; this.healthBarHeight = 5; this.healthBarOffsetY = -45;
        ['ship1HealthBarBg', 'ship1HealthBar', 'ship2HealthBarBg', 'ship2HealthBar'].forEach(prop => {
            if (this[prop]) this[prop].destroy(); this[prop] = this.add.graphics();
        });

        // Create Parallax Stars
        this.starLayers = {};
        this.createStarLayer('star_slow', this.STAR_LAYER_COUNTS.slow, -10, this.STAR_LAYER_SPEEDS.slow); // Deepest layer
        this.createStarLayer('star_medium', this.STAR_LAYER_COUNTS.medium, -9, this.STAR_LAYER_SPEEDS.medium);
        this.createStarLayer('star_fast', this.STAR_LAYER_COUNTS.fast, -8, this.STAR_LAYER_SPEEDS.fast);   // Closest star layer

        // Create Asteroids
        // this.asteroids = this.physics.add.group(); // Changed to dynamic group
        // for (let i = 0; i < Phaser.Math.Between(this.MIN_ASTEROIDS, this.MAX_ASTEROIDS); i++) {
        //     this.spawnAsteroid();
        // }

        // Setup Colliders
        this.physics.add.collider(this.ship, this.projectiles, this.handleProjectileHitShip, null, this);
        this.physics.add.collider(this.ship2, this.projectiles, this.handleProjectileHitShip, null, this);
        this.physics.add.overlap(this.ship, this.missiles, this.handleMissileHitShip, null, this);
        this.physics.add.overlap(this.ship2, this.missiles, this.handleMissileHitShip, null, this);
        this.physics.add.overlap(this.ship, this.powerUps, this.collectPowerUp, null, this);
        this.physics.add.overlap(this.ship2, this.powerUps, this.collectPowerUp, null, this);

        // // Asteroid Collisions
        // this.physics.add.collider(this.ship, this.asteroids);
        // this.physics.add.collider(this.ship2, this.asteroids);
        // this.physics.add.collider(this.projectiles, this.asteroids, this.handleProjectileHitAsteroid, null, this);
        // this.physics.add.collider(this.missiles, this.asteroids, this.handleMissileHitAsteroid, null, this);

        const hudTextStyle = { fontSize: '16px', fill: '#00ff00', stroke: '#000000', strokeThickness: 2 };
        const speedBoostHudStyle = { fontSize: '16px', fill: '#4488FF', stroke: '#000000', strokeThickness: 2 };
        const shieldHudStyle = { fontSize: '16px', fill: '#9370DB', stroke: '#000000', strokeThickness: 2 };
        const turretBoostHudStyle = { fontSize: '16px', fill: '#FFB800', stroke: '#000000', strokeThickness: 2 };
        const missileSpreadHudStyle = { fontSize: '16px', fill: '#ff0000', stroke: '#000000', strokeThickness: 2 }; // Red for Missile Spread

        this.missileStatus1Text = this.add.text(20, 20, '', hudTextStyle);
        this.speedBoostTimerText1 = this.add.text(20, 40, '', speedBoostHudStyle).setVisible(false);
        this.shieldStatusText1 = this.add.text(20, 60, '', shieldHudStyle).setVisible(false);
        this.turretBoostTimerText1 = this.add.text(20, 80, '', turretBoostHudStyle).setVisible(false);
        this.missileSpreadStatusText1 = this.add.text(20, 100, '', missileSpreadHudStyle).setVisible(false); // Added for T1

        this.missileStatus2Text = this.add.text(this.cameras.main.width - 20, 20, '', hudTextStyle).setOrigin(1, 0);
        this.speedBoostTimerText2 = this.add.text(this.cameras.main.width - 20, 40, '', speedBoostHudStyle).setOrigin(1, 0).setVisible(false);
        this.shieldStatusText2 = this.add.text(this.cameras.main.width - 20, 60, '', shieldHudStyle).setOrigin(1, 0).setVisible(false);
        this.turretBoostTimerText2 = this.add.text(this.cameras.main.width - 20, 80, '', turretBoostHudStyle).setOrigin(1, 0).setVisible(false);
        this.missileSpreadStatusText2 = this.add.text(this.cameras.main.width - 20, 100, '', missileSpreadHudStyle).setOrigin(1, 0).setVisible(false); // Added for T2

        this.input.gamepad.refreshPads();
        this.updateHealthBars(); this.updateNameTags();
        this.updateMissileStatusHUD(this.time.now);
        this.updateSpeedBoostHUD(this.time.now);
        this.updateShieldHUD(this.time.now);
        this.updateTurretBoostHUD(this.time.now);
        this.updateMissileSpreadHUD(); // Initialize Missile Spread HUD
        console.log("GameScene create complete.");
        this.startCountdown();
    }

    createStarLayer(textureKey, count, depth, speed) {
        const group = this.add.group();
        for (let i = 0; i < count; i++) {
            const x = Phaser.Math.Between(0, this.cameras.main.width);
            const y = Phaser.Math.Between(0, this.cameras.main.height);
            const star = group.create(x, y, textureKey);
            if (star) {
                star.setDepth(depth);
                // star.setBlendMode(Phaser.BlendModes.ADD); // Optional: for brighter stars against dark bg
            }
        }
        this.starLayers[textureKey] = { group: group, speed: speed };
    }

    // spawnAsteroid() {
    //     const worldBounds = this.physics.world.bounds;
    //     const buffer = 100; // Spawn slightly off-screen
    //     let x, y, vx, vy;
    //
    //     // Meteor shower: primarily from top
    //     x = Phaser.Math.Between(0, worldBounds.width);
    //     y = -buffer; // Start above the screen
    //     vx = Phaser.Math.Between(-this.ASTEROID_SPEED_MAX / 3, this.ASTEROID_SPEED_MAX / 3); // Some horizontal spread
    //     vy = Phaser.Math.Between(this.ASTEROID_SPEED_MIN, this.ASTEROID_SPEED_MAX); // Consistently downward
    //
    //     const asteroid = this.asteroids.create(x, y, 'asteroid_placeholder_texture');
    //     if (asteroid) {
    //         const scale = Phaser.Math.FloatBetween(0.5, 1.2); // Smaller on average
    //         asteroid.setScale(scale);
    //         const radius = (asteroid.texture.getSourceImage().width / 2) * scale * 0.8;
    //         asteroid.setCircle(radius);
    //         asteroid.setCollideWorldBounds(false); // Allow to go off-screen
    //         asteroid.setBounce(0.8); // Prevent freezing on collision
    //         asteroid.setVelocity(vx, vy);
    //         asteroid.setAngularVelocity(Phaser.Math.Between(-60, 60)); // Add some spin
    //         // asteroid.setMass(5); // Give some mass if needed for interactions
    //         // console.log(`Spawned asteroid at (${x.toFixed(0)}, ${y.toFixed(0)}) with velocity (${vx.toFixed(0)}, ${vy.toFixed(0)})`);
    //     }
    // }

    updateMissileStatusHUD(time) {
        const readyColor = '#00ff00', cooldownColor = '#ffff00';
        if (this.missileStatus1Text) {
            const team1Name = this.shipNames?.team1 || "Team 1"; // Use optional chaining and fallback
            if (time >= this.nextMissileFireTime1) this.missileStatus1Text.setText(`${team1Name} Missile: READY`).setFill(readyColor);
            else this.missileStatus1Text.setText(`${team1Name} Missile: ${Math.ceil((this.nextMissileFireTime1 - time) / 1000)}s`).setFill(cooldownColor);
        }
        if (this.missileStatus2Text) {
            const team2Name = this.shipNames?.team2 || "Team 2"; // Use optional chaining and fallback
            if (time >= this.nextMissileFireTime2) this.missileStatus2Text.setText(`${team2Name} Missile: READY`).setFill(readyColor);
            else this.missileStatus2Text.setText(`${team2Name} Missile: ${Math.ceil((this.nextMissileFireTime2 - time) / 1000)}s`).setFill(cooldownColor);
        }
    }

    updateSpeedBoostHUD(time) {
        const updateText = (textObject, ship) => {
            if (textObject && ship && ship.speedBoostEndTime > 0 && this.time.now < ship.speedBoostEndTime) {
                textObject.setText(`Speed Boost: ${Math.ceil((ship.speedBoostEndTime - this.time.now) / 1000)}s`).setVisible(true);
            } else if (textObject) {
                textObject.setVisible(false);
            }
        };
        updateText(this.speedBoostTimerText1, this.ship);
        updateText(this.speedBoostTimerText2, this.ship2);
    }

    updateShieldHUD(time) {
        const updateText = (textObject, ship) => {
            if (textObject && ship && ship.shieldActive) {
                const remainingTime = Math.ceil((ship.shieldEndTime > 0 ? (ship.shieldEndTime - this.time.now) : 0) / 1000);
                textObject.setText(`Shield: ${ship.shieldHealth}HP / ${remainingTime > 0 ? remainingTime : 0}s`).setVisible(true);
            } else if (textObject) {
                textObject.setVisible(false);
            }
        };
        updateText(this.shieldStatusText1, this.ship);
        updateText(this.shieldStatusText2, this.ship2);
    }

    updateTurretBoostHUD(time) {
        const updateText = (textObject, ship) => {
            if (textObject && ship && ship.turretBoostEndTime > 0 && this.time.now < ship.turretBoostEndTime) {
                textObject.setText(`Turret Boost: ${Math.ceil((ship.turretBoostEndTime - this.time.now) / 1000)}s`).setVisible(true);
            } else if (textObject) {
                textObject.setVisible(false);
            }
        };
        updateText(this.turretBoostTimerText1, this.ship);
        updateText(this.turretBoostTimerText2, this.ship2);
    }

    updateMissileSpreadHUD() {
        const updateText = (textObject, ship) => {
            if (textObject && ship && ship.missileSpreadActive) {
                textObject.setText('Triple Shot: READY').setVisible(true);
            } else if (textObject) {
                textObject.setVisible(false);
            }
        };
        updateText(this.missileSpreadStatusText1, this.ship);
        updateText(this.missileSpreadStatusText2, this.ship2);
    }

    startCountdown() {
        this.gameplayActive = false;
        let countdown = 3;
        const countdownText = this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2, String(countdown), {
            fontSize: '128px', fill: '#fff', align: 'center', stroke: '#000', strokeThickness: 6
        }).setOrigin(0.5).setDepth(200);

        const countdownEvent = this.time.addEvent({
            delay: 1000,
            callback: () => {
                countdown--;
                if (countdown > 0) {
                    countdownText.setText(String(countdown));
                } else if (countdown === 0) {
                    countdownText.setText('GO!');
                } else {
                    countdownText.destroy();
                    this.gameplayActive = true;
                    this.nextPowerUpSpawnTime = this.time.now + this.powerUpSpawnInterval;
                    countdownEvent.remove();
                }
            },
            loop: true
        });
    }

    attemptSpawnPowerUp(time) {
        if (!this.gameplayActive) return;
        const edgePadding = 50, minPlayerDist = 120, minPowerUpDist = 80, maxAttempts = 10;
        let validSpawn = false, spawnX, spawnY;
        for (let attempts = 0; attempts < maxAttempts; attempts++) {
            spawnX = Phaser.Math.Between(edgePadding, this.cameras.main.width - edgePadding);
            spawnY = Phaser.Math.Between(edgePadding, this.cameras.main.height - edgePadding);
            validSpawn = true;
            if (this.ship.active && Phaser.Math.Distance.Between(spawnX, spawnY, this.ship.x, this.ship.y) < minPlayerDist) validSpawn = false;
            if (validSpawn && this.ship2.active && Phaser.Math.Distance.Between(spawnX, spawnY, this.ship2.x, this.ship2.y) < minPlayerDist) validSpawn = false;
            if (validSpawn) {
                for (const existingPowerUp of this.powerUps.getChildren()) {
                    if (existingPowerUp.active && Phaser.Math.Distance.Between(spawnX, spawnY, existingPowerUp.x, existingPowerUp.y) < minPowerUpDist) {
                        validSpawn = false; break;
                    }
                }
            }
            // // Also check distance from asteroids
            // if (validSpawn && this.asteroids) {
            //      this.asteroids.getChildren().forEach(asteroid => {
            //         // Use displayWidth/Height which accounts for scale
            //         if (Phaser.Math.Distance.Between(spawnX, spawnY, asteroid.x, asteroid.y) < (asteroid.displayWidth / 2 + 40)) { // Avoid spawning too close to asteroids
            //             validSpawn = false;
            //         }
            //     });
            // }
            if (validSpawn) break;
        }
        if (validSpawn) {
            const powerUp = this.powerUps.create(spawnX, spawnY, 'powerup_placeholder_texture');
            if (powerUp) {
                const randomType = Phaser.Math.RND.pick(this.availablePowerUpTypes);
                console.log(`Attempting to spawn. Randomly selected type: ${randomType}`);
                powerUp.setData('spawnTime', time);
                powerUp.setData('type', randomType);
                if (randomType === 'health_regen') powerUp.setTint(0x00FF00);
                else if (randomType === 'speed_boost') powerUp.setTint(0x4488FF);
                else if (randomType === 'shield') powerUp.setTint(0x9370DB);
                else if (randomType === 'turret_boost') powerUp.setTint(0xFFB800);
                else if (randomType === 'emp') powerUp.setTint(0x00FFFF);
                else if (randomType === 'missile_spread') powerUp.setTint(0xFF4500); // Fiery red/orange for missile spread
                else console.warn(`Unknown power-up type for tinting: ${randomType}`);
                console.log(`Power-up (${randomType}) spawned at (${spawnX}, ${spawnY})`);

                // Add pulsating tween
                this.tweens.add({
                    targets: powerUp,
                    scale: 1.25, // Pulsate to 125% of original size
                    duration: 600, // Duration of one pulse (half a cycle)
                    yoyo: true,    // Scale back down to original
                    repeat: -1,    // Loop indefinitely
                    ease: 'Sine.easeInOut' // Smooth easing function
                });
            }
        } else console.log("Failed to find valid spawn location for power-up after " + maxAttempts + " attempts.");
        this.nextPowerUpSpawnTime = time + this.powerUpSpawnInterval;
    }

    collectPowerUp(ship, powerUp) {
        if (!powerUp.active) return;
        const powerUpType = powerUp.getData('type');
        console.log(`Ship ${ship.teamId} collected power-up of type ${powerUpType}`);

        if (powerUpType === 'health_regen') {
            const healthToRestore = ship.maxHealth * 0.35;
            ship.health = Math.min(ship.maxHealth, ship.health + healthToRestore);
            this.updateHealthBars();
        } else if (powerUpType === 'speed_boost') {
            ship.currentSpeed = ship.originalSpeed * 2.0;
            ship.speedBoostEndTime = this.time.now + 10000;
        } else if (powerUpType === 'shield') {
            ship.shieldActive = true;
            ship.shieldHealth = ship.shieldMaxHealth;
            ship.shieldEndTime = this.time.now + 8000; // Increased shield duration to 8 seconds
            ship.setTint(0x9370DB);
        } else if (powerUpType === 'turret_boost') {
            ship.currentFireRate = ship.originalFireRate / 2;
            ship.turretBoostEndTime = this.time.now + 8000;
        } else if (powerUpType === 'emp') {
            const opponentShip = (ship === this.ship) ? this.ship2 : this.ship;
            if (opponentShip && opponentShip.active) {
                opponentShip.isEmpDisabled = true;
                opponentShip.empDisableEndTime = this.time.now + 3000;
                opponentShip.setTint(0x888888);
                console.log(`Ship ${opponentShip.teamId} is EMP'd by Ship ${ship.teamId}!`);
            }
        } else if (powerUpType === 'missile_spread') {
            ship.missileSpreadActive = true;
            console.log(`Ship ${ship.teamId} Missile Spread collected!`);
            // Visual indicator is now handled by updateMissileSpreadHUD
        }
        this.powerUps.killAndHide(powerUp);
        if (powerUp.body) powerUp.body.enable = false;
        this.updateShieldHUD(this.time.now);
        this.updateSpeedBoostHUD(this.time.now);
        this.updateTurretBoostHUD(this.time.now);
        this.updateMissileSpreadHUD(); // Update immediately on collect
    }

    update(time, delta) {
        if (this.gameOver) {
            if (this.gunner1Pad && this.gunner1Pad.buttons[9] && this.gunner1Pad.buttons[9].pressed) { this.gameOver = false; this.scene.restart(); return; }
            else if (this.gunner1Pad && this.gunner1Pad.buttons[8] && this.gunner1Pad.buttons[8].pressed) { this.gameOver = false; this.scene.start('ConfigScene'); return; }
            return;
        }
        if (!this.gameplayActive) {
            if (this.ship && this.ship.body) this.ship.setVelocity(0,0);
            if (this.ship2 && this.ship2.body) this.ship2.setVelocity(0,0);
            return;
        }

        if (time > this.nextPowerUpSpawnTime) this.attemptSpawnPowerUp(time);
        this.powerUps.getChildren().forEach(powerUp => {
            if (powerUp.active && time > powerUp.getData('spawnTime') + this.powerUpLifespan) {
                this.powerUps.killAndHide(powerUp); if (powerUp.body) powerUp.body.enable = false;
            }
        });

        [this.ship, this.ship2].forEach(s => {
            if (!s || !s.active) return;

            if (s.speedBoostEndTime > 0 && time > s.speedBoostEndTime) {
                s.currentSpeed = s.originalSpeed; s.speedBoostEndTime = 0;
                if (s.tint !== s.originalTint && !s.shieldActive && !s.isEmpDisabled) {
                     if (s.originalTint !== 0xffffff) s.setTint(s.originalTint); else s.clearTint();
                }
                console.log(`Ship ${s.teamId} Speed Boost expired.`);
            }
            if (s.shieldActive && s.shieldEndTime > 0 && time > s.shieldEndTime && s.shieldHealth > 0) {
                s.shieldActive = false; s.shieldHealth = 0; s.shieldEndTime = 0;
                if (s.originalTint !== 0xffffff) s.setTint(s.originalTint); else s.clearTint();
                console.log(`Shield on Ship ${s.teamId} expired by time.`);
            }
            if (s.turretBoostEndTime > 0 && time > s.turretBoostEndTime) {
                s.currentFireRate = s.originalFireRate;
                s.turretBoostEndTime = 0;
                console.log(`Ship ${s.teamId} Turret Boost expired.`);
            }
            if (s.isEmpDisabled && time > s.empDisableEndTime) {
                s.isEmpDisabled = false; s.empDisableEndTime = 0;
                if (s.originalTint !== 0xffffff) s.setTint(s.originalTint); else s.clearTint();
                console.log(`Ship ${s.teamId} EMP effect expired.`);
            }
        });

        // Parallax Stars Update
        for (const layerKey in this.starLayers) {
            const layer = this.starLayers[layerKey];
            layer.group.getChildren().forEach(star => {
                star.y += layer.speed * (delta / 16.666); // Changed to star.y and += for downward scroll
                if (star.y > this.cameras.main.height + star.displayHeight / 2) { // Check if off bottom edge
                    star.y = -star.displayHeight / 2; // Reposition to top edge
                    star.x = Phaser.Math.Between(0, this.cameras.main.width); // Randomize x on wrap
                }
            });
        }

        // // Asteroid screen wrapping / recycling & continuous spawning
        // const worldBounds = this.physics.world.bounds;
        // const offScreenBuffer = 150;
        //
        // let asteroidsDestroyedThisFrame = 0;
        // // Iterate over a copy of the children array for safe removal during iteration
        // if (this.asteroids) { // Check if asteroids group exists
        //     const currentAsteroids = [...this.asteroids.getChildren()];
        //
        //     currentAsteroids.forEach(asteroid => {
        //         if (!asteroid.active) return; // Skip if already destroyed or inactive
        //
        //         if (asteroid.x < -offScreenBuffer || asteroid.x > worldBounds.width + offScreenBuffer ||
        //             asteroid.y < -offScreenBuffer || asteroid.y > worldBounds.height + offScreenBuffer) {
        //             // console.log('Asteroid off screen, destroying.'); // Optional: for debugging
        //             asteroid.destroy(); // Marks for destruction
        //             asteroidsDestroyedThisFrame++;
        //         }
        //     });
        //
        //     // Maintain asteroid count
        //     const activeAsteroidCount = this.asteroids.countActive(true);
        //
        //     if (asteroidsDestroyedThisFrame > 0) {
        //         for (let i = 0; i < asteroidsDestroyedThisFrame; i++) {
        //             if (this.asteroids.countActive(true) < this.MAX_ASTEROIDS) {
        //                 // this.spawnAsteroid(); // Don't spawn new ones if commented out
        //             } else {
        //                 break;
        //             }
        //         }
        //     } else if (this.gameplayActive && activeAsteroidCount < this.MIN_ASTEROIDS) {
        //         // Fallback if count drops below min for other reasons
        //         // this.spawnAsteroid(); // Don't spawn new ones if commented out
        //     }
        // }
        
        // Ship 1 Movement & Firing
        if (this.ship.active) {
            if (!this.ship.isEmpDisabled && this.pilot1Pad && this.pilot1Pad.connected && this.pilot1Pad.axes.length >= 2) {
                let moveX = this.pilot1Pad.axes[0].value; let moveY = this.pilot1Pad.axes[1].value;
                if (Math.abs(moveX) < 0.1) moveX = 0; if (Math.abs(moveY) < 0.1) moveY = 0;
                this.ship.setVelocityX(moveX * this.ship.currentSpeed); this.ship.setVelocityY(moveY * this.ship.currentSpeed);
            } else {
                 this.ship.setVelocity(0,0);
            }
            if (this.turret.active && !this.ship.isEmpDisabled && this.gunner1Pad && this.gunner1Pad.connected) {
                if (this.gunner1Pad.buttons[4] && this.gunner1Pad.buttons[4].pressed) this.turretAngle -= this.turretRotationSpeed;
                if (this.gunner1Pad.buttons[5] && this.gunner1Pad.buttons[5].pressed) this.turretAngle += this.turretRotationSpeed;
                if (this.gunner1Pad.buttons[1] && this.gunner1Pad.buttons[1].pressed && time > this.ship.nextTurretFire) this.fireTurret(time);
                if (this.gunner1Pad.buttons[0] && this.gunner1Pad.buttons[0].pressed && time > this.nextMissileFireTime1) this.fireMissile1(time);
            }
            if (this.turret.active) {
                 this.turret.rotation = this.turretAngle + Math.PI / 2;
                 this.turret.setPosition(this.ship.x + this.turretOffset * Math.cos(this.turretAngle), this.ship.y + this.turretOffset * Math.sin(this.turretAngle));
            }
        }

        // Ship 2 Movement & Firing
        if (this.ship2.active) {
            if (!this.ship2.isEmpDisabled && this.pilot2Pad && this.pilot2Pad.connected && this.pilot2Pad.axes.length >= 2) {
                let moveX2 = this.pilot2Pad.axes[0].value; let moveY2 = this.pilot2Pad.axes[1].value;
                if (Math.abs(moveX2) < 0.1) moveX2 = 0; if (Math.abs(moveY2) < 0.1) moveY2 = 0;
                this.ship2.setVelocityX(moveX2 * this.ship2.currentSpeed); this.ship2.setVelocityY(moveY2 * this.ship2.currentSpeed);
            } else {
                this.ship2.setVelocity(0,0);
            }
            if (this.turret2.active && !this.ship2.isEmpDisabled && this.gunner2Pad && this.gunner2Pad.connected) {
                if (this.gunner2Pad.buttons[4] && this.gunner2Pad.buttons[4].pressed) this.turret2Angle -= this.turretRotationSpeed;
                if (this.gunner2Pad.buttons[5] && this.gunner2Pad.buttons[5].pressed) this.turret2Angle += this.turretRotationSpeed;
                if (this.gunner2Pad.buttons[1] && this.gunner2Pad.buttons[1].pressed && time > this.ship2.nextTurretFire) this.fireTurret2(time);
                if (this.gunner2Pad.buttons[0] && this.gunner2Pad.buttons[0].pressed && time > this.nextMissileFireTime2) this.fireMissile2(time);
            }
             if (this.turret2.active) {
                this.turret2.rotation = this.turret2Angle + Math.PI / 2;
                this.turret2.setPosition(this.ship2.x + this.turretOffset * Math.cos(this.turret2Angle), this.ship2.y + this.turretOffset * Math.sin(this.turret2Angle));
            }
        }

        this.projectiles.getChildren().forEach(p => { if (p.active && !this.cameras.main.worldView.contains(p.x, p.y)) { this.projectiles.killAndHide(p); if(p.body)p.body.stop();}});
        this.missiles.getChildren().forEach(m => { if (m.active && !this.cameras.main.worldView.contains(m.x, m.y)) { this.missiles.killAndHide(m); if(m.body){m.body.stop();m.body.enable=false;}}});

        this.updateHealthBars(); this.updateNameTags();
        this.updateMissileStatusHUD(time); this.updateSpeedBoostHUD(time); this.updateShieldHUD(time); this.updateTurretBoostHUD(time); this.updateMissileSpreadHUD(); // Update Missile Spread HUD in main loop
    }

    updateNameTags() {
        const nameTagOffsetY = -55;
        if (this.ship1NameTag && this.ship && this.ship.active) {
            this.ship1NameTag.setPosition(this.ship.x, this.ship.y + nameTagOffsetY).setVisible(true);
        } else if (this.ship1NameTag) this.ship1NameTag.setVisible(false);
        if (this.ship2NameTag && this.ship2 && this.ship2.active) {
            this.ship2NameTag.setPosition(this.ship2.x, this.ship2.y + nameTagOffsetY).setVisible(true);
        } else if (this.ship2NameTag) this.ship2NameTag.setVisible(false);
    }

    fireTurret(time) {
        this.ship.nextTurretFire = time + this.ship.currentFireRate;
        const projectile = this.projectiles.get();
        if (projectile) {
            if (projectile.body) projectile.body.enable = true;
            const muzzleOffsetDistance = this.turret.height / 2;
            const startX = this.turret.x + Math.cos(this.turretAngle) * muzzleOffsetDistance;
            const startY = this.turret.y + Math.sin(this.turretAngle) * muzzleOffsetDistance;
            projectile.setPosition(startX, startY).setRotation(this.turretAngle + Math.PI / 2).setActive(true).setVisible(true).setCircle(5);
            projectile.firedBy = this.ship.teamId;
            // projectile.setTint(this.ship.originalTint); // Apply team color - User denied this change
            projectile.setVelocity(Math.cos(this.turretAngle) * this.projectileSpeed, Math.sin(this.turretAngle) * this.projectileSpeed);
            if(projectile.body) projectile.body.setCollideWorldBounds(false);
        }
    }

    fireTurret2(time) {
        this.ship2.nextTurretFire = time + this.ship2.currentFireRate;
        const projectile = this.projectiles.get();
        if (projectile) {
            if (projectile.body) projectile.body.enable = true;
            const muzzleOffsetDistance = this.turret2.height / 2;
            const startX = this.turret2.x + Math.cos(this.turret2Angle) * muzzleOffsetDistance;
            const startY = this.turret2.y + Math.sin(this.turret2Angle) * muzzleOffsetDistance;
            projectile.setPosition(startX, startY).setRotation(this.turret2Angle + Math.PI / 2).setActive(true).setVisible(true).setCircle(5);
            projectile.firedBy = this.ship2.teamId;
            // projectile.setTint(this.ship2.originalTint); // Apply team color - User denied this change
            projectile.setVelocity(Math.cos(this.turret2Angle) * this.projectileSpeed, Math.sin(this.turret2Angle) * this.projectileSpeed);
            if(projectile.body) projectile.body.setCollideWorldBounds(false);
        }
    }

    fireMissile1(time) {
        this.nextMissileFireTime1 = time + this.missileFireRate; // Cooldown applies whether it's spread or single

        if (this.ship.missileSpreadActive) {
            const spreadAngle = Phaser.Math.DegToRad(15); // 15 degrees spread on each side
            const angles = [this.turretAngle - spreadAngle, this.turretAngle, this.turretAngle + spreadAngle];

            for (const angle of angles) {
                const missile = this.missiles.get();
                if (missile) {
                    if (missile.body) missile.body.enable = true;
                    const muzzleOffsetDistance = this.turret.height / 2;
                    const startX = this.turret.x + Math.cos(this.turretAngle) * muzzleOffsetDistance; // Fire from center of turret for all
                    const startY = this.turret.y + Math.sin(this.turretAngle) * muzzleOffsetDistance;
                    missile.setPosition(startX, startY).setRotation(angle + Math.PI / 2).setActive(true).setVisible(true);
                    missile.firedBy = this.ship.teamId;
                    // missile.setTint(this.ship.originalTint); // Apply team color - User denied this change
                    missile.setVelocity(Math.cos(angle) * this.missileSpeed, Math.sin(angle) * this.missileSpeed);
                    if(missile.body) missile.body.setCollideWorldBounds(false);
                }
            }
            this.ship.missileSpreadActive = false;
            this.updateMissileSpreadHUD(); // Update HUD immediately after firing spread
            console.log("Ship 1 fired missile spread.");
            return;
        }

        // Normal single missile fire
        const missile = this.missiles.get();
        if (missile) {
            if (missile.body) missile.body.enable = true;
            const muzzleOffsetDistance = this.turret.height / 2;
            const startX = this.turret.x + Math.cos(this.turretAngle) * muzzleOffsetDistance;
            const startY = this.turret.y + Math.sin(this.turretAngle) * muzzleOffsetDistance;
            missile.setPosition(startX, startY).setRotation(this.turretAngle + Math.PI / 2).setActive(true).setVisible(true);
            missile.firedBy = this.ship.teamId;
            // missile.setTint(this.ship.originalTint); // Apply team color - User denied this change
            missile.setVelocity(Math.cos(this.turretAngle) * this.missileSpeed, Math.sin(this.turretAngle) * this.missileSpeed);
            if(missile.body) missile.body.setCollideWorldBounds(false);
        }
    }

    fireMissile2(time) {
        this.nextMissileFireTime2 = time + this.missileFireRate; // Cooldown applies

        if (this.ship2.missileSpreadActive) {
            const spreadAngle = Phaser.Math.DegToRad(15);
            const angles = [this.turret2Angle - spreadAngle, this.turret2Angle, this.turret2Angle + spreadAngle];

            for (const angle of angles) {
                const missile = this.missiles.get();
                if (missile) {
                    if (missile.body) missile.body.enable = true;
                    const muzzleOffsetDistance = this.turret2.height / 2;
                    const startX = this.turret2.x + Math.cos(this.turret2Angle) * muzzleOffsetDistance;
                    const startY = this.turret2.y + Math.sin(this.turret2Angle) * muzzleOffsetDistance;
                    missile.setPosition(startX, startY).setRotation(angle + Math.PI / 2).setActive(true).setVisible(true);
                    missile.firedBy = this.ship2.teamId;
                    // missile.setTint(this.ship2.originalTint); // Apply team color - User denied this change
                    missile.setVelocity(Math.cos(angle) * this.missileSpeed, Math.sin(angle) * this.missileSpeed);
                    if(missile.body) missile.body.setCollideWorldBounds(false);
                }
            }
            this.ship2.missileSpreadActive = false;
            this.updateMissileSpreadHUD(); // Update HUD immediately after firing spread
            console.log("Ship 2 fired missile spread.");
            return;
        }

        // Normal single missile fire
        const missile = this.missiles.get();
        if (missile) {
            if (missile.body) missile.body.enable = true;
            const muzzleOffsetDistance = this.turret2.height / 2;
            const startX = this.turret2.x + Math.cos(this.turret2Angle) * muzzleOffsetDistance;
            const startY = this.turret2.y + Math.sin(this.turret2Angle) * muzzleOffsetDistance;
            missile.setPosition(startX, startY).setRotation(this.turret2Angle + Math.PI / 2).setActive(true).setVisible(true);
            missile.firedBy = this.ship2.teamId;
            // missile.setTint(this.ship2.originalTint); // Apply team color - User denied this change
            missile.setVelocity(Math.cos(this.turret2Angle) * this.missileSpeed, Math.sin(this.turret2Angle) * this.missileSpeed);
            if(missile.body) missile.body.setCollideWorldBounds(false);
        }
    }

    updateHealthBars() {
        if (this.ship1HealthBar && this.ship1HealthBarBg) {
            if (this.ship && this.ship.active) {
                this.ship1HealthBarBg.setVisible(true); this.ship1HealthBar.setVisible(true);
                const x1 = this.ship.x - this.healthBarWidth / 2, y1 = this.ship.y + this.healthBarOffsetY;
                this.ship1HealthBarBg.clear().fillStyle(0x550000, 0.8).fillRect(x1, y1, this.healthBarWidth, this.healthBarHeight);
                this.ship1HealthBar.clear().fillStyle(0x00ff00, 0.9).fillRect(x1, y1, Math.max(0, (this.ship.health / this.ship.maxHealth) * this.healthBarWidth), this.healthBarHeight);
            } else { this.ship1HealthBarBg.setVisible(false); this.ship1HealthBar.setVisible(false); }
        }
        if (this.ship2HealthBar && this.ship2HealthBarBg) {
            if (this.ship2 && this.ship2.active) {
                this.ship2HealthBarBg.setVisible(true); this.ship2HealthBar.setVisible(true);
                const x2 = this.ship2.x - this.healthBarWidth / 2, y2 = this.ship2.y + this.healthBarOffsetY;
                this.ship2HealthBarBg.clear().fillStyle(0x550000, 0.8).fillRect(x2, y2, this.healthBarWidth, this.healthBarHeight);
                this.ship2HealthBar.clear().fillStyle(0x00ff00, 0.9).fillRect(x2, y2, Math.max(0, (this.ship2.health / this.ship2.maxHealth) * this.healthBarWidth), this.healthBarHeight);
            } else { this.ship2HealthBarBg.setVisible(false); this.ship2HealthBar.setVisible(false); }
        }
    }

    handleProjectileHitShip(shipHit, projectile) {
        if (!projectile.active || !shipHit.active) return;
        if (shipHit.shieldActive) {
            shipHit.shieldHealth -= this.projectileDamage;
            this.projectiles.killAndHide(projectile); if (projectile.body) projectile.body.enable = false;
            if (shipHit.shieldHealth <= 0) {
                shipHit.shieldActive = false; shipHit.shieldEndTime = 0; shipHit.shieldHealth = 0;
                if (shipHit.originalTint !== 0xffffff) shipHit.setTint(shipHit.originalTint); else shipHit.clearTint();
                console.log(`Shield on Ship ${shipHit.teamId} broke from damage.`);
            }
            this.updateShieldHUD(this.time.now); return;
        }
        if (projectile.firedBy && projectile.firedBy !== shipHit.teamId) {
            this.projectiles.killAndHide(projectile); if (projectile.body) projectile.body.enable = false;
            shipHit.health -= this.projectileDamage; this.updateHealthBars();
            if (shipHit.health <= 0) {
                shipHit.setActive(false).setVisible(false); if (shipHit.body) shipHit.body.enable = false;
                if (shipHit === this.ship) this.turret.setVisible(false); else if (shipHit === this.ship2) this.turret2.setVisible(false);
                this.announceWinner(shipHit.teamId === 1 ? 2 : 1);
            } else {
                shipHit.setTint(0xff0000);
                this.time.delayedCall(100, () => { if (shipHit.active) { if (shipHit.originalTint !== 0xffffff) shipHit.setTint(shipHit.originalTint); else shipHit.clearTint(); }});
            }
        } else if (projectile.firedBy === shipHit.teamId || !projectile.firedBy) {
             this.projectiles.killAndHide(projectile); if (projectile.body) projectile.body.enable = false;
        }
    }

    handleMissileHitShip(shipHit, missile) {
        if (!missile.active || !shipHit.active) return;
        if (shipHit.shieldActive) {
            shipHit.shieldHealth -= this.missileDamage;
            this.missiles.killAndHide(missile); if (missile.body) missile.body.enable = false;
            if (shipHit.shieldHealth <= 0) {
                shipHit.shieldActive = false; shipHit.shieldEndTime = 0; shipHit.shieldHealth = 0;
                if (shipHit.originalTint !== 0xffffff) shipHit.setTint(shipHit.originalTint); else shipHit.clearTint();
                console.log(`Shield on Ship ${shipHit.teamId} broke from missile damage.`);
            }
            this.updateShieldHUD(this.time.now); return;
        }
        if (missile.firedBy && missile.firedBy !== shipHit.teamId) {
            this.missiles.killAndHide(missile); if (missile.body) missile.body.enable = false;
            shipHit.health -= this.missileDamage; this.updateHealthBars();
            if (shipHit.health <= 0) {
                shipHit.setActive(false).setVisible(false); if (shipHit.body) shipHit.body.enable = false;
                if (shipHit === this.ship) this.turret.setVisible(false); else if (shipHit === this.ship2) this.turret2.setVisible(false);
                this.announceWinner(shipHit.teamId === 1 ? 2 : 1);
            } else {
                shipHit.setTint(0xffaa00);
                this.time.delayedCall(150, () => { if (shipHit.active) { if (shipHit.originalTint !== 0xffffff) shipHit.setTint(shipHit.originalTint); else shipHit.clearTint(); }});
            }
        } else if (missile.firedBy === shipHit.teamId || !missile.firedBy) {
            this.missiles.killAndHide(missile); if (missile.body) missile.body.enable = false;
        }
    }

    // handleProjectileHitAsteroid(projectile, asteroid) {
    //     // Projectile is destroyed, asteroid is unharmed
    //     this.projectiles.killAndHide(projectile);
    //     if (projectile.body) projectile.body.enable = false;
    //     // Optional: Add a small visual effect (spark?) at collision point
    // }

    // handleMissileHitAsteroid(missile, asteroid) {
    //     // Missile is destroyed, asteroid is unharmed
    //     this.missiles.killAndHide(missile);
    //     if (missile.body) missile.body.enable = false;
    //     // Optional: Add a small explosion visual effect at collision point
    // }

    announceWinner(winningTeamId) {
        if (this.gameOver) return; this.gameOver = true;
        console.log(`Game Over! Team ${winningTeamId} Wins!`);
        this.projectiles.getChildren().forEach(p => { p.setActive(false).setVisible(false); if(p.body) p.body.enable = false; });
        this.missiles.getChildren().forEach(m => { m.setActive(false).setVisible(false); if(m.body) m.body.enable = false; });
        const message = `Team ${winningTeamId} Wins!`;
        if (this.winMessageText) this.winMessageText.destroy();
        this.winMessageText = this.add.text(this.cameras.main.width/2, this.cameras.main.height/2, message, { fontSize: '64px', fill: '#fff', backgroundColor: '#000000cc', padding: {x:20,y:10} }).setOrigin(0.5).setDepth(100);
        if (this.playAgainText) this.playAgainText.destroy();
        this.playAgainText = this.add.text(this.cameras.main.width/2, this.cameras.main.height/2 + 70, "START (P1 Gunner) to Play Again", { fontSize: '28px', fill: '#dddddd', backgroundColor: '#000000cc', padding: {x:10,y:5} }).setOrigin(0.5).setDepth(100);
        if (this.returnToConfigText) this.returnToConfigText.destroy();
        this.returnToConfigText = this.add.text(this.cameras.main.width/2, this.cameras.main.height/2 + 115, "SELECT (P1 Gunner) for New Config", { fontSize: '28px', fill: '#cccccc', backgroundColor: '#000000cc', padding: {x:10,y:5} }).setOrigin(0.5).setDepth(100);
    }
}

export default GameScene;
