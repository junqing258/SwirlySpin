import { randomNum, backOut2 } from "utils/util";
import { LAYOUT } from "const/config";
import { subscribeStore, getNoWinningGraph, playStart } from "ctrl/playCtrl";
import SymbolCell from "components/SymbolCell";
import SpinBase from "components/SpinBase";
import Trench from "components/Trench";

const { Tween, Ease, Event, Handler } = Laya;

export default class SpinMaster extends SpinBase {

    static getInstance() {
        if (!this.instance||this.instance.destroyed) this.instance = new this();
        return this.instance;
    }

    constructor() {
        super();
        this.pivot(333, 338);
        this.pos(317+333, 750-725+338);
        this.loadImage("board/broad1.png");
        let trench = Trench.getInstance();
        trench.pos(trench.x+116, trench.y+105);
        this.addChild(trench);
        this.init();
        Laya.timer.once(100, this, this.onEntra);
    }

    init() {
        subscribeStore("gameStatus", (data)=> {
            switch (data) {
                case "PLAY_START":
                    this.freshStart();
                    break;
                case "PLAY_ING":
                    break;
            }
        }, this);
    }

    onLeave() {
        this.stopAllAnimation();
    }

    stopAllAnimation() {

    }

}