import { Application, Graphics } from 'pixi.js';
import { PeerRoom } from './PeerRoom';
import { Vector } from './utils/Vector';
import Controls from './Controls';
import Player from './game-objects/Player';
import Bullet from './game-objects/Bullet';
import Camera from './game-objects/Camera';
import { isIUpdate } from './game-objects/IUpdate';
import { SPEED_ZOOM_FACTOR, WINDOW_HEIGHT, WINDOW_WIDTH } from './consts';
import { sortedClamp } from './utils';
import Enemy from './game-objects/Enemy';


const starsBackground = (g: Graphics) => {
    const colors = [0xffffff, 0xffffff, 0xff8855, 0x8888ff]
    g.clear();
    for (let i = -300; i < 300; i++) {
        for (let j = -300; j < 300; j++) {
            const colorRand = Math.random();
            const spread = 100;
            const opacityRand = Math.random();
            const sizeRand = Math.random();
            g.beginFill(colors[Math.floor(colorRand * colorRand * colors.length)], opacityRand * opacityRand * Math.max(sizeRand, opacityRand) * 0.6 + 0.4);
            g.drawCircle(i * spread + Math.random() * 100 - 50, j * spread + Math.random() * 100 - 50, sizeRand * sizeRand * sizeRand * 3);
        }
    }
    g.endFill();
}
export default class GameManager {
    private app: Application;
    private camera: Camera;
    private room: PeerRoom;

    player: Player;
    enemies: Map<string, Enemy>;
    bullets: Bullet[];

    constructor(app: Application, camera: Camera, room: PeerRoom) {
        this.app = app;
        this.camera = camera;
        this.room = room;
        this.enemies = new Map<string, Enemy>();
        this.bullets = [];
    }

    onPlayerState(address: string, message) {
        if (this.enemies.has(address)) {
            const enemy = this.enemies.get(address) as Enemy;
            enemy.x = message.position.x;
            enemy.y = message.position.y;
            enemy.graphics.angle = message.angle;
            enemy.health = message.health;
        } else {
            const enemy = new Enemy(new URL("/src/imgs/spaceship_sprite.png", import.meta.url).toString());
            this.enemies.set(address, enemy);
            this.camera.addChild(enemy);
        }
    }

    onBulletShot(address: string, message) {
        const bullet = new Bullet(
            message.position,
            message.velocity,
            message.angle,
            address,
            message.id,
            new URL("/src/imgs/long-ray.png", import.meta.url).toString()
        );
        this.bullets.push(bullet);
        this.camera.addChild(bullet);
    }

    private checkPlayerBulletsCollision() {
        for (const b of this.bullets) {
            if (b.owner !== this.room.address()
                && Vector.distance(new Vector(this.player.x, this.player.y), new Vector(b.x, b.y)) < 40) {
                this.room.send({ type: 'bullet-collided', message: { owner: b.owner, id: b.id } })
                this.player.health -= 5;
                if (this.player.health < 0) {
                    this.player.x = 0;
                    this.player.y = 0;
                    this.player.velocity = new Vector(0, 0);
                    this.player.health = 100;
                    this.player.rotation = 0;
                    this.room.send({ type: 'kill', message: { killer: b.owner, target: this.room.address() } })
                }
            }
        }
    }

    playerShoot(counter: number) {
        const angleRads = this.player.graphics.rotation;
        const angleRange = Math.PI / 12;
        const playerDir = new Vector(-Math.cos(angleRads), -Math.sin(angleRads));
        const playerDirLeft = new Vector(-Math.cos(angleRads - angleRange), -Math.sin(angleRads - angleRange));
        const playerDirRight = new Vector(-Math.cos(angleRads + angleRange), -Math.sin(angleRads + angleRange));
        const mouseWorldPoint = this.camera.screenToWorldPoint(Controls.instance.mouse.position);
        const perpOffset = new Vector(playerDir.y, -playerDir.x);
        const bulletOffsetSign = (counter % 2) * 2 - 1;
        const bulletPos = new Vector(this.player.x + bulletOffsetSign * perpOffset.x * 20 + playerDir.x * 120, this.player.y + bulletOffsetSign * perpOffset.y * 20 + playerDir.y * 120);
        const dir = new Vector(mouseWorldPoint.x - bulletPos.x, mouseWorldPoint.y - bulletPos.y);
        const dirNomalized = dir.normalized;
        const dirClamped = new Vector(sortedClamp(dirNomalized.x, playerDirLeft.x, playerDirRight.x), sortedClamp(dirNomalized.y, playerDirLeft.y, playerDirRight.y));
        const bulletAngle = Math.atan2(dirClamped.y, dirClamped.x) * 180 / Math.PI;
        const bulletVelocity = new Vector(dirClamped.x * 50000, dirClamped.y * 50000);
        const bulletData = { id: counter, position: bulletPos, angle: bulletAngle, velocity: bulletVelocity };
        this.onBulletShot(this.room.address(), bulletData);
        this.room.send({ type: 'bullet-shot', message: bulletData })
    }

    startGame() {
        this.player = new Player(this.room, new URL("/src/imgs/spaceship_sprite.png", import.meta.url).toString());
        this.camera.addChild(this.player);

        const g = new Graphics();
        starsBackground(g);
        this.camera.addChild(g);

        let counter = 0;
        const fireRate = 5;
        let time = fireRate;

        this.app.ticker.add((dt) => {
            for (const child of this.camera.children) {
                if (isIUpdate(child)) {
                    child.update(dt);
                }
            }
            this.checkPlayerBulletsCollision();
            const desiredZoom = Math.min(0.6, SPEED_ZOOM_FACTOR / this.player.velocity.length);
            this.camera.desiredZoom = desiredZoom;
            const mousePos = Controls.instance.mouse.position;

            const MOUSE_FACTOR = 0.4;
            const cameraOffset = {
                x: this.player.x + this.player.velocity.x / 20 + (mousePos.x - WINDOW_WIDTH / 2) * MOUSE_FACTOR,
                y: this.player.y + this.player.velocity.y / 20 + (mousePos.y - WINDOW_HEIGHT / 2) * MOUSE_FACTOR,
            };
            const desiredPos = new Vector((WINDOW_WIDTH / 2 - cameraOffset.x * desiredZoom), (WINDOW_HEIGHT / 2 - cameraOffset.y * desiredZoom));
            this.camera.desiredPosition.x = desiredPos.x;
            this.camera.desiredPosition.y = desiredPos.y;

            time -= dt;
            if (Controls.instance.mouse.pressed && time < 0) {
                time = fireRate;
                this.playerShoot(counter)

                counter++;
            }
            this.camera.update(dt);
        });
    };

}
