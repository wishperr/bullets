import { spawnEnemy } from '../enemies.js';
import { showBossMessage } from '../ui.js';
import { initializeArsenalBoss } from '../weapons/systems/arsenalSystem.js';

// Wave configurations - Using an object instead of array to allow for sparse wave definitions
export const WAVE_CONFIGS = {
    // Waves 1-5 defined explicitly
    1: {
        normal: 8,
        tank: 2
    },
    2: {
        arsenal_boss: 1,
        special: "initializeArsenalBoss"
    },
    3: {
        boss: 1
    },
    4: {
        normal: 6,
        tank: 3,
        berserker: 2,
        shooter: 2,
        shielded: {
            normal: 2,
            tank: 1
        }
    },
    5: {
        normal: 8,
        tank: 4,
        berserker: 3,
        shooter: 3,
        shielded: {
            berserker: 2
        }
    },
    // Special waves can be defined at any number
    16: {
        arsenal_boss: 1,
        normal: 10,
        shielded: {
            shooter: 4,
            berserker: 2
        }
    }
    // Add more specific waves here...
};

// Function to get wave configuration
export function getWaveConfig(waveNumber) {
    // Check if this wave number has a specific configuration
    if (WAVE_CONFIGS[waveNumber]) {
        return WAVE_CONFIGS[waveNumber];
    }

    // Generate scaled wave for undefined wave numbers
    const baseEnemies = Math.floor(10 + waveNumber * 2); // Scale up with wave number
    
    // Every 5th wave that isn't specifically defined should be tougher
    if (waveNumber % 5 === 0) {
        return {
            normal: Math.floor(baseEnemies * 0.3),
            tank: Math.floor(baseEnemies * 0.2),
            berserker: Math.floor(baseEnemies * 0.2),
            shooter: Math.floor(baseEnemies * 0.2),
            shielded: {
                tank: Math.floor(baseEnemies * 0.05),
                berserker: Math.floor(baseEnemies * 0.05)
            }
        };
    }

    // Regular generated wave
    return {
        normal: Math.floor(baseEnemies * 0.4),
        tank: Math.floor(baseEnemies * 0.2),
        berserker: Math.floor(baseEnemies * 0.2),
        shooter: Math.floor(baseEnemies * 0.1),
        shielded: {
            normal: Math.floor(baseEnemies * 0.05),
            berserker: Math.floor(baseEnemies * 0.05)
        }
    };
}

export function spawnWaveEnemies(waveNumber) {
    const config = getWaveConfig(waveNumber);
    
    // Handle special waves (boss waves)
    if (config.arsenal_boss || config.boss) {
        if (config.arsenal_boss) {
            const boss = spawnEnemy("arsenal_boss");
            initializeArsenalBoss(boss);
        } else if (config.boss) {
            spawnEnemy("boss");
        }
        showBossMessage();
        return;
    }

    // Spawn regular enemies
    Object.entries(config).forEach(([type, count]) => {
        if (type === 'shielded') {
            // Handle shielded enemies
            Object.entries(count).forEach(([shieldedType, shieldedCount]) => {
                for (let i = 0; i < shieldedCount; i++) {
                    spawnEnemy(shieldedType, waveNumber, true);
                }
            });
        } else {
            // Spawn regular unshielded enemies
            for (let i = 0; i < count; i++) {
                spawnEnemy(type, waveNumber, false);
            }
        }
    });
}