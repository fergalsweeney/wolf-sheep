class MenuScene {
    constructor(game) {
        this.game = game;
    }

    preload() {
        // Load any assets needed for the menu scene
    }

    create() {
        // Set up the menu scene, including buttons and background
        this.startButton = this.game.add.text(100, 100, 'Start Game', { fontSize: '32px', fill: '#fff' });
        this.startButton.setInteractive();
        this.startButton.on('pointerdown', this.startGame.bind(this));
    }

    startGame() {
        // Transition to the GameScene
        this.game.scene.start('GameScene');
    }

    update() {
        // Update the menu scene if necessary
    }
}

export default MenuScene;