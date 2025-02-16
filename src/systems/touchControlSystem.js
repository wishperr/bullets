import { VIRTUAL_JOYSTICK, CAMERA, MOBILE_UI } from '../constants.js';
import { switchWeapon } from '../player.js';
import { toggleStatsMenu } from '../statsMenu.js';

let joystickTouch = null;
let joystickPos = {
    x: VIRTUAL_JOYSTICK.POSITION.LEFT,
    y: CAMERA.HEIGHT - VIRTUAL_JOYSTICK.POSITION.BOTTOM
};
let stickPos = { x: 0, y: 0 };
let moveVector = { x: 0, y: 0 };

// Weapon button positions
const weaponButtons = {
    prev: {
        x: CAMERA.WIDTH - (MOBILE_UI.WEAPON_BUTTON.RIGHT + MOBILE_UI.WEAPON_BUTTON.SIZE * 2 + MOBILE_UI.WEAPON_BUTTON.SPACING),
        y: CAMERA.HEIGHT - MOBILE_UI.WEAPON_BUTTON.BOTTOM,
        size: MOBILE_UI.WEAPON_BUTTON.SIZE
    },
    next: {
        x: CAMERA.WIDTH - MOBILE_UI.WEAPON_BUTTON.RIGHT,
        y: CAMERA.HEIGHT - MOBILE_UI.WEAPON_BUTTON.BOTTOM,
        size: MOBILE_UI.WEAPON_BUTTON.SIZE
    }
};

const statsButton = {
    x: CAMERA.WIDTH - MOBILE_UI.STATS_BUTTON.RIGHT - MOBILE_UI.STATS_BUTTON.SIZE,
    y: MOBILE_UI.STATS_BUTTON.TOP,
    size: MOBILE_UI.STATS_BUTTON.SIZE
};

export function initTouchControls(canvas) {
    // Update positions based on canvas size
    function updateButtonPositions() {
        // Update joystick position
        joystickPos = {
            x: VIRTUAL_JOYSTICK.POSITION.LEFT,
            y: canvas.height - VIRTUAL_JOYSTICK.POSITION.BOTTOM
        };
        stickPos = { x: joystickPos.x, y: joystickPos.y };

        // Update weapon buttons
        weaponButtons.prev.y = canvas.height - MOBILE_UI.WEAPON_BUTTON.BOTTOM;
        weaponButtons.next.y = canvas.height - MOBILE_UI.WEAPON_BUTTON.BOTTOM;
        weaponButtons.prev.x = canvas.width - (MOBILE_UI.WEAPON_BUTTON.RIGHT + MOBILE_UI.WEAPON_BUTTON.SIZE * 2 + MOBILE_UI.WEAPON_BUTTON.SPACING);
        weaponButtons.next.x = canvas.width - MOBILE_UI.WEAPON_BUTTON.RIGHT;

        // Update stats button position
        statsButton.x = canvas.width - MOBILE_UI.STATS_BUTTON.RIGHT - MOBILE_UI.STATS_BUTTON.SIZE;
        statsButton.y = MOBILE_UI.STATS_BUTTON.TOP;
    }

    // Initial position update
    updateButtonPositions();

    // Update positions when window resizes
    window.addEventListener('resize', updateButtonPositions);

    // Add touch event listeners
    canvas.addEventListener('touchstart', handleTouchStart);
    canvas.addEventListener('touchmove', handleTouchMove);
    canvas.addEventListener('touchend', handleTouchEnd);
    
    // Prevent default touch actions
    canvas.addEventListener('touchstart', preventDefault);
    canvas.addEventListener('touchmove', preventDefault);
    canvas.addEventListener('touchend', preventDefault);
}

function preventDefault(e) {
    e.preventDefault();
}

function handleTouchStart(e) {
    for (let i = 0; i < e.touches.length; i++) {
        const touch = e.touches[i];
        const touchX = touch.clientX;
        const touchY = touch.clientY;

        // Check joystick area
        if (!joystickTouch && isInCircle(touchX, touchY, joystickPos.x, joystickPos.y, VIRTUAL_JOYSTICK.OUTER_RADIUS)) {
            joystickTouch = touch.identifier;
            updateStickPos(touchX, touchY);
            continue;
        }

        // Check weapon switch buttons
        if (isInButton(touchX, touchY, weaponButtons.prev)) {
            switchWeapon(-1);
            continue;
        }
        if (isInButton(touchX, touchY, weaponButtons.next)) {
            switchWeapon(1);
            continue;
        }

        // Check stats button - now toggles the menu
        if (isInButton(touchX, touchY, statsButton)) {
            toggleStatsMenu();
            continue;
        }
    }
}

function isInCircle(x, y, centerX, centerY, radius) {
    const dx = x - centerX;
    const dy = y - centerY;
    return (dx * dx + dy * dy) <= radius * radius;
}

