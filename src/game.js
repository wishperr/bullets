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
import { initializeArsenalBoss, drawArsenalBoss } from './weapons/systems/arsenalSystem.js';

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
            // Check if there's any type of boss alive
            const bossAlive = enemies.some(e => e.type === "boss" || e.type === "arsenal_boss");
            
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
            const bossAlive = enemies.some(e => e.type === "boss" || e.type === "arsenal_boss");
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
    if (waveNumber === 2) {
        const boss = spawnEnemy("arsenal_boss");
        initializeArsenalBoss(boss);
        showBossMessage();
        return;
    } else if (waveNumber === 3) {
        spawnEnemy("boss");
        showBossMessage();
        return;
    }

    let enemyCount = WAVE.INITIAL_ENEMY_COUNT + waveNumber * WAVE.ENEMY_COUNT_INCREMENT;
    for (let i = 0; i < enemyCount; i++) {
        let type = "normal";
        
        // First determine if we spawn a special enemy type
        const roll = Math.random();
        if (roll < WAVE.TANK_SPAWN_CHANCE_BASE + waveNumber * WAVE.TANK_SPAWN_CHANCE_INCREMENT) {
            type = "tank";
        } else if (roll < (WAVE.TANK_SPAWN_CHANCE_BASE + waveNumber * WAVE.TANK_SPAWN_CHANCE_INCREMENT) + 0.3) {
            // 30% chance after tank roll to spawn a berserker
            type = "berserker";
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
        if (e.type === "arsenal_boss") {
            drawArsenalBoss(ctx, e, camera);
        } else if (e.type === "arsenal_turret") {
            // Draw turret
            ctx.fillStyle = "#888888";
            ctx.beginPath();
            ctx.arc(e.pos.x - camera.x, e.pos.y - camera.y, e.radius, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw turret barrel
            if (e.lastTarget) {
                const angle = Math.atan2(e.lastTarget.y - e.pos.y, e.lastTarget.x - e.pos.x);
                ctx.strokeStyle = "#666666";
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.moveTo(e.pos.x - camera.x, e.pos.y - camera.y);
                ctx.lineTo(
                    e.pos.x - camera.x + Math.cos(angle) * e.radius * 1.5,
                    e.pos.y - camera.y + Math.sin(angle) * e.radius * 1.5
                );
                ctx.stroke();
            }
        } else if (e.type === "berserker") {
            // Draw berserker with unique appearance
            const baseColor = e.rageStage === 3 ? '#660000' : 
                            e.rageStage === 2 ? '#884400' : 
                            e.rageStage === 1 ? '#666600' : '#446600';
            
            // Draw main body with spiky appearance
            const spikes = 8;
            const spikeLength = 5 + (e.rageStage * 2); // Spikes grow with rage
            
            ctx.fillStyle = baseColor;
            ctx.beginPath();
            
            for (let i = 0; i < spikes * 2; i++) {
                const angle = (i * Math.PI) / spikes;
                const radius = i % 2 === 0 ? e.radius + spikeLength : e.radius;
                const x = e.pos.x - camera.x + Math.cos(angle) * radius;
                const y = e.pos.y - camera.y + Math.sin(angle) * radius;
                
                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            
            ctx.closePath();
            ctx.fill();

            // Add glowing outline based on rage state
            if (e.rageStage > 0) {
                ctx.strokeStyle = e.rageStage === 3 ? '#ff0000' : 
                                e.rageStage === 2 ? '#ff8800' : '#ffff00';
                ctx.lineWidth = 2 + e.rageStage;
                ctx.shadowBlur = 10;
                ctx.shadowColor = ctx.strokeStyle;
                ctx.stroke();
                ctx.shadowBlur = 0;
            }
        } else {
            ctx.fillStyle = e.type === "boss" ? 
                (e.isInvulnerable ? "rgba(255, 0, 0, 0.5)" : "red") : 
                e.type === "tank" ? "yellow" : 
                e.type === "shooter" ? "pink" : "green";

            ctx.beginPath();
            ctx.arc(e.pos.x - camera.x, e.pos.y - camera.y, e.radius, 0, Math.PI * 2);
            ctx.fill();
        }

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
