import { getPlayer, addXP } from './player.js';
import { projectiles } from './projectiles.js';
import { GAME_WIDTH, GAME_HEIGHT, ENEMY_TYPES, WAVE, PROJECTILE } from './constants.js';
import { getRandomEdgePosition, getDistance } from './utils.js';
import { updateBoss } from './weapons/systems/bossSystem.js';

export const enemies = [];
let normalEnemyKillCount = 0;

export function spawnEnemy(type = "normal", waveNumber = 1, hasShield = false, spawnPos = null) {
    const position = spawnPos || getRandomEdgePosition(GAME_WIDTH, GAME_HEIGHT);
    let enemyConfig = ENEMY_TYPES[type.toUpperCase()] || ENEMY_TYPES.NORMAL;

    let enemy = {
        pos: { x: position.x, y: position.y },
        radius: enemyConfig.RADIUS,
        health: enemyConfig.HEALTH,
        damage: enemyConfig.DAMAGE,
        speed: enemyConfig.SPEED,
        type: type,
        shoots: type === "shooter",
        shootCooldown: enemyConfig.SHOOT_COOLDOWN || 0,
        lastShot: Date.now(),
        shield: hasShield ? 3 : 0,
        // Boss-specific properties
        currentPhase: type === "boss" ? 1 : null,
        isCharging: false,
        isInvulnerable: false,
        lastAttack: null,
        lastBulletSpray: null,    // Track bullet spray timing
        lastSpecialAttack: null,  // Track special attack timing
        chargeTarget: null,
        chargeVel: null,
        burnEffect: type === "boss" ? null : undefined  // Initialize burnEffect for boss
    };

    enemies.push(enemy);
    return enemy;
}

function avoidOverlap(enemy, otherEnemies) {
    const SEPARATION_FORCE = 0.5;
    let dx = 0;
    let dy = 0;

    otherEnemies.forEach(other => {
        if (other === enemy) return;
        
        const dist = getDistance(enemy.pos.x, enemy.pos.y, other.pos.x, other.pos.y);
        const minDist = enemy.radius + other.radius;
        
        if (dist < minDist) {
            const angle = Math.atan2(enemy.pos.y - other.pos.y, enemy.pos.x - other.pos.x);
            const pushX = Math.cos(angle) * (minDist - dist) * SEPARATION_FORCE;
            const pushY = Math.sin(angle) * (minDist - dist) * SEPARATION_FORCE;
            
            dx += pushX;
            dy += pushY;
        }
    });

    return { dx, dy };
}

export function updateEnemies() {
    const player = getPlayer();
    if (!player) return;

    enemies.forEach(e => {
        if (e.type === "boss") {
            updateBoss(e);
        } else {
            const dx = player.pos.x - e.pos.x;
            const dy = player.pos.y - e.pos.y;
            const dist = getDistance(player.pos.x, player.pos.y, e.pos.x, e.pos.y);

            // Get separation forces
            const separation = avoidOverlap(e, enemies);
            
            if (e.type === "shooter") {
                if (dist > 150) {
                    // Apply movement with separation
                    e.pos.x += ((dx / dist) * e.speed) + separation.dx;
                    e.pos.y += ((dy / dist) * e.speed) + separation.dy;

                    // Handle shooting logic
                    if (!e.lastShot) e.lastShot = Date.now();
                    if (Date.now() - e.lastShot > e.shootCooldown) {
                        let angle = Math.atan2(dy, dx);
                        projectiles.push({
                            pos: { x: e.pos.x, y: e.pos.y },
                            vel: { 
                                x: Math.cos(angle) * PROJECTILE.ENEMY_SPEED,
                                y: Math.sin(angle) * PROJECTILE.ENEMY_SPEED 
                            },
                            radius: PROJECTILE.ENEMY_RADIUS,
                            damage: ENEMY_TYPES.SHOOTER.DAMAGE,
                            enemyShot: true,
                            color: "cyan"
                        });
                        e.lastShot = Date.now();
                    }
                } else {
                    // Apply only separation when not moving towards player
                    e.pos.x += separation.dx;
                    e.pos.y += separation.dy;
                }
            } else {
                // Normal and tank enemies - apply movement with separation
                e.pos.x += ((dx / dist) * e.speed) + separation.dx;
                e.pos.y += ((dy / dist) * e.speed) + separation.dy;
            }
        }
    });
}

// Getters and counters for normal enemy kills
export function getNormalEnemyKillCount() {
    return normalEnemyKillCount;
}

export function increaseNormalEnemyKillCount() {
    normalEnemyKillCount++;
}

export function resetNormalEnemyKillCount() {
    normalEnemyKillCount = 0;
}
