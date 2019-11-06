import { PubSub } from "ctrl/playCtrl";
import { createSkeleton } from "utils/util";
import ABonusModeBg from "modeType/ABonusModeBg";
import ABonusMode from "modeType/ABonusMode";

const { Tween, Ease, Event } = Laya;

export default class StarModeBg extends ABonusModeBg {

    init() {
        let self = this, stage = Laya.stage;
        let bgtexture = Laya.loader.getRes("bg/bonus3.jpg");

        let pendant = createSkeleton("ani/bonus3/pendant");
        pendant.pos(1031, 114);
        this.addChild(pendant);
        pendant.play(0, true);

        let starbg = createSkeleton("ani/bonus3/starbg");
        starbg.x = 667;
        this.addChild(starbg);
        starbg.play(0, true);
        
        this.resizable(()=> {
            this.graphics.clear();
            this.graphics.drawTexture(bgtexture, 0 , Laya.stage.height/2-667);
            this.pivot(stage.width/2, stage.height/2);
            this.pos(stage.width/2, stage.height/2);
            starbg.y = stage.height/2;
        });

        this.initCom && this.initCom();
        
    }

};