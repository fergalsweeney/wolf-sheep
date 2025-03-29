class EndScene {
    constructor(finalScore) {
        this.finalScore = finalScore;
    }

    display() {
        console.log("Game Over");
        console.log(`Your final score is: ${this.finalScore}`);
        console.log("Press 'R' to restart the game.");
    }

    restartGame() {
        // Logic to restart the game
        console.log("Restarting the game...");
    }
}

export default EndScene;