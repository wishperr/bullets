import { getPlayer } from './player.js';
import { gameWidth, gameHeight } from './game.js';
import { projectiles } from './projectiles.js';

export const enemies = [];
const enemySpeed = 1.5;
let normalEnemyKillCount = 0;

export function spawnEnemy(type = "normal", waveNumber = 1, isShielded = false) {
    const edge = Math.floor(Math.random() * 4);
    let x, y;
    switch (edge) {
        case 0: x = Math.random() * gameWidth; y = 0; break;
        case 1: x = Math.random() * gameWidth; y = gameHeight; break;
        case 2: x = 0; y = Math.random() * gameHeight; break;
        case 3: x = gameWidth; y = Math.random() * gameHeight; break;
    }

    let enemy;
    if (type === "tank") {
        enemy = { pos: { x, y }, radius: 20, health: 5, type: "tank" };
    } else if (type === "boss") {
        enemy = { pos: { x, y }, radius: 40, health: 20, type: "boss" };
    } else if (type === "shooter") {
        enemy = { 
            pos: { x, y }, 
            radius: 15, 
            health: 2, 
            type: "shooter", 
            shoots: true, 
            shootCooldown: 2000, 
            lastShot: Date.now() 
        };
    } else {
        enemy = { pos: { x, y }, radius: 10, health: 1, type: "normal" };
    }

    if (isShielded) {
        enemy.shield = 3;
    }

    enemies.push(enemy);
}

export function updateEnemies() {
    const player = getPlayer();
    if (!player) return;

    enemies.forEach(e => {
        const dx = player.pos.x - e.pos.x;
        const dy = player.pos.y - e.pos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (e.type === "shooter" && dist > 150) {
            e.pos.x += (dx / dist) * enemySpeed;
            e.pos.y += (dy / dist) * enemySpeed;
        } else if (e.type !== "shooter") {
            e.pos.x += (dx / dist) * enemySpeed;
            e.pos.y += (dy / dist) * enemySpeed;
        }

        if (e.shoots) {
            if (!e.lastShot) e.lastShot = Date.now();
            if (Date.now() - e.lastShot > e.shootCooldown) {
                let angle = Math.atan2(dy, dx);
                projectiles.push({
                    pos: { x: e.pos.x, y: e.pos.y },
                    vel: { x: Math.cos(angle) * 4, y: Math.sin(angle) * 4 },
                    radius: 5,
                    damage: 1,
                    enemyShot: true,
                    color: "cyan" // ✅ Ensures color property is set
                });
                e.lastShot = Date.now();
            }
        }
    });
}

export function getNormalEnemyKillCount() {
    return normalEnemyKillCount;
}

export function increaseNormalEnemyKillCount() {
    normalEnemyKillCount++;
}

export function resetNormalEnemyKillCount() {
    normalEnemyKillCount = 0;
}
