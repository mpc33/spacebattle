class ConfigScene extends Phaser.Scene {
    constructor() {
        super({ key: 'ConfigScene' });
    }

    preload() {
        console.log('ConfigScene preload');
    }

    create() {
        this.cameras.main.setBackgroundColor('#222222');

        this.add.text(this.cameras.main.width / 2, 50, 'Controller Configuration', {
            fontSize: '32px',
            fill: '#ffffff',
            roundPixels: true
        }).setOrigin(0.5);

        this.rolePrompts = {};
        const yStart = 100;
        const yStep = 30;
        this.rolePrompts.pilot1 = this.add.text(50, yStart, '', { fontSize: '18px', fill: '#ffffff', roundPixels: true });
        this.rolePrompts.gunner1 = this.add.text(50, yStart + yStep, '', { fontSize: '18px', fill: '#cccccc', roundPixels: true });
        this.rolePrompts.pilot2 = this.add.text(50, yStart + yStep * 2.5, '', { fontSize: '18px', fill: '#cccccc', roundPixels: true });
        this.rolePrompts.gunner2 = this.add.text(50, yStart + yStep * 3.5, '', { fontSize: '18px', fill: '#cccccc', roundPixels: true });

        this.mainPromptText = this.add.text(this.cameras.main.width / 2, this.cameras.main.height - 100, '', {
            fontSize: '24px',
            fill: '#ffff00',
            align: 'center',
            roundPixels: true
        }).setOrigin(0.5);

        this.errorMessageText = this.add.text(this.cameras.main.width / 2, this.cameras.main.height - 60, '', {
            fontSize: '18px',
            fill: '#ff4444',
            align: 'center',
            roundPixels: true
        }).setOrigin(0.5);

        this.availableColors = [
            { name: 'Mint Green', hex: '#4BD6B4', phaserColor: new Phaser.Display.Color.HexStringToColor('#4BD6B4') },
            { name: 'Purple',     hex: '#9B6DFF', phaserColor: new Phaser.Display.Color.HexStringToColor('#9B6DFF') },
            { name: 'Coral',      hex: '#FF7E67', phaserColor: new Phaser.Display.Color.HexStringToColor('#FF7E67') },
            { name: 'Light Blue', hex: '#5BC0EB', phaserColor: new Phaser.Display.Color.HexStringToColor('#5BC0EB') }
        ];
        this.teamSelectedColors = { team1: null, team2: null };
        this.currentConfigPhase = 'controllers'; // Phases: 'controllers', 'team1Color', 'team2Color', 'team1Name', 'team2Name', 'allComplete'
        this.colorSelectionTexts = {};
        this.teamColorBoxes = { team1: [], team2: [] };
        
        // Ship Names - Initialize with defaults, will be updated by input
        this.shipNames = { team1: "Team 1", team2: "Team 2" };
        this.shipNameLabels = {}; // Phaser text objects to display the names
        this.nameInputContainers = {}; // References to HTML container divs
        this.nameInputs = {}; // References to HTML input elements
        
        this.colorSelectionTexts.team1 = this.add.text(50, yStart + yStep * 5, 'Team 1 Color: [Select]', { fontSize: '18px', fill: '#cccccc', roundPixels: true });
        this.colorSelectionTexts.team2 = this.add.text(50, yStart + yStep * 6, 'Team 2 Color: [Select]', { fontSize: '18px', fill: '#cccccc', roundPixels: true });
        
        // Phaser Text Labels for Ship Names (will be updated)
        this.shipNameLabels.team1 = this.add.text(50, yStart + yStep * 7.5, `Team 1 Name: ${this.shipNames.team1}`, { fontSize: '18px', fill: '#cccccc', roundPixels: true });
        this.shipNameLabels.team2 = this.add.text(50, yStart + yStep * 8.5, `Team 2 Name: ${this.shipNames.team2}`, { fontSize: '18px', fill: '#cccccc', roundPixels: true });
        
        this.assignedPads = { pilot1: null, gunner1: null, pilot2: null, gunner2: null };
        this.rolesToConfigure = ['pilot1', 'gunner1', 'pilot2', 'gunner2'];
        this.roleDisplayNames = {
            pilot1: 'P1 Pilot (Joystick)',
            gunner1: 'P1 Gunner (SNES)',
            pilot2: 'P2 Pilot (Joystick)',
            gunner2: 'P2 Gunner (SNES)'
        };
        this.currentConfigStepIndex = 0;
        this.isConfigComplete = false;
        this.inputListener = null;
        this.gameHasStarted = false;

        this.updateConfigPrompt();
        this.setupInputListeners();
        
        console.log('ConfigScene create - Ready for controller assignment.');
        this.createColorSelectionUI();
        this.setupNameInputElements(); // Get references and add listeners
    }

    setupInputListeners() {
        if (this.inputListener) {
            this.input.gamepad.off('down', this.inputListener);
        }
        this.input.gamepad.off('connected');

        this.inputListener = (pad, button, value) => {
            this.handleInput(pad, button, value);
        };
        this.input.gamepad.on('down', this.inputListener);

        this.input.gamepad.on('connected', (pad) => {
            console.log(`Gamepad connected in ConfigScene: ${pad.id} (Index: ${pad.index})`);
        });
    }

    createColorSelectionUI() {
        const swatchSize = 40;
        const swatchPadding = 10;
        const startXTeam1 = 300;
        const startXTeam2 = 300;
        const yTeam1TextCenter = this.colorSelectionTexts.team1.y + this.colorSelectionTexts.team1.height / 2;
        const yTeam2TextCenter = this.colorSelectionTexts.team2.y + this.colorSelectionTexts.team2.height / 2;

        const yTeam1 = yTeam1TextCenter - swatchSize / 2;
        const yTeam2 = yTeam2TextCenter - swatchSize / 2;

        this.availableColors.forEach((colorInfo, index) => {
            const x1 = startXTeam1 + index * (swatchSize + swatchPadding);
            const team1Swatch = this.add.graphics({ fillStyle: { color: colorInfo.phaserColor.color } });
            team1Swatch.fillRect(x1, yTeam1, swatchSize, swatchSize);
            team1Swatch.setData('colorInfo', colorInfo);
            team1Swatch.setData('team', 'team1');
            team1Swatch.setInteractive(new Phaser.Geom.Rectangle(x1, yTeam1, swatchSize, swatchSize), Phaser.Geom.Rectangle.Contains);
            team1Swatch.setVisible(false);
            team1Swatch.on('pointerdown', () => this.handleColorSwatchClick(team1Swatch));
            this.teamColorBoxes.team1.push(team1Swatch);

            const x2 = startXTeam2 + index * (swatchSize + swatchPadding);
            const team2Swatch = this.add.graphics({ fillStyle: { color: colorInfo.phaserColor.color } });
            team2Swatch.fillRect(x2, yTeam2, swatchSize, swatchSize);
            team2Swatch.setData('colorInfo', colorInfo);
            team2Swatch.setData('team', 'team2');
            team2Swatch.setInteractive(new Phaser.Geom.Rectangle(x2, yTeam2, swatchSize, swatchSize), Phaser.Geom.Rectangle.Contains);
            team2Swatch.setVisible(false);
            team2Swatch.on('pointerdown', () => this.handleColorSwatchClick(team2Swatch));
            this.teamColorBoxes.team2.push(team2Swatch);
        });
        console.log('Color selection UI elements created with click listeners.');
    }

    setupNameInputElements() {
        this.nameInputContainers.team1 = document.getElementById('team1-name-container');
        this.nameInputs.team1 = document.getElementById('team1-name-input');
        this.nameInputContainers.team2 = document.getElementById('team2-name-container');
        this.nameInputs.team2 = document.getElementById('team2-name-input');

        if (!this.nameInputs.team1 || !this.nameInputs.team2) {
            console.error("Could not find name input HTML elements!");
            return;
        }

        // Add Enter key listener
        this.nameInputs.team1.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' && this.currentConfigPhase === 'team1Name') {
                event.preventDefault(); // Prevent form submission/other defaults
                this.confirmNameInput('team1');
            }
        });

        this.nameInputs.team2.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' && this.currentConfigPhase === 'team2Name') {
                event.preventDefault();
                this.confirmNameInput('team2');
            }
        });
        console.log('Name input HTML elements referenced and listeners added.');
    }

    handleColorSwatchClick(swatch) {
        const colorInfo = swatch.getData('colorInfo');
        const team = swatch.getData('team');

        if (this.currentConfigPhase === 'team1Color' && team === 'team1') {
            this.teamSelectedColors.team1 = colorInfo;
            this.colorSelectionTexts.team1.setText(`Team 1 Color: ${this.teamSelectedColors.team1.name}`);
            console.log(`Team 1 selected color via click: ${this.teamSelectedColors.team1.name}`);
            this.currentConfigPhase = 'team2Color';
            this.updateConfigPrompt();
        } else if (this.currentConfigPhase === 'team2Color' && team === 'team2') {
            if (colorInfo.hex === this.teamSelectedColors.team1.hex) {
                this.errorMessageText.setText('Team 2 cannot select the same color as Team 1!');
                this.time.delayedCall(2000, () => { this.errorMessageText.setText(''); });
                console.log("Team 2 tried to select Team 1's color via click. Denied.");
            } else {
                this.teamSelectedColors.team2 = colorInfo;
                this.colorSelectionTexts.team2.setText(`Team 2 Color: ${this.teamSelectedColors.team2.name}`);
                console.log(`Team 2 selected color via click: ${this.teamSelectedColors.team2.name}`);
                this.currentConfigPhase = 'team1Name'; // Go to Team 1 Name input
                this.updateConfigPrompt();
            }
        }
    }

    confirmNameInput(team) {
        const inputElement = this.nameInputs[team];
        const containerElement = this.nameInputContainers[team];
        const labelElement = this.shipNameLabels[team];

        if (!inputElement || !containerElement || !labelElement) return;

        let newName = inputElement.value.trim();
        if (newName.length > 10) {
            newName = newName.substring(0, 10); // Truncate
        }
        
        if (newName === "") {
            // Keep default if empty
            newName = (team === 'team1') ? "Team 1" : "Team 2";
        }

        this.shipNames[team] = newName;
        labelElement.setText(`${team === 'team1' ? 'Team 1' : 'Team 2'} Name: ${newName}`);
        labelElement.setFill('#00ff00'); // Mark as confirmed
        console.log(`${team} name set to: ${newName}`);

        containerElement.style.display = 'none'; // Hide HTML input
        if (this.input.keyboard) {
            this.input.keyboard.enableGlobalCapture(); // Re-enable Phaser keyboard
        }

        // Advance phase
        if (team === 'team1') {
            this.currentConfigPhase = 'team2Name';
        } else if (team === 'team2') {
            this.currentConfigPhase = 'allComplete';
        }
        this.updateConfigPrompt();
    }

    updateConfigPrompt() {
        this.errorMessageText.setText('');

        this.teamColorBoxes.team1.forEach(box => box.setVisible(false));
        this.teamColorBoxes.team2.forEach(box => box.setVisible(false));
        // Hide HTML name inputs by default
        if (this.nameInputContainers.team1) this.nameInputContainers.team1.style.display = 'none';
        if (this.nameInputContainers.team2) this.nameInputContainers.team2.style.display = 'none';
        // Ensure Phaser keyboard capture is enabled by default
        if (this.input.keyboard && !this.input.keyboard.enabled) {
            this.input.keyboard.enableGlobalCapture();
        }

        // Reset styles
        this.colorSelectionTexts.team1.setFill(this.teamSelectedColors.team1 ? '#00ff00' : '#cccccc').setFontStyle('normal');
        this.colorSelectionTexts.team2.setFill(this.teamSelectedColors.team2 ? '#00ff00' : '#cccccc').setFontStyle('normal');
        this.shipNameLabels.team1.setFill(this.shipNames.team1 !== "Team 1" ? '#00ff00' : '#cccccc').setFontStyle('normal'); // Green if changed from default
        this.shipNameLabels.team2.setFill(this.shipNames.team2 !== "Team 2" ? '#00ff00' : '#cccccc').setFontStyle('normal'); // Green if changed from default
        
        // Update text content based on current state
        this.colorSelectionTexts.team1.setText(`Team 1 Color: ${this.teamSelectedColors.team1 ? this.teamSelectedColors.team1.name : '[Select]'}`);
        this.colorSelectionTexts.team2.setText(`Team 2 Color: ${this.teamSelectedColors.team2 ? this.teamSelectedColors.team2.name : '[Select]'}`);
        this.shipNameLabels.team1.setText(`Team 1 Name: ${this.shipNames.team1}`);
        this.shipNameLabels.team2.setText(`Team 2 Name: ${this.shipNames.team2}`);

        if (this.currentConfigPhase === 'controllers') {
            for (const role of this.rolesToConfigure) {
                const padIndex = this.assignedPads[role];
                const displayName = this.roleDisplayNames[role];
                if (padIndex !== null &&
                    this.input.gamepad &&
                    this.input.gamepad.pads &&
                    padIndex < this.input.gamepad.pads.length &&
                    this.input.gamepad.pads[padIndex] &&
                    typeof this.input.gamepad.pads[padIndex].id === 'string') {
                    const padId = this.input.gamepad.pads[padIndex].id.substring(0, 25);
                    this.rolePrompts[role].setText(`${displayName}: ${padId} [OK]`);
                    this.rolePrompts[role].setFill('#00ff00');
                } else if (padIndex !== null) {
                    this.rolePrompts[role].setText(`${displayName}: Pad ${padIndex} [OK]`);
                    this.rolePrompts[role].setFill('#00ff00');
                } else {
                     this.rolePrompts[role].setText(`${displayName}: Press button...`);
                     this.rolePrompts[role].setFill(this.rolesToConfigure[this.currentConfigStepIndex] === role ? '#ffffff' : '#888888');
                }
            } 

            if (this.currentConfigStepIndex >= this.rolesToConfigure.length) {
                this.currentConfigPhase = 'team1Color';
                this.currentConfigStepIndex = 0; 
                console.log("Controllers done. To Team 1 Color selection.");
            } else {
                const currentRoleKey = this.rolesToConfigure[this.currentConfigStepIndex];
                const currentRoleDisplayName = this.roleDisplayNames[currentRoleKey];
                this.mainPromptText.setText(`ASSIGN: ${currentRoleDisplayName}\n(Press any button on the desired controller)`);
                for (const role in this.rolePrompts) {
                    if (this.rolePrompts[role]) {
                        this.rolePrompts[role].setFill(role === currentRoleKey ? '#ffffff' : (this.assignedPads[role] !== null ? '#00ff00' : '#888888'));
                        this.rolePrompts[role].setFontStyle(role === currentRoleKey ? 'bold' : 'normal');
                    }
                }
                return; 
            }
        } 

        if (this.currentConfigPhase === 'team1Color') {
            this.mainPromptText.setText('Team 1: Select Color\n(Click a swatch)');
            this.colorSelectionTexts.team1.setFill('#ffffff').setFontStyle('bold');
            this.teamColorBoxes.team1.forEach((box) => { 
                box.setVisible(true);
                box.setAlpha(1); 
            });
            return;
        }

        if (this.currentConfigPhase === 'team2Color') {
            this.mainPromptText.setText('Team 2: Select Color\n(Click a swatch)');
            this.colorSelectionTexts.team1.setFill(this.teamSelectedColors.team1 ? '#00ff00' : '#888888').setFontStyle('normal');
            this.colorSelectionTexts.team2.setFill('#ffffff').setFontStyle('bold');
            this.teamColorBoxes.team1.forEach(box => box.setVisible(false)); 
            this.teamColorBoxes.team2.forEach((box) => { 
                box.setVisible(true);
                const isTeam1SelectedColor = this.teamSelectedColors.team1 && box.getData('colorInfo').hex === this.teamSelectedColors.team1.hex;
                if (isTeam1SelectedColor) {
                    box.setAlpha(0.3); 
                } else {
                    box.setAlpha(1); 
                }
            });
            return;
        }

        if (this.currentConfigPhase === 'team1Name') {
            this.mainPromptText.setText('Team 1: Enter Name (Max 10 chars)\nPress Enter to Confirm');
            this.shipNameLabels.team1.setFill('#ffffff').setFontStyle('bold');
            if (this.nameInputContainers.team1) {
                this.nameInputContainers.team1.style.display = 'block';
                this.nameInputs.team1.value = this.shipNames.team1 === "Team 1" ? "" : this.shipNames.team1; // Clear default for editing
                this.nameInputs.team1.focus();
                if (this.input.keyboard) this.input.keyboard.disableGlobalCapture(); // Disable Phaser keys
            }
            return;
        }

        if (this.currentConfigPhase === 'team2Name') {
            this.mainPromptText.setText('Team 2: Enter Name (Max 10 chars)\nPress Enter to Confirm');
            this.shipNameLabels.team2.setFill('#ffffff').setFontStyle('bold');
            if (this.nameInputContainers.team2) {
                this.nameInputContainers.team2.style.display = 'block';
                this.nameInputs.team2.value = this.shipNames.team2 === "Team 2" ? "" : this.shipNames.team2; // Clear default for editing
                this.nameInputs.team2.focus();
                if (this.input.keyboard) this.input.keyboard.disableGlobalCapture(); // Disable Phaser keys
            }
            return;
        }
        
        if (this.currentConfigPhase === 'allComplete') {
            this.mainPromptText.setText('All configuration complete!\nPress START (P1 Gunner) to begin.');
            this.isConfigComplete = true;
            // Final styles already set above
            return;
        }

        // Fallback: Ensure keyboard capture is enabled if somehow in an unknown state
        if (this.input.keyboard && !this.input.keyboard.enabled) {
            this.input.keyboard.enableGlobalCapture();
        }
    }

    handleInput(pad, button, value) {
        if (this.currentConfigPhase === 'controllers') {
            if (this.currentConfigStepIndex >= this.rolesToConfigure.length) {
                this.updateConfigPrompt(); // Will transition to team1Color
                return;
            }
    
            const currentRoleKey = this.rolesToConfigure[this.currentConfigStepIndex];
    
            for (const role in this.assignedPads) {
                if (this.assignedPads[role] === pad.index && role !== currentRoleKey) {
                    const existingRoleDisplayName = this.roleDisplayNames[role];
                    this.errorMessageText.setText(`Error: Pad ${pad.index} already assigned to ${existingRoleDisplayName}!`);
                    this.time.delayedCall(2500, () => { this.errorMessageText.setText(''); });
                    return;
                }
            }
            
            this.assignedPads[currentRoleKey] = pad.index;
            const assignedPadId = pad.id ? pad.id.substring(0, 25) : `Pad ${pad.index}`;
            this.rolePrompts[currentRoleKey].setText(`${this.roleDisplayNames[currentRoleKey]}: ${assignedPadId} [OK]`);
            this.rolePrompts[currentRoleKey].setFill('#00ff00');
            console.log(`${this.roleDisplayNames[currentRoleKey]} assigned to Gamepad ${pad.index} (${pad.id})`);
    
            this.currentConfigStepIndex++;
            this.updateConfigPrompt();
        } else if (this.currentConfigPhase === 'team1Color' || this.currentConfigPhase === 'team2Color' || this.currentConfigPhase === 'team1Name' || this.currentConfigPhase === 'team2Name') {
            // Color selection is mouse-only, Name input uses HTML Enter key listener. Gamepad does nothing here.
        } else if (this.currentConfigPhase === 'allComplete') {
            const p1GunnerPadIndex = this.assignedPads.gunner1;
            if (p1GunnerPadIndex !== null && pad.index === p1GunnerPadIndex && button && button.index === 9) { // START button
                console.log("P1 Gunner Start pressed. Starting game.");
                if (!this.gameHasStarted) this.startGame();
            }
        }
    }
    
    startGame() {
        console.log("LOG BEFORE SCENE START: Attempting this.scene.start('GameScene') with assignments:", this.assignedPads, 'colors:', this.teamSelectedColors, 'names:', this.shipNames);
        
        if (!this.scene.isActive('ConfigScene')) { 
            console.log("startGame() aborted: ConfigScene not active.");
            return; 
        }
        if (this.gameHasStarted) {
            console.log("startGame() aborted: gameHasStarted flag is true.");
            return;
        }
        this.gameHasStarted = true;
        console.log("gameHasStarted flag set to true.");
        
        if (this.inputListener) {
             this.input.gamepad.off('down', this.inputListener);
             this.inputListener = null;
        }
        this.input.gamepad.off('connected'); 

        this.scene.start('GameScene', {
            controllerAssignments: this.assignedPads,
            teamColors: this.teamSelectedColors,
            shipNames: this.shipNames 
        });
        console.log('LOG AFTER SCENE START: this.scene.start("GameScene") was called.');
    }

    update(time, delta) {
        // No continuous update logic needed
    }
}

export default ConfigScene;