function isInButton(x, y, button) {
    return x >= button.x && x <= button.x + button.size &&
           y >= button.y && y <= button.y + button.size;
}

function handleTouchMove(e) {
    // Find our joystick touch
    for (let i = 0; i < e.touches.length; i++) {
        const touch = e.touches[i];
        if (touch.identifier === joystickTouch) {
            updateStickPos(touch.clientX, touch.clientY);
            break;
        }
    }
}

function handleTouchEnd(e) {
    // Check if the joystick touch ended
    for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === joystickTouch) {
            joystickTouch = null;
            // Reset stick to center
            stickPos = { x: joystickPos.x, y: joystickPos.y };
            moveVector = { x: 0, y: 0 };
            break;
        }
    }
}

function updateStickPos(touchX, touchY) {
    // Calculate distance from joystick center
    const dx = touchX - joystickPos.x;
    const dy = touchY - joystickPos.y;
    const distance = Math.hypot(dx, dy);

    // Normalize movement vector
    moveVector.x = dx / distance;
    moveVector.y = dy / distance;

    // Constrain stick position to outer radius
    if (distance > VIRTUAL_JOYSTICK.OUTER_RADIUS) {
        stickPos = {
            x: joystickPos.x + moveVector.x * VIRTUAL_JOYSTICK.OUTER_RADIUS,
            y: joystickPos.y + moveVector.y * VIRTUAL_JOYSTICK.OUTER_RADIUS
        };
    } else {
        stickPos = { x: touchX, y: touchY };
    }
}

export function getMoveVector() {
    return moveVector;
}

export function drawTouchControls(ctx) {
    ctx.save();
    
    // Draw joystick
    ctx.globalAlpha = VIRTUAL_JOYSTICK.OPACITY;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    
    // Outer circle
    ctx.beginPath();
    ctx.arc(joystickPos.x, joystickPos.y, VIRTUAL_JOYSTICK.OUTER_RADIUS, 0, Math.PI * 2);
    ctx.stroke();

    // Inner circle (stick)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(stickPos.x, stickPos.y, VIRTUAL_JOYSTICK.INNER_RADIUS, 0, Math.PI * 2);
    ctx.fill();

    // Draw weapon buttons
    ctx.globalAlpha = MOBILE_UI.WEAPON_BUTTON.OPACITY;
    
    // Previous weapon button
    ctx.fillStyle = '#444444';
    ctx.fillRect(weaponButtons.prev.x, weaponButtons.prev.y, weaponButtons.prev.size, weaponButtons.prev.size);
    drawArrow(ctx, weaponButtons.prev, true);

    // Next weapon button
    ctx.fillStyle = '#444444';
    ctx.fillRect(weaponButtons.next.x, weaponButtons.next.y, weaponButtons.next.size, weaponButtons.next.size);
    drawArrow(ctx, weaponButtons.next, false);

    // Draw stats button
    ctx.fillStyle = '#444444';
    ctx.fillRect(statsButton.x, statsButton.y, statsButton.size, statsButton.size);
    drawStatsIcon(ctx, statsButton);

    ctx.restore();
}

function drawArrow(ctx, button, isLeft) {
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    
    const padding = 15;
    const centerX = button.x + button.size / 2;
    const centerY = button.y + button.size / 2;
    
    if (isLeft) {
        ctx.moveTo(centerX + padding, centerY - padding);
        ctx.lineTo(centerX - padding, centerY);
        ctx.lineTo(centerX + padding, centerY + padding);
    } else {
        ctx.moveTo(centerX - padding, centerY - padding);
        ctx.lineTo(centerX + padding, centerY);
        ctx.lineTo(centerX - padding, centerY + padding);
    }
    ctx.stroke();
}

function drawStatsIcon(ctx, button) {
    ctx.fillStyle = '#444444';
    ctx.fillRect(button.x, button.y, button.size, button.size);
    
    // Check if menu is open
    const isMenuOpen = document.getElementById('stats-menu').style.display === 'block';
    
    ctx.strokeStyle = isMenuOpen ? '#ffff00' : '#ffffff'; // Yellow when open, white when closed
    ctx.lineWidth = 3;
    const padding = button.size * 0.25;
    const centerX = button.x + button.size / 2;
    const centerY = button.y + button.size / 2;
    
    // Draw stats icon (vertical bars)
    for (let i = 0; i < 3; i++) {
        const height = ((i + 1) * button.size * 0.2);
        const barWidth = button.size * 0.15;
        const startX = centerX - padding + (i * (barWidth + padding/2));
        
        ctx.beginPath();
        ctx.moveTo(startX, centerY + padding - height);
        ctx.lineTo(startX, centerY + padding);
        ctx.stroke();
    }

    // Add glow effect - stronger when menu is open
    ctx.shadowBlur = isMenuOpen ? 10 : 5;
    ctx.shadowColor = isMenuOpen ? '#ffff00' : '#ffffff';
}