import { ENEMY_TYPES, PROJECTILE } from '../../constants.js';
import { getPlayer } from '../../player.js';
import { projectiles } from '../../projectiles.js';
import { spawnEnemy } from '../../enemies.js';
import { getDistance } from '../../utils.js';

const BOSS_PHASES = {
    PHASE1: 0.75, // 75% health
    PHASE2: 0.50, // 50% health
    PHASE3: 0.25  // 25% health
};

function updateBossPhase(boss, healthPercentage) {
    // Update phase based on health percentage
    if (healthPercentage <= BOSS_PHASES.PHASE3 && boss.currentPhase < 4) {
        boss.currentPhase = 4;
        boss.speed = ENEMY_TYPES.BOSS.SPEED * 1.5;
    } else if (healthPercentage <= BOSS_PHASES.PHASE2 && boss.currentPhase < 3) {
        boss.currentPhase = 3;
        boss.speed = ENEMY_TYPES.BOSS.SPEED * 1.2;
    } else if (healthPercentage <= BOSS_PHASES.PHASE1 && boss.currentPhase < 2) {
        boss.currentPhase = 2;
        boss.speed = ENEMY_TYPES.BOSS.SPEED;
    }
}

export function updateBoss(boss) {
    const player = getPlayer();
    if (!player) return;

    const healthPercentage = boss.health / ENEMY_TYPES.BOSS.HEALTH;
    updateBossPhase(boss, healthPercentage);

    // Base movement when not charging
    if (!boss.isCharging) {
        const dx = player.pos.x - boss.pos.x;
        const dy = player.pos.y - boss.pos.y;
        const dist = getDistance(player.pos.x, player.pos.y, boss.pos.x, boss.pos.y);
        
        boss.pos.x += (dx / dist) * boss.speed;
        boss.pos.y += (dy / dist) * boss.speed;
    }

    // Handle phase-specific attacks
    switch(boss.currentPhase) {
        case 1:
            handlePhase1Attacks(boss);
            break;
        case 2:
            handlePhase1Attacks(boss); // Continue bullet spray
            if (!boss.lastSpecialAttack || Date.now() - boss.lastSpecialAttack > 7000) {
                handlePhase2Attacks(boss);
                boss.lastSpecialAttack = Date.now();
            }
            break;
        case 3:
            handlePhase1Attacks(boss); // Continue bullet spray
            if (!boss.isCharging && (!boss.lastSpecialAttack || Date.now() - boss.lastSpecialAttack > 5000)) {
                handlePhase3Attacks(boss, player);
                boss.lastSpecialAttack = Date.now();
            }
            break;
        case 4:
            handleFinalPhase(boss, player);
            break;
    }
}

function handlePhase1Attacks(boss) {
    if (!boss.lastBulletSpray || Date.now() - boss.lastBulletSpray > 2000) {
        // Bullet spray attack
        for (let i = 0; i < 12; i++) {
            const angle = (Math.PI * 2 * i) / 12;
            projectiles.push({
                pos: { x: boss.pos.x, y: boss.pos.y },
                vel: { 
                    x: Math.cos(angle) * PROJECTILE.ENEMY_SPEED,
                    y: Math.sin(angle) * PROJECTILE.ENEMY_SPEED 
                },
                radius: PROJECTILE.ENEMY_RADIUS,
                damage: ENEMY_TYPES.BOSS.DAMAGE / 2,
                enemyShot: true,
                color: "red"
            });
        }
        boss.lastBulletSpray = Date.now();
    }
}

function handlePhase2Attacks(boss) {
    // Become temporarily invulnerable and spawn minions around the boss
    boss.isInvulnerable = true;
    setTimeout(() => { boss.isInvulnerable = false; }, 3000);

    // Spawn minions in a circle around the boss
    const numMinions = 3;
    for (let i = 0; i < numMinions; i++) {
        const angle = (Math.PI * 2 * i) / numMinions;
        const distance = 100; // Distance from boss
        const spawnX = boss.pos.x + Math.cos(angle) * distance;
        const spawnY = boss.pos.y + Math.sin(angle) * distance;
        spawnEnemy("shooter", undefined, false, { x: spawnX, y: spawnY });
    }
}

function handlePhase3Attacks(boss, player) {
    // Start charge attack
    boss.isCharging = true;
    const dx = player.pos.x - boss.pos.x;
    const dy = player.pos.y - boss.pos.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    boss.chargeVel = {
        x: (dx / dist) * boss.speed * 4,
        y: (dy / dist) * boss.speed * 4
    };
    
    boss.chargeTarget = {
        x: player.pos.x,
        y: player.pos.y
    };

    // End charge and create shockwave after 1 second
    setTimeout(() => {
        if (boss.isCharging) {
            boss.isCharging = false;
            createShockwave(boss);
        }
    }, 1000);
}

function handleFinalPhase(boss, player) {
    // Maintain bullet spray with increased frequency
    if (!boss.lastBulletSpray || Date.now() - boss.lastBulletSpray > 1500) {
        handlePhase1Attacks(boss);
        boss.lastBulletSpray = Date.now();
    }

    // Random special attacks with increased frequency
    if (!boss.lastSpecialAttack || Date.now() - boss.lastSpecialAttack > 4000) {
        const attackChoice = Math.random();
        
        if (attackChoice < 0.5) {
            handlePhase2Attacks(boss); // 50% chance for minion spawn
        } else {
            handlePhase3Attacks(boss, player); // 50% chance for charge attack
        }
        
        boss.lastSpecialAttack = Date.now();
    }
}

function createShockwave(boss) {
    const numProjectiles = 16;
    for (let i = 0; i < numProjectiles; i++) {
        const angle = (Math.PI * 2 * i) / numProjectiles;
        projectiles.push({
            pos: { x: boss.pos.x, y: boss.pos.y },
            vel: { 
                x: Math.cos(angle) * PROJECTILE.ENEMY_SPEED * 2,
                y: Math.sin(angle) * PROJECTILE.ENEMY_SPEED * 2
            },
            radius: PROJECTILE.ENEMY_RADIUS * 2,
            damage: ENEMY_TYPES.BOSS.DAMAGE / 3,
            enemyShot: true,
            color: "purple"
        });
    }
}