
import SenseManager, { sense } from "utils/SenseManager";
import { CLOUD_ASSET } from "const/assets";
import MasterSense from "senses/MasterSense";
import { createSkeleton } from "utils/util";
import { subscribeStore, getDataByKey, choiceBonusType } from "ctrl/playCtrl";
import Sound from "common/Sound";
import Confirm from "popup/Confirm";
import HelpPopup from "popup/HelpPopup";

const { Stage, Handler, Sprite, Tween, Event } = Laya;

const TYPES = ["star", "fire", "bar", "magic"];
const ALIAS = ["占星小屋", "溶火城堡", "幸运酒吧", "炼金工坊"];

@sense("/cloud")
export default class CloudSense extends ui.senses.CloudUI {

    constructor() {
        super();
        this.init();
    }

    getAsset() {
        return CLOUD_ASSET;
    }
    
    willMount() {
        return new Promise(reslove=> {
            Laya.loader.load([
                { url: "ani/sky/cloud.sk", type: "arraybuffer" },
	            { url: "ani/sky/cloud.png", type: "image" }
            ], Laya.Handler.create(null, ()=> {
                let cloudAni = this.cloudAni = createSkeleton("ani/sky/cloud");
                cloudAni.pos(667, Laya.stage.height/2);
                cloudAni.play(0, true);
                Laya.stage.addChild(cloudAni);
                Tween.from(cloudAni, { alpha: 0.1 }, 350, null, Handler.create(this, reslove));
            }));
        });
    }

    init() {
        this.lockStatus = {};
        let unlock = getDataByKey("unlock");
        subscribeStore("keyCount", (data, state)=> {
            this.keyCountLable.text = data>=1000? "999+": data;
            [3,4,5,6].forEach(id=> {
                let unlockNum = unlock.get(String(id));
                let cont = this[`lock${id}`];
                let lableCont = cont.getChildAt(0);
                let lable = lableCont.getChildAt(0);
                lable.text = `${data}/${unlockNum}`;
                if (!(parseInt(data)>parseInt(unlockNum))) {
                    let lockAni = createSkeleton("ani/sky/lock");
                    lockAni.pos(48, 50);
                    cont.addChildAt(lockAni, 1);
                    lockAni.play(1);
                } else {
                    lableCont.visible = false;
                }
                this.lockStatus[id] = !(parseInt(data)>=parseInt(unlockNum));
            });
        }, this);
        this.initEvent();
        this.keyStore.alpha = 0;

        this.keyStore.on(Event.CLICK, this, ()=> {
            HelpPopup.getInstance().popup(3);
        });

    }

    didMount() {
        let { bgShot, midShot, fronShot, cloudAni } = this;
        Sound.stop("key_tunnel");
        cloudAni.once(Event.STOPPED, cloudAni, ()=> {
            cloudAni.destroy();
            Laya.timer.once(200, this, ()=> Sound.play("cloud_bg"));
            Laya.timer.once(1200, this, ()=> Sound.play("explosion1"));
            Laya.timer.once(300, this, ()=> Tween.to(this.keyStore, { alpha: 1 }, 150) );
        });
        cloudAni.play(1, false);
        Laya.timer.once(300, this, ()=> Sound.play("cloud_open"));
        midShot.scale(0.77, 0.77);
        bgShot.scale(1, 1);
        Laya.timer.once(1000, this, ()=> {
            Tween.to(bgShot, { scaleX: 1.1, scaleY:1.1 }, 2000, null);
            Tween.to(midShot, { scaleX: 1, scaleY:1 }, 2000, null);
            Tween.to(fronShot, { scaleX: 1.3, scaleY:1.3, y: Laya.stage.height }, 2000, null);
        });
        Laya.timer.once(100, this, ()=> {
            let unlock = getDataByKey("unlock"),
                keyCount = getDataByKey("keyCount");
            [3,4,5,6].forEach(id=> {
                let unlockNum = unlock.get(String(id));
                if (!(parseInt(keyCount)>parseInt(unlockNum))) {
                    this[`${TYPES[id-3]}Land`].stop();
                } 
            });
        });
        Laya.timer.once(2800, this, ()=> {
            let unlock = getDataByKey("unlock"),
                keyCount = getDataByKey("keyCount");
            [3,4,5,6].forEach(id=> {
                let unlockNum = unlock.get(String(id));
                let cont = this[`lock${id}`];
                let lableCont = cont.getChildAt(0);
                if (parseInt(keyCount)===parseInt(unlockNum)) {
                    let lockAni = cont.getChildAt(1);
                    lockAni.play(0);
                    Tween.to(lableCont, { alpha: 0 }, 416, null, null, 840);
                    this[`${TYPES[id-3]}Land`].play(0, true);
                }
            });
        });

        this.resizable(()=> {
            this.height = Laya.stage.height;
            this.width = Laya.stage.width;
            this.midShot.height = Laya.stage.height;
            if (this.cloudAni) this.cloudAni.y = Laya.stage.height/2;
            this.island.y = (Laya.stage.height-675)/2 + 120;
            this.bgShot.y = Laya.stage.height/2;
            this.fronShot.y = Laya.stage.height;
        });

    }

    initEvent() {
        [3,4,5,6].forEach(id=> {
            let btn = this[`item${id}`];
            btn.on(Event.CLICK, this, ()=> {
                if (this.lockStatus[id]) {
                    Confirm.getInstance().popup(`您的钥匙不够，还不能进入${ALIAS[id-3]}`);
                } else {
                    let freeInfo = getDataByKey("freeInfo");
                    Confirm.getInstance().popup(`${ALIAS[id-3]}中有${ freeInfo.get(String(id)) }次免费游戏，是否进入`, {
                        type: 4,
                        sure: ()=> {
                            this.loadBounds(id);
                        }
                    });
                }
            });
        });
    }

    loadBounds(gameType) {
        let cloudAni = createSkeleton("ani/sky/cloud");
        cloudAni.pos(667, Laya.stage.height/2);
        cloudAni.once(Event.STOPPED, cloudAni, ()=> {
            cloudAni.play(0, true);
        });
        cloudAni.play(2, false);
        cloudAni.zOrder = 9;
        let maskLayer = new Laya.Sprite();
        maskLayer.size(Laya.stage.width, Laya.stage.height);
        maskLayer.on(Event.MOUSE_DOWN, this, event=> event.stopPropagation());
        Laya.stage.addChildren(maskLayer, cloudAni);
        choiceBonusType(gameType).subscribe(data=> {
            SenseManager.load("/bonus", { gameType }, ()=> {
                cloudAni.once(Event.STOPPED, cloudAni, cloudAni.destroy);
                cloudAni.play(1, false);
                maskLayer.destroy();
            });
        }, error=> {
            cloudAni.once(Event.STOPPED, cloudAni, cloudAni.destroy);
            cloudAni.play(1, false);
            maskLayer.destroy();
            Confirm.getInstance().popup('网络异常了', {
                close: ()=> location.reload()
            });
        });
    }

}