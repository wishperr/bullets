import { PROJECTILE, ENEMY_TYPES } from '../../constants.js';
import { enemies } from '../../enemies.js';
import { createExplosion, createShockwave, particles } from '../../particles.js';
import { addXP } from '../../player.js';
import { dropPowerup } from '../../powerups.js';
import { getDistance } from '../../utils.js';

export let rocketTrails = [];

export function shootRocket(player, target) {
    const dx = target.pos.x - player.pos.x;
    const dy = target.pos.y - player.pos.y;
    const angle = Math.atan2(dy, dx);
    
    const rocketDamage = player.projectileStrength + 
        (player.projectileStrength - 1) * (PROJECTILE.ROCKET.DAMAGE_PER_UPGRADE - 1);
    
    const explosionRadius = PROJECTILE.ROCKET.BASE_EXPLOSION_RADIUS + 
        (player.additionalProjectiles * PROJECTILE.ROCKET.RADIUS_PER_UPGRADE);

    return {
        pos: { x: player.pos.x, y: player.pos.y },
        vel: {
            x: Math.cos(angle) * PROJECTILE.ROCKET.SPEED,
            y: Math.sin(angle) * PROJECTILE.ROCKET.SPEED
        },
        radius: PROJECTILE.RADIUS,
        damage: rocketDamage,
        angle: angle,
        isRocket: true,
        explosionRadius: explosionRadius,
        enemyShot: false
    };
}

function createRocketExplosion(x, y, radius) {
    particles.push({
        pos: { x, y },
        radius: radius * 0.3,
        life: 8,
        isFlash: true,
        color: "rgba(255, 200, 100, 0.8)"
    });

    createExplosion(x, y, '#ff4400', 20);
    
    const shockwaveConfig = {
        ringConfigs: [
            { speed: 8, width: 6, color: "rgba(255, 68, 0, 0.9)", delay: 0 },
            { speed: 7, width: 4, color: "rgba(255, 140, 0, 0.7)", delay: 50 },
            { speed: 6, width: 3, color: "rgba(255, 200, 0, 0.5)", delay: 100 }
        ]
    };

    shockwaveConfig.ringConfigs.forEach(config => {
        setTimeout(() => {
            createShockwave(x, y, {
                maxRadius: radius,
                speed: config.speed,
                lineWidth: config.width,
                color: config.color,
                duration: 15,
                startOpacity: 1
            });
        }, config.delay);
    });
}

export function handleRocketCollision(rocket, enemyIndex, handleEnemyDeath) {
    const enemy = enemies[enemyIndex];
    enemy.health -= rocket.damage;
    
    createRocketExplosion(rocket.pos.x, rocket.pos.y, rocket.explosionRadius);
    
    enemies.forEach((splashEnemy, splashIndex) => {
        if (enemyIndex !== splashIndex) {
            const splashDist = getDistance(rocket.pos.x, rocket.pos.y, splashEnemy.pos.x, splashEnemy.pos.y);
            if (splashDist <= rocket.explosionRadius) {
                splashEnemy.health -= rocket.damage * PROJECTILE.ROCKET.SPLASH_DAMAGE_MULTIPLIER;
                if (splashEnemy.health <= 0) {
                    enemies.splice(splashIndex, 1);
                    if (handleEnemyDeath) handleEnemyDeath(splashEnemy);
                }
            }
        }
    });

    if (enemy.health <= 0) {
        enemies.splice(enemyIndex, 1);
        if (handleEnemyDeath) handleEnemyDeath(enemy);
    }
}

export function updateRocketTrails() {
    for (let i = rocketTrails.length - 1; i >= 0; i--) {
        const trail = rocketTrails[i];
        trail.life--;
        if (trail.life <= 0) {
            rocketTrails.splice(i, 1);
        }
    }
}

export function createRocketTrail(pos) {
    rocketTrails.push({
        pos: { x: pos.x, y: pos.y },
        radius: 2 + Math.random() * 2,
        life: 10 + Math.random() * 10,
        color: Math.random() < 0.3 ? '#ff4400' : '#ffaa00'
    });
}

export function drawRocketTrails(ctx, camera) {
    rocketTrails.forEach(trail => {
        ctx.fillStyle = trail.color;
        ctx.globalAlpha = trail.life / 20;
        ctx.beginPath();
        ctx.arc(trail.pos.x - camera.x, trail.pos.y - camera.y, trail.radius, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1;
}

export function drawRocket(ctx, rocket, camera) {
    ctx.save();
    ctx.translate(rocket.pos.x - camera.x, rocket.pos.y - camera.y);
    ctx.rotate(rocket.angle);
    
    ctx.fillStyle = '#666666';
    ctx.beginPath();
    ctx.moveTo(10, 0);
    ctx.lineTo(-5, -5);
    ctx.lineTo(-5, 5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
}