import { bonusPlayStart, subscribeStore, roundEnd, addWinAll, takeWin, getDataByKey  } from "ctrl/playCtrl";
import { LAYOUT, V_LAYOUT } from "const/config";
import { createBackOut, createSkeleton } from "utils/util";
import SenseManager from "utils/SenseManager";
import WinCoins from "components/WinCoins";

import ABonusModeBg from "modeType/ABonusModeBg";
import ABonusMode from "modeType/ABonusMode";
import Sound from "common/Sound";

const { Tween, Event, Handler, Ease, Sprite } = Laya;

export default class BarMode extends ABonusMode {

    init() {
        super.init();
        subscribeStore("voiceOn", data=> {
            data && Sound.play("bn_bar_bg");
        }, this);
    }

    prelude() {
        Tween.to(this, { y: Laya.stage.height/2-15 }, 450, createBackOut(0.5), Handler.create(this, ()=> {
            this.resizable(()=>  this.y = Laya.stage.height/2-15 );
            Sound.play("startFreespin");
            this.countFree();
            Laya.timer.once(1500, this, ()=> {
                Sound.play("bn_bar_entra");
                let barEntra = createSkeleton("ani/bonus5/bar_entra");
                barEntra.pos(667, Laya.stage.height/2);
                barEntra.zOrder = 50;
                Laya.stage.addChild(barEntra);
                barEntra.once(Event.STOPPED, this, ()=> {
                    barEntra.destroy();
                    Laya.timer.once(250, this, ()=> {
                        this.replaceSymbs(()=> {
                            Laya.timer.once(1000, this, this.dealNextPage);
                        });
                    });
                });
                barEntra.play(0, false);
            });
        }));
    }
    
    replaceSymbs(cb) {
        let change = this.resultData.change[0];
        let { replace, type } = change;
        
        let isHorizontal = false;
        LAYOUT.forEach(lineargs=> {
            if (isHorizontal) return;
            let c = 0;
            for (let i=0,len=replace.length; i< len; i++) {
                if (lineargs.includes(replace[i]) && ++c>=2) {
                    isHorizontal = true;
                    break; 
                }
            }
        });
        let _layoutArr = isHorizontal? LAYOUT: V_LAYOUT;
        let _layout = _layoutArr.find(list=> list.includes(replace[0]));
        Array.isArray(_layout) && ( replace = replace.sort((a,b)=> _layout.indexOf(a) < _layout.indexOf(b)) );


        replace.forEach(num=> {
            let symbol = this.allSymbols[num];
            symbol.rotateOut();
        });
        Laya.timer.from(replace, 400, this, num=> {
            let symbol = this.allSymbols[num];
            Sound.play("bn_bar_rep");
            symbol.barSplash(type);
        }).complete(()=> {
            if (typeof cb === "function") cb();
        });
    }

};