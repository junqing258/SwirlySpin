import { bonusPlayStart, subscribeStore, roundEnd, addWinAll, takeWin, getDataByKey  } from "ctrl/playCtrl";
import { createBackOut, createSkeleton } from "utils/util";
import SenseManager from "utils/SenseManager";
import WinCoins from "components/WinCoins";

import ABonusModeBg from "modeType/ABonusModeBg";
import ABonusMode from "modeType/ABonusMode";
import Sound from "common/Sound";

const { Tween, Event, Handler, Ease, Sprite } = Laya;

export default class StarMode extends ABonusMode {

    init() {
        super.init();
        subscribeStore("voiceOn", data=> {
            data && Sound.play("bn_star_bg");
        }, this);
    }

    prelude() {
        Tween.to(this, { y: Laya.stage.height/2-15 }, 450, createBackOut(0.5), Handler.create(this, ()=> {
            this.resizable(()=>  this.y = Laya.stage.height/2-15 );
            Sound.play("startFreespin");
            this.countFree();
            Laya.timer.once(1500+250, this, ()=> {
                Laya.timer.of(4, 300, this, num=> {
                    Sound.play("bn_star_entra");
                });
                let starEntra = createSkeleton("ani/bonus3/star_entra");
                starEntra.pos(667-10, Laya.stage.height/2);
                starEntra.zOrder = 50;
                Laya.stage.addChild(starEntra);
                starEntra.once(Event.STOPPED, this, ()=> {
                    starEntra.destroy();
                    Laya.timer.once(200, this, ()=> {
                        this.replaceSymbs(()=> Laya.timer.once(1000, this, this.dealNextPage) );
                    });
                });
                starEntra.play(0, false);
            });
        }));
    }

    replaceSymbs(cb) {
        let change = this.resultData.change[0];
        let { replace, type } = change;
        Laya.timer.from(replace, 1000, this, (num, index)=> {
            let symbol = this.allSymbols[num];
            Sound.play("bn_star_drop");
            symbol.changeAstral(index);
        }).complete(()=> {
            if (typeof cb === "function") cb();
        });
    }

};