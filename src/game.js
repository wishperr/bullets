import { initializePlayer, getPlayer, handlePlayerMovement, addXP } from './player.js';
import { spawnEnemy, updateEnemies, enemies } from './enemies.js';
import { updateProjectiles, shootProjectiles, projectiles, drawProjectiles } from './projectiles.js';
import { updateUI, showGameOver, updateWaveUI, showBossMessage } from './ui.js';
import { GAME_WIDTH, GAME_HEIGHT, CAMERA, WAVE, WAVE_SPAWN_RATE, ENEMY_TYPES } from './constants.js';
import { updatePowerups, drawPowerups, dropPowerup, spinningStar } from './powerups.js';
import { createExplosion, updateParticles, drawParticles } from "./particles.js";
import { getDistance } from './utils.js';
import { UI_ELEMENTS } from './uiConstants.js';  // Add this import

// Game canvas setup
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = CAMERA.WIDTH;
canvas.height = CAMERA.HEIGHT;

const camera = { x: 0, y: 0, width: CAMERA.WIDTH, height: CAMERA.HEIGHT };

// Game state
let gameOver = false;
export let killCount = 0;  // Make killCount accessible to other modules
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
            if (Date.now() >= nextWaveTime) {
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
            const timeRemaining = Math.max(0, Math.ceil((nextWaveTime - Date.now()) / 1000));
            UI_ELEMENTS.waveTimer.innerText = `Next wave in: ${timeRemaining}s`;
        }
    }, 1000);
}

function spawnWaveEnemies() {
    let enemyCount = WAVE.INITIAL_ENEMY_COUNT + waveNumber * WAVE.ENEMY_COUNT_INCREMENT;

    if (waveNumber === 3) {
        spawnEnemy("boss");
        showBossMessage();
        return;
    }

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

    handlePlayerMovement();
    updateProjectiles();
    updateEnemies();
    updateParticles();
    updateCamera();
    updatePowerups();

    if (enemyInView()) {
        if (!projectileInterval) updateProjectileInterval();
    } else {
        if (projectileInterval) {
            clearInterval(projectileInterval);
            projectileInterval = null;
        }
    }

    const player = getPlayer();
    if (player) {
        // Handle shooter enemy projectiles hitting the player
        for (let projIndex = projectiles.length - 1; projIndex >= 0; projIndex--) {
            const p = projectiles[projIndex];
            if (p.enemyShot) {
                const distance = getDistance(p.pos.x, p.pos.y, player.pos.x);
                if (distance < p.radius + player.radius) {
                    player.health -= 1;
                    updateUI(killCount, player.xp, player.level, player.xpToNextLevel, player.health);
                    projectiles.splice(projIndex, 1);
                    if (player.health <= 0) {
                        gameOver = true;
                        stopGame();
                        return;
                    }
                }
            }
        }

        enemies.forEach((e, enemyIndex) => {
            // Handle player collision with enemy
            if (!player.invincible && getDistance(player.pos.x, player.pos.y, e.pos.x, e.pos.y) < player.radius + e.radius) {
                // console.log(`Player received ${e.damage || 1} damage from ${e.type} at (${e.pos.x}, ${e.pos.y})`);
                player.health -= e.damage || 1;
                updateUI(killCount, player.xp, player.level, player.xpToNextLevel, player.health);
                enemies.splice(enemyIndex, 1);
        
                if (player.health <= 0) {
                    // console.log("Player has died!");
                    gameOver = true; 
                    stopGame();
                    return;
                }
            }
        
            // Handle player projectiles hitting enemies
            for (let projIndex = projectiles.length - 1; projIndex >= 0; projIndex--) {
                const p = projectiles[projIndex];
                if (p.enemyShot) continue;
                const distance = getDistance(p.pos.x, p.pos.y, e.pos.x, e.pos.y);
        
                if (distance < p.radius + e.radius) {
                    if (e.shield > 0) {
                        e.shield--;
                    } else {
                        e.health -= p.damage || projectiles.DAMAGE;
                    }
        
                    projectiles.splice(projIndex, 1);
        
                    if (e.health <= 0) {
                        createExplosion(e.pos.x, e.pos.y);
                        dropPowerup(e.pos);
                        enemies.splice(enemyIndex, 1);
                        killCount++;
                        addXP(ENEMY_TYPES[e.type.toUpperCase()].EXP);
                    }
                    break;
                }
            }
        }); 
    }

    draw();
    updateUI(killCount, player.xp, player.level, player.xpToNextLevel, player.health);
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
        ctx.fillStyle = e.type === "boss" ? "red" : e.type === "tank" ? "yellow" : e.type === "shooter" ? "pink" : "green";
    
        ctx.beginPath();
        ctx.arc(e.pos.x - camera.x, e.pos.y - camera.y, e.radius, 0, Math.PI * 2);
        ctx.fill();
    
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
