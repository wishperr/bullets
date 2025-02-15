import { getPlayer } from './player.js';
import { GAME_WIDTH, GAME_HEIGHT } from './constants.js';
import { findClosestEnemy } from './weapons/common/weaponUtils.js';

// Import weapon systems
import { laserBeams, shootLaser, updateLaserBeams, drawLaserBeams } from './weapons/systems/laserSystem.js';
import { rocketTrails, shootRocket, updateRocketTrails, createRocketTrail, drawRocketTrails } from './weapons/systems/rocketSystem.js';
import { lightningChains, lightningVictims, shootChainLightning, updateLightning, drawLightning } from './weapons/systems/chainLightningSystem.js';
import { shootShotgun } from './weapons/systems/shotgunSystem.js';

export { laserBeams, rocketTrails, lightningChains, lightningVictims };
export let projectiles = [];

export function shootProjectiles() {
    const player = getPlayer();
    if (!player) return;

    const closestEnemy = findClosestEnemy(player);
    if (!closestEnemy) return;

    switch(player.weapon) {
        case "laser":
            shootLaser(player, closestEnemy);
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

        p.pos.x += p.vel.x;
        p.pos.y += p.vel.y;

        // Remove projectiles that are out of bounds
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
