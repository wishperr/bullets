export const UI_ELEMENTS = {
    killCounter: document.getElementById("killCounter"),
    xpCounter: document.getElementById("xpCounter"),
    levelCounter: document.getElementById("levelCounter"),
    healthCounter: document.getElementById("healthCounter"),
    attackSpeedCounter: document.getElementById("attackSpeedCounter"),
    movementSpeedCounter: document.getElementById("movementSpeedCounter"),
    projectileStrengthCounter: document.getElementById("projectileStrengthCounter"),
    additionalProjectilesCounter: document.getElementById("additionalProjectilesCounter"),
    waveCounter: document.getElementById("waveCounter"),
    waveTimer: document.getElementById("waveTimer"),
    restartButton: document.getElementById("restartButton"),
    // Stats menu elements
    statsMenu: document.getElementById("stats-menu"),
    availablePoints: document.getElementById("available-points"),
    currentAttackSpeed: document.getElementById("current-attack-speed"),
    currentHealth: document.getElementById("current-health"),
    currentDamage: document.getElementById("current-damage"),
    currentProjectiles: document.getElementById("current-projectiles"),
    currentMoveSpeed: document.getElementById("current-move-speed"),
    closeStats: document.getElementById("close-stats"),
    statButtons: document.querySelectorAll(".stat-button"),
    
    // Boss health bar elements
    bossHealthBar: document.getElementById("bossHealthBar"),
    bossName: document.querySelector(".boss-name"),
    healthBar: document.querySelector(".health-bar"),
    healthPercentage: document.querySelector(".health-percentage")
};