import { PubSub } from "ctrl/playCtrl";
import { createSkeleton } from "utils/util";
import ABonusModeBg from "modeType/ABonusModeBg";
import ABonusMode from "modeType/ABonusMode";

const { Tween, Ease, Event } = Laya;

export default class FieryModeBg extends ABonusModeBg {

    init() {
        let self = this, stage = Laya.stage;
        let bgtexture = Laya.loader.getRes("bg/bonus4.jpg");

        let firehole = createSkeleton("ani/bonus4/firehole");
        firehole.x = 650;
        this.addChild(firehole);
        firehole.play(0, true);

        let dragon = createSkeleton("ani/bonus4/fire_dragon");
        dragon.x = 1264;
        dragon.y = 150;
        this.addChild(dragon);
        dragon.play(0, true);
        
        this.resizable(()=> {
            this.graphics.clear();
            this.graphics.drawTexture(bgtexture, 0 , Laya.stage.height/2-667);
            this.pivot(stage.width/2, stage.height/2);
            this.pos(stage.width/2, stage.height/2);
            firehole.y = Laya.stage.height/2 + 197;
        });
        this.initCom && this.initCom();
    }

};