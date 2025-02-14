import { getPlayer } from './player.js';
import { enemies } from './enemies.js';
import { stopGame, gamePaused } from './game.js';
import { GAME_WIDTH, GAME_HEIGHT } from './constants.js';
import { updateUI } from './ui.js';
import { getDistance } from './utils.js';
import { findClosestEnemy } from './weapons/common/weaponUtils.js';
import { handleEnemyDeath, getKillCount } from './weapons/common/enemyUtils.js';

// Import weapon systems
import { laserBeams, shootLaser, updateLaserBeams, drawLaserBeams } from './weapons/systems/laserSystem.js';
import { rocketTrails, shootRocket, handleRocketCollision, updateRocketTrails, createRocketTrail, drawRocketTrails, drawRocket } from './weapons/systems/rocketSystem.js';
import { lightningChains, lightningVictims, shootChainLightning, updateLightning, drawLightning } from './weapons/systems/chainLightningSystem.js';
import { shootShotgun } from './weapons/systems/shotgunSystem.js';

export { laserBeams, rocketTrails, lightningChains, lightningVictims };
export let projectiles = [];

export function shootProjectiles() {
    const player = getPlayer();
    if (!player || gamePaused) return;

    const closestEnemy = findClosestEnemy(player);
    if (!closestEnemy) return;

    switch(player.weapon) {
        case "laser":
            shootLaser(player);
            break;
        case "rockets":
            const rocket = shootRocket(player, closestEnemy);
            projectiles.push(rocket);
            break;
        case "chainLightning":
            shootChainLightning(player, closestEnemy, handleEnemyDeath);
            break;
        case "shotgun":
            const shotgunProjectiles = shootShotgun(player, closestEnemy);
            projectiles.push(...shotgunProjectiles);
            break;
    }
}

export function updateProjectiles() {
    if (gamePaused) return;

    updateLightning();
    updateLaserBeams();
    updateRocketTrails();

    const player = getPlayer();
    for (let i = projectiles.length - 1; i >= 0; i--) {
        let p = projectiles[i];
        
        if (p.isRocket) {
            createRocketTrail(p.pos);
        }

        p.pos.x += p.vel.x;
        p.pos.y += p.vel.y;

        if (p.enemyShot) {
            const dist = getDistance(p.pos.x, p.pos.y, player.pos.x, player.pos.y);
            if (dist < player.radius + p.radius) {
                if (player.invincible) {
                    console.log("🛡️ Player is invincible! Projectile did no damage.");
                } else {
                    player.health -= 1;
                    updateUI(getKillCount(), player.xp, player.level, player.xpToNextLevel, player.health);
                    console.log(`⚠️ Player received ${p.damage} damage from a projectile!`);
                    if (player.health <= 0) {
                        stopGame();
                        return;
                    }
                }
                projectiles.splice(i, 1);
            }
        } else {
            for (let j = enemies.length - 1; j >= 0; j--) {
                const enemy = enemies[j];
                const distance = getDistance(p.pos.x, p.pos.y, enemy.pos.x, enemy.pos.y);

                if (distance < enemy.radius + p.radius) {
                    if (p.isRocket) {
                        handleRocketCollision(p, j, handleEnemyDeath);
                    } else {
                        enemy.health -= p.damage;
                        if (enemy.health <= 0) {
                            handleEnemyDeath(enemy);
                            enemies.splice(j, 1);
                        }
                    }
                    projectiles.splice(i, 1);
                    break;
                }
            }
        }

        if (p.pos.x < 0 || p.pos.x > GAME_WIDTH || p.pos.y < 0 || p.pos.y > GAME_HEIGHT) {
            projectiles.splice(i, 1);
        }
    }
}

export function drawProjectiles(ctx, camera) {
    // Draw rocket trails
    drawRocketTrails(ctx, camera);
    ctx.globalAlpha = 1;

    // Draw regular projectiles
    projectiles.forEach(p => {
        if (p.pos.x >= camera.x - p.radius && 
            p.pos.x <= camera.x + camera.width + p.radius &&
            p.pos.y >= camera.y - p.radius && 
            p.pos.y <= camera.y + camera.height + p.radius) {
            
            if (p.isRocket) {
                // Draw rocket
                ctx.translate(p.pos.x - camera.x, p.pos.y - camera.y);
                ctx.rotate(p.angle);
                
                ctx.fillStyle = '#666666';
                ctx.beginPath();
                ctx.moveTo(10, 0);
                ctx.lineTo(-5, -5);
                ctx.lineTo(-5, 5);
                ctx.closePath();
                ctx.fill();
                
                // Reset transformations
                ctx.setTransform(1, 0, 0, 1, 0, 0);
            } else {
                ctx.fillStyle = p.enemyShot ? "cyan" : "white";
                ctx.shadowColor = p.enemyShot ? "cyan" : "red";
                ctx.shadowBlur = 10;
                ctx.beginPath();
                ctx.arc(p.pos.x - camera.x, p.pos.y - camera.y, p.radius, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    });

    // Draw laser beams
    drawLaserBeams(ctx, camera);
    
    // Draw lightning effects
    drawLightning(ctx, camera);
    
    // Reset all context properties to defaults
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';
    ctx.setTransform(1, 0, 0, 1, 0, 0);
}
