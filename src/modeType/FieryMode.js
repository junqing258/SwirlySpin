import { bonusPlayStart, subscribeStore, roundEnd, addWinAll, takeWin  } from "ctrl/playCtrl";
import { createBackOut, createSkeleton } from "utils/util";
import SenseManager from "utils/SenseManager";
import WinCoins from "components/WinCoins";

import ABonusModeBg from "modeType/ABonusModeBg";
import ABonusMode from "modeType/ABonusMode";
import Sound from "common/Sound";

const { Tween, Event, Handler, Ease, Sprite } = Laya;

export default class FieryMode extends ABonusMode {

    init() {
        super.init();
        subscribeStore("voiceOn", data=> {
            data && Sound.play("bn_fire_bg");
        }, this);
    }

    prelude() {
        Tween.to(this, { y: Laya.stage.height/2-15 }, 450, createBackOut(0.5), Handler.create(this, ()=> {
            this.resizable(()=>  this.y = Laya.stage.height/2-15 );
            Sound.play("startFreespin");
            this.countFree();
            Laya.timer.once(1750, this, ()=> {
                Laya.timer.once(1000, this, this.dealNextPage);
            });
        }));
    }

    dealNextPage() {
        if (this.resultData.layout==this.pageIndex+1) {
            let fireEntra = createSkeleton("ani/bonus4/fire_entra");
            fireEntra.pos(667, Laya.stage.height/2);
            fireEntra.zOrder = 50;
            Laya.stage.addChild(fireEntra);
            this.burnSymbols();
            fireEntra.once(Event.STOPPED, this, ()=> {
                fireEntra.destroy();
                this.replaceSymbs();
            });
            Sound.play("bn_fire_entra");
            Laya.timer.once(750, this, ()=> fireEntra.play(0, false));
        } else {
            this._dealNextPage();
        }
    }

    burnSymbols() {
        Sound.play("bn_fire_symb");
        for (let i=1; i<=25; i++) {
            let symbol = this.allSymbols[i];
            symbol.burningHot();
        }
    }

    coolingSymbols() {
        for (let i=1; i<=25; i++) {
            let symbol = this.allSymbols[i];
            if (symbol && symbol.color/* && symbol.color.charAt(0)==="_"*/) {
                symbol.toCooling();
            }
        }
    }

    replaceSymbs(cb) {
        let change = this.resultData.change[0];
        let { replace } = change;
        let i = 0;
        let temp = replace.sort((a,b)=> 0.5 - Math.random()).slice(0, 3);
        Laya.timer.from(temp, 600, this, (num)=> {
            let symbol = this.allSymbols[num];
            symbol.catchFire();
        }).complete(()=> {
            Laya.timer.once(600, this, ()=> {
                replace.forEach(num=> {
                    let symbol = this.allSymbols[num];
                    symbol.catchFire(()=> {
                        if (++i===replace.length) {
                            Sound.play("bn_fire_rep");
                            replace.forEach(m=> this.allSymbols[m].bombOut(null, null, false));
                            this.coolingSymbols();
                            Laya.timer.once(1500, this, this.moveSymbols);
                        }
                    });
                });
            });
        });
    }

};