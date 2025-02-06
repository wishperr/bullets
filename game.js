import { initializePlayer, getPlayer, handlePlayerMovement, addXP, unlockNewWeapon } from './player.js';
import { spawnEnemy, updateEnemies, enemies } from './enemies.js';
import { updateProjectiles, shootProjectiles, projectiles, drawProjectiles } from './projectiles.js';
import { updateUI, showGameOver, updateWaveUI } from './ui.js';

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

export const gameWidth = 3000; // Increased world size
export const gameHeight = 3000;
canvas.width = 1000;
canvas.height = 800;

let gameOver = false;
let killCount = 0;
let waveNumber = 1;
let enemySpawnRate = 2000;
let projectileInterval;
let gamePaused = false;

const camera = { x: 0, y: 0, width: canvas.width, height: canvas.height };

function startWave() {
    setInterval(() => {
        if (!gameOver && !gamePaused) {
            waveNumber++;
            enemySpawnRate = Math.max(500, enemySpawnRate - 200);
            spawnWaveEnemies();
            updateWaveUI(waveNumber);
        }
    }, 20000);
}

function spawnWaveEnemies() {
    let enemyCount = 50 + waveNumber * 2;

    if (waveNumber % 5 === 0) {
        spawnEnemy("boss");
    }

    for (let i = 0; i < enemyCount; i++) {
        let type = "normal";

        if (Math.random() < 0.2 + waveNumber * 0.02) {
            type = "tank";
        }

        if (waveNumber >= 5 && Math.random() < 0.3) {
            spawnEnemy(type, waveNumber, true);
        } else if (waveNumber % 1 === 0 && Math.random() < 0.4) {
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
    
    camera.x = Math.max(0, Math.min(player.pos.x - camera.width / 2, gameWidth - camera.width));
    camera.y = Math.max(0, Math.min(player.pos.y - camera.height / 2, gameHeight - camera.height));
}

export function gameLoop() {
    if (gameOver || gamePaused) return;

    handlePlayerMovement();
    updateProjectiles();
    updateEnemies();
    updateCamera();
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
            if (p.enemyShot) { // Only process enemy projectiles
                const distance = Math.hypot(p.pos.x - player.pos.x, p.pos.y - player.pos.y);
                if (distance < p.radius + player.radius) {
                    player.health -= 1;
                    updateUI(killCount, player.xp, player.level, player.xpToNextLevel, player.health);
                    projectiles.splice(projIndex, 1); // Remove projectile
                    if (player.health <= 0) {
                        gameOver = true; // Ensure game state is updated
                        stopGame();
                        return;
                    }
                }
            }
        }

        enemies.forEach((e, enemyIndex) => {
            if (Math.hypot(player.pos.x - e.pos.x, player.pos.y - e.pos.y) < player.radius + e.radius) {
                player.health -= 1;
                updateUI(killCount, player.xp, player.level, player.xpToNextLevel, player.health);
                enemies.splice(enemyIndex, 1); // Remove enemy on collision
                if (player.health <= 0) {
                    gameOver = true; // Ensure game state is updated
                    stopGame();
                    return;
                }
            }

            for (let projIndex = projectiles.length - 1; projIndex >= 0; projIndex--) {
                const p = projectiles[projIndex];
                const distance = Math.hypot(p.pos.x - e.pos.x, p.pos.y - e.pos.y);

                if (p.enemyShot) {
                    continue; // ✅ Completely skip enemy projectiles in enemy collision logic
                }
                

                if (distance < p.radius + e.radius) {
                    e.health -= p.damage || 1;
                    projectiles.splice(projIndex, 1);

                    if (e.health <= 0) {
                        enemies.splice(enemyIndex, 1);
                        killCount++;
                        addXP(e.type === "boss" ? 10 : e.type === "tank" ? 5 : e.type === "shooter" ? 3 : 1);
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
}

export function resumeGame() {
    gamePaused = false;
    updateProjectileInterval();
    gameLoop();
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

    drawProjectiles(ctx, camera);

    enemies.forEach(e => {
        ctx.fillStyle = e.type === "boss" ? "red" : e.type === "tank" ? "yellow" : e.type === "shooter" ? "pink" : "green";
        ctx.beginPath();
        ctx.arc(e.pos.x - camera.x, e.pos.y - camera.y, e.radius, 0, Math.PI * 2);
        ctx.fill();
    });
}