import { getPlayer } from '../../player.js';
import { projectiles } from '../../projectiles.js';
import { enemies } from '../../enemies.js';
import { getDistance } from '../../utils.js';

let drones = [];
const DRONE_CONFIG = {
    ORBIT_RADIUS: 100,
    ORBIT_SPEED: 0.02,
    BASE_ATTACK_RANGE: 500,
    PROJECTILE_SPEED: 5,
    SIZE: {
        BODY: 8,
        WING: 6
    },
    ATTACK: {
        BURST_COUNT: 3,
        BURST_DELAY: 50,  // ms between each burst shot
        DAMAGE_MULTIPLIER: 0.3,  // 30% of player's damage per projectile
        PROJECTILE_SPREAD: 0.2,  // spread angle in radians
        COLOR: {
            PRIMARY: '#00ffff',
            TRAIL: '#00ffff44'
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

function fireDroneProjectile(drone, dronePos, targetPos, player) {
    const baseAngle = Math.atan2(
        targetPos.y - dronePos.y,
        targetPos.x - dronePos.x
    );
    
    // Add slight spread
    const spread = (Math.random() - 0.5) * DRONE_CONFIG.ATTACK.PROJECTILE_SPREAD;
    const angle = baseAngle + spread;

    projectiles.push({
        pos: { ...dronePos },
        vel: {
            x: Math.cos(angle) * DRONE_CONFIG.PROJECTILE_SPEED,
            y: Math.sin(angle) * DRONE_CONFIG.PROJECTILE_SPEED
        },
        damage: player.projectileStrength * DRONE_CONFIG.ATTACK.DAMAGE_MULTIPLIER,
        radius: 3,
        color: DRONE_CONFIG.ATTACK.COLOR.PRIMARY,
        isDroneProjectile: true,
        trail: [], // Store positions for trail effect
        maxTrailLength: 5
    });
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
                fireDroneProjectile(drone, dronePos, drone.currentTarget.pos, player);
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
}

export function drawDroneSwarm(ctx, camera) {
    const player = getPlayer();
    if (!player || player.weapon !== 'droneSwarm') return;

    drones.forEach(drone => {
        const x = player.pos.x + Math.cos(drone.angle) * DRONE_CONFIG.ORBIT_RADIUS - camera.x;
        const y = player.pos.y + Math.sin(drone.angle) * DRONE_CONFIG.ORBIT_RADIUS - camera.y;
        const rotationAngle = drone.angle + Math.PI / 2; // Make drone face perpendicular to orbit

        // Save context for rotation
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotationAngle);

        // Draw drone body
        ctx.fillStyle = DRONE_CONFIG.ATTACK.COLOR.PRIMARY;
        ctx.beginPath();
        ctx.ellipse(0, 0, DRONE_CONFIG.SIZE.BODY, DRONE_CONFIG.SIZE.BODY * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Draw wings
        ctx.fillRect(-DRONE_CONFIG.SIZE.WING * 1.5, -DRONE_CONFIG.SIZE.WING, DRONE_CONFIG.SIZE.WING * 3, 2);
        ctx.fillRect(-DRONE_CONFIG.SIZE.WING * 1.5, DRONE_CONFIG.SIZE.WING, DRONE_CONFIG.SIZE.WING * 3, 2);

        // Draw energy field
        ctx.strokeStyle = DRONE_CONFIG.ATTACK.COLOR.TRAIL;
        ctx.beginPath();
        ctx.arc(0, 0, DRONE_CONFIG.SIZE.BODY + 4, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();
    });
}