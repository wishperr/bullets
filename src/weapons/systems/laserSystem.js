import { CAMERA, PROJECTILE, ENEMY_TYPES } from '../../constants.js';
import { getDistance } from '../../utils.js';
import { createExplosion } from '../../particles.js';

export let laserBeams = [];

export function shootLaser(player, target) {
    const numLasers = 1 + player.additionalProjectiles;
    const laserDamage = Math.max(0.5, player.projectileStrength * PROJECTILE.LASER_DAMAGE_MULTIPLIER);
    
    const angle = Math.atan2(target.pos.y - player.pos.y, target.pos.x - player.pos.x);
    
    laserBeams.push({
        start: { x: player.pos.x, y: player.pos.y },
        angle: angle,
        width: 3,
        length: CAMERA.WIDTH,
        damage: laserDamage,
        life: 10,
        color: 'cyan',
        hitEnemies: new Set()
    });
}

export function updateLaserBeams() {
    for (let i = laserBeams.length - 1; i >= 0; i--) {
        const laser = laserBeams[i];
        laser.life--;

        if (laser.life <= 0) {
            laserBeams.splice(i, 1);
        }
    }
}

// Drawing code remains the same
export function drawLaserBeams(ctx, camera) {
    laserBeams.forEach(laser => {
        const end = {
            x: laser.start.x + Math.cos(laser.angle) * laser.length,
            y: laser.start.y + Math.sin(laser.angle) * laser.length
        };

        // Draw main beam glow
        ctx.shadowBlur = 15;
        ctx.shadowColor = 'rgba(0, 255, 255, 0.5)';
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)';
        ctx.lineWidth = laser.width * 2;
        ctx.globalAlpha = laser.life / 20;
        
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
            
            const offset = (Math.random() - 0.5) * 10;
            const perpX = Math.cos(laser.angle + Math.PI/2) * offset;
            const perpY = Math.sin(laser.angle + Math.PI/2) * offset;
            
            const cp1x = x + (nextX - x) * 0.4 + perpX;
            const cp1y = y + (nextY - y) * 0.4 + perpY;
            const cp2x = x + (nextX - x) * 0.6 + perpX;
            const cp2y = y + (nextY - y) * 0.6 + perpY;
            
            ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, nextX, nextY);
            
            x = nextX;
            y = nextY;
        }
        ctx.stroke();

        if (Math.random() < 0.3) {
            const particlePos = Math.random();
            const particleX = laser.start.x + (end.x - laser.start.x) * particlePos;
            const particleY = laser.start.y + (end.y - laser.start.y) * particlePos;
            createExplosion(particleX, particleY, 'cyan', 1, false, true);
        }
    });

    // Reset context properties
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';
}