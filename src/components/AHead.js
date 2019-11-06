
import { DButtonDecorator as $btn } from "common/Custom";
import { subscribeStore, setStoreState, getDataByKey, PubSub, queryUserAccount } from "ctrl/playCtrl";
import { toThousands, ellipsis, checkLogin, toLogin, createSkeleton, appGoback } from "utils/util";

import RankPopup from "popup/RankPopup";
import RechargePopup from "popup/RechargePopup";
import HelpPopup from "popup/HelpPopup";

const { Tween, Handler, Ease, Event } = Laya;

export default class AHead extends ui.fragment.HeadUI {

    static getInstance() {
        if (!this.instance||this.instance.destroyed) this.instance = new this();
        return this.instance;
    }
    
    constructor() {
        super();
        this.zOrder = 3;
        this.init();
    }

    init() {
        let stage = Laya.stage;
        
        subscribeStore("gameBase", (data)=> {
            data = data.toJS();
            let { gameScore, TCoin } = data;
            this.yuLabe.text =  ellipsis( toThousands( gameScore), 13) ;
            this.douLabe.text = ellipsis( toThousands ( TCoin), 11) ;
        }, this);

        this.$btnBack = $btn(this.btnBack);
        subscribeStore("gameStatus", data=> {
            switch (data) {
                case "PLAY_BONUS":
                    this.$btnBack.isForbid = true;
                    break;
                case "PLAY_INIT":
                case "PLAY_END":
                    this.$btnBack.isForbid = false;
                    break;
            }
        }, this);

        this.once(Event.ADDED, this, ()=> {
            this.menuPanle.zOrder = 20;
            this.parent.addChild(this.menuPanle);
            
            let maskLayer = this.maskLayer = new Laya.Sprite();
            maskLayer.zOrder = 19;
            maskLayer.on(Event.CLICK, this, ()=> {
                if (this.isShowedMenu) this.hideMenu();
            });
            this.resizable(()=> {
                maskLayer.size(stage.width, stage.height);
            });
        });

        this.initEvent();
        this.initCommon();
    }

    initCommon() {
        // home按钮
        if (GM && GM.backHomeUrl) {
			this.btnHome.visible = true;
			$btn(this.btnHome).on(Event.CLICK, this, () => {
				return location.href = GM.backHomeUrl;
			});
		} else {
			this.btnHome.visible = false;
        }
        
        if (GM && GM.isShowBtnBack_out) {
            this.$btnBack.visible = true;
            this.$btnBack.on(Event.CLICK, this, appGoback);
        } else {
            this.$btnBack.visible = false;
            this.btnRank.x -= 125;
        }

        // 余额
        if (window.GM && GM.popBalanceShow_out) {
            this.yuInfo.on(Event.CLICK, this, () => {
                if (!checkLogin()) return;
                GM.popBalanceShow_out();
                queryUserAccount();
            });
        }

        this.menuPanle.scaleY = 0;

        let { menuPanle, btnNotice, redPoint, m_line2, btnShare } = this;

        const m_lines = menuPanle['_childs'].filter(v=> v.name==='m_line');
        const icon_btns = ['btnVoice', 'btnHelp', 'btnNotice', 'btnShare'];
        const _resizePanel = ()=> {
            let h = 403, t = m_lines.length-1;
            icon_btns.forEach((key, i)=> {
                if (!this[key].visible) {
                    h -= 100;
                    m_lines[t--].visible = false;
                } else if (i>=1) {
                    m_lines[i-1].visible = true;
                }
            });
            menuPanle.height = h;
        };

        // 公告
        let initNotice = true;
        ["btnNotice"].forEach(key=> this[key].visible = false);
        redPoint.visible = false;
        this['btnShare'].y -= 100;

		if (window.GM && GM.noticeStatus_out) {
			GM.noticeStatus_out((data)=> {
                data = data || {};
                if (data.isShowNotice) {
                    ["btnNotice"].forEach(key=> this[key].visible = true);
                    if (initNotice) {
						initNotice = false;
                        this.btnNotice = $btn(btnNotice);
						this.btnNotice.on(Event.CLICK, self, () => {
	                    	this.hideMenu();
	                        redPoint.visible  = false;
	                        if (GM.noticePopShow_out) GM.noticePopShow_out();
	                    });
                    }
                    redPoint.visible  = !!data.isShowRedPoint;
                    this['btnShare'].y += 100;
                } else {
                    ["btnNotice"].forEach(key=> this[key].visible = false);
                    redPoint.visible  = false;
                }
                _resizePanel();
            });
		}
        
        this['btnShare'].visible = (window.GM && GM.isShowInvite && GM.isShowInvite());
        
        this.btnShare = $btn(btnShare).on(Event.CLICK, self, () => {
            this.hideMenu();
            if (GM.showInvitePop) GM.showInvitePop();
        });
        
        _resizePanel();
    }

    initEvent() {
        $btn(this.btnMenu).on(Event.CLICK, this, ()=> this.showMenu());
        $btn(this.btnRank).on(Event.CLICK, this, ()=> RankPopup.getInstance().popup());
        $btn(this.btnRecharge).on(Event.CLICK, this, ()=> {
            if (!checkLogin()) return toLogin();
            RechargePopup.getInstance().popup();
        });
        $btn(this.btnHelp).on(Event.CLICK, this, ()=> {
            HelpPopup.getInstance().popup();
            this.hideMenu();
        });

        $btn(this.btnVoice).on(Event.CLICK, this, ()=> {
            let voiceOn = getDataByKey("voiceOn");
            setStoreState({ "voiceOn": !voiceOn });
            if (GM && GM.muteAudio) GM.muteAudio.setMuteState(voiceOn);
        });
        subscribeStore("voiceOn", data=> {
            this.btnVoice.skin = data? "fragment/m_voice_on.png": "fragment/m_voice_off.png";
        }, this);
    }

    showMenu() {
        if (this.isShowedMenu) return;
        this.isShowedMenu = true;
        if (this.parent) this.parent.addChild(this.maskLayer);
        Tween.to(this.menuPanle, { scaleY: 1 }, 250, Ease.backOut, Handler.create(this, ()=> {

        }));
    }

    hideMenu() {
        if (!this.isShowedMenu) return;
        this.isShowedMenu = false;
        Tween.to(this.menuPanle, { scaleY: 0 }, 120, Ease.sineIn, Handler.create(this, ()=> {
            this.maskLayer.removeSelf();
        }));
    }

}
