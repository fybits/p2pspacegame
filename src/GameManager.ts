import { Application, Assets, Graphics, Texture, TilingSprite } from 'pixi.js';
import { PeerRoom } from './PeerRoom';
import { Vector } from './utils/Vector';
import Controls, { KeyState } from './Controls';
import Player from './game-objects/Player';
import Bullet from './game-objects/Bullet';
import Camera from './game-objects/Camera';
import { isIUpdate } from './game-objects/IUpdate';
import { AssetKey, SPEED_ZOOM_FACTOR, WINDOW_HEIGHT, WINDOW_WIDTH } from './consts';
import { sortedClamp } from './utils';
import Enemy from './game-objects/Enemy';
import UI from './game-objects/UI';


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
    private ui: UI;
    private room: PeerRoom;

    private cameraFollowAllMode = false
    private fullscreen = false

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
            enemy.d.x = message.d.x;
            enemy.d.y = message.d.y;
            enemy.engine = message.engine;
            enemy.speed = message.speed;
        } else {
            const enemy = new Enemy(AssetKey.Spaceship);
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
        );
        this.bullets.push(bullet);
        this.camera.addChild(bullet);
    }

    onBulletCollided(message) {
        const bulletIndex = this.bullets.findIndex((b) => b.id === message.id && b.owner === message.owner);
        const deletedBullet = this.bullets.splice(bulletIndex, 1);
        if (deletedBullet[0]) deletedBullet[0].destroy();
    }

    private checkPlayerBulletsCollision() {
        for (const b of this.bullets) {
            if (b.owner !== this.room.address()
                && Vector.distance(new Vector(this.player.x, this.player.y), new Vector(b.x, b.y)) < 40) {
                this.room.send({ type: 'bullet-collided', message: { owner: b.owner, id: b.id } })
                this.onBulletCollided({ owner: b.owner, id: b.id });
                this.player.health -= 5;
                if (Math.random() < 0.1 - (this.player.health / 1000)) {
                    this.player.gyroBroken = true;
                }
                if (Math.random() < 0.1 - (this.player.health / 1000)) {
                    this.player.rcsBroken = true;
                }
                if (Math.random() < 0.05 - (this.player.health / 1000)) {
                    this.player.engBroken = true;
                }
                if (this.player.health < 0) {
                    this.player.x = 0;
                    this.player.y = 0;
                    this.player.velocity = new Vector(0, 0);
                    this.player.health = 100;
                    this.player.rotation = 0;
                    this.player.gyroBroken = false;
                    this.player.rcsBroken = false;
                    this.player.engBroken = false;
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
        const bulletVelocity = new Vector(dirClamped.x * 50000 + this.player.velocity.x, dirClamped.y * 50000 + this.player.velocity.y);
        const bulletData = { id: counter, position: bulletPos, angle: bulletAngle, velocity: bulletVelocity };
        this.onBulletShot(this.room.address(), bulletData);
        this.room.send({ type: 'bullet-shot', message: bulletData })
    }

    async loadAssets() {
        Assets.add(({ alias: AssetKey.Spaceship, src: new URL("/src/imgs/spaceship_sprite.png", import.meta.url).toString() }));
        Assets.add(({ alias: AssetKey.Bullet, src: new URL("/src/imgs/long-ray.png", import.meta.url).toString() }));
        Assets.add(({ alias: AssetKey.Jet, src: new URL("/src/imgs/jet.png", import.meta.url).toString() }));
        await Assets.load([AssetKey.Spaceship, AssetKey.Bullet, AssetKey.Jet]);
    }


    async startGame() {
        // Preload textures
        await this.loadAssets();

        this.player = new Player(this.room, AssetKey.Spaceship);

        this.camera.addChild(this.player);

        const g = new Graphics();
        starsBackground(g);
        this.camera.addChild(g);
        this.camera.setChildIndex(g, 0);

        let counter = 0;
        const fireRate = 5;
        let time = fireRate;

        this.ui = new UI(this.app.screen, this);
        this.app.stage.addChild(this.ui);

        this.app.ticker.add((dt) => {
            this.ui.update(this.app.ticker.deltaMS);

            for (const child of this.camera.children) {
                if (isIUpdate(child)) {
                    child.update(dt);
                }
            }
            this.checkPlayerBulletsCollision();

            if (Controls.instance.keyboard.get('tab') === KeyState.PRESSED) {
                console.log('change follow mode')
                this.cameraFollowAllMode = !this.cameraFollowAllMode;
            }

            if (Controls.instance.keyboard.get('f') === KeyState.PRESSED) {
                console.log('change follow mode')
                this.fullscreen = !this.fullscreen;
                if (this.fullscreen) {
                    document.querySelector('canvas')?.requestFullscreen();
                    this.app.screen.width = window.screen.width;
                    this.app.screen.height = window.screen.height;
                    this.app.view.width = window.screen.width;
                    this.app.view.height = window.screen.height;
                } else {
                    document.exitFullscreen();
                    this.app.screen.width = WINDOW_WIDTH;
                    this.app.screen.height = WINDOW_HEIGHT;
                    this.app.view.width = WINDOW_WIDTH;
                    this.app.view.height = WINDOW_HEIGHT;
                }
                this.ui.redrawGUI()
            }

            const MOUSE_FACTOR = 0.4;
            const mousePos = Controls.instance.mouse.position;

            let desiredZoom = Math.max(0.4, Math.min(0.6, SPEED_ZOOM_FACTOR / this.player.velocity.length));
            let desiredPos = new Vector(0, 0);

            const WIDTH = this.app.screen.width;
            const HEIGHT = this.app.screen.height;

            if (this.cameraFollowAllMode) {
                const playersList: (Player | Enemy)[] = Array.from(this.enemies.values());
                playersList.push(this.player);

                const minX = playersList.reduce((min, cur) => cur.position.x < min ? cur.position.x : min, 9999999);
                const maxX = playersList.reduce((max, cur) => cur.position.x > max ? cur.position.x : max, -9999999);
                const minY = playersList.reduce((min, cur) => cur.position.y < min ? cur.position.y : min, 9999999);
                const maxY = playersList.reduce((max, cur) => cur.position.y > max ? cur.position.y : max, -9999999);

                const desiredZoomX = WIDTH * 0.7 / (maxX - minX);
                const desiredZoomY = HEIGHT * 0.7 / (maxY - minY);
                desiredZoom = Math.min(0.8, desiredZoomX, desiredZoomY);

                const averageX = playersList.reduce((acc, cur) => cur.position.x + acc, 0) / playersList.length + (mousePos.x - WIDTH / 2) * MOUSE_FACTOR;
                const averageY = playersList.reduce((acc, cur) => cur.position.y + acc, 0) / playersList.length + (mousePos.y - HEIGHT / 2) * MOUSE_FACTOR;
                desiredPos = new Vector((WIDTH / 2 - averageX * desiredZoom), (HEIGHT / 2 - averageY * desiredZoom));
            } else {
                const cameraOffset = {
                    x: this.player.x + this.player.velocity.x * desiredZoom / 20 + (mousePos.x - WIDTH / 2) * MOUSE_FACTOR,
                    y: this.player.y + this.player.velocity.y * desiredZoom / 20 + (mousePos.y - HEIGHT / 2) * MOUSE_FACTOR,
                };
                desiredPos = new Vector((WIDTH / 2 - cameraOffset.x * desiredZoom), (HEIGHT / 2 - cameraOffset.y * desiredZoom));
            }

            this.camera.desiredPosition.x = desiredPos.x;
            this.camera.desiredPosition.y = desiredPos.y;
            this.camera.desiredZoom = desiredZoom;

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
