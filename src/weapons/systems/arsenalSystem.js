import { ENEMY_TYPES, PROJECTILE } from '../../constants.js';
import { getPlayer } from '../../player.js';
import { projectiles } from '../../projectiles.js';
import { spawnEnemy, enemies } from '../../enemies.js';
import { getDistance } from '../../utils.js';
import { createExplosion } from '../../particles.js';

const ARSENAL_BOSS_PHASES = {
    PHASE1: 0.75,
    PHASE2: 0.50,
    PHASE3: 0.25
};

const SHIELD_CONFIG = {
    SEGMENTS: 8,
    ROTATION_SPEED: 0.02,
    RADIUS: 60
};

const BURN_EFFECT = {
    PHASE2: {
        PARTICLES: 2,
        COLOR: '#ffdd00',  // Bright yellow
        RADIUS: 2,
        FREQUENCY: 0.3
    },
    PHASE3: {
        PARTICLES: 3,
        COLOR: '#ff5500',  // Bright orange
        RADIUS: 3,
        FREQUENCY: 0.4
    },
    PHASE4: {
        PARTICLES: 4,
        COLOR: '#ff0000',  // Pure red
        RADIUS: 4,
        FREQUENCY: 0.5
    }
};

const ORBITING_TURRET_CONFIG = {
    ORBIT_RADIUS: 150,
    ORBIT_SPEED: 0.01,
    COUNT: 4
};

let shieldSegments = [];
let deployedTurrets = [];

function updateBossPhase(boss, healthPercentage) {
    if (healthPercentage <= ARSENAL_BOSS_PHASES.PHASE3 && boss.currentPhase < 4) {
        boss.currentPhase = 4;
        boss.speed = ENEMY_TYPES.ARSENAL_BOSS.SPEED * 1.5;
        boss.burnEffect = BURN_EFFECT.PHASE4;
        deployOrbitingTurrets(boss);
    } else if (healthPercentage <= ARSENAL_BOSS_PHASES.PHASE2 && boss.currentPhase < 3) {
        boss.currentPhase = 3;
        boss.speed = ENEMY_TYPES.ARSENAL_BOSS.SPEED * 1.2;
        boss.burnEffect = BURN_EFFECT.PHASE3;
        deployTurrets(boss);
    } else if (healthPercentage <= ARSENAL_BOSS_PHASES.PHASE1 && boss.currentPhase < 2) {
        boss.currentPhase = 2;
        boss.speed = ENEMY_TYPES.ARSENAL_BOSS.SPEED;
        boss.burnEffect = BURN_EFFECT.PHASE2;
        breakShieldSegments(boss);
    }
}

function initializeShield(boss) {
    shieldSegments = [];
    for (let i = 0; i < SHIELD_CONFIG.SEGMENTS; i++) {
        const angle = (i * 2 * Math.PI) / SHIELD_CONFIG.SEGMENTS;
        shieldSegments.push({
            angle: angle,
            active: true,
            lastShot: 0
        });
    }
    boss.shieldAngle = 0;
}

function breakShieldSegments(boss) {
    // Make shield segments operate independently
    shieldSegments.forEach(segment => {
        segment.independent = true;
    });
}

function deployTurrets(boss) {
    deployedTurrets = [];
    const numTurrets = 4;
    for (let i = 0; i < numTurrets; i++) {
        const angle = (i * 2 * Math.PI) / numTurrets;
        const distance = 150;
        const turret = spawnEnemy("arsenal_turret", undefined, false, {
            x: boss.pos.x + Math.cos(angle) * distance,
            y: boss.pos.y + Math.sin(angle) * distance
        });
        deployedTurrets.push(turret);
    }
}

function deployOrbitingTurrets(boss) {
    deployedTurrets = [];
    for (let i = 0; i < ORBITING_TURRET_CONFIG.COUNT; i++) {
        const angle = (i * 2 * Math.PI) / ORBITING_TURRET_CONFIG.COUNT;
        const turret = spawnEnemy("arsenal_turret", undefined, false, {
            x: boss.pos.x + Math.cos(angle) * ORBITING_TURRET_CONFIG.ORBIT_RADIUS,
            y: boss.pos.y + Math.sin(angle) * ORBITING_TURRET_CONFIG.ORBIT_RADIUS
        });
        turret.orbitAngle = angle;
        turret.isOrbiting = true;
        deployedTurrets.push(turret);
    }
}

