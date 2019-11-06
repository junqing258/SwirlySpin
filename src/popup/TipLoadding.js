import { createSkeleton } from "utils/util";

const { Sprite, Event, Handler } = Laya;

export default class TipLoadding extends Laya.Sprite {

    constructor() {
        super();
        this.zOrder = 101;
        this.on(Event.MOUSE_DOWN, this, event=> event.stopPropagation());
    }

    static getInstance() {
        if (!this.instance||this.instance.destroyed) this.instance = new this();
        return this.instance;
    }

    show() {
        if (this.showed) return;
        this.showed = true;
        let stage = Laya.stage;
        let maskLayer = this.maskLayer = new Sprite();
        this.size(stage.width, stage.height);
        maskLayer.graphics.drawRect(0, 0, stage.width, stage.height, "#000000");
        maskLayer.alpha = 0.6;
        this.addChild(maskLayer);

        let ani = this.ani = createSkeleton("ani/tip_loadding");
        ani.pos(stage.width/2+100, stage.height/2);
        this.addChild(ani);
        ani.play(0, true);
        
        Laya.stage.addChild(this);
    }

    hide() {
        if (this.showed) {
            this.destroy();
            this.showed = false;
        }
    }

}