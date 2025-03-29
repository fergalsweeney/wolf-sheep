// Initialize game constants
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const WOLF_SIZE = 40;
const SHEEP_SIZE = 40;
const POOP_SIZE = 30;
const MAX_ROUNDS = 5; // Maximum rounds in the game
const SHEEP_TO_LEVEL_UP = 10; // Number of sheep to catch to reach next level
let startTime;
let timeInterval;
let sheepCaught = 0; // Track number of sheep caught in current round

// Power-up constants
const POWERUP_SIZE = 30;
const POWERUP_TYPES = [
    { name: 'speed', color: '#3498db', duration: 10000, chance: 0.6 },
    { name: 'Poop Shield', color: '#e74c3c', duration: 8000, chance: 0.3 },
    { name: 'magnet', color: '#9b59b6', duration: 5000, chance: 0.1 }
];
const POWERUP_SPAWN_CHANCE = 0.002; // Chance to spawn a power-up each frame

// Set canvas size
canvas.width = 800;
canvas.height = 600;

// Simple image loading
const sheepImage = new Image();
sheepImage.src = './assets/sheep.jpg';
console.log('Loading sheep image from:', sheepImage.src);

const wolfImage = new Image();
wolfImage.src = './assets/wolf.png';
console.log('Loading wolf image from:', wolfImage.src);

const hedgeImage = new Image();
hedgeImage.src = './assets/hedge.png';

const poopImage = new Image();
poopImage.src = './assets/poop.png';

// Audio setup
const backgroundMusic = document.getElementById('backgroundMusic');
const biteSound = document.getElementById('biteSound');
const wolfSound = document.getElementById('wolfSound');

// Simple function to play sounds
function playSound(sound) {
    if (sound) {
        try {
            sound.currentTime = 0;
            let playPromise = sound.play();
            
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.log("Sound play error:", error);
                });
            }
        } catch (err) {
            console.log("Error playing sound:", err);
        }
    }
}

// Initialize game state
let gameRunning = false;

// Game state object
const gameState = {
    player: {
        x: 400,
        y: 300,
        speed: 5
    },
    sheep: [],
    hedges: [],
    particles: [],
    scoreEffects: [],
    poop: {
        x: 0,
        y: 0,
        width: POOP_SIZE,
        height: POOP_SIZE,
        speed: 3,
        moveDown: false
    },
    poop2: {
        x: 0,
        y: 0,
        width: POOP_SIZE,
        height: POOP_SIZE,
        speed: 4,
        moveUp: false
    },
    poop3: {
        x: canvas.width,
        y: canvas.height / 2,
        width: POOP_SIZE,
        height: POOP_SIZE,
        speed: 5,
        moveLeft: true
    },
    poop4: {
        x: canvas.width / 2,
        y: 0,
        width: POOP_SIZE,
        height: POOP_SIZE,
        speed: 6,
        moveRight: true
    },
    poop5: {
        x: canvas.width / 2,
        y: canvas.height / 2,
        width: POOP_SIZE,
        height: POOP_SIZE,
        speed: 7,
        direction: Math.random() * Math.PI * 2
    },
    score: 0,
    highScore: localStorage.getItem('highScore') ? parseInt(localStorage.getItem('highScore')) : 0,
    isGameOver: false,
    isTransitioning: false,
    gameTimer: 120,
    level: 1,
    combo: 0,
    lastSheepCatchTime: 0,
    movement: {
        up: false,
        down: false,
        left: false,
        right: false
    },
    powerUps: [] // Array to hold active power-ups
};

// Draw functions
function drawBackground() {
    ctx.fillStyle = '#4a752c'; // Grass green
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawPlayer() {
    if (wolfImage.complete) {
        ctx.drawImage(wolfImage, gameState.player.x, gameState.player.y, WOLF_SIZE, WOLF_SIZE);
        console.log("Drew wolf at:", gameState.player.x, gameState.player.y);
    } else {
        // Fallback
        ctx.fillStyle = 'gray';
        ctx.fillRect(gameState.player.x, gameState.player.y, WOLF_SIZE, WOLF_SIZE);
        console.log("Drew wolf fallback");
    }
}

function drawSheep(sheep) {
    if (sheepImage.complete) {
        ctx.drawImage(sheepImage, sheep.x, sheep.y, SHEEP_SIZE, SHEEP_SIZE);
    } else {
        // Fallback
        ctx.fillStyle = 'white';
        ctx.fillRect(sheep.x, sheep.y, SHEEP_SIZE, SHEEP_SIZE);
        console.log("Drew sheep fallback");
    }
}

// At document load, add event listeners
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM fully loaded, adding event listeners');
    
    // Add event listeners for buttons
    document.getElementById('startButton').addEventListener('click', function() {
        console.log('Start button clicked');
        // Make sure the game-over overlay is hidden even if startGame isn't called directly
        document.getElementById('game-over').style.display = 'none';
        startGame();
    });
    
    document.getElementById('closeInstructions').addEventListener('click', function() {
        console.log('Got it button clicked');
        document.getElementById('instructions').style.display = 'none';
    });
    
    // Enable audio unlocking
    document.addEventListener('click', enableAudio);
    document.addEventListener('keydown', enableAudio);
});

