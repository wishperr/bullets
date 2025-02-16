import { getPlayer } from './player.js';
import { pauseGame, resumeGame } from './game.js';
import { UI_ELEMENTS } from './uiConstants.js';

export function initStatsMenu() {
    // Initialize stat button handlers
    UI_ELEMENTS.statButtons.forEach(button => {
        button.onclick = () => {
            const player = getPlayer();
            if (!player) return;
            
            const stat = button.dataset.stat;
            if (handleStatUpgrade(stat, player)) {
                updateStatDisplay(player);
                UI_ELEMENTS.statButtons.forEach(btn => btn.disabled = player.statPoints <= 0);
            }
        };
    });

    // Initialize close button handler
    if (UI_ELEMENTS.closeStats) {
        UI_ELEMENTS.closeStats.onclick = () => hideStatsMenu();
    }
}

export function toggleStatsMenu() {
    const statsMenu = UI_ELEMENTS.statsMenu;
    if (statsMenu.style.display === 'block') {
        hideStatsMenu();
    } else {
        showStatsMenu();
    }
}

function hideStatsMenu() {
    UI_ELEMENTS.statsMenu.style.display = 'none';
    resumeGame();
}

export function showStatsMenu() {
    const player = getPlayer();
    const statsMenu = UI_ELEMENTS.statsMenu;
    
    // Show menu and pause game
    statsMenu.style.display = 'block';
    pauseGame();

    // Initial stats display
    updateStatDisplay(player);

    // Setup button handlers
    UI_ELEMENTS.statButtons.forEach(button => {
        button.disabled = player.statPoints <= 0;
        button.onclick = () => {
            const stat = button.dataset.stat;
            if (handleStatUpgrade(stat, player)) {
                updateStatDisplay(player);
                UI_ELEMENTS.statButtons.forEach(btn => btn.disabled = player.statPoints <= 0);
            }
        };
    });

    // Setup close button
    UI_ELEMENTS.closeStats.onclick = () => {
        statsMenu.style.display = 'none';
        resumeGame();
    };
}

function updateStatDisplay(player) {
    UI_ELEMENTS.availablePoints.textContent = player.statPoints;
    UI_ELEMENTS.currentAttackSpeed.textContent = player.attackSpeed + 'ms';
    UI_ELEMENTS.currentHealth.textContent = player.health;
    UI_ELEMENTS.currentDamage.textContent = player.projectileStrength;
    UI_ELEMENTS.currentProjectiles.textContent = player.additionalProjectiles;
    UI_ELEMENTS.currentMoveSpeed.textContent = player.speed.toFixed(1);
}

export function handleStatUpgrade(stat, player) {
    if (player.statPoints <= 0) return false;

    switch(stat) {
        case 'attackSpeed':
            player.attackSpeed = Math.max(200, player.attackSpeed - 100);
            break;
        case 'health':
            player.health += 1;
            break;
        case 'damage':
            player.projectileStrength++;
            break;
        case 'additionalProjectiles':
            player.additionalProjectiles++;
            break;
        case 'moveSpeed':
            player.speed += 0.5;
            break;
        default:
            return false;
    }

    player.statPoints--;
    return true;
}