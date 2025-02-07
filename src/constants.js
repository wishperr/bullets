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
    HEALTH: 5,
    ATTACK_SPEED: 500, // Time in milliseconds between attacks
    PROJECTILE_STRENGTH: 1,
    ADDITIONAL_PROJECTILES: 0 // Default additional projectiles
};

// Enemy Settings
export const ENEMY_TYPES = {
    NORMAL: {
        SPEED: 2,
        HEALTH: 3,
        DAMAGE: 1,
        RADIUS: 10
    },
    TANK: {
        SPEED: 1.5,
        HEALTH: 6,
        DAMAGE: 2,
        RADIUS: 20
    },
    SHOOTER: {
        SPEED: 1.8,
        HEALTH: 4,
        DAMAGE: 1,
        SHOOT_COOLDOWN: 2000, // Time in milliseconds between shots
        RADIUS: 15
    },
    BOSS: {
        SPEED: 1,
        HEALTH: 15,
        DAMAGE: 3,
        RADIUS: 40
    }
};

// Projectile Settings
export const PROJECTILE = {
    SPEED: 5,
    RADIUS: 5,
    ENEMY_SPEED: 3,
    ENEMY_RADIUS: 5,
    DAMAGE: 1
};

// Wave Settings
export const WAVE = {
    INITIAL_ENEMY_COUNT: 50,
    ENEMY_COUNT_INCREMENT: 2,
    TANK_SPAWN_CHANCE_BASE: 0.2,
    TANK_SPAWN_CHANCE_INCREMENT: 0.02,
    SHOOTER_SPAWN_CHANCE: 0.4,
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