// Ensure audio is properly initialized when starting the game
function startGame() {
    console.log('Starting game');
    gameRunning = true;
    
    document.getElementById('startButton').style.display = 'none';
    document.getElementById('instructions').style.display = 'none';
    document.getElementById('game-over').style.display = 'none'; // Hide game over overlay
    
    // Reset game state
    gameState.score = 0;
    gameState.level = 1;
    gameState.isGameOver = false;
    gameState.gameTimer = 120;
    gameState.combo = 0;
    gameState.isTransitioning = false;
    sheepCaught = 0; // Reset sheep caught counter
    
    // Update score display
    document.getElementById('score').textContent = 'Score: 0';
    document.getElementById('high-score').textContent = `High Score: ${gameState.highScore}`;
    
    // Reset positions
    gameState.player.x = canvas.width / 2 - WOLF_SIZE / 2;
    gameState.player.y = canvas.height / 2 - WOLF_SIZE / 2;
    
    // Reset poops
    gameState.poop.x = 0;
    gameState.poop.y = 0;
    gameState.poop.moveDown = false;
    
    gameState.poop2.x = 0;
    gameState.poop2.y = canvas.height;
    gameState.poop2.moveUp = true;
    
    gameState.poop3.x = canvas.width;
    gameState.poop3.y = canvas.height / 2;
    gameState.poop3.moveLeft = true;
    
    gameState.poop4.x = canvas.width / 2;
    gameState.poop4.y = 0;
    gameState.poop4.moveRight = true;
    
    gameState.poop5.x = canvas.width / 2;
    gameState.poop5.y = canvas.height / 2;
    gameState.poop5.direction = Math.random() * Math.PI * 2;
    
    // Reset game elements
    gameState.hedges = [];
    gameState.sheep = [];
    gameState.particles = [];
    gameState.scoreEffects = [];
    
    console.log('Generating game elements');
    spawnHedges();
    spawnSheepWave();
    
    // Play wolf sound when game starts
    playSound(wolfSound);
    
    // Skip background music since the file doesn't exist in the assets
    /*
    try {
        console.log("Starting background music");
        backgroundMusic.currentTime = 0;
        backgroundMusic.volume = 1.0; // Maximum volume
        
        let playPromise = backgroundMusic.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                console.log("Background music started successfully");
            }).catch(err => {
                console.error('Audio play error:', err);
                // Try again after a short delay
                setTimeout(() => {
                    backgroundMusic.play().catch(e => console.error("Second attempt failed:", e));
                }, 1000);
            });
        }
    } catch (e) {
        console.log("Error starting music:", e);
    }
    */
    
    // Reset and start timer
    startTime = Date.now();
    startTimer();
    
    // Make sure we have objects to draw
    console.log("Sheep count:", gameState.sheep.length);
    console.log("Hedge count:", gameState.hedges.length);
    
    // Start game loop
    requestAnimationFrame(gameLoop);
}

// Add startTimer function
function startTimer() {
    startTime = Date.now();
    clearInterval(timeInterval);
    timeInterval = setInterval(() => {
        if (!gameState.isGameOver && !gameState.isTransitioning) {
            let elapsedTime = Math.floor((Date.now() - startTime) / 1000);
            gameState.gameTimer = Math.max(120 - elapsedTime, 0); // 120 second timer
            
            if (gameState.gameTimer <= 0) {
                gameState.isGameOver = true;
                clearInterval(timeInterval);
                
                // Use the game over overlay instead of drawing on canvas
                endGame("TIME UP!!!!");
            }
        }
    }, 100);
}

// Function to spawn sheep wave
function spawnSheepWave() {
    const sheepCount = 5 + (gameState.level - 1) * 2; // More sheep in higher levels
    gameState.sheep = [];
    
    for (let i = 0; i < sheepCount; i++) {
        const edge = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left
        let x, y;
        
        switch (edge) {
            case 0: // Top
                x = Math.random() * canvas.width;
                y = -SHEEP_SIZE;
                break;
            case 1: // Right
                x = canvas.width;
                y = Math.random() * canvas.height;
                break;
            case 2: // Bottom
                x = Math.random() * canvas.width;
                y = canvas.height;
                break;
            case 3: // Left
                x = -SHEEP_SIZE;
                y = Math.random() * canvas.height;
                break;
        }
        
        gameState.sheep.push({
            x,
            y,
            speed: 1 + Math.random(),
            direction: Math.random() * Math.PI * 2,
            lastDirectionChange: Date.now()
        });
    }
}

// Function to spawn hedges
function spawnHedges() {
    gameState.hedges = [];
    
    // Add some random hedges
    const hedgeCount = 5 + (gameState.level - 1) * 2; // More hedges in higher levels
    
    for (let i = 0; i < hedgeCount; i++) {
        const width = 40 + Math.random() * 60;
        const height = 40 + Math.random() * 60;
        
        // Keep hedges away from edges
        const x = 50 + Math.random() * (canvas.width - width - 100);
        const y = 50 + Math.random() * (canvas.height - height - 100);
        
        gameState.hedges.push({
            x, y, width, height
        });
    }
}

