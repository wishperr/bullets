import { getPlayer } from './player.js';
import { enemies } from './enemies.js';
import { stopGame } from './game.js';
import { PROJECTILE, GAME_WIDTH, GAME_HEIGHT, CAMERA, ENEMY_TYPES } from './constants.js';
import { updateUI } from './ui.js';
import { getDistance } from './utils.js';
import { addXP } from './player.js';
import { createExplosion, createShockwave, particles } from './particles.js';
import { dropPowerup } from './powerups.js';

export let projectiles = [];
export let laserBeams = [];
export let rocketTrails = [];

export function shootProjectiles() {
    const player = getPlayer();
    if (!player) return;

    const closestEnemy = findClosestEnemy(player);
    if (!closestEnemy) return;

    switch(player.weapon) {
        case "laser":
            shootLaser(player);
            break;
        case "rockets":
            shootRocket(player, closestEnemy);
            break;
        case "shotgun":
            let baseProjectiles = 2 + player.additionalProjectiles; // Using constant for additional projectiles

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
            break;
    }
}

function shootLaser(player) {
    const sortedEnemies = enemies
        .filter(enemy => {
            // Only target enemies in camera view
            const inViewX = enemy.pos.x >= player.pos.x - CAMERA.WIDTH / 2 &&
                          enemy.pos.x <= player.pos.x + CAMERA.WIDTH / 2;
            const inViewY = enemy.pos.y >= player.pos.y - CAMERA.HEIGHT / 2 &&
                          enemy.pos.y <= player.pos.y + CAMERA.HEIGHT / 2;
            return inViewX && inViewY;
        })
        .map(enemy => ({
            enemy,
            distance: getDistance(player.pos.x, player.pos.y, enemy.pos.x, enemy.pos.y)
        }))
        .sort((a, b) => a.distance - b.distance);

    // Number of lasers based on additional projectiles
    const numLasers = 1 + player.additionalProjectiles;
    
    // Calculate laser damage based on player's projectile strength
    const laserDamage = Math.max(0.5, player.projectileStrength * PROJECTILE.LASER_DAMAGE_MULTIPLIER); // Ensure minimum damage of 0.5
    
    // Create a laser for each target up to numLasers
    for (let i = 0; i < Math.min(numLasers, sortedEnemies.length); i++) {
        const target = sortedEnemies[i].enemy;
        const angle = Math.atan2(target.pos.y - player.pos.y, target.pos.x - player.pos.x);
        
        laserBeams.push({
            start: { x: player.pos.x, y: player.pos.y },
            angle: angle,
            width: 3,
            length: CAMERA.WIDTH, // Maximum length of laser
            damage: laserDamage,
            life: 10, // Frames the laser will exist
            color: 'cyan',
            hitEnemies: new Set() // Track which enemies this beam has already hit
        });
    }
}

function shootRocket(player, target) {
    const dx = target.pos.x - player.pos.x;
    const dy = target.pos.y - player.pos.y;
    const angle = Math.atan2(dy, dx);
    
    // Calculate rocket damage
    const rocketDamage = player.projectileStrength + 
        (player.projectileStrength - 1) * (PROJECTILE.ROCKET.DAMAGE_PER_UPGRADE - 1);
    
    // Calculate explosion radius based on additional projectiles
    const explosionRadius = PROJECTILE.ROCKET.BASE_EXPLOSION_RADIUS + 
        (player.additionalProjectiles * PROJECTILE.ROCKET.RADIUS_PER_UPGRADE);

    projectiles.push({
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
    });
}

function findClosestEnemy(player) {
    if (enemies.length === 0) return null;
    return enemies.reduce((closest, enemy) => {
        const distance = getDistance(player.pos.x, player.pos.y, enemy.pos.x, enemy.pos.y);
        return distance < (closest?.distance || Infinity) ? { enemy, distance } : closest;
    }, null)?.enemy;
}

function createRocketExplosion(x, y, radius) {
    // Create bright flash at explosion point
    particles.push({
        pos: { x, y },
        radius: radius * 0.3, // Flash size proportional to explosion radius
        life: 8,
        isFlash: true,
        color: "rgba(255, 200, 100, 0.8)"
    });

    // Create central explosion
    createExplosion(x, y, '#ff4400', 20);
    
    // Create shockwave effect to show damage radius with more visible colors
    const shockwaveConfig = {
        ringConfigs: [
            { speed: 8, width: 6, color: "rgba(255, 68, 0, 0.9)", delay: 0 },     // Main bright orange ring
            { speed: 7, width: 4, color: "rgba(255, 140, 0, 0.7)", delay: 50 },   // Secondary orange ring
            { speed: 6, width: 3, color: "rgba(255, 200, 0, 0.5)", delay: 100 }   // Third yellow-orange ring
        ]
    };

    // Create expanding shockwave rings that match the explosion radius
    shockwaveConfig.ringConfigs.forEach(config => {
        setTimeout(() => {
            createShockwave(x, y, {
                maxRadius: radius,
                speed: config.speed,
                lineWidth: config.width,
                color: config.color,
                duration: 15,
                startOpacity: 1  // Full opacity at start
            });
        }, config.delay);
    });
}

