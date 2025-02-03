import { getPlayer } from './player.js';
import { enemies } from './enemies.js';
import { gameWidth, gameHeight } from './game.js';
import { showGameOver } from './ui.js';
import { stopGame } from './game.js';

export const projectiles = [];

export function shootProjectiles() {
    const player = getPlayer();
    if (!player) return;

    const closestEnemy = findClosestEnemy(player);
    let baseProjectiles = 3 + player.additionalProjectiles;

    if (player.weapon && player.weapon === "shotgun") {
        if (!closestEnemy) return;

        const dx = closestEnemy.pos.x - player.pos.x;
        const dy = closestEnemy.pos.y - player.pos.y;
        const baseAngle = Math.atan2(dy, dx);

        for (let i = 0; i < baseProjectiles; i++) {
            let spreadOffset = (-15 + (30 / (baseProjectiles - 1)) * i) * (Math.PI / 180);
            let finalAngle = baseAngle + spreadOffset;

            let velocity = {
                x: Math.cos(finalAngle) * 5,
                y: Math.sin(finalAngle) * 5
            };

            projectiles.push({
                pos: { x: player.pos.x, y: player.pos.y },
                vel: velocity,
                radius: 5,
                damage: player.projectileStrength || 1,
                enemyShot: false
            });
        }
    } else {
        let velocity = { x: 0, y: -5 };
        if (closestEnemy) {
            const dx = closestEnemy.pos.x - player.pos.x;
            const dy = closestEnemy.pos.y - player.pos.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            velocity = { x: (dx / distance) * 5, y: (dy / distance) * 5 };
        }

        projectiles.push({
            pos: { x: player.pos.x, y: player.pos.y },
            vel: velocity,
            radius: 5,
            damage: player.projectileStrength || 1,
            enemyShot: false
        });
    }
}

function findClosestEnemy(player) {
    if (enemies.length === 0) return null;

    let closestEnemy = null;
    let minDistance = Infinity;

    enemies.forEach(enemy => {
        const dx = enemy.pos.x - player.pos.x;
        const dy = enemy.pos.y - player.pos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < minDistance) {
            minDistance = distance;
            closestEnemy = enemy;
        }
    });

    return closestEnemy;
}

export function updateProjectiles() {
    const player = getPlayer();
    for (let i = projectiles.length - 1; i >= 0; i--) {
        let p = projectiles[i];
        p.pos.x += p.vel.x;
        p.pos.y += p.vel.y;

        // ✅ Enemy bullets hit the player
        if (p.enemyShot) {
            const dist = Math.hypot(player.pos.x - p.pos.x, player.pos.y - p.pos.y);
            if (dist < player.radius + p.radius) {
                stopGame(); // ✅ Ensures the game completely stops
                return;
            }
        }

        if (p.pos.x < 0 || p.pos.x > gameWidth || p.pos.y < 0 || p.pos.y > gameHeight) {
            projectiles.splice(i, 1);
        }
    }
}

export function drawProjectiles(ctx) {
    projectiles.forEach(p => {
        ctx.fillStyle = p.enemyShot ? "cyan" : "red";
        ctx.beginPath();
        ctx.arc(p.pos.x, p.pos.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
    });
}