// Function to move sheep
function moveSheep(sheep) {
    // Change direction randomly
    const now = Date.now();
    if (now - sheep.lastDirectionChange > 1000 + Math.random() * 2000) {
        sheep.direction = Math.random() * Math.PI * 2;
        sheep.lastDirectionChange = now;
    }
    
    // Move sheep
    sheep.x += Math.cos(sheep.direction) * sheep.speed;
    sheep.y += Math.sin(sheep.direction) * sheep.speed;
    
    // Bounce off edges
    if (sheep.x < -SHEEP_SIZE / 2) {
        sheep.x = -SHEEP_SIZE / 2;
        sheep.direction = Math.PI - sheep.direction;
    } else if (sheep.x > canvas.width - SHEEP_SIZE / 2) {
        sheep.x = canvas.width - SHEEP_SIZE / 2;
        sheep.direction = Math.PI - sheep.direction;
    }
    
    if (sheep.y < -SHEEP_SIZE / 2) {
        sheep.y = -SHEEP_SIZE / 2;
        sheep.direction = -sheep.direction;
    } else if (sheep.y > canvas.height - SHEEP_SIZE / 2) {
        sheep.y = canvas.height - SHEEP_SIZE / 2;
        sheep.direction = -sheep.direction;
    }
    
    // Bounce off hedges
    for (const hedge of gameState.hedges) {
        if (sheep.x < hedge.x + hedge.width &&
            sheep.x + SHEEP_SIZE > hedge.x &&
            sheep.y < hedge.y + hedge.height &&
            sheep.y + SHEEP_SIZE > hedge.y) {
            
            // Determine which side of the hedge was hit
            const dx1 = sheep.x - hedge.x; // Distance from left edge
            const dx2 = hedge.x + hedge.width - sheep.x - SHEEP_SIZE; // Distance from right edge
            const dy1 = sheep.y - hedge.y; // Distance from top edge
            const dy2 = hedge.y + hedge.height - sheep.y - SHEEP_SIZE; // Distance from bottom edge
            // Find smallest distance
            const minDist = Math.min(dx1, dx2, dy1, dy2);
            
            if (minDist === dx1) { // Left edge
                sheep.x = hedge.x - SHEEP_SIZE;
                sheep.direction = Math.PI - sheep.direction;
            } else if (minDist === dx2) { // Right edge
                sheep.x = hedge.x + hedge.width;
                sheep.direction = Math.PI - sheep.direction;
            } else if (minDist === dy1) { // Top edge
                sheep.y = hedge.y - SHEEP_SIZE;
                sheep.direction = -sheep.direction;
            } else if (minDist === dy2) { // Bottom edge
                sheep.y = hedge.y + hedge.height;
                sheep.direction = -sheep.direction;
            }
            
            // Add some randomness to bouncing
            sheep.direction += (Math.random() - 0.5) * 0.5;
        }
    }
}

// Check collision between objects
function checkCollision(obj1, obj2) {
    return obj1.x < obj2.x + SHEEP_SIZE &&
           obj1.x + WOLF_SIZE > obj2.x &&
           obj1.y < obj2.y + SHEEP_SIZE &&
           obj1.y + WOLF_SIZE > obj2.y;
}

// Find safe position to spawn the player
function findSafeSpawnPosition() {
    let attempts = 0;
    let x, y;
    
    do {
        // Get random position with some padding from edges
        x = 50 + Math.random() * (canvas.width - 100);
        y = 50 + Math.random() * (canvas.height - 100);
        
        // Check if the position is safe (away from hedges)
        let safePosition = true;
        for (const hedge of gameState.hedges) {
            if (x < hedge.x + hedge.width + 50 &&
                x + WOLF_SIZE + 50 > hedge.x &&
                y < hedge.y + hedge.height + 50 &&
                y + WOLF_SIZE + 50 > hedge.y) {
                safePosition = false;
                break;
            }
        }
        
        if (safePosition) {
            return { x, y };
        }
        
        attempts++;
    } while (attempts < 50); // Limit the number of attempts
    
    // If no safe position found, return center of canvas
    return { x: canvas.width / 2 - WOLF_SIZE / 2, y: canvas.height / 2 - WOLF_SIZE / 2 };
}

// Draw hedges
function drawHedges() {
    gameState.hedges.forEach(hedge => {
        if (hedgeImage.complete && hedgeImage.naturalWidth !== 0) {
            // Draw the hedge image stretched to the hedge dimensions
            ctx.drawImage(hedgeImage, hedge.x, hedge.y, hedge.width, hedge.height);
        } else {
            // Fallback
            ctx.fillStyle = '#006400'; // Dark green
            ctx.fillRect(hedge.x, hedge.y, hedge.width, hedge.height);
        }
    });
}

// Draw poop obstacles
function drawPoops() {
    if (gameState.level >= 1) { // First poop from level 1
        if (poopImage.complete && poopImage.naturalWidth !== 0) {
            ctx.drawImage(poopImage, gameState.poop.x, gameState.poop.y, POOP_SIZE, POOP_SIZE);
        } else {
            ctx.fillStyle = '#663300'; // Brown
            ctx.fillRect(gameState.poop.x, gameState.poop.y, POOP_SIZE, POOP_SIZE);
        }
    }
    
    if (gameState.level >= 2) { // Second poop from level 2
        if (poopImage.complete && poopImage.naturalWidth !== 0) {
            ctx.drawImage(poopImage, gameState.poop2.x, gameState.poop2.y, POOP_SIZE, POOP_SIZE);
        } else {
            ctx.fillStyle = '#663300'; // Brown
            ctx.fillRect(gameState.poop2.x, gameState.poop2.y, POOP_SIZE, POOP_SIZE);
        }
    }
    
    if (gameState.level >= 3) { // Third poop from level 3
        if (poopImage.complete && poopImage.naturalWidth !== 0) {
            ctx.drawImage(poopImage, gameState.poop3.x, gameState.poop3.y, POOP_SIZE, POOP_SIZE);
        } else {
            ctx.fillStyle = '#663300'; // Brown
            ctx.fillRect(gameState.poop3.x, gameState.poop3.y, POOP_SIZE, POOP_SIZE);
        }
    }
    
    if (gameState.level >= 4) { // Fourth poop from level 4
        if (poopImage.complete && poopImage.naturalWidth !== 0) {
            ctx.drawImage(poopImage, gameState.poop4.x, gameState.poop4.y, POOP_SIZE, POOP_SIZE);
        } else {
            ctx.fillStyle = '#663300'; // Brown
            ctx.fillRect(gameState.poop4.x, gameState.poop4.y, POOP_SIZE, POOP_SIZE);
        }
    }
    
    if (gameState.level >= 5) { // Fifth poop from level 5
        if (poopImage.complete && poopImage.naturalWidth !== 0) {
            ctx.drawImage(poopImage, gameState.poop5.x, gameState.poop5.y, POOP_SIZE, POOP_SIZE);
        } else {
            ctx.fillStyle = '#663300'; // Brown
            ctx.fillRect(gameState.poop5.x, gameState.poop5.y, POOP_SIZE, POOP_SIZE);
        }
    }
}

