import { getPlayer } from '../../player.js';
import { projectiles } from '../../projectiles.js';
import { enemies } from '../../enemies.js';
import { getDistance } from '../../utils.js';
import { createExplosion } from '../../particles.js';
import { addXP } from '../../player.js';  // Add this import
import { handleEnemyDeath } from '../common/enemyUtils.js';  // Add this import

let drones = [];
const DRONE_CONFIG = {
    ORBIT_RADIUS: 100,
    ORBIT_SPEED: 0.02,
    BASE_ATTACK_RANGE: 500,
    SIZE: {
        BODY: 12,          // Increased body size
        WING: 8,
        ENGINE: 3,         // Size of engine glow
        WEAPON: 4          // Size of weapon mounts
    },
    ATTACK: {
        BURST_COUNT: 1,  // Changed to 1 since BFG shots are more powerful
        BURST_DELAY: 50,
        DAMAGE_MULTIPLIER: 0.1,
        BFG: {
            PROJECTILE_SPEED: 3,  // Slower speed for BFG projectile
            PROJECTILE_SIZE: 8,
            TENDRIL_RANGE: 150,  // Range of damage tendrils
            TENDRIL_COUNT: 8,    // Number of tendrils to draw
            TENDRIL_DAMAGE_TICK: 100,  // How often tendrils deal damage (ms)
            COLOR: {
                PRIMARY: '#00ff00',    // Bright green
                SECONDARY: '#88ff88',  // Light green
                TENDRILS: '#00ff0088'  // Semi-transparent green
            }
        }
    }
};

function createDrone(index, totalDrones) {
    return {
        angle: (index * 2 * Math.PI) / totalDrones,
        lastShot: 0,
        burstCount: 0,
        lastBurstShot: 0,
        currentTarget: null  // Add currentTarget property
    };
}

function fireBFGProjectile(drone, dronePos, targetPos, player) {
    const angle = Math.atan2(
        targetPos.y - dronePos.y,
        targetPos.x - dronePos.x
    );

    projectiles.push({
        pos: { ...dronePos },
        vel: {
            x: Math.cos(angle) * DRONE_CONFIG.ATTACK.BFG.PROJECTILE_SPEED,
            y: Math.sin(angle) * DRONE_CONFIG.ATTACK.BFG.PROJECTILE_SPEED
        },
        damage: player.projectileStrength * DRONE_CONFIG.ATTACK.DAMAGE_MULTIPLIER,
        radius: DRONE_CONFIG.ATTACK.BFG.PROJECTILE_SIZE,
        isBFG: true,
        lastTendrilDamage: Date.now(),
        tendrilAngle: 0,  // For rotation effect
        color: DRONE_CONFIG.ATTACK.BFG.COLOR.PRIMARY,
        isDroneProjectile: true,
        trail: [],
        maxTrailLength: 8,
        damageEnemies: new Set()  // Track which enemies were damaged this tick
    });
}

function updateBFGProjectile(p, player) {
    // Update trail
    p.trail.unshift({ x: p.pos.x, y: p.pos.y });
    if (p.trail.length > p.maxTrailLength) {
        p.trail.pop();
    }

    // Rotate tendril angle for visual effect
    p.tendrilAngle += 0.05;

    // Check for enemies in tendril range and damage them
    const now = Date.now();
    if (now - p.lastTendrilDamage >= DRONE_CONFIG.ATTACK.BFG.TENDRIL_DAMAGE_TICK) {
        p.damageEnemies.clear();  // Reset damaged enemies list
        
        for (let i = enemies.length - 1; i >= 0; i--) {
            const enemy = enemies[i];
            const distance = getDistance(p.pos.x, p.pos.y, enemy.pos.x, enemy.pos.y);
            if (distance <= DRONE_CONFIG.ATTACK.BFG.TENDRIL_RANGE && !p.damageEnemies.has(enemy)) {
                // Deal damage to enemy
                enemy.health -= p.damage;
                p.damageEnemies.add(enemy);

                // Create particle effect at the enemy's position
                createExplosion(
                    enemy.pos.x,
                    enemy.pos.y,
                    DRONE_CONFIG.ATTACK.BFG.COLOR.SECONDARY,
                    3,
                    false,
                    true
                );

                // Check if enemy died from tendril damage
                if (enemy.health <= 0) {
                    handleEnemyDeath(enemy);  // This handles kill count
                    enemies.splice(i, 1);
                    addXP(1);  // Add XP for the kill
                }
            }
        }

        p.lastTendrilDamage = now;
    }
}

