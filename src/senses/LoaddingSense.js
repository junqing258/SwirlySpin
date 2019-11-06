
import SenseManager, { sense } from "utils/SenseManager";
import { MASTER_ASSET, COMMON_ASSET } from "const/assets";
import { getInitGameInfo, getDataByKey } from "ctrl/playCtrl";
import MasterSense from "senses/MasterSense";
import CloudSense from "senses/CloudSense";
import BonusSense from "senses/BonusSense";
import WinBonSense from "senses/WinBonSense";
import Confirm from "popup/Confirm";
import Tips from "popup/Tips";
import PublicModule from "ctrl/PublicModule";
import Sound from "common/Sound";
import { createSkeleton } from "utils/util";

const { Stage, Handler, Sprite, Tween, Event } = Laya;

@sense("/loadding", false)
export default class LoaddingSense extends ui.senses.LoaddingUI {

    constructor() {
        super();
        this.skybg = createSkeleton("ani/sky/loadbg");
        this.skybg.x = 667;
        this.addChildAt(this.skybg, 0);
        this.skybg.play(0, true);
        this.resizable(()=> {
            this.height = Laya.stage.height;
            this.skybg.y = Laya.stage.height/2;
        });
        this.progressBar.width = 0;
    }

    didMount() {
        this.progressVal = this.prgNum = 0;
        this.listenProgress();

        let asset = [].concat(COMMON_ASSET);

        let startTime = Date.now();
        let router = "/master";
        getInitGameInfo().subscribe(data=> {
            switch(parseInt(data.game_status)) {
                case 2:
                    router = "/cloud";
                    asset = asset.concat(CloudSense.prototype.getAsset());
                    break;
                case 3:
                case 4:
                case 5:
                case 6:
                    router = "/bonus";
                    asset = asset.concat(BonusSense.prototype.getAsset());
                    break;
                case 1:
                default:
                    router = "/master";
                    asset = asset.concat(MasterSense.prototype.getAsset());
                    break;
            }
            this.router = router;
            this.leftPoint = Number(data.left_point);
            Laya.loader.load(asset, Handler.create(this, null), Handler.create(this, this.onloading, null, false));
        }, error=> {
            this.router = "/master";
            asset = asset.concat(MasterSense.prototype.getAsset());
            Laya.loader.load(asset, Handler.create(this, null), Handler.create(this, this.onloading, null, false));
            Confirm.getInstance().show(`系统异常了`);
        });

    }

    onloading(progress) {
        this.progressVal = progress;
    }

    listenProgress() {
        if (this.prgNum < this.progressVal) {
            this.prgNum += 0.01;
            this.progressBar.width = 850 * this.prgNum;
            this.progressLabel.text = `光速加载中...${ parseInt((this.prgNum)*100) }%`;
        }
        if (this.prgNum<0.99) {
            Laya.timer.frameOnce(1, this, this.listenProgress);
        } else {
            this.progressBar.width = 850;
            this.progressLabel.text = `光速加载中...100%`;
            Sound.initial();
            SenseManager.load(this.router, null, ()=> {
                let delay = 0;
                if (this.router === "/master" && getDataByKey("BET_CALCULATE")==true) {
                    delay = 750;
                    Laya.timer.once(500, null, ()=> {
                        Tips.getInstance().popup(`当前默认投币额为${ getDataByKey("bet") }`);
                    });
                }
                if (this.leftPoint) {
                    Laya.timer.once(500+delay, null, ()=> {
                        Confirm.getInstance().show(`上局获得${this.leftPoint}奖励，已发至您的账户了`);
                    });
                }
                PublicModule.init();
            });
        }
    }

}
//