export function updateProjectiles() {
    const player = getPlayer();
    for (let i = projectiles.length - 1; i >= 0; i--) {
        let p = projectiles[i];
        
        // Update rocket trail particles
        if (p.isRocket) {
            // Create trail particles
            const trailParticle = {
                pos: { x: p.pos.x, y: p.pos.y },
                radius: 2 + Math.random() * 2,
                life: 10 + Math.random() * 10,
                color: Math.random() < 0.3 ? '#ff4400' : '#ffaa00'
            };
            rocketTrails.push(trailParticle);
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
                    updateUI(0, player.xp, player.level, player.xpToNextLevel, player.health);
                    console.log(`⚠️ Player received ${p.damage} damage from a projectile!`);
                    if (player.health <= 0) {
                        stopGame();
                        return;
                    }
                }
                projectiles.splice(i, 1); // Remove projectile after collision
            }
        }

        // Check for rocket collisions
        if (p.isRocket) {
            for (let j = enemies.length - 1; j >= 0; j--) {
                const enemy = enemies[j];
                const distance = getDistance(p.pos.x, p.pos.y, enemy.pos.x, enemy.pos.y);

                if (distance < enemy.radius + p.radius) {
                    // Direct hit damage
                    enemy.health -= p.damage;
                    
                    // Create explosion effect with visible radius
                    createRocketExplosion(p.pos.x, p.pos.y, p.explosionRadius);
                    
                    // Splash damage to nearby enemies
                    enemies.forEach((splashEnemy, splashIndex) => {
                        if (j !== splashIndex) {
                            const splashDist = getDistance(p.pos.x, p.pos.y, splashEnemy.pos.x, splashEnemy.pos.y);
                            if (splashDist <= p.explosionRadius) {
                                splashEnemy.health -= p.damage * PROJECTILE.ROCKET.SPLASH_DAMAGE_MULTIPLIER;
                                if (splashEnemy.health <= 0) {
                                    enemies.splice(splashIndex, 1);
                                    addXP(ENEMY_TYPES[splashEnemy.type.toUpperCase()].EXP);
                                    createExplosion(splashEnemy.pos.x, splashEnemy.pos.y, '#ff4400', 10);
                                }
                            }
                        }
                    });

                    // Check if direct hit enemy died
                    if (enemy.health <= 0) {
                        enemies.splice(j, 1);
                        addXP(ENEMY_TYPES[enemy.type.toUpperCase()].EXP);
                        dropPowerup(enemy.pos);
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

    // Update rocket trails
    for (let i = rocketTrails.length - 1; i >= 0; i--) {
        const trail = rocketTrails[i];
        trail.life--;
        if (trail.life <= 0) {
            rocketTrails.splice(i, 1);
        }
    }

    // Update laser beams
    for (let i = laserBeams.length - 1; i >= 0; i--) {
        const laser = laserBeams[i];
        laser.life--;

        if (laser.life <= 0) {
            laserBeams.splice(i, 1);
            continue;
        }

        // Check for enemies hit by laser
        const end = {
            x: laser.start.x + Math.cos(laser.angle) * laser.length,
            y: laser.start.y + Math.sin(laser.angle) * laser.length
        };

        enemies.forEach((enemy, index) => {
            // Skip if this enemy was already hit by this beam
            if (laser.hitEnemies.has(enemy)) return;

            // Check if enemy intersects with laser line
            const distance = pointToLineDistance(
                enemy.pos,
                laser.start,
                end
            );

            if (distance < enemy.radius + laser.width/2) {
                // Laser ignores shields and directly damages health
                enemy.health -= laser.damage;
                laser.hitEnemies.add(enemy); // Mark this enemy as hit by this beam
                
                // console.log(`Laser hit enemy (${enemy.type}), damage: ${laser.damage}, enemy health: ${enemy.health}`);
                if (enemy.health <= 0) {
                    // console.log(`Laser killed enemy (${enemy.type})`);
                    enemies.splice(index, 1);
                    // Add XP and create particle effect when enemy dies
                    addXP(ENEMY_TYPES[enemy.type.toUpperCase()].EXP);
                    createExplosion(enemy.pos.x, enemy.pos.y, 'cyan', 15, false, true); // Add isLaserKill parameter
                    // Check for powerup drop
                    dropPowerup(enemy.pos);
                }
            }
        });
    }
}

// Helper function to calculate point to line distance
function pointToLineDistance(point, lineStart, lineEnd) {
    const A = point.x - lineStart.x;
    const B = point.y - lineStart.y;
    const C = lineEnd.x - lineStart.x;
    const D = lineEnd.y - lineStart.y;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;

    if (lenSq !== 0) param = dot / lenSq;

    let xx, yy;

    if (param < 0) {
        xx = lineStart.x;
        yy = lineStart.y;
    } else if (param > 1) {
        xx = lineEnd.x;
        yy = lineEnd.y;
    } else {
        xx = lineStart.x + param * C;
        yy = lineStart.y + param * D;
    }

    const dx = point.x - xx;
    const dy = point.y - yy;

    return Math.sqrt(dx * dx + dy * dy);
}

export function drawProjectiles(ctx, camera) {
    // Draw rocket trails
    rocketTrails.forEach(trail => {
        ctx.fillStyle = trail.color;
        ctx.globalAlpha = trail.life / 20;
        ctx.beginPath();
        ctx.arc(trail.pos.x - camera.x, trail.pos.y - camera.y, trail.radius, 0, Math.PI * 2);
        ctx.fill();
    });

    ctx.globalAlpha = 1;

    // Draw regular projectiles
    projectiles.forEach(p => {
        if (p.pos.x >= camera.x && p.pos.x <= camera.x + camera.width &&
            p.pos.y >= camera.y && p.pos.y <= camera.y + camera.height) {
            
            if (p.isRocket) {
                // Draw rocket
                ctx.save();
                ctx.translate(p.pos.x - camera.x, p.pos.y - camera.y);
                ctx.rotate(p.angle);
                
                // Draw rocket body
                ctx.fillStyle = '#666666';
                ctx.beginPath();
                ctx.moveTo(10, 0);  // Nose
                ctx.lineTo(-5, -5); // Left wing
                ctx.lineTo(-5, 5);  // Right wing
                ctx.closePath();
                ctx.fill();
            } else {
                // Draw regular projectiles
                ctx.fillStyle = p.enemyShot ? "cyan" : "red";
                ctx.beginPath();
                ctx.arc(p.pos.x - camera.x, p.pos.y - camera.y, p.radius, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }
    });

    // Draw laser beams with crackling effect
    laserBeams.forEach(laser => {
        const end = {
            x: laser.start.x + Math.cos(laser.angle) * laser.length,
            y: laser.start.y + Math.sin(laser.angle) * laser.length
        };

        // Add glow effect
        ctx.shadowBlur = 15;
        ctx.shadowColor = 'rgba(0, 255, 255, 0.5)';
        
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)';
        ctx.lineWidth = laser.width * 2;
        ctx.globalAlpha = laser.life / 20;
        
        // Draw main beam glow
        ctx.beginPath();
        ctx.moveTo(laser.start.x - camera.x, laser.start.y - camera.y);
        ctx.lineTo(end.x - camera.x, end.y - camera.y);
        ctx.stroke();

        // Draw crackling lightning effect
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.globalAlpha = laser.life / 10;

        const segments = 12;
        const segmentLength = getDistance(laser.start.x, laser.start.y, end.x, end.y) / segments;
        
        ctx.beginPath();
        let x = laser.start.x - camera.x;
        let y = laser.start.y - camera.y;
        ctx.moveTo(x, y);

        for (let i = 1; i <= segments; i++) {
            const nextX = laser.start.x + Math.cos(laser.angle) * (segmentLength * i) - camera.x;
            const nextY = laser.start.y + Math.sin(laser.angle) * (segmentLength * i) - camera.y;
            
            // Add random offset perpendicular to the beam
            const offset = (Math.random() - 0.5) * 10;
            const perpX = Math.cos(laser.angle + Math.PI/2) * offset;
            const perpY = Math.sin(laser.angle + Math.PI/2) * offset;
            
            // Create control points for bezier curve
            const cpOffset = (Math.random() - 0.5) * 20;
            const cp1x = x + (nextX - x) * 0.4 + perpX;
            const cp1y = y + (nextY - y) * 0.4 + perpY;
            const cp2x = x + (nextX - x) * 0.6 + perpX;
            const cp2y = y + (nextY - y) * 0.6 + perpY;
            
            ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, nextX, nextY);
            
            x = nextX;
            y = nextY;
        }
        ctx.stroke();

        // Add small energy particles along the beam
        if (Math.random() < 0.3) {
            const particlePos = Math.random();
            const particleX = laser.start.x + (end.x - laser.start.x) * particlePos;
            const particleY = laser.start.y + (end.y - laser.start.y) * particlePos;
            createExplosion(particleX, particleY, 'cyan', 1, false, true);
        }

        // Reset canvas properties
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
    });
}