export function updateDroneSwarm() {
    const player = getPlayer();
    if (!player || player.weapon !== 'droneSwarm') return;

    const droneCount = Math.max(1, player.additionalProjectiles);
    
    // Initialize or update drone count
    if (drones.length !== droneCount) {
        drones = Array.from({ length: droneCount }, (_, i) => createDrone(i, droneCount));
    }

    // Update each drone
    drones.forEach(drone => {
        // Update drone position
        drone.angle += DRONE_CONFIG.ORBIT_SPEED;
        
        // Find nearest enemy within range
        let nearestEnemy = null;
        let nearestDistance = DRONE_CONFIG.BASE_ATTACK_RANGE;

        const dronePos = {
            x: player.pos.x + Math.cos(drone.angle) * DRONE_CONFIG.ORBIT_RADIUS,
            y: player.pos.y + Math.sin(drone.angle) * DRONE_CONFIG.ORBIT_RADIUS
        };

        enemies.forEach(enemy => {
            const distance = getDistance(dronePos.x, dronePos.y, enemy.pos.x, enemy.pos.y);
            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearestEnemy = enemy;
            }
        });

        // Handle burst firing
        const now = Date.now();
        if (nearestEnemy && now - drone.lastShot > player.attackSpeed) {
            if (drone.burstCount === 0) {
                drone.lastShot = now;
                drone.burstCount = DRONE_CONFIG.ATTACK.BURST_COUNT;
                drone.currentTarget = nearestEnemy; // Store the target for the burst duration
            }
        }

        // Fire burst shots if we have a target
        if (drone.burstCount > 0 && now - drone.lastBurstShot > DRONE_CONFIG.ATTACK.BURST_DELAY && drone.currentTarget) {
            // Check if the stored target still exists in the enemies array
            if (enemies.includes(drone.currentTarget)) {
                fireBFGProjectile(drone, dronePos, drone.currentTarget.pos, player);
            } else {
                // If target no longer exists, cancel remaining burst
                drone.burstCount = 0;
                drone.currentTarget = null;
            }
            drone.burstCount--;
            drone.lastBurstShot = now;
            
            // Clear target when burst is complete
            if (drone.burstCount === 0) {
                drone.currentTarget = null;
            }
        }
    });

    // Update BFG projectiles
    projectiles.forEach(p => {
        if (p.isBFG) {
            updateBFGProjectile(p, player);
        }
    });
}

