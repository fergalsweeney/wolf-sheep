class Sheep {
    constructor(x, y) {
        this.x = x; // X position of the sheep
        this.y = y; // Y position of the sheep
        this.speed = 1; // Speed of the sheep
    }

    move() {
        // Logic for sheep movement
        this.x += Math.random() * this.speed - this.speed / 2;
        this.y += Math.random() * this.speed - this.speed / 2;
    }

    display() {
        // Logic for displaying the sheep on the screen
        console.log(`Sheep is at position (${this.x}, ${this.y})`);
    }
}

export default Sheep;