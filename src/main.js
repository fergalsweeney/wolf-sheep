// Initialize game constants
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const WOLF_SIZE = 40;
const SHEEP_SIZE = 40;
const POOP_SIZE = 30;
let startTime;
let timeInterval;

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
    }
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
    
    // Reset game state
    gameState.score = 0;
    gameState.level = 1;
    gameState.isGameOver = false;
    gameState.gameTimer = 120;
    gameState.combo = 0;
    gameState.isTransitioning = false;
    
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
                
                // Draw game over screen
                ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = 'white';
                ctx.font = 'bold 72px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('TIME UP!!!!', canvas.width/2, canvas.height/2);
                ctx.font = 'bold 36px Arial';
                ctx.fillText(`Final Score: ${gameState.score}`, canvas.width/2, canvas.height/2 + 80);
                
                // Show start button again
                document.getElementById('startButton').style.display = 'block';
                
                // Stop background music
                backgroundMusic.pause();
                backgroundMusic.currentTime = 0;
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
}

// Check collision with poop
function checkCollisionWithPoop(player, poop) {
    if (player.x < poop.x + poop.width &&
        player.x + WOLF_SIZE > poop.x &&
        player.y < poop.y + poop.height &&
        player.y + WOLF_SIZE > poop.y) {
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
    
    // Update sheep
    for (const sheep of gameState.sheep) {
        moveSheep(sheep);
    }
    
    // Check collisions between player and sheep
    gameState.sheep = gameState.sheep.filter(sheep => {
        if (checkCollision(gameState.player, sheep)) {
            // Update combo
            gameState.combo++;
            gameState.lastSheepCatchTime = now;
            
            // Calculate score with combo
            const scoreIncrease = Math.min(gameState.combo, 4);  // Cap combo at 4x
            gameState.score += scoreIncrease;
            
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
            
            // Level up at score 5
            if (gameState.score >= 5 && gameState.level === 1) {
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
    
    for (const sheep of gameState.sheep) {
        drawSheep(sheep);
    }
    
    drawPlayer();
    
    // Draw particles and effects
    drawParticles();
    drawScoreEffects();
    
    // Draw timer
    ctx.fillStyle = 'white';
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Time: ${gameState.gameTimer}`, canvas.width/2, 30);
    
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

// Function to release wolf (make sure it plays the sound)
function releaseWolf() {
    console.log("Releasing wolf, playing sound");
    // Play wolf sound
    playSound(wolfSound);
}

// Add wolf release when starting level 2
function showLevelTransition() {
    console.log('Starting level transition');
    gameState.isTransitioning = true;
    
    // Clear the screen
    drawBackground();
    
    // Display transition message
    ctx.fillStyle = 'white';
    ctx.font = 'bold 72px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('ROUND 2!', canvas.width/2, canvas.height/2);
    
    // Play wolf sound during transition to level 2
    playSound(wolfSound);
    
    // Wait for a moment before continuing
    setTimeout(() => {
        console.log('Transition timeout completed, starting level 2');
        
        // Move to next level
        gameState.level++;
        
        // Reset positions
        gameState.player.x = canvas.width / 2 - WOLF_SIZE / 2;
        gameState.player.y = canvas.height / 2 - WOLF_SIZE / 2;
        
        // Reset poops
        gameState.poop.x = 0;
        gameState.poop.y = 0;
        gameState.poop.moveDown = false;
        
        // Enable second poop obstacle in level 2
        gameState.poop2.x = 0;
        gameState.poop2.y = canvas.height;
        gameState.poop2.moveUp = true;
        
        // Spawn new hedges and sheep
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
    
    // Draw game over screen
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    ctx.font = 'bold 72px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(message, canvas.width/2, canvas.height/2);
    ctx.font = 'bold 36px Arial';
    ctx.fillText(`Final Score: ${gameState.score}`, canvas.width/2, canvas.height/2 + 80);
    
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