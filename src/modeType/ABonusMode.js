import { bonusPlayStart, subscribeStore, roundEnd, addWinAll, takeWin, getDataByKey, setStoreState  } from "ctrl/playCtrl";
import { createBackOut, createSkeleton } from "utils/util";
import SenseManager from "utils/SenseManager";
import WinCoins from "components/WinCoins";

import Background from "components/Background";
import SpinBase from "components/SpinBase";
import Sound from "common/Sound";

const { Tween, Event, Handler, Ease, Sprite } = Laya;

export default class ABonusMode extends SpinBase {

    init() {
        this.isBonus = true;
        this.pivot(333, 338);
        this.pos(317+343, -649);
        let bgtexture = Laya.loader.getRes("board/broadbonus.png");
        this.viewport = new Laya.Rectangle(-200,-200,880,800);
        this.graphics.drawTexture(bgtexture, 12, 10);

        Laya.timer.once(0, this, this.freshStart, [true]);
    }

    freshStart(isInit) {
        this.resultData = null;
        bonusPlayStart().subscribe(data=> {
            this.resultData = data;
            this.pageIndex = 0;
            this.fillSymbols(this.resultData.card_info[this.pageIndex].graph);
            if (!isInit) {
                this.allSymbols.forEach(symbol=> symbol.visible = false);
                Laya.timer.once(0, this, ()=> {
                    this.roundStart(()=> this.prelude());
                });
            } else {
                this.prelude();
            }
        }, error=> {
            Log.error(error);
        });
    }


    onOver() {
        Laya.timer.once(300, this, ()=> {
            let freeNum = getDataByKey("freeNum");
            if (freeNum>=1) {
                this.freshStart();
            } else {
                SenseManager.load("/winbonus", { destroylater: 1000 });
            }
            
        });
    }
    
    countFree() {
        let panle = new Sprite();
        panle.size(368, 400);
        panle.pivot(184, 200);
        panle.pos(1334/2, Laya.stage.height/2);
        let title = new Laya.Image("bonus/desc_free.png");
        title.pos(0, 20);
        panle.addChild(title);

        let numLable = new Laya.Text();
        numLable.set({ font: "free_num", width: 368, height: 153, align: "center", x: 184, pivotX: 184, y: 76+110+15, pivotY: 76 });
        let freeNum = getDataByKey("freeNum");
        numLable.text = freeNum;
        panle.addChild(numLable);

        Tween.to(panle, { scaleX: 1.03, scaleY: 1.03 }, 832, Ease.sineOut, Handler.create(this, ()=> {
            Tween.to(panle, { scaleX: 3, scaleY: 3, alpha: 0 }, 416, null, Handler.create(panle, panle.destroy));
            Sound.play("winAttention5");
            Laya.timer.once(300, null, ()=> setStoreState({"freeNum": freeNum-1 }));
        }));
        
        Laya.stage.addChild(panle);
    }

    gameWin() {
        addWinAll(this.bombWin);
        this.bombWin = 0;
    }

};