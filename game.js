console.log("Game script loaded");

let canvas, ctx;
let bunny;
let obstacles = [];
let eagles = [];
let score = 0;
let leaderboard = [];
let bgImage;
let bgX = 0;

window.addEventListener('load', function() {
    console.log("Window loaded");
    initGame();
});

function initGame() {
    console.log("Initializing game");
    canvas = document.getElementById('gameCanvas');
    if (!canvas) {
        console.error("Canvas element not found");
        return;
    }
    ctx = canvas.getContext('2d');
    
    // Create the background image
    createBackgroundImage();
    
    bunny = {
        x: 50,
        y: canvas.height - 40,
        width: 32,
        height: 32,
        speed: 5,
        jumpStrength: 10,
        yVelocity: 0,
        isJumping: false,
        jumpCount: 0,
        maxJumps: 2,
        hitbox: {
            x: 0,
            y: 0,
            width: 28,
            height: 28
        },
        passedObstacles: new Set()
    };

    document.addEventListener('keydown', keyDownHandler);
    document.addEventListener('keyup', keyUpHandler);

    initScore();
    loadLeaderboard();
    gameLoop();
}

function createBackgroundImage() {
    bgImage = document.createElement('canvas');
    bgImage.width = canvas.width * 2; // Make it twice as wide for seamless scrolling
    bgImage.height = canvas.height;
    let bgCtx = bgImage.getContext('2d');

    // Sky
    bgCtx.fillStyle = '#87CEEB';
    bgCtx.fillRect(0, 0, bgImage.width, bgImage.height);

    // Grass
    bgCtx.fillStyle = '#7CFC00';
    bgCtx.fillRect(0, bgImage.height * 0.7, bgImage.width, bgImage.height * 0.3);

    // Flowers
    for (let i = 0; i < 30; i++) {
        drawFlower(bgCtx, Math.random() * bgImage.width, bgImage.height * 0.7 + Math.random() * bgImage.height * 0.2);
    }

    // Bushes
    for (let i = 0; i < 5; i++) {
        drawBush(bgCtx, Math.random() * bgImage.width, bgImage.height * 0.65 + Math.random() * bgImage.height * 0.1);
    }

    // Distant trees
    for (let i = 0; i < 3; i++) {
        drawTree(bgCtx, Math.random() * bgImage.width, bgImage.height * 0.4);
    }

    // White picket fence
    drawFence(bgCtx);
}

function drawFlower(ctx, x, y) {
    ctx.fillStyle = ['#FF69B4', '#FFD700', '#FF6347'][Math.floor(Math.random() * 3)];
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
        ctx.ellipse(x, y, 5, 10, i * Math.PI / 2.5, 0, 2 * Math.PI);
    }
    ctx.fill();
    ctx.fillStyle = '#FFFF00';
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, 2 * Math.PI);
    ctx.fill();
}

function drawBush(ctx, x, y) {
    ctx.fillStyle = '#228B22';
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, 2 * Math.PI);
    ctx.arc(x + 15, y - 10, 20, 0, 2 * Math.PI);
    ctx.arc(x - 15, y - 10, 20, 0, 2 * Math.PI);
    ctx.fill();
}

function drawTree(ctx, x, y) {
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(x - 5, y, 10, 80);
    ctx.fillStyle = '#228B22';
    ctx.beginPath();
    ctx.moveTo(x, y - 60);
    ctx.lineTo(x - 30, y + 10);
    ctx.lineTo(x + 30, y + 10);
    ctx.fill();
}

function drawFence(ctx) {
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 3;
    for (let x = 0; x < bgImage.width; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x, bgImage.height * 0.75);
        ctx.lineTo(x, bgImage.height * 0.85);
        ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(0, bgImage.height * 0.78);
    ctx.lineTo(bgImage.width, bgImage.height * 0.78);
    ctx.stroke();
}

