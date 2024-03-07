import { Container, Sprite, Texture, TilingSprite } from "pixi.js";
import { Vector } from "../utils/Vector";
import Controls from "../Controls";
import IUpdate from "./IUpdate";

const speed = 150;

export default class Enemy extends Container implements IUpdate {
    velocity: Vector;
    health: number;
    graphics: Sprite;
    private healthBar: TilingSprite;
    d: Vector;

    private jetL: Sprite;
    private jetR: Sprite;

    constructor(imageURL: string) {
        super();
        this.velocity = new Vector(0, 0);
        this.d = new Vector(0, 0);

        this.graphics = new Sprite(Texture.from(imageURL));
        this.graphics.anchor.x = 0.5;
        this.graphics.anchor.y = 0.5;
        this.graphics.tint = 0xff0000;
        this.addChild(this.graphics);

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

        this.jetL.scale.y = -0.4 * this.d.y + 0.1 + this.d.x * 0.1;
        this.jetR.scale.y = -0.4 * this.d.y + 0.1 - this.d.x * 0.1;
        this.jetL.alpha = 0.75 + Math.random() / 4;
        this.jetR.alpha = 0.75 + Math.random() / 4;


        this.x = this.x + this.velocity.x * dt / 1000;
        this.y = this.y + this.velocity.y * dt / 1000;
        this.healthBar.width = this.health * 1.5;
    }
}