function updateOrbitingTurrets(boss) {
    deployedTurrets.forEach(turret => {
        if (turret.isOrbiting) {
            turret.orbitAngle += ORBITING_TURRET_CONFIG.ORBIT_SPEED;
            turret.pos.x = boss.pos.x + Math.cos(turret.orbitAngle) * ORBITING_TURRET_CONFIG.ORBIT_RADIUS;
            turret.pos.y = boss.pos.y + Math.sin(turret.orbitAngle) * ORBITING_TURRET_CONFIG.ORBIT_RADIUS;
        }
    });
}

function handleMainShot(boss, player) {
    if (!boss.lastMainShot || Date.now() - boss.lastMainShot > 2000) {
        const angle = Math.atan2(
            player.pos.y - boss.pos.y,
            player.pos.x - boss.pos.x
        );
        
        projectiles.push({
            pos: { x: boss.pos.x, y: boss.pos.y },
            vel: {
                x: Math.cos(angle) * PROJECTILE.ENEMY_SPEED * 1.5,
                y: Math.sin(angle) * PROJECTILE.ENEMY_SPEED * 1.5
            },
            radius: PROJECTILE.ENEMY_RADIUS * 2,
            damage: ENEMY_TYPES.ARSENAL_BOSS.DAMAGE,
            enemyShot: true,
            color: "#ff4400"
        });
        
        boss.lastMainShot = Date.now();
    }
}

function updateShieldSegments(boss, player) {
    if (boss.currentPhase === 1 || boss.currentPhase === 4) {
        // Rotate entire shield
        boss.shieldAngle += SHIELD_CONFIG.ROTATION_SPEED;
        shieldSegments.forEach((segment, i) => {
            segment.angle = boss.shieldAngle + (i * 2 * Math.PI) / SHIELD_CONFIG.SEGMENTS;
            
            // In phase 4, also handle shooting while rotating
            if (boss.currentPhase === 4 && (!segment.lastShot || Date.now() - segment.lastShot > 3000)) {
                const shotAngle = segment.angle + Math.random() * 0.5 - 0.25;
                projectiles.push({
                    pos: {
                        x: boss.pos.x + Math.cos(segment.angle) * SHIELD_CONFIG.RADIUS,
                        y: boss.pos.y + Math.sin(segment.angle) * SHIELD_CONFIG.RADIUS
                    },
                    vel: {
                        x: Math.cos(shotAngle) * PROJECTILE.ENEMY_SPEED,
                        y: Math.sin(shotAngle) * PROJECTILE.ENEMY_SPEED
                    },
                    radius: PROJECTILE.ENEMY_RADIUS,
                    damage: ENEMY_TYPES.ARSENAL_BOSS.DAMAGE / 2,
                    enemyShot: true,
                    color: "#ffaa00"
                });
                segment.lastShot = Date.now();
            }
        });
    } else {
        // Independent segment behavior for other phases
        shieldSegments.forEach(segment => {
            if (segment.independent && (!segment.lastShot || Date.now() - segment.lastShot > 3000)) {
                const shotAngle = segment.angle + Math.random() * 0.5 - 0.25;
                projectiles.push({
                    pos: {
                        x: boss.pos.x + Math.cos(segment.angle) * SHIELD_CONFIG.RADIUS,
                        y: boss.pos.y + Math.sin(segment.angle) * SHIELD_CONFIG.RADIUS
                    },
                    vel: {
                        x: Math.cos(shotAngle) * PROJECTILE.ENEMY_SPEED,
                        y: Math.sin(shotAngle) * PROJECTILE.ENEMY_SPEED
                    },
                    radius: PROJECTILE.ENEMY_RADIUS,
                    damage: ENEMY_TYPES.ARSENAL_BOSS.DAMAGE / 2,
                    enemyShot: true,
                    color: "#ffaa00"
                });
                segment.lastShot = Date.now();
            }
        });
    }
}