function initScore() {
    score = 0;
    updateScore();
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

function update() {
    // Update background position
    bgX -= 2; // Adjust this value to change scroll speed
    if (bgX <= -canvas.width) {
        bgX = 0;
    }

    // Move bunny
    if (rightPressed && bunny.x < canvas.width - bunny.width) {
        bunny.x += bunny.speed;
    }
    if (leftPressed && bunny.x > 0) {
        bunny.x -= bunny.speed;
    }

    // Apply gravity and jumping
    bunny.yVelocity += 0.5;
    bunny.y += bunny.yVelocity;

    if (bunny.y > canvas.height - bunny.height) {
        bunny.y = canvas.height - bunny.height;
        bunny.yVelocity = 0;
        bunny.isJumping = false;
        bunny.jumpCount = 0;  // Reset jump count when landing
    }

    // Move and remove obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
        obstacles[i].x -= 2;
        if (obstacles[i].x + obstacles[i].width < bunny.x && !obstacles[i].passed) {
            obstacles[i].passed = true;
            score += 10;
            updateScore();
        }
        if (obstacles[i].x + obstacles[i].width < 0) {
            obstacles.splice(i, 1);
        }
    }

    // Create new obstacles
    if (Math.random() < 0.02) {
        createObstacle();
    }

    // Move and remove eagles
    for (let i = eagles.length - 1; i >= 0; i--) {
        eagles[i].x -= eagles[i].speed;
        eagles[i].flapPosition += eagles[i].flapSpeed;
        if (eagles[i].x + eagles[i].width < 0) {
            eagles.splice(i, 1);
        }
    }

    // Create new eagles
    if (Math.random() < 0.005) { // Adjust this value to change eagle spawn frequency
        createEagle();
    }

    // Check for collisions
    checkCollisions();
}

function draw() {
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background
    ctx.drawImage(bgImage, bgX, 0);
    ctx.drawImage(bgImage, bgX + canvas.width, 0);

    // Draw bunny
    drawBunny(bunny.x, bunny.y);

    // Draw obstacles
    obstacles.forEach(obstacle => {
        drawObstacle(obstacle);
    });

    // Draw eagles
    eagles.forEach(eagle => {
        drawEagle(eagle);
    });
}

let rightPressed = false;
let leftPressed = false;
let upPressed = false;

function keyDownHandler(e) {
    if (e.key === 'Right' || e.key === 'ArrowRight') rightPressed = true;
    if (e.key === 'Left' || e.key === 'ArrowLeft') leftPressed = true;
    if (e.key === 'Up' || e.key === 'ArrowUp') {
        upPressed = true;
        if (bunny.jumpCount < bunny.maxJumps) {
            bunny.yVelocity = -bunny.jumpStrength;
            bunny.isJumping = true;
            bunny.jumpCount++;
        }
    }
}

function keyUpHandler(e) {
    if (e.key === 'Right' || e.key === 'ArrowRight') rightPressed = false;
    if (e.key === 'Left' || e.key === 'ArrowLeft') leftPressed = false;
    if (e.key === 'Up' || e.key === 'ArrowUp') upPressed = false;
}

// Define colors for our pixel art
const COLORS = {
    BUNNY_BODY: '#FFFFFF',
    BUNNY_EAR: '#FFCCCC',
    BUNNY_EYE: '#000000',
    CARROT: '#FFA500',
    CARROT_TOP: '#00AA00',
    FLOWER_STEM: '#00AA00',
    FLOWER_PETALS: '#FFFF00',
    FLOWER_CENTER: '#FF6600',
    ROCK: '#888888',
    EAGLE_BODY: '#8B4513',
    EAGLE_WING: '#D2691E',
    EAGLE_BEAK: '#FFD700'
};

function drawPixel(x, y, color, size = 4) {
    ctx.fillStyle = color;
    ctx.fillRect(x * size, y * size, size, size);
}

