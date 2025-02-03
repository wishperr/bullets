import { initializePlayer, getPlayer, handlePlayerMovement, addXP, unlockNewWeapon } from './player.js';
import { spawnEnemy, updateEnemies, enemies } from './enemies.js';
import { updateProjectiles, shootProjectiles, projectiles, drawProjectiles } from './projectiles.js';
import { updateUI, showGameOver, updateWaveUI } from './ui.js';

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

export const gameWidth = 1000;
export const gameHeight = 800;
canvas.width = gameWidth;
canvas.height = gameHeight;

let gameOver = false;
let killCount = 0;
let waveNumber = 1;
let enemySpawnRate = 2000;
let projectileInterval;
let gamePaused = false;

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
    let enemyCount = 10 + waveNumber * 2;

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

function updateProjectileInterval() {
    if (projectileInterval) clearInterval(projectileInterval);
    const player = getPlayer();
    projectileInterval = setInterval(shootProjectiles, player.attackSpeed);
}

export function initializeGame() {
    initializePlayer();
    spawnWaveEnemies();
    startWave();
    updateProjectileInterval();
}

export function gameLoop() {
    if (gameOver || gamePaused) return;

    handlePlayerMovement();
    updateProjectiles();
    updateEnemies();

    const player = getPlayer();
    if (player) {
        enemies.forEach((e, enemyIndex) => {
            if (Math.hypot(player.pos.x - e.pos.x, player.pos.y - e.pos.y) < player.radius + e.radius) {
                stopGame();
                return;
            }

            for (let projIndex = projectiles.length - 1; projIndex >= 0; projIndex--) {
                const p = projectiles[projIndex];
                const distance = Math.hypot(p.pos.x - e.pos.x, p.pos.y - e.pos.y);

                if (p.enemyShot && e.type === "shooter") {
                    continue;
                }

                if (distance < p.radius + e.radius) {
                    e.health -= p.damage || 1;
                    projectiles.splice(projIndex, 1);

                    if (e.health <= 0) {
                        enemies.splice(enemyIndex, 1);
                        killCount++;
                        //addXP(e.type === "tank" ? 3 : 1);
                        addXP(e.type === "boss" ? 10 : e.type === "tank" ? 5 : e.type === "shooter" ? 3 : 1)
                    }
                    break;
                }
            }
        });
    }

    draw();
    updateUI(killCount, player.xp, player.level, player.xpToNextLevel);
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

function draw() {
    ctx.clearRect(0, 0, gameWidth, gameHeight);

    const player = getPlayer();
    if (player) {
        ctx.fillStyle = "blue";
        ctx.beginPath();
        ctx.arc(player.pos.x, player.pos.y, player.radius, 0, Math.PI * 2);
        ctx.fill();
    }

    drawProjectiles(ctx);

    enemies.forEach(e => {
        if (e.shield) {
            ctx.strokeStyle = "lightblue";
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(e.pos.x, e.pos.y, e.radius + 3, 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.fillStyle = e.type === "boss" ? "red" : e.type === "tank" ? "yellow" : e.type === "shooter" ? "pink" : "green";
        ctx.beginPath();
        ctx.arc(e.pos.x, e.pos.y, e.radius, 0, Math.PI * 2);
        ctx.fill();
    });
}