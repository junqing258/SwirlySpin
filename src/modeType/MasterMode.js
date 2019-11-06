import { randomNum, backOut2, createSkeleton } from "utils/util";
import { LAYOUT } from "const/config";
import { subscribeStore, playStart, setStoreState, addWinAll, takeWin, roundEnd, getDataByKey } from "ctrl/playCtrl";
import SymbolCell from "components/SymbolCell";
import Trench from "components/Trench";
import WinCoins from "components/WinCoins";
import SenseManager from "utils/SenseManager";
import CloudSense from "senses/CloudSense";

import Background from "components/Background";
import SpinBase from "components/SpinBase";
import { MASTER_ASSET_LETER } from "const/assets";
import Confirm from "popup/Confirm";
import Sound from "common/Sound";

const { Tween, Ease, Event, Handler } = Laya;

let laterloaded = false;

export default class MasterMode extends SpinBase {

    init() {
        this.pivot(333, 338);
        this.loadImage("board/broad1.png");
        let trench = Trench.getInstance();
        trench.pos(116, 105);
        this.addChildAt(trench, 0);

        Laya.timer.once(100, this, this.fillSymbols);

        subscribeStore("gameStatus", (data)=> {
            switch (data) {
                case "PLAY_START":
                    this.freshStart();
                    break;
            }
        }, this);

        subscribeStore("voiceOn", data=> {
            data && Sound.play("game_bg2");
        }, this);
        
    }
    
    freshStart() {
        this.resultData = null;
        playStart().subscribe(data=> {
            this.resultData = data;
            let isFree = this.resultData.is_free;
            if (isFree && !laterloaded) {
                Laya.loader.load(MASTER_ASSET_LETER, Handler.create(this, ()=> laterloaded = true ));
            }
            this.pageIndex = 0;
            this.fillSymbols(this.resultData.card_info[this.pageIndex].graph);
            this.allSymbols.forEach(symbol=> symbol.visible = false);
            Laya.timer.once(0, this, ()=> {
                Laya.timer.once(100, this, ()=> this.keyholeJello());
                this.roundStart(()=> Laya.timer.once(1000, this, this.dealNextPage) );
            });
        }, error=> {
            
        });
    }

    onOver() {
        let isFree = this.resultData.is_free;
        let winAll = getDataByKey("winAll");
        if (!winAll) return roundEnd();
        WinCoins.getInstance().show(()=> {
            if (!isFree) return roundEnd();
            takeWin();
            Laya.timer.once(1500, this, ()=> {
                if (!laterloaded) return Confirm.getInstance().show("网络异常了！");
                this.openTheTunnel();
            });
        });
    }

    gameWin() {
        addWinAll(this.bombWin);
        this.bombWin = 0;
    }

    openTheTunnel() {
        if (this.allSymbols[25]) this.allSymbols[25].destroy();
        
        this.keyholeJello(true);
        let ani = createSkeleton("ani/icekey");
        ani.pos(this.x, this.y);
        Laya.stage.addChild(ani);
        ani.once(Event.STOPPED, this, ()=> {
            SenseManager.load("/cloud");
            Tween.to(ani, { alpha: 0 }, 200, null, Handler.create(ani, ani.destroy));
        });
        ani.play(0, false);
        
        Laya.timer.once(400, this, ()=> {
            Sound.stop("game_bg2");
            Sound.play("key_open");
            Laya.timer.once(400, null, ()=> Sound.play("key_tunnel"));
            
            Laya.timer.once(1000, this, ()=> {
                let curSense = SenseManager.getCurSense();
                curSense.pivot(Laya.stage.width/2, Laya.stage.height/2);
                curSense.pos(Laya.stage.width/2, Laya.stage.height/2);
                Tween.to(curSense, { scaleX: 1.5, scaleY: 1.5, alpha: 0.2 }, 158*1000/24, null, Handler.create(null, ()=> {
                    curSense.destroy();
                }));
            });
            
        });
        
        let keyCount = parseInt(this.resultData.my_key);
        setStoreState({ "keyCount": keyCount });
    }

    keyholeJello(open) {
        let ani = createSkeleton("ani/keyhole");
        ani.scale(1.2,1.2);
        ani.pos(335, 335);
        this.addChild(ani);
        if (open) {
            ani.play(1, false);
        } else {
            ani.once(Event.STOPPED, ani, ani.destroy);
            ani.play(0, false);
        }
    }
};