function drawBunny(x, y) {
    // Body
    for (let i = 0; i < 8; i++) {
        for (let j = 2; j < 8; j++) {
            drawPixel(x/4 + i, y/4 + j, COLORS.BUNNY_BODY);
        }
    }
    
    // Ears
    drawPixel(x/4 + 1, y/4, COLORS.BUNNY_EAR);
    drawPixel(x/4 + 2, y/4, COLORS.BUNNY_EAR);
    drawPixel(x/4 + 5, y/4, COLORS.BUNNY_EAR);
    drawPixel(x/4 + 6, y/4, COLORS.BUNNY_EAR);
    drawPixel(x/4 + 1, y/4 + 1, COLORS.BUNNY_EAR);
    drawPixel(x/4 + 6, y/4 + 1, COLORS.BUNNY_EAR);
    
    // Eyes
    drawPixel(x/4 + 2, y/4 + 3, COLORS.BUNNY_EYE);
    drawPixel(x/4 + 5, y/4 + 3, COLORS.BUNNY_EYE);

    // Update hitbox position
    bunny.hitbox.x = x + 5;
    bunny.hitbox.y = y + 10;

    // Uncomment to visualize the hitbox
    // ctx.strokeStyle = 'red';
    // ctx.strokeRect(bunny.hitbox.x, bunny.hitbox.y, bunny.hitbox.width, bunny.hitbox.height);
}

function drawObstacle(obstacle) {
    switch(obstacle.type) {
        case 'carrot':
            drawCarrot(obstacle.x, obstacle.y);
            break;
        case 'flower':
            drawFlower(obstacle.x, obstacle.y);
            break;
        case 'rock':
            drawRock(obstacle.x, obstacle.y);
            break;
    }
}

function drawCarrot(x, y) {
    // Carrot body
    for (let i = 0; i < 6; i++) {
        for (let j = 0; j < 8 - i; j++) {
            drawPixel(x/4 + i + 1, y/4 + j, COLORS.CARROT);
        }
    }
    // Carrot top
    drawPixel(x/4, y/4, COLORS.CARROT_TOP);
    drawPixel(x/4 + 1, y/4, COLORS.CARROT_TOP);
    drawPixel(x/4 + 2, y/4, COLORS.CARROT_TOP);
}

function drawFlower(x, y) {
    // Stem
    drawPixel(x/4 + 3, y/4 + 6, COLORS.FLOWER_STEM);
    drawPixel(x/4 + 3, y/4 + 7, COLORS.FLOWER_STEM);
    // Petals
    drawPixel(x/4 + 2, y/4 + 2, COLORS.FLOWER_PETALS);
    drawPixel(x/4 + 4, y/4 + 2, COLORS.FLOWER_PETALS);
    drawPixel(x/4 + 1, y/4 + 3, COLORS.FLOWER_PETALS);
    drawPixel(x/4 + 5, y/4 + 3, COLORS.FLOWER_PETALS);
    drawPixel(x/4 + 1, y/4 + 5, COLORS.FLOWER_PETALS);
    drawPixel(x/4 + 5, y/4 + 5, COLORS.FLOWER_PETALS);
    drawPixel(x/4 + 2, y/4 + 6, COLORS.FLOWER_PETALS);
    drawPixel(x/4 + 4, y/4 + 6, COLORS.FLOWER_PETALS);
    // Center
    drawPixel(x/4 + 3, y/4 + 3, COLORS.FLOWER_CENTER);
    drawPixel(x/4 + 2, y/4 + 4, COLORS.FLOWER_CENTER);
    drawPixel(x/4 + 3, y/4 + 4, COLORS.FLOWER_CENTER);
    drawPixel(x/4 + 4, y/4 + 4, COLORS.FLOWER_CENTER);
    drawPixel(x/4 + 3, y/4 + 5, COLORS.FLOWER_CENTER);
}

function drawRock(x, y) {
    for (let i = 1; i < 7; i++) {
        for (let j = 8 - i; j < 8; j++) {
            drawPixel(x/4 + i, y/4 + j, COLORS.ROCK);
        }
    }
}

function createObstacle() {
    const types = ['carrot', 'flower', 'rock'];
    const type = types[Math.floor(Math.random() * types.length)];
    obstacles.push({
        x: canvas.width,
        y: canvas.height - 32,
        width: 32,
        height: 32,
        passed: false,
        type: type
    });
}

