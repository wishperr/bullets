import { getPlayer, addXP } from './player.js';
import { projectiles } from './projectiles.js';
import { GAME_WIDTH, GAME_HEIGHT, ENEMY_TYPES, WAVE, PROJECTILE } from './constants.js';
import { getRandomEdgePosition, getDistance } from './utils.js';
import { updateBoss } from './weapons/systems/bossSystem.js';
import { updateArsenalBoss } from './weapons/systems/arsenalSystem.js';
import { createExplosion } from './particles.js';

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
        shoots: type === "shooter" || type === "arsenal_turret",
        shootCooldown: enemyConfig.SHOOT_COOLDOWN || 0,
        lastShot: Date.now(),
        shield: hasShield ? 3 : 0,
        // Berserker-specific properties
        initialHealth: type === "berserker" ? enemyConfig.HEALTH : null,
        rageStage: type === "berserker" ? 0 : null,
        // Boss-specific properties
        currentPhase: (type === "boss" || type === "arsenal_boss") ? 1 : null,
        isCharging: false,
        isInvulnerable: false,
        lastAttack: null,
        lastBulletSpray: null,    // Track bullet spray timing
        lastSpecialAttack: null,  // Track special attack timing
        chargeTarget: null,
        chargeVel: null
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

function createRageEffect(enemy, color) {
    // Create burst effect when entering new rage stage
    createExplosion(
        enemy.pos.x,
        enemy.pos.y,
        color,
        20,
        false,
        false,
        { 
            velocityMultiplier: 2,
            isRageTransform: true 
        }
    );
}

function createRageParticles(enemy, color) {
    createExplosion(
        enemy.pos.x,
        enemy.pos.y,
        color,
        2,
        false,
        false,
        {
            velocityMultiplier: 0.5,
            isRageAura: true
        }
    );
}

function updateBerserker(enemy, player) {
    // Calculate health percentage
    const healthPercentage = enemy.health / enemy.initialHealth;
    let newRageStage = enemy.rageStage;
    
    // Check and update rage states
    if (healthPercentage <= ENEMY_TYPES.BERSERKER.RAGE_THRESHOLDS.STAGE3 && enemy.rageStage < 3) {
        newRageStage = 3;
        enemy.speed = ENEMY_TYPES.BERSERKER.SPEED * ENEMY_TYPES.BERSERKER.RAGE_MULTIPLIERS.STAGE3.SPEED;
        enemy.damage = ENEMY_TYPES.BERSERKER.DAMAGE * ENEMY_TYPES.BERSERKER.RAGE_MULTIPLIERS.STAGE3.DAMAGE;
        createRageEffect(enemy, '#ff0000'); // Red particles for maximum rage
    } else if (healthPercentage <= ENEMY_TYPES.BERSERKER.RAGE_THRESHOLDS.STAGE2 && enemy.rageStage < 2) {
        newRageStage = 2;
        enemy.speed = ENEMY_TYPES.BERSERKER.SPEED * ENEMY_TYPES.BERSERKER.RAGE_MULTIPLIERS.STAGE2.SPEED;
        enemy.damage = ENEMY_TYPES.BERSERKER.DAMAGE * ENEMY_TYPES.BERSERKER.RAGE_MULTIPLIERS.STAGE2.DAMAGE;
        createRageEffect(enemy, '#ff8800'); // Orange particles for medium rage
    } else if (healthPercentage <= ENEMY_TYPES.BERSERKER.RAGE_THRESHOLDS.STAGE1 && enemy.rageStage < 1) {
        newRageStage = 1;
        enemy.speed = ENEMY_TYPES.BERSERKER.SPEED * ENEMY_TYPES.BERSERKER.RAGE_MULTIPLIERS.STAGE1.SPEED;
        enemy.damage = ENEMY_TYPES.BERSERKER.DAMAGE * ENEMY_TYPES.BERSERKER.RAGE_MULTIPLIERS.STAGE1.DAMAGE;
        createRageEffect(enemy, '#ffff00'); // Yellow particles for initial rage
    }

    // If rage stage changed, update stats and trigger effect
    if (newRageStage !== enemy.rageStage) {
        enemy.rageStage = newRageStage;
    }

    // Create continuous rage particles based on stage
    if (enemy.rageStage > 0 && Math.random() < 0.1 + (enemy.rageStage * 0.1)) {
        const color = enemy.rageStage === 3 ? '#ff0000' : 
                     enemy.rageStage === 2 ? '#ff8800' : '#ffff00';
        createRageParticles(enemy, color);
    }

    // Basic movement with rage-adjusted speed
    const dx = player.pos.x - enemy.pos.x;
    const dy = player.pos.y - enemy.pos.y;
    const dist = getDistance(player.pos.x, player.pos.y, enemy.pos.x, enemy.pos.y);
    const separation = avoidOverlap(enemy, enemies);

    enemy.pos.x += ((dx / dist) * enemy.speed) + separation.dx;
    enemy.pos.y += ((dy / dist) * enemy.speed) + separation.dy;
}

export function updateEnemies() {
    const player = getPlayer();
    if (!player) return;

    enemies.forEach(e => {
        if (e.type === "boss") {
            updateBoss(e);
        } else if (e.type === "arsenal_boss") {
            updateArsenalBoss(e);
        } else if (e.type === "arsenal_turret") {
            // Handle turret behavior
            if (!e.lastShot || Date.now() - e.lastShot > e.shootCooldown) {
                const angle = Math.atan2(player.pos.y - e.pos.y, player.pos.x - e.pos.x);
                projectiles.push({
                    pos: { x: e.pos.x, y: e.pos.y },
                    vel: { 
                        x: Math.cos(angle) * PROJECTILE.ENEMY_SPEED * 1.2,
                        y: Math.sin(angle) * PROJECTILE.ENEMY_SPEED * 1.2
                    },
                    radius: PROJECTILE.ENEMY_RADIUS,
                    damage: ENEMY_TYPES.ARSENAL_TURRET.DAMAGE,
                    enemyShot: true,
                    color: "#ffaa00"
                });
                e.lastShot = Date.now();
                e.lastTarget = { x: player.pos.x, y: player.pos.y }; // Save target for drawing
            }
        } else if (e.type === "berserker") {
            updateBerserker(e, player);
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
