import { initializePlayer, getPlayer, handlePlayerMovement } from './player.js';
import { spawnEnemy, updateEnemies, enemies } from './enemies.js';
import { updateProjectiles, shootProjectiles, projectiles, drawProjectiles, setCamera } from './projectiles.js';
import { updateUI, showGameOver, updateWaveUI, showBossMessage } from './ui.js';
import { GAME_WIDTH, GAME_HEIGHT, CAMERA, WAVE, WAVE_SPAWN_RATE, ENEMY_TYPES } from './constants.js';
import { updatePowerups, drawPowerups } from './powerups.js';
import { updateParticles, drawParticles } from "./particles.js";
import { handleCollisions } from './systems/collisionSystem.js';
import { getDistance } from './utils.js';
import { UI_ELEMENTS } from './uiConstants.js';
import { handleEnemyDeath, resetKillCount, getKillCount } from './weapons/common/enemyUtils.js';
import { initializeArsenalBoss, drawArsenalBoss } from './weapons/systems/arsenalSystem.js';
import { spawnWaveEnemies } from './systems/waveSystem.js';
import { updateDroneSwarm, drawDroneSwarm } from './weapons/systems/droneSwarmSystem.js';
import { updateMinimap } from './systems/minimapSystem.js';

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
                spawnWaveEnemies(waveNumber);
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
    spawnWaveEnemies(1); // Pass wave number 1 explicitly
    startWave();
    setCamera(camera);  // Add this line to set the camera reference
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
    updateDroneSwarm();  // Add drone swarm update
    updateCamera();
    updatePowerups();
    updateMinimap(); // Add minimap update

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
    drawDroneSwarm(ctx, camera);

    // Update boss health bar visibility
    let bossPresent = false;
    let currentBoss = null;

    enemies.forEach(e => {
        if (e.type === "arsenal_boss") {
            bossPresent = true;
            currentBoss = e;
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

            if (e.type === "boss") {
                bossPresent = true;
                currentBoss = e;
            }

            ctx.beginPath();
            ctx.arc(e.pos.x - camera.x, e.pos.y - camera.y, e.radius, 0, Math.PI * 2);
            ctx.fill();
        }

        if (e.shield > 0) {
            ctx.strokeStyle = "cyan";
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(e.pos.x - camera.x, e.pos.y - camera.y, e.radius + 5, 0, Math.PI * 2);
            ctx.stroke();
        }
    });

    // Update boss health bar UI
    if (bossPresent && currentBoss) {
        const maxHealth = currentBoss.type === "arsenal_boss" ? 
            ENEMY_TYPES.ARSENAL_BOSS.HEALTH : 
            ENEMY_TYPES.BOSS.HEALTH;
        
        const healthPercentage = (currentBoss.health / maxHealth) * 100;
        
        UI_ELEMENTS.bossHealthBar.style.display = "block";
        UI_ELEMENTS.bossName.textContent = currentBoss.type === "arsenal_boss" ? 
            "Arsenal Boss" : "Boss";
        UI_ELEMENTS.healthBar.style.width = `${healthPercentage}%`;
        UI_ELEMENTS.healthPercentage.textContent = `${Math.round(healthPercentage)}%`;
    } else {
        UI_ELEMENTS.bossHealthBar.style.display = "none";
    }

    drawPowerups(ctx, camera);
}
