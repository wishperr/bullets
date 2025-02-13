// UI-related imports
import { getPlayer } from './player.js';
import { pauseGame, resumeGame } from "./game.js";
import { UI } from "./constants.js";
import { UI_ELEMENTS } from "./uiConstants.js";

export function updateUI(killCount, xp, level, xpToNextLevel, health) {
    const player = getPlayer();
    
    // Update status counters with kill count passed as parameter
    UI_ELEMENTS.killCounter.innerText = `💀 Kills: ${killCount}`;
    UI_ELEMENTS.xpCounter.innerText = `⭐ XP: ${player.xp} / ${player.xpToNextLevel}`;
    UI_ELEMENTS.levelCounter.innerText = `📈 Level: ${player.level}${player.statPoints > 0 ? ` (Press C: ${player.statPoints} points available)` : ''}`;
    
    // Handle invincibility status display
    let invincibilityText = "";
    if (player.invincible) {
        let remainingSeconds = Math.ceil(player.invincibleRemaining / 1000);
        invincibilityText = ` (Invincible ${remainingSeconds})`;
    }

    // Update player stats with icons
    UI_ELEMENTS.healthCounter.innerText = `❤️ Health: ${player.health}${invincibilityText}`;
    UI_ELEMENTS.attackSpeedCounter.innerText = `⚡ Attack Speed: ${player.attackSpeed}ms`;
    UI_ELEMENTS.movementSpeedCounter.innerText = `🏃 Movement Speed: ${player.speed}`;
    UI_ELEMENTS.projectileStrengthCounter.innerText = `💥 Projectile Strength: ${player.projectileStrength}`;
    UI_ELEMENTS.additionalProjectilesCounter.innerText = `🎯 Additional Projectiles: ${player.additionalProjectiles}`;
}

export function showUpgradeOptions() {
    const player = getPlayer();
    pauseGame();

    // Create upgrade container
    const upgradeContainer = document.createElement("div");
    upgradeContainer.id = "upgradeContainer";
    upgradeContainer.classList.add("upgrade-container");

    const title = document.createElement("p");
    title.innerText = "Choose an Upgrade!";
    upgradeContainer.appendChild(title);

    // Define available upgrades with matching icons
    const upgradeOptions = [
        { text: "⚡ Attack Speed", effect: () => { player.attackSpeed = Math.max(200, player.attackSpeed - 100); } },
        { text: "🏃 Move Speed", effect: () => { player.speed += 0.5; } },
        { text: "💥 Damage", effect: () => { player.projectileStrength++; } },
        { text: "🎯 Additional Projectile", effect: () => { player.additionalProjectiles++; } },
        { text: "❤️ Increase Health", effect: () => { getPlayer().health += 1; } }
    ];

    // Randomly select and display upgrades
    const shuffledUpgrades = upgradeOptions.sort(() => Math.random() - 0.5).slice(0, 4);

    shuffledUpgrades.forEach(upgrade => {
        const button = document.createElement("button");
        button.innerText = upgrade.text;
        button.style.margin = "5px";
        button.onclick = () => {
            upgrade.effect();
            document.body.removeChild(upgradeContainer);
            resumeGame();
        };
        upgradeContainer.appendChild(button);
    });

    document.body.appendChild(upgradeContainer);
}

// Game state UI updates
export function showGameOver() {
    UI_ELEMENTS.restartButton.style.display = "block";
    UI_ELEMENTS.restartButton.onclick = () => location.reload();

    const gameOverText = document.createElement("div");
    gameOverText.innerText = "Game Over";
    gameOverText.classList.add("game-over-text");
    document.body.appendChild(gameOverText);
}

export function updateWaveUI(waveNumber) {
    UI_ELEMENTS.waveCounter.innerText = `Wave: ${waveNumber}`;
}

export function showBossMessage() {
    const bossMessage = document.createElement('div');
    bossMessage.innerText = 'Boss Incoming!';
    bossMessage.classList.add("boss-message");
    document.body.appendChild(bossMessage);

    // Remove message after delay
    setTimeout(() => {
        document.body.removeChild(bossMessage);
    }, 3000);
}
