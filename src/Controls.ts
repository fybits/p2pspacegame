import { Vector } from "./utils/Vector";


export class Controls {
    public keyboard: Map<string, number>;
    public mouse: { position: Vector, pressed: boolean };

    static _instance: Controls
    static get instance() {
        if (Controls._instance) {
            return Controls._instance;
        }
        throw new Error("Controls is not created!");
    }


    private keyDown(event: KeyboardEvent) {
        Controls.instance.keyboard[event.key] = 1;
        // if (event.key === 'Tab') {
        //   event.preventDefault();
        //   setCameraMode(!cameraMode);
        // }
    }

    private keyUp(event: KeyboardEvent) {
        Controls.instance.keyboard[event.key] = 0;
        // if (event.key === 'f' && stageRef.current) {
        //   if (!fullscreen) {
        //     setFullscreen(true)
        //     stageRef.current._canvas.requestFullscreen();
        //   } else {
        //     setFullscreen(false)
        //     document.exitFullscreen();
        //   }
        // }
    }

    private mouseMove(event) {
        var rect = event.target.getBoundingClientRect();
        Controls.instance.mouse.position = new Vector(event.clientX - rect.left, event.clientY - rect.top);
    }

    private mouseDown(event: MouseEvent) {
        if (event.button === 0) {
            Controls.instance.mouse.pressed = true;
        }
    }

    private mouseUp(event: MouseEvent) {
        if (event.button === 0) {
            Controls.instance.mouse.pressed = false;
        }
    }


    constructor(parent: HTMLElement) {
        this.keyboard = new Map();
        this.mouse = { position: new Vector(0, 0), pressed: false };
        parent.addEventListener("keydown", (e) => this.keyDown(e));
        parent.addEventListener("keyup", this.keyUp);
        parent.addEventListener("mousemove", this.mouseMove);
        parent.addEventListener("mousedown", this.mouseDown);
        parent.addEventListener("mouseup", this.mouseUp);
        Controls._instance = this;
    }
}