
import { DButtonDecorator as $btn } from "common/Custom";
import { subscribeStore, setStoreState, getDataByKey, getBetScope, getMaxBet, PubSub } from "ctrl/playCtrl";
import { checkLogin, toLogin, createSkeleton } from "utils/util";
import Sound from "common/Sound";

const { Event, Handler, Tween, Ease } = Laya;

let playStatus;
export default class AFooter extends ui.fragment.FooterUI {

    static getInstance() {
        if (!this.instance||this.instance.destroyed) this.instance = new this();
        return this.instance;
    }
    
    constructor() {
        super();
        this.zOrder = 9;
        this.init();
    }

    init() {
        let stage = Laya.stage;
        let $btnPlay = this.$btnPlay = $btn(this.btnPlay, { audio: null }),
            $btnMinus = this.$btnMinus = $btn(this.btnMinus),
            $btnAdd = this.$btnAdd = $btn(this.btnAdd),
            $btnMax = this.$btnMax = $btn(this.btnMax);
        let btnPlayAni = this.btnPlayAni = createSkeleton("ani/btnPlay");
        btnPlayAni.pos(302/2, 76/2);
        btnPlayAni.play("play_start", true);
        $btnPlay.addChild(btnPlayAni);

        let playcliked=0, clickTimer;
        let touchInTime, touchOutTime;
        $btnPlay.on(Event.MOUSE_DOWN, this, ()=> {
            if ($btnPlay._isForbid||playcliked) return;
            touchInTime = Date.now();
            let isAuto = getDataByKey("autoNum")>=1;
            if (isAuto) return;
            clickTimer = setTimeout(()=> {
                if (playcliked) return;
                this.showAutoPanle();
            }, 800);
        });
        $btnPlay.on(Event.MOUSE_UP, this, ()=> {
            touchOutTime = Date.now();
            clearTimeout(clickTimer);
            setTimeout(()=> playcliked = false, 100);
            if (touchOutTime<=touchInTime+500) {
                playcliked = true;
                clearTimeout(clickTimer);
                if (!checkLogin()) return toLogin();
                if ($btnPlay._isForbid) return;
                let isAuto = getDataByKey("autoNum")>=1;
                if (isAuto) {
                    setStoreState({ "autoNum": 0 });
                } else {
                    Sound.play("spinButtonClick");
                    setStoreState({ "gameStatus": "PLAY_START" });
                }
            }
        });
        
        $btnPlay.on(Event.CLICK, this, event=> event.stopPropagation());

        $btnMinus.on(Event.CLICK, this, ()=> {
            if (!checkLogin()) return toLogin();
            let betAmount = getDataByKey("bet");
            let step = getBetScope(betAmount, true);
            if (betAmount>10) {
                setStoreState({"bet": betAmount-step});
            }
        });
        $btnAdd.on(Event.CLICK, this, ()=> {
            if (!checkLogin()) return toLogin();
            let betAmount = getDataByKey("bet");
            let step = getBetScope(betAmount, false);
            if (betAmount < getMaxBet()) {
                setStoreState({"bet": betAmount+step});
            }
        });
        $btnMax.on(Event.CLICK, this, ()=> {
            if (!checkLogin()) return toLogin();
            let betAmount = getDataByKey("bet");
            let step = getBetScope(betAmount, false);
            let maxbet = getMaxBet();
            if (betAmount < maxbet) {
                setStoreState({"bet": maxbet});
            }
        });
        $btn(this.betWrap).on(Event.CLICK, this, ()=> this.showBetPanle());

        this.once(Event.ADDED, this, ()=> {
            ["optAutoNum", "optBetValue"].forEach(key=> {
                this[key].removeSelf();
                this[key].zOrder = 20;
                this.parent.addChild(this[key]);
            });
            let maskLayer = this.maskLayer = new Laya.Sprite();
            maskLayer.zOrder = 19;
            maskLayer.alpha = 0.2;
            maskLayer.on(Event.CLICK, this, ()=> {
                if (this.isShowedAuto) this.hideAutoPanle();
                if (this.isShowedBet) this.hideBetPanle();
            });
            this.resizable(()=> {
                maskLayer.size(stage.width, stage.height);
            });
        });
        for(let i=0,len=this.optAutoNum.numChildren; i<len; i++) {
            let $btnOpt =  $btn(this.optAutoNum.getChildAt(i));
            let lable = $btnOpt.getChildAt(0);
            $btnOpt.on(Event.CLICK, this, ()=> {
                setStoreState({"autoNum": parseInt(lable.text)});
                this.hideAutoPanle();
            });
        }
        for(let i=0,len=this.optBetValue.numChildren; i<len; i++) {
            let $btnOpt =  $btn(this.optBetValue.getChildAt(i));
            let lable = $btnOpt.getChildAt(0);
            $btnOpt.on(Event.CLICK, this, ()=> {
                setStoreState({"bet": parseInt(lable.text)});
                this.hideBetPanle();
            });
        }

        ////////////////////////////////
        //  initSubscribe
        //  
        subscribeStore("autoNum", (data)=> {
            let gameStatus = getDataByKey("gameStatus");
            this.autoCountLabel.text = data;
            let isPlaying = (gameStatus!=="PLAY_INIT" && gameStatus!=="PLAY_END"),
                isAuto = data>=1;
            let isBonus = gameStatus==="PLAY_BONUS";
            if (isAuto) {
                if (!isPlaying) {
                    btnPlayAni.play("auto_cancle", true);
                    this.autoCountLabel.visible = true;
                    setTimeout(()=> {
                        let autoNum = getDataByKey("autoNum");
                        autoNum &&　setStoreState({
                            "gameStatus": "PLAY_START",
                            "autoNum": autoNum-1
                        });
                    }, 800);
                } else {
                    this.autoCountLabel.visible = isAuto&&!isBonus;
                }
            } else {
                this.autoCountLabel.visible = isAuto&&!isBonus;
                if (!isPlaying) {
                    btnPlayAni.play("play_start", true);
                } else {
                    if (isBonus) btnPlayAni.play("free_time", true);
                    else btnPlayAni.play("clicked");
                    $btnPlay._isForbid = true;
                }
            }
        }, this);

        subscribeStore("gameStatus", (data)=> {
            playStatus = data;
            this.freeCountLabel.visible = false;
            let autoNum = getDataByKey("autoNum"),
                isAuto = autoNum>=1;
            switch (data) {
                case "PLAY_START":
                case "PLAY_ING":
                    $btnMinus.isForbid = $btnAdd.isForbid = $btnMax.isForbid = true;
                    this.betWrap._isForbid = true;
                    $btnPlay._isForbid = !isAuto;
                    !isAuto && btnPlayAni.play("clicked");
                    this.autoCountLabel.visible = isAuto;
                    break;
                case "PLAY_END":
                    let maxbet = getMaxBet(),
                        bet = getDataByKey("bet");
                    this.autoCountLabel.visible = isAuto;
                    if (isAuto) {
                        btnPlayAni.play("auto_cancle", true);
                        setTimeout(()=> {
                            setStoreState({ "gameStatus": "PLAY_START" });
                            setTimeout(()=> {
                                autoNum = getDataByKey("autoNum");
                                autoNum>=1 && setStoreState({ "autoNum": autoNum-1 });
                            }, 300);
                        }, 1000);
                    } else {
                        $btnMinus.isForbid = !(10<bet);
                        $btnPlay._isForbid = this.betWrap._isForbid = false;
                        $btnAdd.isForbid = $btnMax.isForbid = bet>=maxbet;
                        btnPlayAni.play("play_start", true);
                        autoNum==1 && setStoreState({"autoNum": 0});
                    }
                    break;
                case "PLAY_BONUS":
                    $btnMinus.isForbid = $btnAdd.isForbid = $btnMax.isForbid = true;
                    $btnPlay._isForbid = this.betWrap._isForbid = true;
                    this.freeCountLabel.visible = true;
                    this.autoCountLabel.visible = false;
                    btnPlayAni.play("free_time", true);
                    break;
                default:
                    break;
            }
        }, this);

        subscribeStore("bet", (data)=> {
            this.betLabel.text = data;
            let gameStatus = getDataByKey("gameStatus");
            let autoNum = getDataByKey("autoNum");
            let maxbet = getMaxBet(),
                minbet = 10;
            let isPlaying = (gameStatus!=="PLAY_INIT" && gameStatus!=="PLAY_END"),
                isAuto = autoNum>=1;
            let isBonus = gameStatus==="PLAY_BONUS";
            if (isPlaying || isAuto) {
                $btnAdd.isForbid = $btnMax.isForbid = $btnMinus.isForbid = true;
            } else {
                $btnAdd.isForbid = $btnMax.isForbid = data>=maxbet;
                $btnMinus.isForbid =  data<=minbet;
            }
        }, this);

        subscribeStore("winAll", (data)=> {
            this.winLabel.text = data;
        }, this);

        subscribeStore("freeNum", (data)=> {
            this.freeCountLabel.text = data;
        }, this);

        let step;
        const coinsloop = ()=> {
            let cur = Number(this.winLabel.text);
            if (cur<=step) {
                this.winLabel.text = "0";
                return Laya.timer.clear(null, coinsloop);
            }
            this.winLabel.text = cur - step;
        };

        PubSub.on("WIN_COINS", this, ()=> {
            let winLabel = this.winLabel;
            Tween.to(winLabel, { scaleX: 1.2, scaleY: 1.2 }, 250, Ease.sineIn, Handler.create(this, ()=> {
                Tween.to(winLabel, { scaleX: 1.0, scaleY: 1.0 }, 350,  Ease.sineOut, Handler.create(this, ()=> {
                    step = Math.max(1, parseInt(Number(this.winLabel.text)/10));
                    Laya.timer.loop(90, null, coinsloop);
                }));
            }));
        });

    }

