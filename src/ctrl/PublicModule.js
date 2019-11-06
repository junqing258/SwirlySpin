
import { PubSub, subscribeStore, setStoreState, roundEnd, gameException } from "ctrl/playCtrl";
import SenseManager from "utils/SenseManager";
import socket from "ctrl/socket";
import Confirm from "popup/Confirm";
import AwardsBroadcast from "popup/AwardsBroadcast";

export default class PublicModule {

    static init() {
        
        AwardsBroadcast.listenSocketRJ();

        socket.on("losePointRemind", rep=> {
            let res = rep.res;
            if (res&&(res.code|0===0)) {
                let obj = {
                    losepointlevel: `level${res.level}`,
                    losepointvalue: res.endTime
                };
                if (window.GM && GM.loseRemind) {
                    if (GM.loseRemind.check(obj)) {
                        setStoreState({ "autoNum": 0 });
                        setTimeout(gameException, 300);
                    }
                    GM.loseRemind.showLevel_1();
                }
            }
        });

        socket.on("losePointFreeze", rep=> {
            let res = rep.res;
            setStoreState({ "autoNum": 0 });
            setTimeout(gameException, 300);
            if (res&&(res.code|0===0)) {
                GM.jumpToHomePage && GM.jumpToHomePage("blacklist_disable");
            }
        });

        socket.on("userForbidden", rep=> {
            let res = rep.res;
            setStoreState({ "autoNum": 0 });
            setTimeout(gameException, 300);
            if (res&&(res.code|0===0)) {
                Confirm.getInstance().popup("游戏账号被禁用了");
            }
        });

        socket.on("gameRepair", rep=> {
            let res = rep.res;
            setStoreState({ "autoNum": 0 });
            setTimeout(gameException, 100);
            if (res&&(res.code|0===0)) {
                Confirm.getInstance().popup("系统维护中", {
                    align: "center",
                    close: ()=> location.reload()
                });
            }
        });


    }

}