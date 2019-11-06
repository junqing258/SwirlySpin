import { bonusPlayStart, subscribeStore, roundEnd, addWinAll, takeWin  } from "ctrl/playCtrl";
import { createBackOut, createSkeleton } from "utils/util";
import SenseManager from "utils/SenseManager";
import WinCoins from "components/WinCoins";

import ABonusModeBg from "modeType/ABonusModeBg";
import ABonusMode from "modeType/ABonusMode";
import Sound from "common/Sound";

const { Tween, Event, Handler, Ease, Sprite } = Laya;

export default class MagicMode extends ABonusMode {

    init() {
        super.init();
        subscribeStore("voiceOn", data=> {
            data && Sound.play("bn_magic_bg");
        }, this);
    }

    prelude() {
        Tween.to(this, { y: Laya.stage.height/2-15 }, 450, createBackOut(0.5), Handler.create(this, ()=> {
            this.resizable(()=>  this.y = Laya.stage.height/2-15 );
            Sound.play("startFreespin");
            this.countFree();
            Laya.timer.once(1750, this, ()=> {
                let magicEntra = createSkeleton("ani/bonus6/magic_entra");
                magicEntra.pos(667, Laya.stage.height/2);
                magicEntra.zOrder = 50;
                Laya.stage.addChild(magicEntra);
                magicEntra.once(Event.STOPPED, this, ()=> {
                    magicEntra.destroy();
                    Laya.timer.once(250, this, ()=> {
                        this.replaceSymbs(()=> {
                            Laya.timer.once(1000, this, this.dealNextPage);
                        });
                    });
                });
                magicEntra.play(0, false);
                Sound.play("bn_magic_entra");
                Laya.timer.once(500, this, ()=> {
                    this.fullStars();
                    this.blinkSymbs();
                });
            });
        }));
    }

    replaceSymbs(cb) {
        let self = this;
        let changes = this.resultData.change;

        let d = 0;
        function eachCahge() {
            let { replace, type } = changes[d], c = 0;
            replace.forEach(num=> {
                let symbol = self.allSymbols[num];
                symbol.changeMagic(String(type).toUpperCase(), ()=> {
                    if (++c===replace.length) {
                        if (++d===changes.length) {
                            Array.isArray(self.blinks) && self.blinks.forEach(num=> {
                                if (self.allSymbols[num] && self.allSymbols[num].blinkAni) 
                                    self.allSymbols[num].blinkAni.destroy();
                            });
                            typeof cb === "function" && Laya.timer.once(300, self, cb);
                        } else {
                            eachCahge();
                        }
                    }
                });
            });
        }
        eachCahge();
    }

    fullStars(cb) {
        let fullstar = createSkeleton("ani/bonus6/full_stars");
        this.parent.addChild(fullstar);
        fullstar.pos(667, Laya.stage.height/2);
        fullstar.on(Event.STOPPED, this, ()=> {
            fullstar.destroy();
            if (typeof cb === "function") cb();
        });
        fullstar.play(0, false);
    }

    blinkSymbs() {
        let changes = this.resultData.change;
        let blinks = this.blinks = [];
        changes.forEach(change=> {
            let { replace, type } = change;
            blinks = blinks.concat(replace);
        });
        Sound.play("bn_magic_rep");
        blinks.forEach(num=> {
            let symbol = this.allSymbols[num];
            symbol.magicBlink();
        });
    }
    
};