import { Container, Sprite, Texture, TilingSprite } from "pixi.js";
import { Vector } from "../utils/Vector";
import Controls, { KeyState } from "../Controls";
import { PeerRoom } from "../PeerRoom";
import IUpdate from "./IUpdate";
import { SPEED, AFTERBURNER_SPEED, MAX_AFTERBURNER, SPEED_DAMPENING, RCS_DAMPENING } from "../consts";

export default class Player extends Container implements IUpdate {
    health = 100;
    velocity: Vector;
    angularVelocity: number = 0;
    graphics: Sprite;
    engOn: boolean = true;
    engBroken: boolean = false;
    rcsOn: boolean = true;
    rcsBroken: boolean = false;
    gyroOn: boolean = true;
    gyroBroken: boolean = false;
    speed: number = SPEED;
    afterburner: number = 100;

    private jetL: Sprite;
    private jetR: Sprite;
    private _room: PeerRoom;
    private healthBar: TilingSprite;

    constructor(room: PeerRoom, imageURL: string) {
        super();
        this._room = room;
        this.velocity = new Vector(0, 0);

        const texture = Texture.from(imageURL);
        texture.rotate = 2;
        const playerSprite = new Sprite(texture);
        this.graphics = playerSprite;
        this.graphics.anchor.x = 0.5;
        this.graphics.anchor.y = 0.5;
        this.addChild(this.graphics)

        const jetTexture = Texture.from(new URL("/src/imgs/jet.png", import.meta.url).toString());
        this.jetL = new Sprite(jetTexture);
        this.jetL.angle = -90;
        this.jetL.anchor.x = 0.5;
        this.jetL.anchor.y = 0;
        this.jetL.x = 50;
        this.jetL.y = 35;
        this.jetL.scale.set(0.4, 0.5);
        this.graphics.addChild(this.jetL);

        this.jetR = new Sprite(jetTexture);
        this.jetR.angle = -90;
        this.jetR.anchor.x = 0.5;
        this.jetR.anchor.y = 0;
        this.jetR.x = 50;
        this.jetR.y = -35;
        this.jetR.scale.set(0.4, 0.5);
        this.graphics.addChild(this.jetR);

        const bulletTexture = Texture.from(new URL("/src/imgs/long-ray.png", import.meta.url).toString());
        this.healthBar = new TilingSprite(bulletTexture, this.health * 1.5, 16);
        this.healthBar.tileScale = { x: 0.2, y: 0.1 };
        this.healthBar.position = { x: -75, y: -90 };
        this.healthBar.anchor.x = 0;
        this.healthBar.anchor.y = 0.5;
        this.healthBar.tint = 0x00ff00;
        const healthBarBackground = new TilingSprite(bulletTexture, 150, 16);
        healthBarBackground.tileScale = { x: 0.2, y: 0.1 };
        healthBarBackground.position = { x: -75, y: -94 };
        healthBarBackground.anchor.x = 0;
        healthBarBackground.anchor.y = 0.5;
        healthBarBackground.tint = 0xff0000;
        this.addChild(healthBarBackground);
        this.addChild(this.healthBar);
    }

    update(dt: number) {
        const d: Vector = new Vector(0, 0);
        if (Controls.instance.keyboard['w'] === KeyState.HELD)
            d.y += - 1;
        if (Controls.instance.keyboard['a'] === KeyState.HELD)
            d.x += -1;
        if (Controls.instance.keyboard['s'] === KeyState.HELD)
            d.y += 1;
        if (Controls.instance.keyboard['d'] === KeyState.HELD)
            d.x += 1;

        if (Controls.instance.keyboard[' '] === KeyState.HELD && this.afterburner > 0) {
            if (this.afterburner > 1) {
                this.speed = AFTERBURNER_SPEED;
            }
            this.afterburner -= dt / 2;
        } else {
            this.speed = SPEED;
            if (this.afterburner < MAX_AFTERBURNER)
                this.afterburner += dt / 4;
        }

        if (Controls.instance.keyboard['e'] === KeyState.PRESSED) {
            this.engOn = !this.engOn;
        }

        if (Controls.instance.keyboard['r'] === KeyState.PRESSED) {
            this.rcsOn = !this.rcsOn;
        }

        if (Controls.instance.keyboard['g'] === KeyState.PRESSED) {
            this.gyroOn = !this.gyroOn;
        }

        this.jetL.scale.y = -0.4 * d.y * this.speed / SPEED + d.x * 0.1 + Math.random() / 20 + 0.1;
        this.jetR.scale.y = -0.4 * d.y * this.speed / SPEED - d.x * 0.1 + Math.random() / 20 + 0.1;
        this.jetL.alpha = 0.75 + Math.random() / 4;
        this.jetR.alpha = 0.75 + Math.random() / 4;

        if (d.x && this.engOn && !this.engBroken) {
            this.angularVelocity = this.angularVelocity - this.angularVelocity * 0.01 * dt + d.x * dt * 0.1;
        } else if (this.gyroOn && !this.gyroBroken) {
            this.angularVelocity -= this.angularVelocity * 0.1 * dt;
        }

        if (!this.engOn || this.engBroken) {
            this.jetL.alpha = 0;
            this.jetR.alpha = 0;
        }

        this.graphics.angle = (this.graphics.angle + this.angularVelocity * dt) % 360;
        this.healthBar.width = this.health * 1.5;

        if (d.y && this.engOn && !this.engBroken) {
            this.velocity = new Vector(
                this.velocity.x - this.velocity.x * SPEED_DAMPENING * dt + this.speed * d.y * dt * Math.cos(this.graphics.rotation),
                this.velocity.y - this.velocity.y * SPEED_DAMPENING * dt + this.speed * d.y * dt * Math.sin(this.graphics.rotation)
            );
        } else if (this.rcsOn && !this.rcsBroken && this.engOn && !this.engBroken) {
            this.velocity = new Vector(this.velocity.x - this.velocity.x * RCS_DAMPENING * dt, this.velocity.y - this.velocity.y * RCS_DAMPENING * dt);
        }
        this.x = this.x + this.velocity.x * dt / 1000;
        this.y = this.y + this.velocity.y * dt / 1000;

        this._room.send({
            type: 'player-state',
            message: {
                position: { x: this.x, y: this.y },
                angle: this.graphics.angle,
                health: this.health,
                d: { x: d.x, y: d.y },
                engine: !this.engBroken && this.engOn,
                speed: this.speed,
            }
        })
    }
}