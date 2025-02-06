import { getPlayer } from './player.js';
import { updateUI, showGameOver } from './ui.js';
import { stopGame } from './game.js';
import { enemies } from './enemies.js';
import { gameWidth, gameHeight } from './game.js';

export let projectiles = [];

export function shootProjectiles() {
    const player = getPlayer();
    if (!player) return;

    const closestEnemy = findClosestEnemy(player);
    let baseProjectiles = 3 + (player.additionalProjectiles || 0);

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

            const newProjectile = {
                pos: { x: player.pos.x, y: player.pos.y },
                vel: velocity,
                radius: 5,
                damage: player.projectileStrength || 1,
                enemyShot: false
            };
            projectiles.push(newProjectile);
        }
    } else {
        let velocity = { x: 0, y: -5 };
        if (closestEnemy) {
            const dx = closestEnemy.pos.x - player.pos.x;
            const dy = closestEnemy.pos.y - player.pos.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            velocity = { x: (dx / distance) * 5, y: (dy / distance) * 5 };
        }

        const newProjectile = {
            pos: { x: player.pos.x, y: player.pos.y },
            vel: velocity,
            radius: 5,
            damage: player.projectileStrength || 1,
            enemyShot: false
        };
        projectiles.push(newProjectile);
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

        // Check for enemy projectile collisions with the player
        if (p.enemyShot) {
            const dist = Math.hypot(player.pos.x - p.pos.x, player.pos.y - p.pos.y);
            if (dist < player.radius + p.radius) {
                player.health -= 1;
                updateUI();
                projectiles.splice(i, 1);

                if (player.health <= 0) {
                    stopGame();
                    return;
                }
            }
            continue; // ✅ Ensure enemy projectiles don't interact with other enemies
        }

        // Remove projectiles that leave the screen
        if (p.pos.x < 0 || p.pos.x > gameWidth || p.pos.y < 0 || p.pos.y > gameHeight) {
            projectiles.splice(i, 1);
        }
    }
}

export function drawProjectiles(ctx, camera) {
    projectiles.forEach((p, index) => {
        if (
            p.pos.x >= camera.x && p.pos.x <= camera.x + camera.width &&
            p.pos.y >= camera.y && p.pos.y <= camera.y + camera.height
        ) {
            ctx.fillStyle = p.enemyShot ? "cyan" : "red";
            ctx.beginPath();
            ctx.arc(p.pos.x - camera.x, p.pos.y - camera.y, p.radius, 0, Math.PI * 2);
            ctx.fill();
        }
    });
}