// Update poops
function updatePoops() {
    // Update first poop
    if (gameState.level >= 1) {
        if (gameState.poop.moveDown) {
            gameState.poop.y += gameState.poop.speed;
            if (gameState.poop.y > canvas.height) {
                gameState.poop.moveDown = false;
            }
        } else {
            gameState.poop.x += gameState.poop.speed;
            if (gameState.poop.x > canvas.width) {
                gameState.poop.x = 0;
                gameState.poop.moveDown = true;
            }
        }
        
        // Check collision with player
        if (checkCollisionWithPoop(gameState.player, gameState.poop)) {
            // End game when poop hits wolf
            endGame("POOPED!!!");
        }
    }
    
    // Update second poop in level 2
    if (gameState.level >= 2) {
        if (gameState.poop2.moveUp) {
            gameState.poop2.y -= gameState.poop2.speed;
            if (gameState.poop2.y < 0) {
                gameState.poop2.moveUp = false;
            }
        } else {
            gameState.poop2.x += gameState.poop2.speed;
            if (gameState.poop2.x > canvas.width) {
                gameState.poop2.x = 0;
                gameState.poop2.moveUp = true;
            }
        }
        
        // Check collision with player
        if (checkCollisionWithPoop(gameState.player, gameState.poop2)) {
            // End game when poop hits wolf
            endGame("POOPED!!!");
        }
    }
    
    // Update third poop in level 3
    if (gameState.level >= 3) {
        if (gameState.poop3.moveLeft) {
            gameState.poop3.x -= gameState.poop3.speed;
            if (gameState.poop3.x < 0) {
                gameState.poop3.moveLeft = false;
            }
        } else {
            gameState.poop3.x += gameState.poop3.speed;
            if (gameState.poop3.x > canvas.width) {
                gameState.poop3.x = canvas.width;
                gameState.poop3.moveLeft = true;
            }
        }
        
        // Check collision with player
        if (checkCollisionWithPoop(gameState.player, gameState.poop3)) {
            // End game when poop hits wolf
            endGame("POOPED!!!");
        }
    }
    
    // Update fourth poop in level 4
    if (gameState.level >= 4) {
        if (gameState.poop4.moveRight) {
            gameState.poop4.x += gameState.poop4.speed;
            if (gameState.poop4.x > canvas.width) {
                gameState.poop4.moveRight = false;
            }
        } else {
            gameState.poop4.x -= gameState.poop4.speed;
            if (gameState.poop4.x < 0) {
                gameState.poop4.moveRight = true;
            }
        }
        
        // Check collision with player
        if (checkCollisionWithPoop(gameState.player, gameState.poop4)) {
            // End game when poop hits wolf
            endGame("POOPED!!!");
        }
    }
    
    // Update fifth poop in level 5
    if (gameState.level >= 5) {
        gameState.poop5.x += Math.cos(gameState.poop5.direction) * gameState.poop5.speed;
        gameState.poop5.y += Math.sin(gameState.poop5.direction) * gameState.poop5.speed;
        
        // Bounce off edges
        if (gameState.poop5.x < -POOP_SIZE / 2) {
            gameState.poop5.x = -POOP_SIZE / 2;
            gameState.poop5.direction = Math.PI - gameState.poop5.direction;
        } else if (gameState.poop5.x > canvas.width - POOP_SIZE / 2) {
            gameState.poop5.x = canvas.width - POOP_SIZE / 2;
            gameState.poop5.direction = Math.PI - gameState.poop5.direction;
        }
        
        if (gameState.poop5.y < -POOP_SIZE / 2) {
            gameState.poop5.y = -POOP_SIZE / 2;
            gameState.poop5.direction = -gameState.poop5.direction;
        } else if (gameState.poop5.y > canvas.height - POOP_SIZE / 2) {
            gameState.poop5.y = canvas.height - POOP_SIZE / 2;
            gameState.poop5.direction = -gameState.poop5.direction;
        }
        
        // Check collision with player
        if (checkCollisionWithPoop(gameState.player, gameState.poop5)) {
            // End game when poop hits wolf
            endGame("POOPED!!!");
        }
    }
}

// Check collision with poop
function checkCollisionWithPoop(player, poop) {
    if (player.x < poop.x + poop.width &&
        player.x + WOLF_SIZE > poop.x &&
        player.y < poop.y + poop.height &&
        player.y + WOLF_SIZE > poop.y) {
        
        // Check if player has shield power-up active
        if (hasShield()) {
            // Find the shield power-up and remove it
            const shieldIndex = gameState.powerUps.findIndex(p => p.active && p.type === 'shield');
            if (shieldIndex !== -1) {
                // Create shield break effect
                for (let i = 0; i < 20; i++) {
                    gameState.particles.push(
                        createParticle(player.x + WOLF_SIZE/2, player.y + WOLF_SIZE/2, '#e74c3c')
                    );
                }
                
                // Display shield protection message
                gameState.scoreEffects.push({
                    x: canvas.width / 2,
                    y: canvas.height / 2,
                    text: "Shield Protected!",
                    life: 60,
                    alpha: 1,
                    color: '#e74c3c'
                });
                
                // Remove the shield power-up
                gameState.powerUps.splice(shieldIndex, 1);
                
                // Return false to indicate no harmful collision
                return false;
            }
        }
        
        return true;
    }
    return false;
}

