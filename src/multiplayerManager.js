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
    }

    connect() {
        this.ws = new WebSocket('ws://192.168.3.24:3000');
        
        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
        };

        this.ws.onclose = () => {
            console.log('Disconnected from server');
            // Handle reconnection logic here if needed
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
                document.getElementById('start-game-button').style.display = 'none';
                break;

            case 'PLAYER_JOINED':
                if (this.isHost) {
                    document.getElementById('lobby-status').textContent = 'Player joined! Ready to start.';
                    document.getElementById('start-game-button').style.display = 'block';
                }
                break;

            case 'JOINED_LOBBY':
                document.getElementById('join-screen').style.display = 'none';
                document.getElementById('lobby-screen').style.display = 'block';
                document.getElementById('lobby-status').textContent = 'Waiting for host to start...';
                break;

            case 'GAME_STARTED':
                this.isMultiplayerGame = true;
                document.getElementById('lobby-screen').style.display = 'none';
                document.getElementById('intro-screen').style.display = 'block';
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
                    // Update game state with received data
                    this.applyGameState(data.state);
                }
                break;

            case 'PLAYER_PAUSE':
                if (data.playerId !== this.getPlayer()?.id) {
                    if (data.isPaused) {
                        window.pauseGame();
                    } else {
                        window.resumeGame();
                    }
                }
                break;
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
            // Basic player state (position, etc)
            this.ws.send(JSON.stringify({
                type: 'GAME_STATE',
                state: playerState
            }));

            // If host, also send full game state periodically
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
                enemies: window.getEnemies(),
                projectiles: window.getProjectiles(),
                waveNumber: window.getWaveNumber(),
                nextWaveTime: window.getNextWaveTime(),
                gameTime: Date.now()
            }
        }));
    }

    applyGameState(state) {
        window.syncGameState(state);
    }

    notifyPause(isPaused) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'PLAYER_PAUSE',
                playerId: this.getPlayer()?.id,
                isPaused
            }));
        }
    }

    updateOtherPlayerState(state) {
        // Update the state of other players in the game
        this.otherPlayers.set(state.id, state);
    }

    getOtherPlayers() {
        return Array.from(this.otherPlayers.values());
    }

    getPlayer() {
        return window.getPlayer?.();
    }
}

// Export a singleton instance
export const multiplayerManager = new MultiplayerManager();