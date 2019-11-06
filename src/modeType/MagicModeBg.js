import { PubSub } from "ctrl/playCtrl";
import { createSkeleton } from "utils/util";
const { Tween, Ease, Event } = Laya;

import ABonusModeBg from "modeType/ABonusModeBg";
import ABonusMode from "modeType/ABonusMode";

export default class MagicModeBg extends ABonusModeBg {

    init() {
        let self = this, stage = Laya.stage;
        let bgtexture = Laya.loader.getRes("bg/bonus6.jpg");

        let harpbg = createSkeleton("ani/bonus6/harp_bg");
        this.addChild(harpbg);
        harpbg.pos(1334/2, Laya.stage.height/2);
        harpbg.play(0, true);

        this.resizable(()=> {
            this.graphics.clear();
            this.graphics.drawTexture(bgtexture, 0 , Laya.stage.height/2-667);
            this.pivot(stage.width/2, stage.height/2);
            this.pos(stage.width/2, stage.height/2);
        });

        this.initCom && this.initCom();
    }

};