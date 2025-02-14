import { ENEMY_TYPES } from '../../constants.js';
import { enemies } from '../../enemies.js';
import { createExplosion } from '../../particles.js';
import { findClosestEnemyToPoint } from '../common/weaponUtils.js';
import { getDistance } from '../../utils.js';
import { handleEnemyDeath } from '../common/enemyUtils.js';

export let lightningChains = [];
export let lightningVictims = new Map();

function applyChainLightning(player, target, damage) {
    if (target.shield > 0) {
        target.shield--;
    } else {
        target.health -= damage;
        
        if (target.health <= 0) {
            const index = enemies.indexOf(target);
            if (index > -1) {
                handleEnemyDeath(target);
                enemies.splice(index, 1);
                return true;
            }
        }
    }
    
    lightningVictims.set(target, Date.now() + 1000);
    return false;
}

export function shootChainLightning(player, initialTarget) {
    const maxJumps = player.additionalProjectiles + 1;
    let currentTarget = initialTarget;
    let currentDamageMultiplier = 1;
    let hitEnemies = new Set();
    let chainPoints = [];
    
    chainPoints.push({
        start: { x: player.pos.x, y: player.pos.y },
        end: { x: currentTarget.pos.x, y: currentTarget.pos.y }
    });

    const initialDamage = player.projectileStrength * currentDamageMultiplier;
    const died = applyChainLightning(player, currentTarget, initialDamage);
    if (!died) {
        hitEnemies.add(currentTarget);
    }

    for (let i = 1; i < maxJumps; i++) {
        const nextTarget = findClosestEnemyToPoint(
            currentTarget.pos.x, 
            currentTarget.pos.y, 
            hitEnemies
        );

        if (!nextTarget) break;

        chainPoints.push({
            start: { x: currentTarget.pos.x, y: currentTarget.pos.y },
            end: { x: nextTarget.pos.x, y: nextTarget.pos.y }
        });

        currentDamageMultiplier = Math.max(0, 1 - (i * 0.1));
        const chainDamage = player.projectileStrength * currentDamageMultiplier;
        
        const died = applyChainLightning(player, nextTarget, chainDamage);
        if (!died) {
            hitEnemies.add(nextTarget);
            currentTarget = nextTarget;
        }
    }

    lightningChains.push({
        points: chainPoints,
        life: 10,
        color: '#00ffff',
        width: 3
    });
}

export function updateLightning() {
    const now = Date.now();
    for (const [enemy, endTime] of lightningVictims.entries()) {
        if (now >= endTime || !enemies.includes(enemy)) {
            lightningVictims.delete(enemy);
        }
    }

    for (let i = lightningChains.length - 1; i >= 0; i--) {
        const chain = lightningChains[i];
        chain.life--;
        if (chain.life <= 0) {
            lightningChains.splice(i, 1);
        }
    }
}

export function drawLightning(ctx, camera) {
    lightningChains.forEach(chain => {
        chain.points.forEach(segment => {
            // Draw main bright core with shadow
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = chain.width - 1;
            ctx.shadowColor = '#80ffff';
            ctx.shadowBlur = 20;
            ctx.globalAlpha = chain.life / 10;

            const dx = segment.end.x - segment.start.x;
            const dy = segment.end.y - segment.start.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const segments = Math.floor(distance / 20);

            ctx.beginPath();
            ctx.moveTo(segment.start.x - camera.x, segment.start.y - camera.y);
            
            for (let i = 1; i <= segments; i++) {
                const x = segment.start.x + (dx * i / segments);
                const y = segment.start.y + (dy * i / segments);
                
                const displacement = (Math.random() - 0.5) * 20;
                const perpX = -dy / distance;
                const perpY = dx / distance;
                
                const midX = x + perpX * displacement - camera.x;
                const midY = y + perpY * displacement - camera.y;
                
                ctx.lineTo(midX, midY);
            }
            
            ctx.lineTo(segment.end.x - camera.x, segment.end.y - camera.y);
            ctx.stroke();

            // Draw outer glow
            ctx.strokeStyle = '#00ffff';
            ctx.lineWidth = chain.width + 2;
            ctx.globalAlpha = (chain.life / 10) * 0.5;
            ctx.stroke();
        });

        // Add particles
        if (Math.random() < .3) {
            chain.points.forEach(segment => {
                const particlePos = Math.random();
                const particleX = segment.start.x + (segment.end.x - segment.start.x) * particlePos;
                const particleY = segment.start.y + (segment.end.y - segment.start.y) * particlePos;
                createExplosion(particleX, particleY, '#ffffff', 1, false, true);
            });
        }
    });

    // Draw crackling effect on victims
    for (const [enemy, endTime] of lightningVictims.entries()) {
        if (enemy && enemies.includes(enemy)) {
            const timeLeft = endTime - Date.now();
            const opacity = Math.max(0, timeLeft / 1000);
            
            ctx.strokeStyle = '#00ffff';
            ctx.lineWidth = 2;
            ctx.shadowColor = '#80ffff';
            ctx.shadowBlur = 15;
            ctx.globalAlpha = opacity;
            
            const numArcs = 4;
            const radius = enemy.radius + 5;
            
            for (let i = 0; i < numArcs; i++) {
                const startAngle = (Math.PI * 2 * i / numArcs) + (Math.random() * 0.5);
                const arcLength = (Math.PI * 0.3) + (Math.random() * 0.2);
                
                ctx.beginPath();
                ctx.arc(
                    enemy.pos.x - camera.x,
                    enemy.pos.y - camera.y,
                    radius,
                    startAngle,
                    startAngle + arcLength
                );
                ctx.stroke();
            }
            
            if (Math.random() < 0.3) {
                const sparkAngle = Math.random() * Math.PI * 2;
                const sparkLength = enemy.radius * 0.8;
                const startX = enemy.pos.x - camera.x + Math.cos(sparkAngle) * radius;
                const startY = enemy.pos.y - camera.y + Math.sin(sparkAngle) * radius;
                
                ctx.beginPath();
                ctx.moveTo(startX, startY);
                ctx.lineTo(
                    startX + Math.cos(sparkAngle) * sparkLength,
                    startY + Math.sin(sparkAngle) * sparkLength
                );
                ctx.stroke();
            }
        }
    }

    // Reset all context properties
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';
}