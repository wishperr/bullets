import { initializePlayer, getPlayer, handlePlayerMovement } from './player.js';
import { spawnEnemy, updateEnemies, enemies } from './enemies.js';
import { updateProjectiles, shootProjectiles, projectiles, drawProjectiles } from './projectiles.js';
import { updateUI, showGameOver, updateWaveUI, showBossMessage } from './ui.js';
import { GAME_WIDTH, GAME_HEIGHT, CAMERA, WAVE, WAVE_SPAWN_RATE, ENEMY_TYPES } from './constants.js';
import { updatePowerups, drawPowerups } from './powerups.js';
import { updateParticles, drawParticles } from "./particles.js";
import { handleCollisions } from './systems/collisionSystem.js';
import { getDistance } from './utils.js';
import { UI_ELEMENTS } from './uiConstants.js';
import { handleEnemyDeath, resetKillCount, getKillCount } from './weapons/common/enemyUtils.js';

// Game canvas setup
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = CAMERA.WIDTH;
canvas.height = CAMERA.HEIGHT;

const camera = { x: 0, y: 0, width: CAMERA.WIDTH, height: CAMERA.HEIGHT };

// Game state
let gameOver = false;
let waveNumber = 1;
let enemySpawnRate = WAVE_SPAWN_RATE;
let projectileInterval;
let nextWaveTime;
export let gamePaused = false;
let pauseStartTime = 0;  // Track when the game was paused

function startWave() {
    nextWaveTime = Date.now() + WAVE_SPAWN_RATE;

    setInterval(() => {
        if (!gameOver && !gamePaused) {
            // Check if there's a boss alive
            const bossAlive = enemies.some(e => e.type === "boss");
            
            if (Date.now() >= nextWaveTime && !bossAlive) {
                waveNumber++;
                enemySpawnRate = Math.max(500, enemySpawnRate - 200);
                spawnWaveEnemies();
                updateWaveUI(waveNumber);
                nextWaveTime = Date.now() + WAVE_SPAWN_RATE;
            }
        }
    }, 1000);

    // Update wave timer every second
    setInterval(() => {
        if (!gameOver && !gamePaused) {
            const bossAlive = enemies.some(e => e.type === "boss");
            if (bossAlive) {
                UI_ELEMENTS.waveTimer.innerText = "Defeat the boss!";
            } else {
                const timeRemaining = Math.max(0, Math.ceil((nextWaveTime - Date.now()) / 1000));
                UI_ELEMENTS.waveTimer.innerText = `Next wave in: ${timeRemaining}s`;
            }
        }
    }, 1000);
}

function spawnWaveEnemies() {
    if (waveNumber === 3) {
        // Spawn boss without clearing existing enemies
        spawnEnemy("boss");
        showBossMessage();
        return;
    }

    let enemyCount = WAVE.INITIAL_ENEMY_COUNT + waveNumber * WAVE.ENEMY_COUNT_INCREMENT;

    for (let i = 0; i < enemyCount; i++) {
        let type = "normal";

        if (Math.random() < WAVE.TANK_SPAWN_CHANCE_BASE + waveNumber * WAVE.TANK_SPAWN_CHANCE_INCREMENT) {
            type = "tank";
        }

        if (waveNumber >= 5 && Math.random() < WAVE.SHIELDED_SPAWN_CHANCE) {
            spawnEnemy(type, waveNumber, true);
        } else if (waveNumber % WAVE.SHIELDED_SPAWN_INTERVAL === 0 && Math.random() < WAVE.SHOOTER_SPAWN_CHANCE) {
            spawnEnemy("shooter", waveNumber);
        } else {
            spawnEnemy(type);
        }
    }
}

function enemyInView() {
    return enemies.some(e => 
        e.pos.x >= camera.x && e.pos.x <= camera.x + camera.width &&
        e.pos.y >= camera.y && e.pos.y <= camera.y + camera.height
    );
}

function updateProjectileInterval() {
    if (projectileInterval) clearInterval(projectileInterval);
    const player = getPlayer();
    if (!player) return;
    
    if (enemyInView()) {
        projectileInterval = setInterval(shootProjectiles, player.attackSpeed);
    }
}

export function initializeGame() {
    initializePlayer();
    spawnWaveEnemies();
    startWave();
    updateProjectileInterval();
}

