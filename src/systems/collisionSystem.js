import { getPlayer } from '../player.js';
import { enemies } from '../enemies.js';
import { projectiles } from '../projectiles.js';
import { getDistance, pointToLineDistance } from '../utils.js';
import { handleEnemyDeath } from '../weapons/common/enemyUtils.js';
import { updateUI } from '../ui.js';
import { getKillCount } from '../weapons/common/enemyUtils.js';
import { handleRocketCollision } from '../weapons/systems/rocketSystem.js';
import { laserBeams } from '../weapons/systems/laserSystem.js';

export function handleCollisions() {
    const player = getPlayer();
    if (!player) return false;

    if (handlePlayerEnemyCollisions(player)) return true;
    if (handleProjectileCollisions(player)) return true;
    handleLaserCollisions();
    
    return false;
}

function handlePlayerEnemyCollisions(player) {
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        if (!player.invincible && getDistance(player.pos.x, player.pos.y, enemy.pos.x, enemy.pos.y) < player.radius + enemy.radius) {
            player.health -= enemy.damage || 1;
            updateUI(getKillCount(), player.xp, player.level, player.xpToNextLevel, player.health);
            
            if (enemy.type !== "boss") {
                enemies.splice(i, 1);
            }
    
            if (player.health <= 0) {
                return true; // Game Over
            }
        }
    }
    return false;
}

function handleProjectileCollisions(player) {
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const projectile = projectiles[i];
        
        if (projectile.enemyShot) {
            if (handleEnemyProjectileCollision(projectile, player, i)) {
                return true; // Game Over
            }
        } else {
            handlePlayerProjectileCollision(projectile, i);
        }
    }
    return false;
}

function handleEnemyProjectileCollision(projectile, player, projectileIndex) {
    const dist = getDistance(projectile.pos.x, projectile.pos.y, player.pos.x, player.pos.y);
    if (dist < player.radius + projectile.radius) {
        if (!player.invincible) {
            player.health -= projectile.damage || 1;
            updateUI(getKillCount(), player.xp, player.level, player.xpToNextLevel, player.health);
            if (player.health <= 0) {
                projectiles.splice(projectileIndex, 1);
                return true; // Game Over
            }
        }
        projectiles.splice(projectileIndex, 1);
    }
    return false;
}

function handlePlayerProjectileCollision(projectile, projectileIndex) {
    for (let j = enemies.length - 1; j >= 0; j--) {
        const enemy = enemies[j];
        const distance = getDistance(projectile.pos.x, projectile.pos.y, enemy.pos.x, enemy.pos.y);

        if (distance < enemy.radius + projectile.radius) {
            if (projectile.isRocket) {
                handleRocketCollision(projectile, j, handleEnemyDeath);
            } else {
                enemy.health -= projectile.damage;
                if (enemy.health <= 0) {
                    handleEnemyDeath(enemy);
                    enemies.splice(j, 1);
                }
            }
            projectiles.splice(projectileIndex, 1);
            break;
        }
    }
}

function handleLaserCollisions() {
    laserBeams.forEach(laser => {
        const end = {
            x: laser.start.x + Math.cos(laser.angle) * laser.length,
            y: laser.start.y + Math.sin(laser.angle) * laser.length
        };

        enemies.forEach((enemy, index) => {
            if (laser.hitEnemies.has(enemy)) return;

            const distance = pointToLineDistance(
                enemy.pos,
                laser.start,
                end
            );

            if (distance < enemy.radius + laser.width/2) {
                if (enemy.type === "boss" && enemy.isInvulnerable) return;
                
                if (enemy.shield > 0) {
                    enemy.shield--;
                } else {
                    enemy.health -= laser.damage;
                    laser.hitEnemies.add(enemy);
                    
                    if (enemy.health <= 0) {
                        handleEnemyDeath(enemy);
                        enemies.splice(index, 1);
                    }
                }
            }
        });
    });
}