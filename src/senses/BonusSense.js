
import { BONUS_ASSET, BONUS_3_ASSET, BONUS_4_ASSET, BONUS_5_ASSET, BONUS_6_ASSET  } from "const/assets";
import SenseManager, { sense } from "utils/SenseManager";
import { registeFnt, mixin } from "utils/util";

import ABonusMode from "modeType/ABonusMode";
import ABonusModeBg from "modeType/ABonusModeBg";
import StarMode from "modeType/StarMode";
import BarMode from "modeType/BarMode";
import FieryMode from "modeType/FieryMode";
import MagicMode from "modeType/MagicMode";
import StarModeBg from "modeType/StarModeBg";
import BarModeBg from "modeType/BarModeBg";
import FieryModeBg from "modeType/FieryModeBg";
import MagicModeBg from "modeType/MagicModeBg";

import AHead from "components/AHead";
import AFooter from "components/AFooter";
import { bonusPlayStart, getDataByKey } from "ctrl/playCtrl";

let modeType;

@sense("/bonus")
export default class BonusSense extends Laya.Sprite  {

    getAsset() {
        modeType = getDataByKey("modeType");
        const a = [BONUS_3_ASSET, BONUS_4_ASSET, BONUS_5_ASSET, BONUS_6_ASSET][modeType-3];
        return BONUS_ASSET.concat(a);
    }

    constructor() {
        super();
        this.height = Laya.stage.height;
        this.width = Laya.stage.width;
        this.init();
    }
    
    init() {
        const BgMix = [StarModeBg, FieryModeBg, BarModeBg, MagicModeBg][modeType-3];
        let bgview = new BgMix();
        this.addChild(bgview);

        const ModeMix = [StarMode, FieryMode, BarMode, MagicMode][modeType-3];
        let spin = this.spin = new ModeMix();
        this.addChild(spin);

        let head = AHead.getInstance();
        this.addChild(head);

        let footer = AFooter.getInstance();
        this.addChild(footer);

        this.resizable(()=> {
            this.height = Laya.stage.height;
            footer.y = Laya.stage.height - 115;
            spin.y = this.height - 725 + 338;
        });
    }

    didMount() {
        this.constructor.prototype.hasLoaded = false;
        let delay = this.payload? 1800: 0;
        Laya.timer.once(delay, this, ()=> this.spin.init());
    }

}