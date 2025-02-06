import { getPlayer } from './player.js';
import { pauseGame, resumeGame } from "./game.js";
import { UI } from "./constants.js";

export function updateUI() {
    const player = getPlayer();
    document.getElementById("killCounter").innerText = `Kills: ${player.killCount || 0}`;
    document.getElementById("xpCounter").innerText = `XP: ${player.xp} / ${player.xpToNextLevel}`;
    document.getElementById("levelCounter").innerText = `Level: ${player.level}`;
    document.getElementById("healthCounter").innerText = `Health: ${player.health}`;
    document.getElementById("attackSpeedCounter").innerText = `Attack Speed: ${player.attackSpeed}ms`;
    document.getElementById("movementSpeedCounter").innerText = `Movement Speed: ${player.speed}`;
    document.getElementById("projectileStrengthCounter").innerText = `Projectile Strength: ${player.projectileStrength}`;
    document.getElementById("additionalProjectilesCounter").innerText = `Additional Projectiles: ${player.additionalProjectiles}`;
}

export function showUpgradeOptions() {
    const player = getPlayer();
    pauseGame();

    const upgradeContainer = document.createElement("div");
    upgradeContainer.id = "upgradeContainer";
    upgradeContainer.style.position = "absolute";
    upgradeContainer.style.top = "50%";
    upgradeContainer.style.left = "50%";
    upgradeContainer.style.transform = "translate(-50%, -50%)";
    upgradeContainer.style.padding = "20px";
    upgradeContainer.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
    upgradeContainer.style.color = "white";
    upgradeContainer.style.fontSize = "20px";
    upgradeContainer.style.border = "2px solid white";
    upgradeContainer.style.textAlign = "center";

    const title = document.createElement("p");
    title.innerText = "Choose an Upgrade!";
    upgradeContainer.appendChild(title);

    const upgradeOptions = [
        { text: "🔥 Attack Speed", effect: () => { player.attackSpeed = Math.max(200, player.attackSpeed - 100); } },
        { text: "⚡ Move Speed", effect: () => { player.speed += 0.5; } },
        { text: "💥 Damage", effect: () => { player.projectileStrength++; } },
        { text: "🎯 Additional Projectile", effect: () => { player.additionalProjectiles++; } }
    ];

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

export function showGameOver() {
    const restartButton = document.getElementById("restartButton");
    restartButton.style.display = "block";
    restartButton.onclick = () => location.reload();

    const gameOverText = document.createElement("div");
    gameOverText.innerText = "Game Over";
    gameOverText.style.position = "absolute";
    gameOverText.style.top = "40%";
    gameOverText.style.left = "50%";
    gameOverText.style.transform = "translate(-50%, -50%)";
    gameOverText.style.fontSize = "40px";
    gameOverText.style.color = "red";
    gameOverText.style.fontWeight = "bold";
    document.body.appendChild(gameOverText);
}
