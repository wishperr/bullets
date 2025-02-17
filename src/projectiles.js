import { getPlayer } from './player.js';
import { GAME_WIDTH, GAME_HEIGHT } from './constants.js';
import { findClosestEnemy } from './weapons/common/weaponUtils.js';
import { enemies } from './enemies.js';  // Add this import
import { getDistance } from './utils.js';  // Add this import too since we use it

// Import weapon systems
import { laserBeams, shootLaser, updateLaserBeams, drawLaserBeams } from './weapons/systems/laserSystem.js';
import { rocketTrails, shootRocket, updateRocketTrails, createRocketTrail, drawRocketTrails } from './weapons/systems/rocketSystem.js';
import { lightningChains, lightningVictims, shootChainLightning, updateLightning, drawLightning } from './weapons/systems/chainLightningSystem.js';
import { shootShotgun } from './weapons/systems/shotgunSystem.js';

export { laserBeams, rocketTrails, lightningChains, lightningVictims };
export let projectiles = [];

// Add camera reference
let gameCamera;

export function setCamera(camera) {
    gameCamera = camera;
}

export function shootProjectiles() {
    const player = getPlayer();
    if (!player) return;

    const closestEnemy = findClosestEnemy(player);
    if (!closestEnemy) return;

    switch(player.weapon) {
        case "laser":
            shootLaser(player, closestEnemy, gameCamera);  // Use the stored camera reference
            break;
        case "rockets":
            const rocket = shootRocket(player, closestEnemy);
            projectiles.push(rocket);
            break;
        case "chainLightning":
            shootChainLightning(player, closestEnemy);
            break;
        case "shotgun":
            const shotgunProjectiles = shootShotgun(player, closestEnemy);
            projectiles.push(...shotgunProjectiles);
            break;
        // Drone swarm doesn't need this as it handles its own shooting
    }
}

export function updateProjectiles() {
    updateLightning();
    updateLaserBeams();
    updateRocketTrails();

    for (let i = projectiles.length - 1; i >= 0; i--) {
        let p = projectiles[i];
        
        if (p.isRocket) {
            createRocketTrail(p.pos);
        }

        // Update drone projectile trails
        if (p.isDroneProjectile) {
            p.trail.unshift({ x: p.pos.x, y: p.pos.y });
            if (p.trail.length > p.maxTrailLength) {
                p.trail.pop();
            }
        }

        // For BFG projectiles, add lifetime tracking
        if (p.isBFG) {
            if (!p.lifetime) {
                p.lifetime = Date.now() + 5000; // 5 seconds lifetime
            }
            // Remove BFG projectile if lifetime expired
            if (Date.now() > p.lifetime) {
                projectiles.splice(i, 1);
                continue;
            }
        }

        p.pos.x += p.vel.x;
        p.pos.y += p.vel.y;

        // Only remove non-BFG projectiles when out of bounds
        if (!p.isBFG && (p.pos.x < 0 || p.pos.x > GAME_WIDTH || p.pos.y < 0 || p.pos.y > GAME_HEIGHT)) {
            projectiles.splice(i, 1);
        } else if (p.isBFG) {
            // For BFG projectiles, wrap around the screen
            if (p.pos.x < 0) p.pos.x = GAME_WIDTH;
            if (p.pos.x > GAME_WIDTH) p.pos.x = 0;
            if (p.pos.y < 0) p.pos.y = GAME_HEIGHT;
            if (p.pos.y > GAME_HEIGHT) p.pos.y = 0;
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
            } else if (p.isBFG) {
                // Draw BFG trail
                if (p.trail.length > 1) {
                    ctx.strokeStyle = p.color + '44';
                    ctx.lineWidth = p.radius * 2;
                    ctx.beginPath();
                    ctx.moveTo(p.trail[0].x - camera.x, p.trail[0].y - camera.y);
                    for (let i = 1; i < p.trail.length; i++) {
                        ctx.lineTo(p.trail[i].x - camera.x, p.trail[i].y - camera.y);
                    }
                    ctx.stroke();
                }

                // Draw energy tendrils
                ctx.save();
                ctx.translate(p.pos.x - camera.x, p.pos.y - camera.y);
                ctx.rotate(p.tendrilAngle);

                // Draw tendrils reaching out to nearby enemies
                enemies.forEach(enemy => {
                    const distance = getDistance(p.pos.x, p.pos.y, enemy.pos.x, enemy.pos.y);
                    if (distance <= 150) { // Tendril range
                        const angle = Math.atan2(enemy.pos.y - p.pos.y, enemy.pos.x - p.pos.x);
                        
                        // Draw lightning-like tendril
                        ctx.beginPath();
                        ctx.strokeStyle = p.color + '88';
                        ctx.lineWidth = 2;
                        
                        let x = 0;
                        let y = 0;
                        ctx.moveTo(x, y);
                        
                        // Create zigzag pattern
                        const segments = 5;
                        for (let i = 1; i <= segments; i++) {
                            const segLen = distance / segments;
                            const offset = (Math.random() - 0.5) * 20;
                            x = Math.cos(angle) * segLen * i;
                            y = Math.sin(angle) * segLen * i;
                            ctx.lineTo(x + offset, y + offset);
                        }
                        
                        ctx.stroke();
                    }
                });

                ctx.restore();

                // Draw BFG projectile
                const gradient = ctx.createRadialGradient(
                    p.pos.x - camera.x, p.pos.y - camera.y, 0,
                    p.pos.x - camera.x, p.pos.y - camera.y, p.radius * 2
                );
                gradient.addColorStop(0, p.color);
                gradient.addColorStop(1, p.color + '00');

                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(p.pos.x - camera.x, p.pos.y - camera.y, p.radius * 2, 0, Math.PI * 2);
                ctx.fill();

                // Core of the projectile
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(p.pos.x - camera.x, p.pos.y - camera.y, p.radius * 0.5, 0, Math.PI * 2);
                ctx.fill();
            } else if (p.isDroneProjectile) {
                // Draw drone projectile trail
                if (p.trail.length > 1) {
                    ctx.strokeStyle = p.color + '44';
                    ctx.lineWidth = p.radius * 1.5;
                    ctx.beginPath();
                    ctx.moveTo(p.trail[0].x - camera.x, p.trail[0].y - camera.y);
                    for (let i = 1; i < p.trail.length; i++) {
                        ctx.lineTo(p.trail[i].x - camera.x, p.trail[i].y - camera.y);
                    }
                    ctx.stroke();
                }

                // Draw drone projectile
                ctx.fillStyle = p.color;
                ctx.shadowColor = p.color;
                ctx.shadowBlur = 15;
                ctx.beginPath();
                ctx.arc(p.pos.x - camera.x, p.pos.y - camera.y, p.radius, 0, Math.PI * 2);
                ctx.fill();
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