// Check collision with hedge
function checkCollisionWithHedge(player, hedge) {
    return player.x < hedge.x + hedge.width &&
           player.x + WOLF_SIZE > hedge.x &&
           player.y < hedge.y + hedge.height &&
           player.y + WOLF_SIZE > hedge.y;
}

// The main game loop
function gameLoop() {
    if (gameState.isGameOver || gameState.isTransitioning) {
        return; // Don't update or draw during game over or transitions
    }
    
    // Clear the canvas
    drawBackground();
    
    // Store previous position for collision detection
    const prevPlayerX = gameState.player.x;
    const prevPlayerY = gameState.player.y;
    
    // Update player position based on movement
    if (gameState.movement.up) gameState.player.y -= gameState.player.speed;
    if (gameState.movement.down) gameState.player.y += gameState.player.speed;
    if (gameState.movement.left) gameState.player.x -= gameState.player.speed;
    if (gameState.movement.right) gameState.player.x += gameState.player.speed;
    
    // Keep player within bounds
    gameState.player.x = Math.max(0, Math.min(canvas.width - WOLF_SIZE, gameState.player.x));
    gameState.player.y = Math.max(0, Math.min(canvas.height - WOLF_SIZE, gameState.player.y));
    
    // Check for hedge collisions
    let collisionDetected = false;
    for (const hedge of gameState.hedges) {
        if (checkCollisionWithHedge(gameState.player, hedge)) {
            collisionDetected = true;
            break;
        }
    }
    
    // Restore previous position if collision detected
    if (collisionDetected) {
        gameState.player.x = prevPlayerX;
        gameState.player.y = prevPlayerY;
    }
    
    // Update combo timer
    const now = Date.now();
    if (now - gameState.lastSheepCatchTime > 2000) {
        gameState.combo = 0;
    }
    
    // Chance to spawn a power-up
    spawnPowerUp();
    
    // Update sheep
    for (const sheep of gameState.sheep) {
        moveSheep(sheep);
    }
    
    // Check for power-up collisions and update active power-ups
    checkPowerUpCollisions();
    
    // Check collisions between player and sheep
    gameState.sheep = gameState.sheep.filter(sheep => {
        // If magnet power-up is active, attract nearby sheep
        if (hasMagnet() && 
            Math.hypot(sheep.x - gameState.player.x, sheep.y - gameState.player.y) < 150) {
            // Calculate direction toward player
            const dx = gameState.player.x - sheep.x;
            const dy = gameState.player.y - sheep.y;
            const dist = Math.hypot(dx, dy);
            // Move sheep toward player with increased speed
            sheep.x += (dx / dist) * sheep.speed * 1.5;
            sheep.y += (dy / dist) * sheep.speed * 1.5;
        }
        
        if (checkCollision(gameState.player, sheep)) {
            // Update combo
            gameState.combo++;
            gameState.lastSheepCatchTime = now;
            
            // Calculate score with combo
            const scoreIncrease = Math.min(gameState.combo, 4);  // Cap combo at 4x
            gameState.score += scoreIncrease;
            
            // Increment sheep count and check for level transition
            sheepCaught++;
            
            // Add bonus time
            gameState.gameTimer = Math.min(120, gameState.gameTimer + scoreIncrease);
            
            // Update display
            document.getElementById('score').textContent = `Score: ${gameState.score}`;
            
            // Play bite sound
            playSound(biteSound);
            
            // Create particles
            for (let i = 0; i < 10; i++) {
                gameState.particles.push(
                    createParticle(sheep.x + SHEEP_SIZE/2, sheep.y + SHEEP_SIZE/2, 
                        gameState.combo > 1 ? '#ffff00' : '#ffffff')
                );
            }
            
            // Create score effect
            gameState.scoreEffects.push(
                createScoreEffect(sheep.x + SHEEP_SIZE/2, sheep.y + SHEEP_SIZE/2, `+${scoreIncrease}`)
            );
            
            // Update high score
            if (gameState.score > gameState.highScore) {
                gameState.highScore = gameState.score;
                localStorage.setItem('highScore', gameState.highScore.toString());
                document.getElementById('high-score').textContent = `High Score: ${gameState.highScore}`;
            }
            
            // Check if we've caught enough sheep to level up
            if (sheepCaught >= SHEEP_TO_LEVEL_UP && gameState.level < MAX_ROUNDS) {
                showLevelTransition();
                return false;
            }
            
            return false; // Remove sheep from array
        }
        return true; // Keep sheep in array
    });
    
    // Spawn more sheep if none left
    if (gameState.sheep.length === 0 && !gameState.isTransitioning) {
        spawnSheepWave();
    }
    
    // Update poops
    updatePoops();
    
    // Update particles
    updateParticles();
    
    // Draw game elements
    drawHedges();
    drawPoops();
    
    // Draw power-ups
    drawPowerUps();
    
    for (const sheep of gameState.sheep) {
        drawSheep(sheep);
    }
    
    drawPlayer();
    
    // Draw particles and effects
    drawParticles();
    drawScoreEffects();
    
    // Draw timer and score
    // Create a semi-transparent background for the UI
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(canvas.width/2 - 150, 10, 300, 40);
    ctx.fillStyle = 'white';
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    
    // Draw time on the left side
    ctx.fillText(`Time: ${gameState.gameTimer}`, canvas.width/2 - 70, 38);
    
    // Draw a separator line
    ctx.fillRect(canvas.width/2, 15, 2, 30);
    
    // Draw score on the right side
    ctx.fillText(`Score: ${gameState.score}`, canvas.width/2 + 70, 38);
    
    // Draw current level indicator in the top left corner
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(10, 10, 100, 40);
    ctx.fillStyle = '#4CAF50'; // Green color for level
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`LEVEL ${gameState.level}`, 60, 35);
    
    // Draw sheep progress indicator in the top right corner
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(canvas.width - 110, 10, 100, 40);
    ctx.fillStyle = 'white';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Sheep: ${sheepCaught}/${SHEEP_TO_LEVEL_UP}`, canvas.width - 60, 30);
    
    // Draw a small progress bar
    const progressBarWidth = 80;
    const progress = sheepCaught / SHEEP_TO_LEVEL_UP;
    
    // Draw progress bar background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(canvas.width - 100, 33, progressBarWidth, 10);
    
    // Draw progress bar fill
    ctx.fillStyle = '#4CAF50'; // Green progress
    ctx.fillRect(canvas.width - 100, 33, progressBarWidth * progress, 10);
    
    // Draw current combo if active
    if (gameState.combo > 1) {
        ctx.fillStyle = '#ffff00'; // Yellow for combo
        ctx.font = '18px Arial';
        ctx.fillText(`Combo: ${gameState.combo}x`, canvas.width/2, 65);
    }
    
    // Continue the game loop
    requestAnimationFrame(gameLoop);
}

// Event listeners for keyboard
document.addEventListener('keydown', event => {
    switch (event.key) {
        case 'ArrowUp':
        case 'w':
            gameState.movement.up = true;
            break;
        case 'ArrowDown':
        case 's':
            gameState.movement.down = true;
            break;
        case 'ArrowLeft':
        case 'a':
            gameState.movement.left = true;
            break;
        case 'ArrowRight':
        case 'd':
            gameState.movement.right = true;
            break;
    }
});

document.addEventListener('keyup', event => {
    switch (event.key) {
        case 'ArrowUp':
        case 'w':
            gameState.movement.up = false;
            break;
        case 'ArrowDown':
        case 's':
            gameState.movement.down = false;
            break;
        case 'ArrowLeft':
        case 'a':
            gameState.movement.left = false;
            break;
        case 'ArrowRight':
        case 'd':
            gameState.movement.right = false;
            break;
    }
});

// Mouse input for player movement
canvas.addEventListener('mousemove', event => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    
    // Store previous position for collision detection
    const prevPlayerX = gameState.player.x;
    const prevPlayerY = gameState.player.y;
    
    // Move player towards mouse with smoothing
    const dx = mouseX - (gameState.player.x + WOLF_SIZE/2);
    const dy = mouseY - (gameState.player.y + WOLF_SIZE/2);
    const distance = Math.sqrt(dx*dx + dy*dy);
    
    if (distance > 5) {
        // Calculate new position
        const newX = gameState.player.x + dx * 0.1;
        const newY = gameState.player.y + dy * 0.1;
        
        // Apply new position
        gameState.player.x = newX;
        gameState.player.y = newY;
        
        // Keep player within bounds
        gameState.player.x = Math.max(0, Math.min(canvas.width - WOLF_SIZE, gameState.player.x));
        gameState.player.y = Math.max(0, Math.min(canvas.height - WOLF_SIZE, gameState.player.y));
        
        // Check for hedge collisions
        let collisionDetected = false;
        for (const hedge of gameState.hedges) {
            if (checkCollisionWithHedge(gameState.player, hedge)) {
                collisionDetected = true;
                break;
            }
        }
        
        // Restore previous position if collision detected
        if (collisionDetected) {
            gameState.player.x = prevPlayerX;
            gameState.player.y = prevPlayerY;
        }
    }
});

// Create particles for visual effects
function createParticle(x, y, color) {
    return {
        x,
        y,
        color,
        size: 5 + Math.random() * 5,
        speedX: (Math.random() - 0.5) * 10,
        speedY: (Math.random() - 0.5) * 10,
        life: 30 // Frames to live
    };
}

// Create score effect particles
function createScoreEffect(x, y, text) {
    return {
        x,
        y,
        text,
        life: 40, // Frames to live
        alpha: 1
    };
}

// Update particles
function updateParticles() {
    // Update particles
    gameState.particles = gameState.particles.filter(particle => {
        particle.x += particle.speedX;
        particle.y += particle.speedY;
        particle.life--;
        return particle.life > 0;
    });
    
    // Update score effects
    gameState.scoreEffects = gameState.scoreEffects.filter(effect => {
        effect.y -= 2; // Move up
        effect.life--;
        effect.alpha = effect.life / 40; // Fade out
        return effect.life > 0;
    });
}

// Draw particles
function drawParticles() {
    gameState.particles.forEach(particle => {
        ctx.globalAlpha = particle.life / 30; // Fade out as life decreases
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1; // Reset alpha
}

// Draw score effects
function drawScoreEffects() {
    gameState.scoreEffects.forEach(effect => {
        ctx.globalAlpha = effect.alpha;
        ctx.fillStyle = '#ffff00';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(effect.text, effect.x, effect.y);
        ctx.strokeText(effect.text, effect.x, effect.y);
    });
    ctx.globalAlpha = 1; // Reset alpha
}

// Function to release wolf and trigger round transition
function showLevelTransition() {
    console.log('Starting level transition');
    gameState.isTransitioning = true;
    
    // Get the level transition overlay elements
    const levelTransition = document.getElementById('level-transition');
    const roundText = document.getElementById('round-text');
    const roundDescription = document.getElementById('round-description');
    
    // Update the text content
    roundText.textContent = `ROUND ${gameState.level + 1}!`;
    roundDescription.textContent = `Watch out! Another poop has appeared!`;
    
    // Show the transition overlay
    levelTransition.style.display = 'flex';
    
    // Play wolf sound during transition to next level
    playSound(wolfSound);
    
    // Wait for a moment before continuing
    setTimeout(() => {
        console.log(`Transition timeout completed, starting level ${gameState.level + 1}`);
        
        // Hide the transition overlay
        levelTransition.style.display = 'none';
        
        // Move to next level
        gameState.level++;
        
        // Reset sheep caught counter for the new round
        sheepCaught = 0;
        
        // Reset player position
        gameState.player.x = canvas.width / 2 - WOLF_SIZE / 2;
        gameState.player.y = canvas.height / 2 - WOLF_SIZE / 2;
        
        // Reset and position poop obstacles based on the current level
        // First poop (all levels)
        gameState.poop.x = 0;
        gameState.poop.y = 0;
        gameState.poop.moveDown = false;
        
        // Second poop (level 2 and above)
        if (gameState.level >= 2) {
            gameState.poop2.x = 0;
            gameState.poop2.y = canvas.height;
            gameState.poop2.moveUp = true;
        }
        
        // Third poop (level 3 and above)
        if (gameState.level >= 3) {
            gameState.poop3.x = canvas.width;
            gameState.poop3.y = canvas.height / 2;
            gameState.poop3.moveLeft = true;
        }
        
        // Fourth poop (level 4 and above)
        if (gameState.level >= 4) {
            gameState.poop4.x = canvas.width / 2;
            gameState.poop4.y = 0;
            gameState.poop4.moveRight = true;
        }
        
        // Fifth poop (level 5)
        if (gameState.level >= 5) {
            gameState.poop5.x = canvas.width / 2;
            gameState.poop5.y = canvas.height / 2;
            gameState.poop5.direction = Math.random() * Math.PI * 2;
        }
        
        // Spawn new hedges and sheep for the new round
        spawnHedges();
        spawnSheepWave();
        
        // Continue game
        gameState.isTransitioning = false;
        
        // Make sure game loop continues
        requestAnimationFrame(gameLoop);
    }, 2000);
}

// End game function
function endGame(message) {
    gameState.isGameOver = true;
    clearInterval(timeInterval);
    
    // Get the game over overlay elements
    const gameOverOverlay = document.getElementById('game-over');
    const gameOverText = document.getElementById('game-over-text');
    const finalScoreText = document.getElementById('final-score');
    
    // Update text content
    gameOverText.textContent = message;
    finalScoreText.textContent = `Final Score: ${gameState.score}`;
    
    // Show the game over overlay
    gameOverOverlay.style.display = 'flex';
    
    // Show start button again
    document.getElementById('startButton').style.display = 'block';
    
    // Stop background music
    backgroundMusic.pause();
    backgroundMusic.currentTime = 0;
}

// Add the missing enableAudio function to unlock audio on mobile browsers
function enableAudio() {
    console.log("Enabling audio...");
    
    // Remove event listeners once audio is enabled
    document.removeEventListener('click', enableAudio);
    document.removeEventListener('keydown', enableAudio);
    
    // Create silent audio context to unlock audio
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
        const audioCtx = new AudioContext();
        
        // Create and play a silent sound
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        gainNode.gain.setValueAtTime(0, audioCtx.currentTime); // Set volume to 0
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.start(0);
        oscillator.stop(audioCtx.currentTime + 0.001); // Stop after a very short time
        
        console.log("Audio context unlocked");
    }
    
    // Try to play each audio element to unlock them
    [backgroundMusic, biteSound, wolfSound].forEach(sound => {
        if (sound) {
            sound.volume = 0;
            sound.play()
                .then(() => {
                    sound.pause();
                    sound.currentTime = 0;
                    sound.volume = 1.0;
                    console.log("Sound unlocked:", sound.id);
                })
                .catch(err => console.log("Couldn't unlock audio:", err));
        }
    });
}

// Function to spawn power-ups randomly
function spawnPowerUp() {
    // Random chance to spawn a power-up
    if (Math.random() < POWERUP_SPAWN_CHANCE) {
        // Choose a random position that's not on a hedge
        let x, y;
        let validPosition = false;
        let attempts = 0;
        
        while (!validPosition && attempts < 20) {
            x = 50 + Math.random() * (canvas.width - 100);
            y = 50 + Math.random() * (canvas.height - 100);
            
            // Check if position overlaps with any hedge
            validPosition = true;
            for (const hedge of gameState.hedges) {
                if (x < hedge.x + hedge.width + POWERUP_SIZE &&
                    x + POWERUP_SIZE > hedge.x &&
                    y < hedge.y + hedge.height + POWERUP_SIZE &&
                    y + POWERUP_SIZE > hedge.y) {
                    validPosition = false;
                    break;
                }
            }
            attempts++;
        }
        
        if (validPosition) {
            // Choose a power-up type based on weighted chance
            const totalWeight = POWERUP_TYPES.reduce((sum, type) => sum + type.chance, 0);
            let random = Math.random() * totalWeight;
            let selectedType;
            
            for (const type of POWERUP_TYPES) {
                random -= type.chance;
                if (random <= 0) {
                    selectedType = type;
                    break;
                }
            }
            
            // Add new power-up to the game
            gameState.powerUps.push({
                x,
                y,
                type: selectedType.name,
                color: selectedType.color,
                duration: selectedType.duration,
                expiryTime: null, // Will be set when collected
                active: false,
                width: POWERUP_SIZE,
                height: POWERUP_SIZE
            });
        }
    }
}

// Function to draw power-ups
function drawPowerUps() {
    gameState.powerUps.forEach(powerUp => {
        // Only draw uncollected power-ups
        if (!powerUp.active) {
            ctx.fillStyle = powerUp.color;
            ctx.beginPath();
            ctx.arc(powerUp.x + POWERUP_SIZE/2, powerUp.y + POWERUP_SIZE/2, POWERUP_SIZE/2, 0, Math.PI * 2);
            ctx.fill();
            
            // Add pulsing effect
            const pulseSize = Math.sin(Date.now() / 200) * 3;
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(powerUp.x + POWERUP_SIZE/2, powerUp.y + POWERUP_SIZE/2, POWERUP_SIZE/2 + pulseSize, 0, Math.PI * 2);
            ctx.stroke();
            
            // Draw power-up icon/letter
            ctx.fillStyle = 'white';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            // Show first letter of power-up type
            let icon = powerUp.type.charAt(0).toUpperCase();
            ctx.fillText(icon, powerUp.x + POWERUP_SIZE/2, powerUp.y + POWERUP_SIZE/2);
        }
    });
    
    // Draw active power-up indicators
    const activePowerUps = gameState.powerUps.filter(p => p.active);
    if (activePowerUps.length > 0) {
        // Draw background for power-up indicators
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(10, 60, 100, 30 * activePowerUps.length);
        
        // Draw each active power-up
        activePowerUps.forEach((powerUp, index) => {
            const timeLeft = Math.max(0, (powerUp.expiryTime - Date.now()) / 1000).toFixed(1);
            const y = 80 + index * 30;
            
            // Power-up circle
            ctx.fillStyle = powerUp.color;
            ctx.beginPath();
            ctx.arc(25, y, 10, 0, Math.PI * 2);
            ctx.fill();
            
            // Power-up text
            ctx.fillStyle = 'white';
            ctx.font = '14px Arial';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${powerUp.type}: ${timeLeft}s`, 40, y);
        });
    }
}

