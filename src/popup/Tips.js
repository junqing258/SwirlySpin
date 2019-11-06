
const { Stage, Sprite, Image, Event, Handler, Text, Tween, Ease, Browser } = Laya;

let queue = [];
export default class Tips extends Laya.Sprite {

    constructor() {
        super();
        this.init();
    }
    
    static getInstance() {
        if (!this.instance || this.instance.destroyed) this.instance = new this();
        return this.instance;
    }

    init() {
        this.bg = new Laya.Sprite();
        this.bg.graphics.drawRoundRect(0, 0, 534, 100, 10, "#000000");
        this.bg.alpha = 0.6;
        this.addChild(this.bg);
        this.msgTxt = new Text();
        this.msgTxt.set({ color: "#ffed74", fontSize: 36, y: 30, font: "SimHei", width: 534, align: "center", wordWrap: false });
        this.addChild(this.msgTxt);
    }

    show(msg) {
        if (this.showed) return queue.push(msg);
        this.showed = true;
		this._show(msg);
    }

    popup(msg) {
        return this.show(msg);
    }

    _show(msg) {
        let stage = Laya.stage;
        this.msgTxt.text = msg;
        this.size(534/2, 100/2);
        this.pivot(534/2, 100/2);
        this.pos(stage.width/2, stage.height/2);
		this.set({ scaleX: 0.5, scaleY: 0.5, alpha: 0.7 });
		Tween.to(this,  { scaleX: 1, scaleY: 1, alpha: 1 }, 250, Ease.backOut);
		let maskLayer = this.maskLayer = new Sprite();
		maskLayer.zOrder = 1990;
		this.zOrder = 1991;
		stage.addChildren(maskLayer, this);
        maskLayer.on(Event.MOUSE_DOWN, this, () => {} );

        this.resizable(()=> {
            maskLayer.size(stage.width, stage.height);
        });

		this.timer.once(2500, this, () => this.hide() );
    }

    hide() {
        Tween.to(this, { scaleX: 0.5, scaleY: 0.5, alpha: 0.7 }, 150,  Ease.sineIn, Handler.create(this, () => {
			this.maskLayer.destroy();
			this.maskLayer = null;
			this.removeSelf();
			this.showed = false;
			if (queue.length>0) {
                for (let i=0,len=queue.length; i< len; i++) {
                    let msg = queue.shift();
                    if (this.msgTxt.text!==msg) {
                        return Laya.timer.once(800, this, ()=> this.show(msg) );
                    } 
                }
			}
		}));
    }

}