function createEagle() {
    eagles.push({
        x: canvas.width,
        y: Math.random() * (canvas.height * 0.6), // Random height in the upper 60% of the screen
        width: 32,
        height: 24,
        speed: 3 + Math.random() * 2, // Random speed between 3 and 5
        flapSpeed: 0.2 + Math.random() * 0.1, // Random flap speed
        flapPosition: 0,
        passed: false
    });
}

function drawEagle(eagle) {
    const wingOffset = Math.sin(eagle.flapPosition) * 4;
    
    // Body
    ctx.fillStyle = COLORS.EAGLE_BODY;
    ctx.fillRect(eagle.x, eagle.y, eagle.width, eagle.height / 2);
    
    // Wings
    ctx.fillStyle = COLORS.EAGLE_WING;
    ctx.beginPath();
    ctx.moveTo(eagle.x, eagle.y);
    ctx.lineTo(eagle.x + eagle.width / 2, eagle.y - wingOffset);
    ctx.lineTo(eagle.x + eagle.width, eagle.y);
    ctx.fill();
    
    // Beak
    ctx.fillStyle = COLORS.EAGLE_BEAK;
    ctx.beginPath();
    ctx.moveTo(eagle.x + eagle.width, eagle.y + eagle.height / 4);
    ctx.lineTo(eagle.x + eagle.width + 8, eagle.y + eagle.height / 3);
    ctx.lineTo(eagle.x + eagle.width, eagle.y + eagle.height / 2);
    ctx.fill();
}

function checkCollisions() {
    for (let obstacle of obstacles) {
        if (
            bunny.hitbox.x < obstacle.x + 28 &&
            bunny.hitbox.x + bunny.hitbox.width > obstacle.x &&
            bunny.hitbox.y < obstacle.y + 28 &&
            bunny.hitbox.y + bunny.hitbox.height > obstacle.y
        ) {
            checkHighScore();
            alert('Game Over! Your score: ' + score);
            // Reset the game
            bunny.x = 50;
            bunny.y = canvas.height - 40;
            bunny.yVelocity = 0;
            bunny.isJumping = false;
            bunny.jumpCount = 0;
            bunny.passedObstacles.clear();
            obstacles.length = 0;
            eagles.length = 0;
            score = 0;
            updateScore();
        }
    }
    checkEagleCollisions();
}

function checkEagleCollisions() {
    for (let eagle of eagles) {
        if (
            bunny.hitbox.x < eagle.x + eagle.width &&
            bunny.hitbox.x + bunny.hitbox.width > eagle.x &&
            bunny.hitbox.y < eagle.y + eagle.height &&
            bunny.hitbox.y + bunny.hitbox.height > eagle.y
        ) {
            gameOver();
        }
    }
}

function gameOver() {
    checkHighScore();
    alert('Game Over! Your score: ' + score);
    // Reset the game
    bunny.x = 50;
    bunny.y = canvas.height - 40;
    bunny.yVelocity = 0;
    bunny.isJumping = false;
    bunny.jumpCount = 0;
    bunny.passedObstacles.clear();
    obstacles.length = 0;
    eagles.length = 0;
    score = 0;
    updateScore();
}

function checkHighScore() {
    if (leaderboard.length < 10 || score > leaderboard[leaderboard.length - 1].score) {
        const name = prompt("You made the top 10! Enter your name:");
        if (name) {
            leaderboard.push({ name, score });
            leaderboard.sort((a, b) => b.score - a.score);
            if (leaderboard.length > 10) {
                leaderboard.pop();
            }
            updateLeaderboard();
            localStorage.setItem('bunnyRunnerLeaderboard', JSON.stringify(leaderboard));
        }
    }
}

function updateLeaderboard() {
    const topScores = document.getElementById('topScores');
    topScores.innerHTML = '';
    leaderboard.forEach(entry => {
        const li = document.createElement('li');
        li.textContent = `${entry.name}: ${entry.score}`;
        topScores.appendChild(li);
    });
}

function loadLeaderboard() {
    const storedLeaderboard = localStorage.getItem('bunnyRunnerLeaderboard');
    if (storedLeaderboard) {
        leaderboard = JSON.parse(storedLeaderboard);
        updateLeaderboard();
    }
}

function updateScore() {
    document.getElementById('score').textContent = score;
}