// Function to check collisions with power-ups
function checkPowerUpCollisions() {
    gameState.powerUps = gameState.powerUps.filter(powerUp => {
        // Skip active power-ups
        if (powerUp.active) {
            // Check if power-up has expired
            if (Date.now() > powerUp.expiryTime) {
                // Remove expired power-up and restore normal state
                deactivatePowerUp(powerUp);
                return false;
            }
            return true;
        }
        
        // Check if player collided with this power-up
        if (gameState.player.x < powerUp.x + powerUp.width &&
            gameState.player.x + WOLF_SIZE > powerUp.x &&
            gameState.player.y < powerUp.y + powerUp.height &&
            gameState.player.y + WOLF_SIZE > powerUp.y) {
            
            // Power-up collected!
            activatePowerUp(powerUp);
            
            // Create particles for visual effect
            for (let i = 0; i < 15; i++) {
                gameState.particles.push(
                    createParticle(powerUp.x + POWERUP_SIZE/2, powerUp.y + POWERUP_SIZE/2, powerUp.color)
                );
            }
            
            // Create text effect
            gameState.scoreEffects.push(
                createScoreEffect(powerUp.x + POWERUP_SIZE/2, powerUp.y + POWERUP_SIZE/2, powerUp.type)
            );
            
            return true; // Keep in array but mark as active
        }
        
        return true; // Keep uncollected power-up in array
    });
}