    showAutoPanle() {
        if (this.isShowedAuto) return;
        if (this.parent) this.parent.addChild(this.maskLayer);
        Tween.to(this.optAutoNum, { scaleY: 1 }, 300, Ease.backOut, Handler.create(this, ()=> {
            this.isShowedAuto = true;
        }));
    }

    hideAutoPanle() {
        if (!this.isShowedAuto) return;
        Tween.to(this.optAutoNum, { scaleY: 0 }, 150, Ease.sineIn, Handler.create(this, ()=> {
            this.isShowedAuto = false;
            this.maskLayer.removeSelf();
        }));
    }

    showBetPanle() {
        if (this.isShowedBet) return;
        if (this.parent) this.parent.addChild(this.maskLayer);
        Tween.to(this.optBetValue, { scaleY: 1 }, 300, Ease.backOut, Handler.create(this, ()=> {
            this.isShowedBet = true;
        }));
        for (let i=0,len=this.optBetValue.numChildren; i<len; i++) {
            let $btnOpt = this.optBetValue.getChildAt(i), itemVal = parseInt($btnOpt.getChildAt(0).text);
            $btnOpt.isForbid = itemVal>getMaxBet();
        }
    }

    hideBetPanle() {
        if (!this.isShowedBet) return;
        Tween.to(this.optBetValue, { scaleY: 0 }, 150, Ease.sineIn, Handler.create(this, ()=> {
            this.isShowedBet = false;
            this.maskLayer.removeSelf();
        }));
    }

}
