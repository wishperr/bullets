import { GAME_WIDTH, GAME_HEIGHT, PLAYER } from './constants.js';
import { showUpgradeOptions } from './ui.js';
import { getDistance } from './utils.js';

let player;
const keys = { w: false, a: false, s: false, d: false };

export function initializePlayer() {
    player = {
        pos: { x: GAME_WIDTH / 2, y: GAME_HEIGHT / 2 },
        speed: PLAYER.SPEED,
        radius: PLAYER.RADIUS,
        xp: 0,
        level: 1,
        xpToNextLevel: 5,
        attackSpeed: PLAYER.ATTACK_SPEED,
        projectileStrength: PLAYER.PROJECTILE_STRENGTH,
        additionalProjectiles: PLAYER.ADDITIONAL_PROJECTILES,
        weapon: "shotgun",
        health: PLAYER.HEALTH,
        invincible: false
    };
}

export function getPlayer() {
    return player;
}

export function addXP(amount) {
    player.xp += amount;
    if (player.xp >= player.xpToNextLevel) {
        levelUp();
    }
}

function levelUp() {
    player.level++;
    player.xp = 0;
    player.xpToNextLevel = Math.floor(player.xpToNextLevel * 1.5);
    showUpgradeOptions();
}

export function handlePlayerMovement() {
    if (keys.w && player.pos.y > 0) player.pos.y -= player.speed;
    if (keys.s && player.pos.y < GAME_HEIGHT - player.radius * 2) player.pos.y += player.speed;
    if (keys.a && player.pos.x > 0) player.pos.x -= player.speed;
    if (keys.d && player.pos.x < GAME_WIDTH - player.radius * 2) player.pos.x += player.speed;
}

window.addEventListener("keydown", (e) => {
    if (e.key.toLowerCase() in keys) {
        keys[e.key.toLowerCase()] = true;
    }
});

window.addEventListener("keyup", (e) => {
    if (e.key.toLowerCase() in keys) {
        keys[e.key.toLowerCase()] = false;
    }
});
