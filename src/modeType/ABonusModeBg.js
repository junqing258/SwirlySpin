import { PubSub, subscribeStore } from "ctrl/playCtrl";
import { createSkeleton, randomNum } from "utils/util";
import Sound from "common/Sound";
import Background from "components/Background";
import SpinBase from "components/SpinBase";
import HelpPopup from "popup/HelpPopup";

const { Tween, Ease, Event } = Laya;


export default class ABonusModeBg extends Background {

    initCom() {
        let keystore = this.keystore = new Laya.Image("fragment/key_wrap.png");
        keystore.zOrder = 10;
        keystore.x = 1022;
        let keycount = new Laya.Text();
        keycount.set( { font: "key_count", width:117, y: 48, align: "center" } );
        keystore.addChild(keycount);
        

        this.addChild(keystore);

        keystore.on(Event.CLICK, this, ()=> {
            HelpPopup.getInstance().popup(3);
        });

        subscribeStore("keyCount", (data)=> {
            keycount.text = data>=1000? "999+": data;
        }, this);

        PubSub.on("SHOCK_LINE", this, shockLine);
        
        function shockLine(len, starLen) {
            if (self.destroyed) return PubSub.off("SHOCK_LINE", shockLine);
        }


        let shareBtn = this.shareBtn = new Laya.Image("fragment/yaoqing.png");
        shareBtn.zOrder = 10;
        shareBtn.x = 1180;
        this.addChild(shareBtn);
        shareBtn.on(Event.CLICK, this, ()=> {
            if (GM.showInvitePop) GM.showInvitePop();
        });

        this.resizable(()=> {
            keystore.y = Laya.stage.height-210;
            shareBtn.y = Laya.stage.height-187;
        });
    }

};
