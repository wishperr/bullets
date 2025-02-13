import { getPlayer } from './player.js';
import { pauseGame, resumeGame } from './game.js';
import { UI_ELEMENTS } from './uiConstants.js';

function updateStatDisplay(player) {
    UI_ELEMENTS.availablePoints.textContent = player.statPoints;
    UI_ELEMENTS.currentAttackSpeed.textContent = player.attackSpeed + 'ms';
    UI_ELEMENTS.currentHealth.textContent = player.health;
    UI_ELEMENTS.currentDamage.textContent = player.projectileStrength;
    UI_ELEMENTS.currentProjectiles.textContent = player.additionalProjectiles;
}

function handleStatUpgrade(stat, player) {
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
        default:
            return false;
    }

    player.statPoints--;
    return true;
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