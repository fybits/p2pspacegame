import { AnimatedSprite, Assets, Container, Sprite, Spritesheet, Texture, TilingSprite } from "pixi.js";
import { Vector } from "../utils/Vector";
import Controls, { KeyState } from "../Controls";
import { PeerRoom } from "../PeerRoom";
import IUpdatable from "./IUpdate";
import { SPEED, AFTERBURNER_SPEED, MAX_AFTERBURNER, SPEED_DAMPENING, RCS_DAMPENING, AssetKey } from "../consts";

const SHIELD_ALPHA = 0.15;
export default class Player extends Container implements IUpdatable {
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
    shieldOn: boolean = true;
    speed: number = SPEED;
    afterburner: number = 100;
    controlled = false;
    input: Vector;

    private shield: AnimatedSprite;
    private jetL: Sprite;
    private jetR: Sprite;
    private _room: PeerRoom;
    private healthBar: TilingSprite;

    private damageTaken = false;

    constructor(room: PeerRoom, controlled: boolean = false) {
        super();
        this._room = room;
        this.velocity = new Vector(0, 0);
        this.input = new Vector(0, 0);
        this.controlled = controlled;

        const texture = Texture.from(AssetKey.Spaceship);
        texture.rotate = 2;
        const playerSprite = new Sprite(texture);
        this.graphics = playerSprite;
        this.graphics.anchor.x = 0.5;
        this.graphics.anchor.y = 0.5;
        if (!controlled)
            this.graphics.tint = 0xff0000;
        this.addChild(this.graphics)

        const jetTexture = Texture.from(AssetKey.Jet);
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

        const bulletTexture = Texture.from(AssetKey.Bullet);
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

        this.shield = new AnimatedSprite(Assets.get<Spritesheet>('shield').animations['default']);
        this.shield.anchor.x = 0.48;
        this.shield.anchor.y = 0.5;
        this.shield.scale.x = 2;
        this.shield.scale.y = 1.6;
        this.shield.alpha = SHIELD_ALPHA;
        this.shield.animationSpeed = 0.1;
        this.graphics.addChild(this.shield);
        this.shield.play()
    }

    takeDamage() {
        this.damageTaken = true;
        if (this.shieldOn)
            this.shield.alpha = 0.5;
    }

    update(dt: number) {
        if (this.controlled) {
            this.input = new Vector(0, 0);
            if (Controls.instance.keyboard.get('w') === KeyState.HELD)
                this.input.y += - 1;
            if (Controls.instance.keyboard.get('a') === KeyState.HELD)
                this.input.x += -1;
            if (Controls.instance.keyboard.get('s') === KeyState.HELD)
                this.input.y += 1;
            if (Controls.instance.keyboard.get('d') === KeyState.HELD)
                this.input.x += 1;

            if (Controls.instance.keyboard.get(' ') === KeyState.HELD && this.afterburner > 0) {
                if (this.afterburner > 1) {
                    this.speed = AFTERBURNER_SPEED;
                }
                this.afterburner -= dt / 2;
            } else {
                this.speed = SPEED;
                if (this.afterburner < MAX_AFTERBURNER)
                    this.afterburner += dt / 4;
            }

            if (Controls.instance.keyboard.get('e') === KeyState.PRESSED) {
                this.engOn = !this.engOn;
            }

            if (Controls.instance.keyboard.get('r') === KeyState.PRESSED) {
                this.rcsOn = !this.rcsOn;
            }

            if (Controls.instance.keyboard.get('g') === KeyState.PRESSED) {
                this.gyroOn = !this.gyroOn;
            }

            if (Controls.instance.keyboard.get('h') === KeyState.PRESSED) {
                this.shieldOn = !this.shieldOn;
                console.log(this.shieldOn)
            }
        }

        if (this.shieldOn) {
            if (this.shield.alpha < SHIELD_ALPHA)
                this.shield.alpha = SHIELD_ALPHA;
            if (this.damageTaken && this.shield.alpha > SHIELD_ALPHA) {
                this.shield.alpha -= dt / 40;
            } else {
                this.damageTaken = false;
            }
        } else {
            this.shield.alpha = 0;
        }


        this.jetL.scale.y = -0.4 * this.input.y * this.speed / SPEED + this.input.x * 0.1 + Math.random() / 20 + 0.1;
        this.jetR.scale.y = -0.4 * this.input.y * this.speed / SPEED - this.input.x * 0.1 + Math.random() / 20 + 0.1;
        this.jetL.alpha = 0.75 + Math.random() / 4;
        this.jetR.alpha = 0.75 + Math.random() / 4;

        if (this.input.x && this.engOn && !this.engBroken) {
            this.angularVelocity = this.angularVelocity - this.angularVelocity * 0.01 * dt + this.input.x * dt * 0.1;
        } else if (this.gyroOn && !this.gyroBroken) {
            this.angularVelocity -= this.angularVelocity * 0.2 * dt;
        }

        if (!this.engOn || this.engBroken) {
            this.jetL.alpha = 0;
            this.jetR.alpha = 0;
        }

        this.graphics.angle = (this.graphics.angle + this.angularVelocity * dt) % 360;
        this.healthBar.width = this.health * 1.5;

        if (this.input.y && this.engOn && !this.engBroken) {
            this.velocity = new Vector(
                this.velocity.x - this.velocity.x * SPEED_DAMPENING * dt + this.speed * this.input.y * dt * Math.cos(this.graphics.rotation),
                this.velocity.y - this.velocity.y * SPEED_DAMPENING * dt + this.speed * this.input.y * dt * Math.sin(this.graphics.rotation)
            );
        } else if (this.rcsOn && !this.rcsBroken && this.engOn && !this.engBroken) {
            this.velocity = new Vector(this.velocity.x - this.velocity.x * RCS_DAMPENING * dt, this.velocity.y - this.velocity.y * RCS_DAMPENING * dt);
        }
        this.x = this.x + this.velocity.x * dt / 1000;
        this.y = this.y + this.velocity.y * dt / 1000;

        if (this.controlled) {
            this._room.send({
                type: 'player-state',
                message: {
                    position: { x: this.x, y: this.y },
                    angle: this.graphics.angle,
                    health: this.health,
                    input: { x: this.input.x, y: this.input.y },
                    engine: !this.engBroken && this.engOn,
                    speed: this.speed,
                }
            })
        }
    }
}