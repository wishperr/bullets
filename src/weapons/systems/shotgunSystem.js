import { PROJECTILE } from '../../constants.js';

export function shootShotgun(player, closestEnemy) {
    const baseProjectiles = 2 + player.additionalProjectiles;
    const dx = closestEnemy.pos.x - player.pos.x;
    const dy = closestEnemy.pos.y - player.pos.y;
    const baseAngle = Math.atan2(dy, dx);

    const projectiles = [];
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
    
    return projectiles;
}