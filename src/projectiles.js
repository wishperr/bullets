import { getPlayer } from './player.js';
import { enemies } from './enemies.js';
import { stopGame } from './game.js';
import { PROJECTILE, GAME_WIDTH, GAME_HEIGHT } from './constants.js';
import { updateUI } from './ui.js';

export let projectiles = [];

export function shootProjectiles() {
    const player = getPlayer();
    if (!player) return;

    const closestEnemy = findClosestEnemy(player);
    let baseProjectiles = 2 + player.additionalProjectiles; // Using constant for additional projectiles

    if (player.weapon === "shotgun") {
        if (!closestEnemy) return;

        const dx = closestEnemy.pos.x - player.pos.x;
        const dy = closestEnemy.pos.y - player.pos.y;
        const baseAngle = Math.atan2(dy, dx);

        for (let i = 0; i < baseProjectiles; i++) {
            let spreadOffset = (-15 + (30 / (baseProjectiles - 1)) * i) * (Math.PI / 180);
            let finalAngle = baseAngle + spreadOffset;

            let velocity = {
                x: Math.cos(finalAngle) * PROJECTILE.SPEED,
                y: Math.sin(finalAngle) * PROJECTILE.SPEED
            };

            projectiles.push({
                pos: { x: player.pos.x, y: player.pos.y },
                vel: velocity,
                radius: PROJECTILE.RADIUS,
                damage: player.projectileStrength,
                enemyShot: false
            });
        }
    } else {
        let velocity = { x: 0, y: -PROJECTILE.SPEED };
        if (closestEnemy) {
            const dx = closestEnemy.pos.x - player.pos.x;
            const dy = closestEnemy.pos.y - player.pos.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            velocity = { x: (dx / distance) * PROJECTILE.SPEED, y: (dy / distance) * PROJECTILE.SPEED };
        }

        projectiles.push({
            pos: { x: player.pos.x, y: player.pos.y },
            vel: velocity,
            radius: PROJECTILE.RADIUS,
            damage: player.projectileStrength,
            enemyShot: false
        });
    }
}

function findClosestEnemy(player) {
    if (enemies.length === 0) return null;
    return enemies.reduce((closest, enemy) => {
        const dx = enemy.pos.x - player.pos.x;
        const dy = enemy.pos.y - player.pos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < (closest?.distance || Infinity) ? { enemy, distance } : closest;
    }, null)?.enemy;
}

export function updateProjectiles() {
    const player = getPlayer();
    for (let i = projectiles.length - 1; i >= 0; i--) {
        let p = projectiles[i];
        p.pos.x += p.vel.x;
        p.pos.y += p.vel.y;

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
            continue;
        }

        if (p.pos.x < 0 || p.pos.x > GAME_WIDTH || p.pos.y < 0 || p.pos.y > GAME_HEIGHT) {
            projectiles.splice(i, 1);
        }
    }
}

export function drawProjectiles(ctx, camera) {
    projectiles.forEach(p => {
        if (p.pos.x >= camera.x && p.pos.x <= camera.x + camera.width &&
            p.pos.y >= camera.y && p.pos.y <= camera.y + camera.height) {
            ctx.fillStyle = p.enemyShot ? "cyan" : "red";
            ctx.beginPath();
            ctx.arc(p.pos.x - camera.x, p.pos.y - camera.y, p.radius, 0, Math.PI * 2);
            ctx.fill();
        }
    });
}
