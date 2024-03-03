
import { Application, Buffer, Graphics, ParticleRenderer } from 'pixi.js';
import { PeerRoom } from './PeerRoom';
import Enemy from './game-objects/Enemy';
import Controls from './Controls';
import Camera from './game-objects/Camera';
import IUpdate from './game-objects/IUpdate';
import GameManager from './GameManager';
import { WINDOW_HEIGHT, WINDOW_WIDTH } from './consts';
import Player from './game-objects/Player';
import Bullet from './game-objects/Bullet';

const lobbyControlsContainer = document.querySelector<HTMLDivElement>('div.lobby-controls')!;

const nicknameInput = document.querySelector<HTMLInputElement>('input#nickname')!;
const hostBtn = document.querySelector<HTMLButtonElement>('button#host')!;
const lobbyInput = document.querySelector<HTMLInputElement>('input#lobby')!;
const joinBtn = document.querySelector<HTMLButtonElement>('button#join')!;

const canvas = document.querySelector<HTMLCanvasElement>('canvas')!;

const app = new Application<HTMLCanvasElement>({ view: canvas, width: WINDOW_WIDTH, height: WINDOW_HEIGHT });

app.view.tabIndex = 1;
app.view.autofocus = true;

const camera = new Camera();
app.stage.addChild(camera);

new Controls(app.view);

const storedNickname = localStorage.getItem('nickname');
if (storedNickname) {
    nicknameInput.value = storedNickname;
}

let room: PeerRoom | null = null;


const connectToLobby = (nickname: string, lobbyKey?: string) => {
    localStorage.setItem('nickname', nickname);
    room = new PeerRoom(`${nickname}_p2pspacegame`);
    if (lobbyKey) {
        console.log("connect")
        room.connectToMember(`${lobbyKey}_p2pspacegame`);
    }
    const gameManager = new GameManager(app, camera, room);
    lobbyControlsContainer.hidden = true;
    room.on("message", (address, { type, message }) => {
        switch (type) {
            case 'player-state':
                if (address !== room?.address()) {
                    gameManager.onPlayerState(address, message);
                }
                break;
            case 'bullet-shot':
                if (address !== room?.address()) {
                    gameManager.onBulletShot(address, message);
                }
                break;
            case 'bullet-collided':
                if (address !== room?.address()) {
                    gameManager.onBulletCollided(message);
                }
                break;
        }
    });
    gameManager.startGame();
}

hostBtn.addEventListener('click', (e) => {
    connectToLobby(nicknameInput.value);
});

joinBtn.addEventListener('click', (e) => {
    connectToLobby(nicknameInput.value, lobbyInput.value);
})