function createBurnParticles(boss) {
    if (!boss.burnEffect) return;
    
    if (Math.random() < boss.burnEffect.FREQUENCY) {
        // Create particles around the boss's perimeter
        for (let i = 0; i < boss.burnEffect.PARTICLES; i++) {
            const angle = Math.random() * Math.PI * 2;
            const x = boss.pos.x + Math.cos(angle) * boss.radius;
            const y = boss.pos.y + Math.sin(angle) * boss.radius;
            
            createExplosion(
                x, 
                y, 
                boss.burnEffect.COLOR, 
                boss.burnEffect.RADIUS,
                false,
                false,
                { 
                    velocityMultiplier: 0.8,
                    upwardForce: true,
                    fromBoss: true,
                    angle: angle
                }
            );
        }
    }
}

export function initializeArsenalBoss(boss) {
    boss.currentPhase = 1;
    boss.shieldAngle = 0;
    initializeShield(boss);
}

export function updateArsenalBoss(boss) {
    const player = getPlayer();
    if (!player) return;

    const healthPercentage = boss.health / ENEMY_TYPES.ARSENAL_BOSS.HEALTH;
    updateBossPhase(boss, healthPercentage);

    // Create burn particles if boss is in phase 2 or higher
    if (boss.currentPhase >= 2) {
        createBurnParticles(boss);
    }

    // Base movement - slower than regular boss
    const dx = player.pos.x - boss.pos.x;
    const dy = player.pos.y - boss.pos.y;
    const dist = Math.max(100, getDistance(player.pos.x, player.pos.y, boss.pos.x, boss.pos.y));
    
    boss.pos.x += (dx / dist) * boss.speed * 0.5;
    boss.pos.y += (dy / dist) * boss.speed * 0.5;

    // Update shield segments
    updateShieldSegments(boss, player);

    // Update orbiting turrets in phase 4
    if (boss.currentPhase === 4) {
        updateOrbitingTurrets(boss);
    }

    // Handle phase-specific attacks
    switch(boss.currentPhase) {
        case 1:
            handleMainShot(boss, player);
            break;
        case 2:
            handleMainShot(boss, player);
            break;
        case 3:
            handleMainShot(boss, player);
            // Turrets are handled in updateEnemies
            break;
        case 4:
            // Rapid-fire phase with orbiting turrets
            if (!boss.lastMainShot || Date.now() - boss.lastMainShot > 800) {
                handleMainShot(boss, player);
            }
            break;
    }
}

export function drawArsenalBoss(ctx, boss, camera) {
    // Draw main body
    ctx.fillStyle = "#666666";
    ctx.beginPath();
    ctx.arc(boss.pos.x - camera.x, boss.pos.y - camera.y, boss.radius, 0, Math.PI * 2);
    ctx.fill();

    // Draw mechanical details
    ctx.strokeStyle = "#888888";
    ctx.lineWidth = 3;
    for (let i = 0; i < 4; i++) {
        const angle = (i * Math.PI / 2) + boss.shieldAngle;
        const startX = boss.pos.x - camera.x + Math.cos(angle) * boss.radius * 0.5;
        const startY = boss.pos.y - camera.y + Math.sin(angle) * boss.radius * 0.5;
        const endX = boss.pos.x - camera.x + Math.cos(angle) * boss.radius;
        const endY = boss.pos.y - camera.y + Math.sin(angle) * boss.radius;
        
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
    }

    // Draw shield segments
    shieldSegments.forEach(segment => {
        if (segment.active) {
            const startX = boss.pos.x + Math.cos(segment.angle) * (SHIELD_CONFIG.RADIUS - 20);
            const startY = boss.pos.y + Math.sin(segment.angle) * (SHIELD_CONFIG.RADIUS - 20);
            const endX = boss.pos.x + Math.cos(segment.angle) * SHIELD_CONFIG.RADIUS;
            const endY = boss.pos.y + Math.sin(segment.angle) * SHIELD_CONFIG.RADIUS;
            
            ctx.strokeStyle = segment.independent ? "#ffaa00" : "#00ffff";
            ctx.lineWidth = 8;
            ctx.globalAlpha = 0.6;
            ctx.beginPath();
            ctx.moveTo(startX - camera.x, startY - camera.y);
            ctx.lineTo(endX - camera.x, endY - camera.y);
            ctx.stroke();
            ctx.globalAlpha = 1;
        }
    });
}