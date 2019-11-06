import { PubSub, subscribeStore, getDataByKey } from "ctrl/playCtrl";
import { sineOut, quarticOut } from "utils/util";


export default class WinCoins extends Laya.Sprite {

	static getInstance() {
		if (!this.instance||this.instance.destroyed) this.instance = new this();
		return this.instance;
    }

    show(cb) {
		let winAll = getDataByKey("winAll");
		if (!winAll) return (typeof cb==="function" && cb() );
		this.count = 0;
		this.cb = cb;
		PubSub.event("WIN_COINS");
		Laya.timer.once(550, this, ()=> {
			Laya.timer.frameLoop(5, this, this.playCoin);
		});
	}

	playCoin() {
		if (this.count++===10) {
			Laya.timer.clear(this, this.playCoin);
			Laya.timer.once(500, this, ()=> {
				if (typeof this.cb==="function") this.cb();
			});
			return;
		}
		let coinsAni = new Laya.Animation();
        coinsAni.zOrder = 20;
        coinsAni.scale(0.9, 0.9);
		coinsAni.loadAtlas("res/atlas/wincoins.atlas");
		coinsAni.interval = 16*1;
		Laya.stage.addChild(coinsAni);
		coinsAni.play();

		let x0 = 776, y0 = Laya.stage.height-90, x2 = 392, y2 = 25;
        let x1 = 818, y1 = 150;
        coinsAni.pos(x0, y0);

		let t = 0;
		let tick = function() {
			if (t>=1) {
				coinsAni.destroy();
				return Laya.timer.clear(null, tick);
            }
            let z = sineOut(t);
			let x = Math.pow(1-z, 2)*x0 + 2*z*(1-z)*x1 + Math.pow(z,2)*x2;
			let y = Math.pow(1-z, 2)*y0 + 2*z*(1-z)*y1 + Math.pow(z,2)*y2;
			if (z>0.6)  {
				let sc = (1.6-z)*0.9;
				coinsAni.set( { scaleX: sc, scaleY: sc } );
			}
			coinsAni.pos(x, y);
			t += 1/30;
		};
		Laya.timer.frameLoop(1, null, tick);
	}
    
}