import { GAME_WIDTH, GAME_HEIGHT, PLAYER } from './constants.js';
import { getDistance } from './utils.js';
import { showStatsMenu } from './statsMenu.js';

const weapons = ["shotgun", "laser", "rockets", "chainLightning", "droneSwarm"];
let currentWeaponIndex = 0;
let player;

function generatePlayerId() {
    return Math.random().toString(36).substring(2, 15);
}

const keys = { w: false, a: false, s: false, d: false };

export function initializePlayer() {
    player = {
        id: generatePlayerId(),  // Add unique ID for multiplayer
        pos: { x: GAME_WIDTH / 2, y: GAME_HEIGHT / 2 },
        speed: PLAYER.SPEED,
        radius: PLAYER.RADIUS,
        xp: 0,
        level: 1,
        xpToNextLevel: 5,
        attackSpeed: PLAYER.ATTACK_SPEED,
        projectileStrength: PLAYER.PROJECTILE_STRENGTH,
        additionalProjectiles: PLAYER.ADDITIONAL_PROJECTILES,
        weapon: weapons[currentWeaponIndex],
        health: PLAYER.HEALTH,
        invincible: false,
        statPoints: 0
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
    player.statPoints++; // Add a stat point
}

export function handlePlayerMovement() {
    if (keys.w && player.pos.y > 0) player.pos.y -= player.speed;
    if (keys.s && player.pos.y < GAME_HEIGHT - player.radius * 2) player.pos.y += player.speed;
    if (keys.a && player.pos.x > 0) player.pos.x -= player.speed;
    if (keys.d && player.pos.x < GAME_WIDTH - player.radius * 2) player.pos.x += player.speed;
}

export function switchWeapon(direction) {
    currentWeaponIndex = (currentWeaponIndex + direction + weapons.length) % weapons.length;
    player.weapon = weapons[currentWeaponIndex];
    updateWeaponUI();
}

function updateWeaponUI() {
    document.querySelectorAll('.weapon-icon').forEach(icon => {
        if (icon.dataset.weapon === player.weapon) {
            icon.classList.add('active');
        } else {
            icon.classList.remove('active');
        }
    });
}

window.addEventListener("keydown", (e) => {
    if (e.key.toLowerCase() in keys) {
        keys[e.key.toLowerCase()] = true;
    }
    
    if (e.key === 'q') {
        switchWeapon(-1);
    } else if (e.key === 'e') {
        switchWeapon(1);
    } else if (e.key.toLowerCase() === 'c') {
        showStatsMenu();
    }
});

window.addEventListener("keyup", (e) => {
    if (e.key.toLowerCase() in keys) {
        keys[e.key.toLowerCase()] = false;
    }
});