// Function to activate a power-up
function activatePowerUp(powerUp) {
    powerUp.active = true;
    powerUp.expiryTime = Date.now() + powerUp.duration;
    
    // Apply power-up effect based on type
    switch(powerUp.type) {
        case 'speed':
            // Double player speed
            gameState.player.speed *= 2;
            break;
        case 'shield':
            // Shield is checked when handling poop collisions
            break;
        case 'magnet':
            // Magnet effect is applied during sheep movement
            break;
    }
    
    // Create a text notification
    ctx.font = 'bold 24px Arial';
    const textWidth = ctx.measureText(`${powerUp.type} activated!`).width;
    
    gameState.scoreEffects.push({
        x: canvas.width / 2,
        y: canvas.height / 2,
        text: `${powerUp.type} activated!`,
        life: 60, // Show longer
        alpha: 1,
        color: powerUp.color
    });
}

// Function to deactivate a power-up
function deactivatePowerUp(powerUp) {
    // Restore normal state based on power-up type
    switch(powerUp.type) {
        case 'speed':
            // Restore original speed
            gameState.player.speed = 5;
            break;
        case 'shield':
            // Shield effect ends automatically
            break;
        case 'magnet':
            // Magnet effect ends automatically
            break;
    }
}

// Check if player has shield power-up active
function hasShield() {
    return gameState.powerUps.some(p => p.active && p.type === 'shield');
}

// Check if player has magnet power-up active
function hasMagnet() {
    return gameState.powerUps.some(p => p.active && p.type === 'magnet');
}