export function drawDroneSwarm(ctx, camera) {
    const player = getPlayer();
    if (!player || player.weapon !== 'droneSwarm') return;

    drones.forEach(drone => {
        const x = player.pos.x + Math.cos(drone.angle) * DRONE_CONFIG.ORBIT_RADIUS - camera.x;
        const y = player.pos.y + Math.sin(drone.angle) * DRONE_CONFIG.ORBIT_RADIUS - camera.y;
        const rotationAngle = drone.angle + Math.PI / 2;

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotationAngle);

        // Draw engine glow
        const engineGlow = ctx.createRadialGradient(
            -DRONE_CONFIG.SIZE.BODY * 0.7, 0, 0,
            -DRONE_CONFIG.SIZE.BODY * 0.7, 0, DRONE_CONFIG.SIZE.ENGINE * 2
        );
        engineGlow.addColorStop(0, '#ff6600');
        engineGlow.addColorStop(1, 'rgba(255, 102, 0, 0)');
        
        ctx.fillStyle = engineGlow;
        ctx.beginPath();
        ctx.arc(-DRONE_CONFIG.SIZE.BODY * 0.7, 0, DRONE_CONFIG.SIZE.ENGINE * 2, 0, Math.PI * 2);
        ctx.fill();

        // Draw main body (fuselage)
        ctx.fillStyle = '#333333';
        ctx.beginPath();
        ctx.moveTo(-DRONE_CONFIG.SIZE.BODY, 0);  // Rear
        ctx.lineTo(DRONE_CONFIG.SIZE.BODY * 0.5, -DRONE_CONFIG.SIZE.BODY * 0.4);  // Top front
        ctx.lineTo(DRONE_CONFIG.SIZE.BODY * 0.5, DRONE_CONFIG.SIZE.BODY * 0.4);   // Bottom front
        ctx.closePath();
        ctx.fill();

        // Draw cockpit/sensor array
        const cockpitGradient = ctx.createLinearGradient(
            0, -DRONE_CONFIG.SIZE.BODY * 0.2,
            DRONE_CONFIG.SIZE.BODY * 0.3, DRONE_CONFIG.SIZE.BODY * 0.2
        );
        cockpitGradient.addColorStop(0, '#00ff00');
        cockpitGradient.addColorStop(1, '#003300');
        
        ctx.fillStyle = cockpitGradient;
        ctx.beginPath();
        ctx.ellipse(
            DRONE_CONFIG.SIZE.BODY * 0.2, 0,
            DRONE_CONFIG.SIZE.BODY * 0.3, DRONE_CONFIG.SIZE.BODY * 0.2,
            0, 0, Math.PI * 2
        );
        ctx.fill();

        // Draw wings
        ctx.fillStyle = '#444444';
        // Left wing
        ctx.beginPath();
        ctx.moveTo(-DRONE_CONFIG.SIZE.BODY * 0.5, 0);
        ctx.lineTo(-DRONE_CONFIG.SIZE.BODY * 0.3, -DRONE_CONFIG.SIZE.WING * 1.5);
        ctx.lineTo(DRONE_CONFIG.SIZE.BODY * 0.3, -DRONE_CONFIG.SIZE.WING);
        ctx.lineTo(DRONE_CONFIG.SIZE.BODY * 0.3, 0);
        ctx.closePath();
        ctx.fill();
        
        // Right wing
        ctx.beginPath();
        ctx.moveTo(-DRONE_CONFIG.SIZE.BODY * 0.5, 0);
        ctx.lineTo(-DRONE_CONFIG.SIZE.BODY * 0.3, DRONE_CONFIG.SIZE.WING * 1.5);
        ctx.lineTo(DRONE_CONFIG.SIZE.BODY * 0.3, DRONE_CONFIG.SIZE.WING);
        ctx.lineTo(DRONE_CONFIG.SIZE.BODY * 0.3, 0);
        ctx.closePath();
        ctx.fill();

        // Draw weapon mounts
        ctx.fillStyle = DRONE_CONFIG.ATTACK.BFG.COLOR.PRIMARY;
        [-1, 1].forEach(side => {
            ctx.beginPath();
            ctx.arc(
                0,
                side * DRONE_CONFIG.SIZE.WING * 0.8,
                DRONE_CONFIG.SIZE.WEAPON,
                0, Math.PI * 2
            );
            ctx.fill();

            // Add weapon glow
            const weaponGlow = ctx.createRadialGradient(
                0, side * DRONE_CONFIG.SIZE.WING * 0.8, 0,
                0, side * DRONE_CONFIG.SIZE.WING * 0.8, DRONE_CONFIG.SIZE.WEAPON * 1.5
            );
            weaponGlow.addColorStop(0, DRONE_CONFIG.ATTACK.BFG.COLOR.PRIMARY + '44');
            weaponGlow.addColorStop(1, 'rgba(0, 255, 0, 0)');
            
            ctx.fillStyle = weaponGlow;
            ctx.beginPath();
            ctx.arc(
                0,
                side * DRONE_CONFIG.SIZE.WING * 0.8,
                DRONE_CONFIG.SIZE.WEAPON * 1.5,
                0, Math.PI * 2
            );
            ctx.fill();
        });

        ctx.restore();
    });
}