class Player {
    constructor(name) {
        this.name = name;
        this.position = { x: 0, y: 0 };
        this.speed = 5;
    }

    move(direction) {
        switch (direction) {
            case 'up':
                this.position.y -= this.speed;
                break;
            case 'down':
                this.position.y += this.speed;
                break;
            case 'left':
                this.position.x -= this.speed;
                break;
            case 'right':
                this.position.x += this.speed;
                break;
            default:
                console.log('Invalid direction');
        }
    }

    interact() {
        console.log(`${this.name} interacts with the game world.`);
    }
}

export default Player;