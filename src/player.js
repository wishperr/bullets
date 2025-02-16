import { GAME_WIDTH, GAME_HEIGHT, PLAYER } from './constants.js';
import { getDistance } from './utils.js';
import { showStatsMenu } from './statsMenu.js';
import { getMoveVector } from './systems/touchControlSystem.js';

const weapons = ["shotgun", "laser", "rockets", "chainLightning"];
let currentWeaponIndex = 0;

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
    // Handle keyboard input
    let dx = 0;
    let dy = 0;
    
    if (keys.w) dy -= 1;
    if (keys.s) dy += 1;
    if (keys.a) dx -= 1;
    if (keys.d) dx += 1;

    // Get touch input
    const touchVector = getMoveVector();
    dx += touchVector.x;
    dy += touchVector.y;

    // Normalize diagonal movement
    if (dx !== 0 && dy !== 0) {
        const length = Math.sqrt(dx * dx + dy * dy);
        dx /= length;
        dy /= length;
    }

    // Apply movement
    const newX = player.pos.x + dx * player.speed;
    const newY = player.pos.y + dy * player.speed;

    // Check boundaries
    if (newX > 0 && newX < GAME_WIDTH - player.radius * 2) {
        player.pos.x = newX;
    }
    if (newY > 0 && newY < GAME_HEIGHT - player.radius * 2) {
        player.pos.y = newY;
    }
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

// Add touch gesture for weapon switching
let touchStartX = 0;
const SWIPE_THRESHOLD = 50;

window.addEventListener("touchstart", (e) => {
    touchStartX = e.touches[0].clientX;
});

window.addEventListener("touchend", (e) => {
    const touchEndX = e.changedTouches[0].clientX;
    const swipeDistance = touchEndX - touchStartX;
    
    if (Math.abs(swipeDistance) > SWIPE_THRESHOLD) {
        // Swipe right switches to next weapon, swipe left to previous
        switchWeapon(swipeDistance > 0 ? 1 : -1);
    }
});

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
