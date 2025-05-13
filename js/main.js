import ConfigScene from './scenes/ConfigScene.js';
import GameScene from './scenes/GameScene.js';
// We'll create BootScene later if needed for preloading assets.

const config = {
    type: Phaser.AUTO, // Automatically detect WebGL or Canvas
    width: 800,        // Game width in pixels
    height: 600,       // Game height in pixels
    parent: 'phaser-example', // ID of the DOM element to parent the canvas to (optional, Phaser creates one if not found)
    physics: {
        default: 'arcade',
        arcade: {
            // gravity: { y: 0 }, // No gravity needed for a top-down space shooter
            debug: false // Set to true for physics debugging visuals
        }
    },
    input: {
        gamepad: true
    },
    scene: [
        // BootScene, // Will be added later if complex preloading is needed
        ConfigScene,
        GameScene
    ]
};

const game = new Phaser.Game(config);