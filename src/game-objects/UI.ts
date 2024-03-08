import { Application, Assets, Container, Graphics, Rectangle, Sprite, Text, Texture } from "pixi.js";
import { Vector } from "../utils/Vector";
import IUpdate from "./IUpdate";
import GameManager from "../GameManager";

const speed = 150;

export default class UI extends Container implements IUpdate {
    private gameManager: GameManager;
    private screen: Rectangle;
    private timer: number = 0;


    positionText = new Text();
    velText = new Text();
    engText = new Text();
    rcsText = new Text();
    gyroText = new Text();

    afterburnerFuel = new Graphics();


    constructor(screen: Rectangle, gameManager: GameManager) {
        super();
        this.gameManager = gameManager;
        this.screen = screen;

        this.velText.anchor.x = 0.5;
        this.velText.style.fill = '#fff';
        this.velText.style.fontFamily = 'Consolas, sans-serif'
        this.velText.style.fontWeight = 'bold';
        this.addChild(this.velText);

        this.engText.text = "[x] ENG";
        this.engText.style.fill = '#0f0';
        this.engText.style.fontFamily = 'Consolas, sans-serif'
        this.engText.style.fontWeight = 'bold';
        this.addChild(this.engText);

        this.rcsText.text = "[x] RCS";
        this.rcsText.style.fill = '#0f0';
        this.rcsText.style.fontFamily = 'Consolas, sans-serif'
        this.rcsText.style.fontWeight = 'bold';
        this.addChild(this.rcsText);

        this.gyroText.text = "[x] GYRO";
        this.gyroText.style.fill = '#0f0';
        this.gyroText.style.fontFamily = 'Consolas, sans-serif'
        this.gyroText.style.fontWeight = 'bold';
        this.addChild(this.gyroText);

        this.positionText.text = "";
        this.positionText.style.fill = '#fff';
        this.positionText.style.fontFamily = 'Consolas, sans-serif'
        this.positionText.style.fontWeight = 'bold';
        this.addChild(this.positionText);

        this.addChild(this.afterburnerFuel)
        this.redrawGUI()

    }

    redrawGUI() {
        this.velText.x = this.screen.width / 2;
        this.velText.y = this.screen.height - 40;

        this.engText.x = this.screen.width / 2 + this.screen.width / 12;
        this.engText.y = this.screen.height - 100;
        this.rcsText.x = this.screen.width / 2 + this.screen.width / 12;
        this.rcsText.y = this.screen.height - 70;
        this.gyroText.x = this.screen.width / 2 + this.screen.width / 12;
        this.gyroText.y = this.screen.height - 40;

        this.positionText.x = this.screen.left + 30;
        this.positionText.y = this.screen.top + 30;

        this.afterburnerFuel.x = this.screen.width / 2 - this.screen.width / 12;
        this.afterburnerFuel.y = this.screen.height - 120;

    }

    update(dtMS: number) {
        this.velText.text = this.gameManager.player.velocity.length.toFixed(0);
        this.positionText.text = `${this.gameManager.player.x.toFixed()}  ${this.gameManager.player.y.toFixed()}`;

        this.afterburnerFuel.clear();
        this.afterburnerFuel.beginFill(0x00ff00);
        this.afterburnerFuel.drawRect(0, 100 - this.gameManager.player.afterburner, 20, this.gameManager.player.afterburner);
        this.afterburnerFuel.endFill();

        this.timer += dtMS;
        const animStep = Math.round(this.timer / 500) % 2;

        if (this.gameManager.player.engBroken) {
            if (animStep) {
                this.engText.text = "[!] ENG";
            } else {
                this.engText.text = "[ ] ENG";
            }
            this.engText.style.fill = '#f00';
        } else if (this.gameManager.player.engOn) {
            this.engText.text = "[x] ENG";
            this.engText.style.fill = '#0f0';
        } else {
            this.engText.text = "[ ] ENG";
            this.engText.style.fill = '#f00';
        }
        if (this.gameManager.player.rcsBroken) {
            if (animStep) {
                this.rcsText.text = "[!] RCS";
            } else {
                this.rcsText.text = "[ ] RCS";
            }
            this.rcsText.style.fill = '#f00';
        } else if (this.gameManager.player.rcsOn) {
            this.rcsText.text = "[x] RCS";
            this.rcsText.style.fill = '#0f0';
        } else {
            this.rcsText.text = "[ ] RCS";
            this.rcsText.style.fill = '#f00';
        }
        if (this.gameManager.player.gyroBroken) {
            if (animStep) {
                this.gyroText.text = "[!] GYRO";
            } else {
                this.gyroText.text = "[ ] GYRO";
            }
            this.gyroText.style.fill = '#f00';
        } else if (this.gameManager.player.gyroOn) {
            this.gyroText.text = "[x] GYRO";
            this.gyroText.style.fill = '#0f0';
        } else {
            this.gyroText.text = "[ ] GYRO";
            this.gyroText.style.fill = '#f00';
        }
    }
}