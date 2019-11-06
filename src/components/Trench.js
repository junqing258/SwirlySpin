
import { OFFSET_TRENCH, SYMB_WIDTH, SYMB_HEIGHT  } from "const/config";
import { LAYOUT, BR_POINTS} from "const/config";
import { subscribeStore } from "ctrl/playCtrl";
import { createSkeleton } from "utils/util";

const { Event } = Laya;

const Hsize = SYMB_WIDTH/2;

let keyPoints = Object.keys(OFFSET_TRENCH).map(v=> Number(v)).sort((a,b)=> a-b);

export default class Trench extends Laya.Sprite {

    static getInstance() {
		if (!this.instance||this.instance.destroyed) this.instance = new this();
		return this.instance;
	}

    constructor() {
        super();
        this.loadImage("board/trench.png");

        let mask = new Laya.Sprite();
        mask.x = 45;
        this.mask = mask;

        let trenchSparkle = this.trenchSparkle = createSkeleton("ani/trend_spark");
        this.once(Event.ADDED, this, () => {
            this.trenchSparkle.x = this.x;
            this.trenchSparkle.y = this.y;
            this.trenchSparkle.pivot(58 / 2, 0);
            this.parent.addChild(trenchSparkle);
            trenchSparkle.play(0, true);
            this.updateMask(1);
        });

        subscribeStore("gameStatus", (data)=> {
            switch (data) {
                case "PLAY_START":
                    this.updateMask(1);
                    break;
                case "PLAY_ING":
                    break;
            }
        }, this);
    }

    // destroy() {}

    updateMask(p) {
        let mask = this.mask;
        if (!(p>1)) {
            this.trenchSparkle.visible = this.visible = false;
            return;
        } else {
            this.trenchSparkle.visible = this.visible = true;
        }
        mask.graphics.clear();

        if (p > 0) {
            let t = Math.min(3, p - 1) * 2*Hsize;
            mask.graphics.drawLine(0, 600, 0, 600-t-141, "#000", 2*Hsize);
        }
        if (p > 4) {
            let r = Math.min(2, p - 4) * 45;
            mask.graphics.drawPie(Hsize, 2*Hsize, 2*Hsize, 180, 180 + r, "#000");
        }
        if (p >= 6) {
            let t = Math.min(2, p - 6) * 2*Hsize;
            mask.graphics.drawLine(Hsize-1, Hsize, Hsize + t, Hsize, "#000", 2*Hsize);
        }
        if (p > 8) {
            let r1 = Math.min(2, p - 8) * 45;
            mask.graphics.drawPie(5*Hsize, 2*Hsize, 2*Hsize, 270, 270 + r1, "#000");
        }
        if (p >= 10) {
            let t = Math.min(2, p - 10) * 2*Hsize;
            mask.graphics.drawLine(6*Hsize, 2*Hsize-1, 6*Hsize, 2*Hsize + t, "#000", 2*Hsize);
        }
        if (p > 12) {
            let r = Math.min(2, p - 12) * 45;
            mask.graphics.drawPie(5*Hsize, 6*Hsize, 2*Hsize, 0, r, "#000");
        }
        if (p >= 14) {
            let t = Math.min(1.25, p - 14) * 2*Hsize;
            mask.graphics.drawLine(5*Hsize, 7*Hsize, 5*Hsize - t, 7*Hsize, "#000", 2*Hsize);
        }
        if (p > 15) {
            let r = Math.min(2, p - 15) * 45;
            mask.graphics.drawPie(2.75*Hsize, 6*Hsize, 2*Hsize, 90, 90 + r, "#000");
        }
        if (p > 17) {
            let t = Math.min(1.2, p - 17) * 2*Hsize;
            mask.graphics.drawLine(2*Hsize, 6*Hsize, 2*Hsize, 6*Hsize - t, "#000", 2*Hsize);
        }
        if (p > 18) {
            let r = Math.min(8, p - 18) * 45;
            mask.graphics.drawPie(3*Hsize, 4*Hsize, 2*Hsize, 180, 180 + r, "#000");
        }
        this.number = p;
        this._aniTrenchSparkle(p);
    }

    _aniTrenchSparkle(p) {
        if (p>23) return;
        let { x, y } = this._getTrenchSparklePos(p);
        this.trenchSparkle.x = x + this.x + 33 -116;
        this.trenchSparkle.y = y + 58 - 63;
    }

    _getTrenchSparklePos(p) {
        let x, y;
        let i = keyPoints.findIndex(v=> v>=p) - 1;
        let m0 = keyPoints[i], m1 = keyPoints[i+1];
        let t0 = OFFSET_TRENCH[m0], t1 = OFFSET_TRENCH[m1];
        let cf = (p - m0)/(m1 - m0);
        x = t0[0] + (t1[0] - t0[0])* cf;
        y = t0[1] + (t1[1]- t0[1])* cf;
        return { x, y };
    }

}