function updateCamera() {
    const player = getPlayer();
    if (!player) return;

    camera.x = Math.max(0, Math.min(player.pos.x - camera.width / 2, GAME_WIDTH - camera.width));
    camera.y = Math.max(0, Math.min(player.pos.y - camera.height / 2, GAME_HEIGHT - camera.height));
}

export function gameLoop() {
    if (gameOver || gamePaused) return;

    handlePlayerMovement(); // This is imported from player.js
    updateProjectiles();
    updateEnemies();
    updateParticles();
    updateCamera();
    updatePowerups();

    if (enemyInView()) {
        if (!projectileInterval) updateProjectileInterval();
    } else if (projectileInterval) {
        clearInterval(projectileInterval);
        projectileInterval = null;
    }

    // Use the centralized collision system
    if (handleCollisions()) {
        gameOver = true;
        stopGame();
        return;
    }

    draw();
    const player = getPlayer();
    if (player) {
        updateUI(getKillCount(), player.xp, player.level, player.xpToNextLevel, player.health);
    }
    requestAnimationFrame(gameLoop);
}

export function stopGame() {
    gameOver = true;
    showGameOver();
}

export function pauseGame() {
    gamePaused = true;
    pauseStartTime = Date.now();
    if (projectileInterval) {
        clearInterval(projectileInterval);
        projectileInterval = null;
    }
}

export function resumeGame() {
    if (gamePaused) {
        const pauseDuration = Date.now() - pauseStartTime;
        nextWaveTime += pauseDuration;
        gamePaused = false;
        updateProjectileInterval();
        gameLoop();
    }
}

// Removed unused startGame() function here

function drawGrid() {
    ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
    ctx.lineWidth = 1;
    for (let x = -camera.x % 50; x < canvas.width + 50; x += 50) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    for (let y = -camera.y % 50; y < canvas.height + 50; y += 50) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid();

    const player = getPlayer();
    if (player) {
        ctx.fillStyle = "blue";
        ctx.beginPath();
        ctx.arc(player.pos.x - camera.x, player.pos.y - camera.y, player.radius, 0, Math.PI * 2);
        ctx.fill();
    }

    if (player.invincible) {
        ctx.strokeStyle = "cyan";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(player.pos.x - camera.x, player.pos.y - camera.y, player.radius + 10, 0, Math.PI * 2);
        ctx.stroke();
    }
    
    drawProjectiles(ctx, camera);
    drawParticles(ctx, camera);

    enemies.forEach(e => {
        ctx.fillStyle = e.type === "boss" ? 
            (e.isInvulnerable ? "rgba(255, 0, 0, 0.5)" : "red") : 
            e.type === "tank" ? "yellow" : 
            e.type === "shooter" ? "pink" : "green";

        ctx.beginPath();
        ctx.arc(e.pos.x - camera.x, e.pos.y - camera.y, e.radius, 0, Math.PI * 2);
        ctx.fill();

        // Add boss health bar and percentage
        if (e.type === "boss") {
            const healthBarWidth = 200;
            const healthBarHeight = 10;
            const healthPercentage = e.health / ENEMY_TYPES.BOSS.HEALTH;
            
            // Health bar background
            ctx.fillStyle = "black";
            ctx.fillRect(
                e.pos.x - camera.x - healthBarWidth/2,
                e.pos.y - camera.y - e.radius - 20,
                healthBarWidth,
                healthBarHeight
            );
            
            // Health bar fill
            ctx.fillStyle = healthPercentage > 0.5 ? "green" : 
                          healthPercentage > 0.25 ? "yellow" : "red";
            ctx.fillRect(
                e.pos.x - camera.x - healthBarWidth/2,
                e.pos.y - camera.y - e.radius - 20,
                healthBarWidth * healthPercentage,
                healthBarHeight
            );

            // Add health percentage text
            ctx.fillStyle = "white";
            ctx.font = "16px Arial";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(
                Math.round(healthPercentage * 100) + "%",
                e.pos.x - camera.x,
                e.pos.y - camera.y
            );
        }

        if (e.shield > 0) {
            ctx.strokeStyle = "cyan";
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(e.pos.x - camera.x, e.pos.y - camera.y, e.radius + 5, 0, Math.PI * 2);
            ctx.stroke();
        }
    });

    drawPowerups(ctx, camera);
}
