
import { Application, Assets, Sprite } from 'pixi.js';
import { PeerRoom } from './PeerRoom';


const nicknameInput = document.querySelector<HTMLInputElement>("#nickname")!;
const hostBtn = document.querySelector<HTMLButtonElement>("#host")!;
const joinBtn = document.querySelector<HTMLButtonElement>("#join")!;

const app = new Application<HTMLCanvasElement>();

const storedNickname = localStorage.getItem("nickname");
if (storedNickname) {
    nicknameInput.value = storedNickname;
}

let room: PeerRoom | null = null;

const connectToLobby = (nickname: string, lobbyKey?: string) => {
    room = new PeerRoom(nickname);
    if (lobbyKey) {
        room.connectToMember(lobbyKey);
    }
    localStorage.setItem("nickname", nickname);
}

hostBtn.addEventListener('click', (e) => {
    connectToLobby(nicknameInput.value);
})



document.body.appendChild(app.view);


