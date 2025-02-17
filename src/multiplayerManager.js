import { initializeGame, gameLoop, syncGameState, getEnemies, getProjectiles, getWaveNumber, getNextWaveTime, pauseGame, resumeGame, getPlayerProjectiles } from './game.js';
import { getPlayer } from './player.js';
import { projectiles } from './projectiles.js';

export class MultiplayerManager {
    constructor() {
        this.ws = null;
        this.isHost = false;
        this.lobbyCode = null;
        this.isMultiplayerGame = false;
        this.otherPlayers = new Map(); // Store other players' states
        this.syncedState = {
            enemies: [],
            projectiles: [],
            waveNumber: 1,
            nextWaveTime: 0,
            gameTime: 0
        };
        this.isPaused = false;
        this.syncInterval = null;
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.getElementById('singleplayer-button').addEventListener('click', () => {
            document.getElementById('menu-screen').style.display = 'none';
            document.getElementById('intro-screen').style.display = 'block';
        });

        document.getElementById('create-lobby-button').addEventListener('click', () => {
            this.createLobby();
        });

        document.getElementById('join-lobby-button').addEventListener('click', () => {
            document.getElementById('menu-screen').style.display = 'none';
            document.getElementById('join-screen').style.display = 'block';
        });

        document.getElementById('join-game-button').addEventListener('click', () => {
            const code = document.getElementById('lobby-code-input').value.toUpperCase();
            this.joinLobby(code);
        });

        document.getElementById('back-to-menu-button').addEventListener('click', () => {
            document.getElementById('join-screen').style.display = 'none';
            document.getElementById('menu-screen').style.display = 'block';
        });

        document.getElementById('leave-lobby-button').addEventListener('click', () => {
            this.leaveLobby();
        });

        document.getElementById('start-game-button').addEventListener('click', () => {
            if (this.isHost) {
                this.startGame();
            }
        });

        // Update the start game button visibility logic
        document.getElementById('start-game-button').style.display = 'none';
    }

