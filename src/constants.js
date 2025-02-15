// constants.js

// Game Settings
export const GAME_WIDTH = 3000;
export const GAME_HEIGHT = 3000;
export const WAVE_SPAWN_RATE = 20000; // Time in milliseconds between waves

// Viewpoint/camera settings
export const CAMERA = {
    WIDTH: 1000,  // Viewport width
    HEIGHT: 800   // Viewport height
};
// Player Settings
export const PLAYER = {
    SPEED: 3,
    RADIUS: 10,
    HEALTH: 50,
    ATTACK_SPEED: 1000, // Time in milliseconds between attacks
    PROJECTILE_STRENGTH: 1,
    ADDITIONAL_PROJECTILES: 1 // Default additional projectiles
};

// Enemy Settings
export const ENEMY_TYPES = {
    NORMAL: {
        SPEED: 2,
        HEALTH: 3,
        DAMAGE: 1,
        RADIUS: 10,
        EXP: 1
    },
    TANK: {
        SPEED: 1.5,
        HEALTH: 6,
        DAMAGE: 2,
        RADIUS: 20,
        EXP: 3
    },
    SHOOTER: {
        SPEED: 1.8,
        HEALTH: 4,
        DAMAGE: 1,
        SHOOT_COOLDOWN: 2000, // Time in milliseconds between shots
        RADIUS: 15,
        EXP: 2
    },
    BOSS: {
        SPEED: 2,
        HEALTH: 200,
        DAMAGE: 30,
        RADIUS: 40,
        EXP: 10
    },
    BERSERKER: {
        SPEED: 1.2,          // Starting speed (will increase as damaged)
        HEALTH: 8,           // More health than normal enemies
        DAMAGE: 1,           // Starting damage (will increase as enraged)
        RADIUS: 12,          // Slightly larger than normal enemies
        EXP: 4,             // More XP reward due to risk
        RAGE_THRESHOLDS: {   // Health percentages where berserker gets enraged
            STAGE1: 0.75,    // 75% health - slight boost
            STAGE2: 0.50,    // 50% health - medium boost
            STAGE3: 0.25     // 25% health - maximum rage
        },
        RAGE_MULTIPLIERS: {  // Multipliers for each rage stage
            STAGE1: {
                SPEED: 1.5,
                DAMAGE: 1.5
            },
            STAGE2: {
                SPEED: 2,
                DAMAGE: 2
            },
            STAGE3: {
                SPEED: 3,
                DAMAGE: 3
            }
        }
    }
};

export const POWERUP = {
    DROP_CHANCE: 0.1, // 10% chance to drop a powerup
    EXTRA_HEALTH_AMOUNT: 5, // Extra health on pickup
    INVINCIBILITY_DURATION: 5000, // 5 seconds of invincibility
};

// Projectile Settings
export const PROJECTILE = {
    SPEED: 5,
    RADIUS: 5,
    ENEMY_SPEED: 3,
    ENEMY_RADIUS: 5,
    DAMAGE: 1,
    LASER_DAMAGE_MULTIPLIER: 0.2,  // Laser deals 10% of normal damage
    ROCKET: {
        SPEED: 4,                  // Slightly slower than normal projectiles
        BASE_EXPLOSION_RADIUS: 50,  // Base explosion radius
        RADIUS_PER_UPGRADE: 20,    // Additional radius per projectile upgrade
        SPLASH_DAMAGE_MULTIPLIER: 0.5, // Splash damage multiplier
        DAMAGE_PER_UPGRADE: 0.5    // Damage increase per projectile strength upgrade
    }
};

// Wave Settings
export const WAVE = {
    INITIAL_ENEMY_COUNT: 50,
    ENEMY_COUNT_INCREMENT: 2,
    TANK_SPAWN_CHANCE_BASE: 0.2,
    TANK_SPAWN_CHANCE_INCREMENT: 0.02,
    SHOOTER_SPAWN_CHANCE: 0.1,
    BOSS_SPAWN_INTERVAL: 5, // Spawn a boss every 5 waves
    SHIELDED_SPAWN_INTERVAL: 1, // Spawn shielded enemies every wave
    SHIELDED_SPAWN_CHANCE: 0.1 // % chance to spawn enemies with shield
};

// Obstacle Settings
export const OBSTACLE = {
    MIN_SIZE: 30,
    MAX_SIZE: 70,
    COUNT: 20
};

// UI Settings
export const UI = {
    HEALTH_BAR_WIDTH: 100,
    HEALTH_BAR_HEIGHT: 10,
    XP_BAR_WIDTH: 100,
    XP_BAR_HEIGHT: 10
};
