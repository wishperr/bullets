import { getPlayer, addXP } from './player.js';
import { projectiles } from './projectiles.js';
import { GAME_WIDTH, GAME_HEIGHT, ENEMY_TYPES, WAVE, PROJECTILE } from './constants.js';
import { getRandomEdgePosition, getDistance } from './utils.js';

export let enemies = [];
let normalEnemyKillCount = 0;

export function spawnEnemy(type = "normal", waveNumber = 1) {
    const { x, y } = getRandomEdgePosition(GAME_WIDTH, GAME_HEIGHT);
    let enemyConfig = ENEMY_TYPES[type.toUpperCase()] || ENEMY_TYPES.NORMAL;

    let enemy = {
        pos: { x, y },
        radius: enemyConfig.RADIUS,
        health: enemyConfig.HEALTH,
        damage: enemyConfig.DAMAGE,
        speed: enemyConfig.SPEED,
        type: type,
        shoots: type === "shooter",
        shootCooldown: enemyConfig.SHOOT_COOLDOWN || 0,
        lastShot: Date.now(),
        shield: Math.random() < WAVE.SHIELDED_SPAWN_CHANCE ? 3 : 0 // X(3) hits for shield
    };

    enemies.push(enemy);
}

export function spawnWaveEnemies(waveNumber) {
    let enemyCount = WAVE.INITIAL_ENEMY_COUNT + waveNumber * WAVE.ENEMY_COUNT_INCREMENT;

    if (waveNumber % WAVE.BOSS_SPAWN_INTERVAL === 0) {
        spawnEnemy("BOSS");
    }

    for (let i = 0; i < enemyCount; i++) {
        let type = "NORMAL";

        if (Math.random() < WAVE.TANK_SPAWN_CHANCE_BASE + waveNumber * WAVE.TANK_SPAWN_CHANCE_INCREMENT) {
            type = "TANK";
        }

        if (waveNumber >= 5 && Math.random() < WAVE.SHIELDED_SPAWN_CHANCE) {
            spawnEnemy(type, waveNumber, true);
        } else if (waveNumber % WAVE.SHIELDED_SPAWN_INTERVAL === 0 && Math.random() < WAVE.SHOOTER_SPAWN_CHANCE) {
            spawnEnemy("SHOOTER", waveNumber);
        } else {
            spawnEnemy(type);
        }
    }
}

export function updateEnemies() {
    const player = getPlayer();
    if (!player) return;

    enemies.forEach(e => {
        const dx = player.pos.x - e.pos.x;
        const dy = player.pos.y - e.pos.y;
        const dist = getDistance(player.pos.x, player.pos.y, e.pos.x, e.pos.y);

        if (e.type === "shooter" && dist > 150) {
            e.pos.x += (dx / dist) * e.speed;
            e.pos.y += (dy / dist) * e.speed;

            if (!e.lastShot) e.lastShot = Date.now();
            if (Date.now() - e.lastShot > e.shootCooldown) {
                let angle = Math.atan2(dy, dx);
                projectiles.push({
                    pos: { x: e.pos.x, y: e.pos.y },
                    vel: { x: Math.cos(angle) * PROJECTILE.ENEMY_SPEED, y: Math.sin(angle) * PROJECTILE.ENEMY_SPEED },
                    radius: PROJECTILE.ENEMY_RADIUS,
                    damage: ENEMY_TYPES.SHOOTER.DAMAGE,
                    enemyShot: true,
                    color: "cyan"
                });
                e.lastShot = Date.now();
            }
        } else if (e.type !== "shooter") {
            e.pos.x += (dx / dist) * e.speed;
            e.pos.y += (dy / dist) * e.speed;
        }
    });
}


// Getters and counters for normal enemy kills
export function getNormalEnemyKillCount() {
    return normalEnemyKillCount;
}

export function increaseNormalEnemyKillCount() {
    normalEnemyKillCount++;
}

export function resetNormalEnemyKillCount() {
    normalEnemyKillCount = 0;
}
