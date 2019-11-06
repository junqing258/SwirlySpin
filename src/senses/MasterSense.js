
import { MASTER_ASSET } from "const/assets";
import SenseManager, { sense } from "utils/SenseManager";
import { registeFnt, mixin } from "utils/util";
import MasterModeBg from "modeType/MasterModeBg";
import MasterMode from "modeType/MasterMode";
import AHead from "components/AHead";
import AFooter from "components/AFooter";
import Sound from "common/Sound";

const { Event } = Laya;

let inited = false;

@sense("/master")
export default class MasterSense extends Laya.Sprite {

    getAsset() {
        return MASTER_ASSET;
    }

    constructor() {
        super();
        this.height = Laya.stage.height;
        this.width = Laya.stage.width;
        this.init();
    }

    init() {
        let bgview = new MasterModeBg();
        this.addChild(bgview);

        let spin = this.spin = new MasterMode();;
        spin.pos(317+333, 750-725+338);
        this.addChild(spin);

        let head = AHead.getInstance();
        this.addChild(head);

        let footer = AFooter.getInstance();
        this.addChild(footer);

        let shareBtn = this.shareBtn = new Laya.Image("fragment/yaoqing.png");
        shareBtn.zOrder = 10;
        shareBtn.x = 1180;
        this.addChild(shareBtn);
        shareBtn.on(Event.CLICK, this, ()=> {
            if (GM.showInvitePop) GM.showInvitePop();
        });
        shareBtn.visible = (window.GM && GM.isShowInvite && GM.isShowInvite());

        this.resizable(()=> {
            this.height = Laya.stage.height;
            spin.y = this.height - 725 + 338;
            footer.y = this.height - 115;
            shareBtn.y = Laya.stage.height - 215;
        });
        spin.init();
    }

    didMount() {
        let i = 0;
        let spin = this.spin;
        let observable = Rx.Observable.fromLayaEvent(spin, Event.CLICK, this, ()=> i++);
        observable.throttle(1000).subscribe(val=> console.log(val));
    }

}