    connect() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}`;
        this.ws = new WebSocket(wsUrl);
        
        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
        };

        this.ws.onclose = () => {
            console.log('Disconnected from server');
            // Handle reconnection logic here if needed
        };

        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };
    }

    handleMessage(data) {
        switch (data.type) {
            case 'LOBBY_CREATED':
                this.isHost = true;
                this.lobbyCode = data.lobbyCode;
                document.getElementById('menu-screen').style.display = 'none';
                document.getElementById('lobby-screen').style.display = 'block';
                document.getElementById('lobby-code-display').textContent = `Lobby Code: ${data.lobbyCode}`;
                document.getElementById('start-game-button').style.display = 'block'; // Only show to host
                break;

            case 'PLAYER_JOINED':
                if (this.isHost) {
                    document.getElementById('lobby-status').textContent = 'Player joined! Ready to start.';
                    document.getElementById('start-game-button').style.display = 'block';
                }
                break;

            case 'JOINED_LOBBY':
                this.isHost = false; // Ensure non-host players know they're not host
                document.getElementById('join-screen').style.display = 'none';
                document.getElementById('lobby-screen').style.display = 'block';
                document.getElementById('lobby-status').textContent = 'Waiting for host to start...';
                document.getElementById('start-game-button').style.display = 'none'; // Hide for non-host
                break;

            case 'GAME_STARTED':
                this.isMultiplayerGame = true;
                document.getElementById('lobby-screen').style.display = 'none';
                // Skip intro screen in multiplayer
                document.getElementById('gameCanvas').style.display = 'block';
                document.getElementById('ui').style.display = 'block';
                document.getElementById('weapons-ui').style.display = 'block';
                document.getElementById('waveInfo').style.display = 'block';
                
                initializeGame(); // Use imported function directly
                gameLoop(); // Use imported function directly
                
                // Set up state sync intervals
                if (this.isHost) {
                    // Host sends full game state every 50ms
                    this.syncInterval = setInterval(() => {
                        this.sendSyncedGameState();
                    }, 50);
                }
                break;

            case 'GAME_STATE':
                this.updateOtherPlayerState(data.state);
                break;

            case 'PLAYER_LEFT':
                if (this.isHost) {
                    document.getElementById('lobby-status').textContent = 'Waiting for players...';
                    document.getElementById('start-game-button').style.display = 'none';
                }
                break;

            case 'LOBBY_CLOSED':
                alert(data.message);
                window.location.reload();
                break;

            case 'ERROR':
                alert(data.message);
                break;

            case 'SYNC_GAME_STATE':
                if (!this.isHost) {  // Only non-host players receive sync
                    this.syncedState = data.state;
                    syncGameState(data.state); // Use imported function
                }
                break;

            case 'PLAYER_PAUSE':
                this.handlePauseState(data);
                break;
        }
    }

    handlePauseState(data) {
        this.isPaused = data.isPaused;
        if (data.isPaused) {
            pauseGame(); // Use imported function
        } else {
            resumeGame(); // Use imported function
        }
    }

    createLobby() {
        this.connect();
        this.ws.onopen = () => {
            this.ws.send(JSON.stringify({
                type: 'CREATE_LOBBY'
            }));
        };
    }

    joinLobby(code) {
        this.connect();
        this.ws.onopen = () => {
            this.ws.send(JSON.stringify({
                type: 'JOIN_LOBBY',
                lobbyCode: code
            }));
        };
    }

    leaveLobby() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
        if (this.ws) {
            this.ws.close();
        }
        window.location.reload();
    }

    startGame() {
        this.ws.send(JSON.stringify({
            type: 'START_GAME'
        }));
    }

    sendGameState(playerState) {
        if (this.isMultiplayerGame && this.ws && this.ws.readyState === WebSocket.OPEN) {
            // Get only projectiles owned by this player
            const currentPlayerId = playerState.id;
            const ownedProjectiles = projectiles.filter(p => p.playerId === currentPlayerId);

            this.ws.send(JSON.stringify({
                type: 'GAME_STATE',
                state: {
                    ...playerState,
                    projectiles: ownedProjectiles,
                    id: currentPlayerId
                }
            }));

            // If host, send full game state every frame
            if (this.isHost) {
                this.sendSyncedGameState();
            }
        }
    }

    sendSyncedGameState() {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

        this.ws.send(JSON.stringify({
            type: 'SYNC_GAME_STATE',
            state: {
                enemies: getEnemies(),
                projectiles: getProjectiles(),
                waveNumber: getWaveNumber(),
                nextWaveTime: getNextWaveTime(),
                gameTime: Date.now(),
                isPaused: this.isPaused
            }
        }));
    }

    applyGameState(state) {
        syncGameState(state);
    }

    notifyPause(isPaused) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.isPaused = isPaused;
            this.ws.send(JSON.stringify({
                type: 'PLAYER_PAUSE',
                playerId: this.getPlayer()?.id,
                isPaused
            }));
        }
    }

    updateOtherPlayerState(state) {
        if (!state.id) return;

        // Add projectiles to the main projectile array
        if (state.projectiles) {
            // Filter out old projectiles from this player
            const currentPlayerId = state.id;
            const existingProjectiles = projectiles.filter(p => p.playerId !== currentPlayerId);
            
            // Reset the array while keeping the reference
            projectiles.length = 0;
            projectiles.push(...existingProjectiles);
            
            // Add new projectiles from this player
            state.projectiles.forEach(p => {
                p.playerId = currentPlayerId;  // Ensure projectile ownership
                p.fromPlayer = true;          // Mark as player projectile
                projectiles.push(p);
            });
        }

        // Update player state
        this.otherPlayers.set(state.id, {
            ...state,
            lastUpdate: Date.now()
        });

        // Prune old player states
        for (const [id, playerState] of this.otherPlayers) {
            if (Date.now() - playerState.lastUpdate > 5000) {
                // Remove all projectiles from disconnected player
                const remainingProjectiles = projectiles.filter(p => p.playerId !== id);
                projectiles.length = 0;
                projectiles.push(...remainingProjectiles);
                this.otherPlayers.delete(id);
            }
        }
    }

    getOtherPlayers() {
        return Array.from(this.otherPlayers.values());
    }

    getPlayer() {
        return getPlayer?.();
    }

    // Update to draw other players
    drawOtherPlayers(ctx, camera) {
        for (const [_, playerState] of this.otherPlayers) {
            // Only draw if state is fresh (last 100ms)
            if (Date.now() - playerState.lastUpdate > 100) continue;

            // Draw other player
            ctx.fillStyle = "red"; // Different color for other players
            ctx.beginPath();
            ctx.arc(
                playerState.pos.x - camera.x, 
                playerState.pos.y - camera.y, 
                playerState.radius || 20, 
                0, 
                Math.PI * 2
            );
            ctx.fill();

            // Draw name tag above player
            ctx.fillStyle = "white";
            ctx.font = "14px Arial";
            ctx.textAlign = "center";
            ctx.fillText(
                "Player 2",
                playerState.pos.x - camera.x,
                playerState.pos.y - camera.y - 30
            );

            // Draw player's projectiles
            if (playerState.projectiles) {
                playerState.projectiles.forEach(proj => {
                    ctx.fillStyle = proj.color || "white";
                    ctx.beginPath();
                    ctx.arc(
                        proj.pos.x - camera.x,
                        proj.pos.y - camera.y,
                        proj.radius || 5,
                        0,
                        Math.PI * 2
                    );
                    ctx.fill();
                });
            }
        }
    }
}