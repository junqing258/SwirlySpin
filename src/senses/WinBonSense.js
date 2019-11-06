import SenseManager, { sense } from "utils/SenseManager";
import { } from "const/assets";
import { roundEnd, getDataByKey, setStoreState, takeWin } from "ctrl/playCtrl";
import { createSkeleton } from "utils/util";
import Sound from "common/Sound";

const { Tween, Ease, Event, Handler } = Laya;

@sense("/winbonus", false)
export default class WinBonSense extends ui.senses.BonusWinUI {

    constructor() {
        super();
        this.zOrder = 2;
        this.init();
    }

    init() {
        this.alpha = 0;
        this.coinsAni = createSkeleton("ani/bonus/bonus_win");
        this.addChildAt(this.coinsAni,1);
        this.coinsAni.x = 682;
        this.resizable(()=> {
            this.height = Laya.stage.height;
            this.coinsAni.y = Laya.stage.height/2;
            this.bg.y = (Laya.stage.height-1334)/2;
        });

        let { title, winLable, titleLose } = this;
        let winAll = getDataByKey("winAll");
        title.visible = winLable.visible = !!winAll;
        titleLose.visible = false;
    }

    willMount() {
        Sound.stopMusic();
        return new Promise(reslove=> {
            Laya.loader.load([
                { url: "ani/sky/cloud.sk", type: "arraybuffer" },
	            { url: "ani/sky/cloud.png", type: "image" }
            ], Laya.Handler.create(null, ()=> {
                reslove();
            }));
        });
    }

    didMount() {
        let winAll = getDataByKey("winAll");
        winAll? this.diwWin(): this.didLose();
    }

    diwWin() {
        let { title, winLable, titleLose } = this;
        winLable.text = getDataByKey("winAll").toString().split("").join("_");
        title.scale(0,0);
        winLable.scale(0,0);
        Tween.to(this, { alpha: 1 }, 800, Ease.linearNone, Handler.create(this, ()=> {
            Sound.play("bn_win");
            Laya.timer.once(100, this, ()=> {
                this.coinsAni.once(Event.STOPPED, this, ()=> {
                    this.coinsAni.play(1, false);
                });
                this.coinsAni.play(0);
                Tween.to(title, { scaleX: 1.1, scaleY: 1.1 }, 300, Ease.sineOut, Handler.create(null, ()=> {
                    Tween.to(title, { scaleX: 1.0, scaleY: 1.0 }, 60, Ease.linearNone);
                }));
                Tween.to(winLable, { scaleX: 1.27, scaleY: 1.27 }, 350, Ease.sineOut, Handler.create(null, ()=> {
                    Tween.to(winLable, { scaleX: 1.0, scaleY: 1.0 }, 80, Ease.linearNone);
                }));
            });
            
            this.loadNext();
        }));

    }

    didLose() {
        Tween.to(this, { alpha: 1 }, 800, Ease.linearNone, Handler.create(this, ()=> {
            Laya.timer.once(800, this, ()=> Sound.play("explosion1"));
            let { title, winLable, titleLose } = this;
            let ty = titleLose.y;
            titleLose.visible = true;
            Tween.from(titleLose, { y: ty-100, alpha: 0 }, 1000, Ease.sineOut, Handler.create(this, ()=> this.loadNext(true) ));
        }));
    }

    loadNext(islose) {
        const MasterSense = SenseManager.getSenseCompent("/master");
        let preProto = MasterSense.prototype;
        let start = Date.now(), complete;
        let p3 = new Promise(resolve=> {
            if (!preProto.hasLoaded) {
                let asset = preProto.getAsset();
                Laya.loader.load(asset, Laya.Handler.create(null, ()=> {
                    preProto.hasLoaded = true;
                    resolve();
                }));
            } else {
                resolve();
            }
        }).then(val=> {
            complete = Date.now();
            let t  = islose? Math.max(0, 3000-complete+start):  Math.max(0, 4700-complete+start);
            Laya.timer.once(t, this, this.onOver);
        });
    }

    onOver() {
        Tween.to( this.coinsAni, { alpha:0 }, 250);
        let cloudAni = createSkeleton("ani/sky/cloud");
        cloudAni.pos(667, Laya.stage.height/2);
        cloudAni.zOrder = 9;
        cloudAni.once(Event.STOPPED, cloudAni, ()=> {
            cloudAni.play(0, true);
            takeWin();
            setStoreState({"modeType": 1});
            SenseManager.load("/master", null, ()=> {
                Laya.timer.once(300, null, roundEnd);
            });
            Laya.timer.once(300, cloudAni, ()=> {
                cloudAni.once(Event.STOPPED, cloudAni, cloudAni.destroy);
                cloudAni.play(1, false);
            });
        });
        cloudAni.play(2, false);
        Laya.stage.addChild(cloudAni);
    }

}