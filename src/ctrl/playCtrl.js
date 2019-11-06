import socket from "ctrl/socket";
import { NO_WINNING } from "const/config";
import { getUserId, checkLogin, toLogin } from "utils/util";
import TipLoadding from "popup/TipLoadding";
import { checkError } from "./errorHandler";
import Confirm from "popup/Confirm";

export const PubSub = new Laya.EventDispatcher();

////////////////////////////////////////////////////////////////////////////////////////
//// State
////////////////////////////////////////////////////////////////////////////////////////
let keyCount = 0;

let initState = {
    gameStatus: "PLAY_INIT",
    gameBase: {
        "gameScore": 0,
        "TCoin": 0
    },
    bet: 100,
    winAll: 0,
    bonusWinAll: 0,
    keyCount: 0,
    modeType: 1,
    freeNum: 0,
    autoNum: 0,
    unlock: {},
    freeInfo: {},
    voiceOn: false
};

let gameStoreSub = new Rx.Subject();
const gameStore$ = gameStoreSub.scan((state, val) => state.merge(val), Immutable.fromJS(initState));
export function subscribeStore(key, callback, component) {
    let observable = gameStore$;
    let subscription = observable.subscribe(state => {
        let data = state.get(key);
        if (component && component.destroyed) {
            subscription.dispose();
            subscription = null;
        } else if (subscription._prestate !== data) {
            subscription._prestate = data;
            callback.call(component, data, state);
        }
    });
    subscription.next(observable.seed);
    return subscription;
}


export function setStoreState(data) {
    gameStore$.seed = gameStore$.seed.merge(data);
    gameStoreSub.onNext(data);
    return true;
}

export function getDataByKey(key) {
    return gameStore$.seed.get(key);
}

////////////////////////////////////////////////////////////////////////////////////////
//// Controller
////////////////////////////////////////////////////////////////////////////////////////

export function addWinAll(data) {
    setStoreState({ "winAll": parseInt(getDataByKey("winAll")) + parseInt(data) });
}

export function takeWin() {
    let gameBase = getDataByKey("gameBase");
    let { TCoin, TScore, gameScore } = gameBase.toJS();
    let winAll = getDataByKey("winAll");
    gameBase = gameBase.merge({
        "gameScore": gameScore+winAll,
        "TScore": TScore+winAll
    });
    setStoreState({ "winAll": 0, "gameBase": gameBase });
    winAll && queryUserAccount();
}

export function getInitGameInfo() {
    return Rx.Observable.create(observer => {
        if (!checkLogin()) {
            observer.onNext({ game_status: "1" });
            observer.onCompleted();
            return;
        }
        socket.once("initGame", rep => {
            if (rep.code == "0") {
                let data = rep.res.data;
                let m = Math.min(2, parseInt(data.game_status) - 1);
                let p = {
                    "gameStatus": ["PLAY_INIT", "PLAY_CHOSE", "PLAY_BONUS"][m],
                    "modeType": parseInt(data.game_status),
                    "keyCount": parseInt(data.my_key),
                    "unlock": data.unlock,
                    "freeInfo": data.freeInfo,
                    "freeNum": parseInt(data.left_num),
                    "winAll": parseInt(data.total_point)
                };
                if (data.bet_point) {
                    Object.assign(p, { "bet": parseInt(data.bet_point), "BET_CALCULATE": false });
                    localStorage.setItem(`bonusStatus${ GM.gameId + getUserId() }`, 0);
                }
                setStoreState(p);
                observer.onNext(data);
                observer.onCompleted();
            } else {
                observer.onError(newError({ message: "网络异常了", code: "1" }) );
            }
        });
        let status = Number(localStorage.getItem(`bonusStatus${ GM.gameId + getUserId() }`));
        socket.send("initGame", { status });
    }).timeout(10000, newError({ message: "网络异常了", code: "4" })).doOnError(err=> {

    });
}
let playStartimer;
export function playStart() {
    return Rx.Observable.create(observer => {
        let betAmount = getDataByKey("bet");
        if (!checkLogin()) {
            observer.onCompleted();
            return toLogin();
        }
        if (!takeOutAmount(betAmount)) {
            observer.onError(newError({ message: "余额不足", code: "5" }) );
            observer.onCompleted();
            return false;
        }
        let startLine = Date.now(), delayed = false;
        playStartimer = setTimeout(()=> {
            delayed = true;
            TipLoadding.getInstance().show();
        }, 1500);
        socket.once("bet", rep=> {
            clearTimeout(playStartimer);
            let later = 0;
            delayed && ( later = Math.max(0, 1800 - (Date.now() - startLine)) );
            setTimeout(()=> {
                TipLoadding.getInstance().hide();
                if (rep.code == "0") {
                    let data = rep.res.data;
                    keyCount = parseInt(data.my_key);
                    observer.onNext(data);
                    let userid = getUserId();
                    localStorage.setItem(`defaultBet${GM.gameId + userid}`, betAmount);
                    observer.onCompleted();
                } else {
                    observer.onError(newError(rep));
                    queryUserAccount();
                }
            }, later);
        });
        let isAuto = getDataByKey("autoNum")>=1;
        socket.send("bet", {
            amount: betAmount,
            isAuto: Number(isAuto)
        });
    }).delay(100).timeout(10000, newError({ message: "网络异常了", code: "4" })).doOnError(err=> {
        setStoreState({ "autoNum": 0 });
        checkError(err);
        clearTimeout(playStartimer);
        TipLoadding.getInstance().hide();
        setTimeout(roundEnd, 100);
    });
}

export function bonusPlayStart() {
    return Rx.Observable.create(observer => {
        if (!checkLogin()) {
            observer.onNext({ "game_status": 1 });
            observer.onCompleted();
            return false;
        }
        socket.once("freeBet", rep => {
            if (rep.code == "0") {
                let data = rep.res.data;
                setStoreState({ "freeNum": parseInt(data.left_num)+1 });
                observer.onNext(data);
                observer.onCompleted();
            } else {
                observer.onError(newError(rep));
            }
        });
        socket.send("freeBet", { "gameType": getDataByKey("modeType") });
    }).delay(500).timeout(10000, newError({ message: "网络异常了", code: "4" }) ).doOnError(err=> {
        Confirm.getInstance().popup(err.message, {
            close: ()=> location.reload()
        });
    });
}

function takeOutAmount(amount) {
    let gameBase = getDataByKey("gameBase");
    let { TCoin, TScore, gameScore } = gameBase.toJS();
    if (TCoin >= amount) {
        TCoin -= amount;
    } else if (gameScore >= amount) {
        gameScore -= amount;
        TScore -= amount;
    } else {
        return false;
    }
    setStoreState({ gameBase: gameBase.merge({ gameScore, TCoin, TScore }) });
    return true;
}

export function roundEnd() {
    setStoreState({ 
        "gameStatus": "PLAY_END",
        "modeType": 1
    });
    takeWin();
    localStorage.setItem(`bonusStatus${ GM.gameId + getUserId() }`, 0);
    socketExec();
}

export function gameException(rep) {
    clearTimeout(playStartimer);
    TipLoadding.getInstance().hide();
    roundEnd();
    setStoreState({ "autoNum": 0 });
    queryUserAccount();
}

export function choiceBonusType(gameType) {
    return Rx.Observable.create(observer => {
        socket.once("choiceGame", rep => {
            if (rep.code == "0") {
                let data = rep.res.data;
                localStorage.setItem(`bonusStatus${ GM.gameId + getUserId() }`, 1);
                setStoreState({ 
                    "freeNum": data.free_num,
                    "modeType": data.gameType,
                    "gameStatus": "PLAY_BONUS"
                });
                observer.onNext(data);
                observer.onCompleted();
            } else {
                observer.onError(newError(rep));
            }
        });
        socket.send("choiceGame", { gameType });
    }).timeout(10000, newError({ message: "网络异常了", code: "4" }) );
}

export function getNoWinningGraph() {
    let d = NO_WINNING[Math.floor(Math.random() * NO_WINNING.length)];
    let modeType = getDataByKey("modeType");
    switch (String(modeType)) {
        case "1":
            d["1"] = "K";
            break;
        case "4":
            d["1"] = "CW";
    }
    return d;
}

export function getBetScope(value, minus) {
    let s = [0, 100, 1000, 10000, 100000, 500000, Infinity];
    let b = [10, 100, 1000, 10000, 100000];
    let i = minus ? s.findIndex(v => v >= value) : s.findIndex(v => v > value);
    return b[Math.max(0, Math.min(i - 1, b.length - 1))];
}

export function getDefaultBet() {
    let userid = getUserId(),
        betAmount = 200;
    if (userid) {
        betAmount = parseInt(localStorage.getItem(`defaultBet${GM.gameId + userid}`));
        if (betAmount) return betAmount;
        let gameBase = getDataByKey("gameBase"),
            gameScore = gameBase.get("gameScore"),
            TCoin = gameBase.get("TCoin");
        let b = Math.max(10, Math.min(500000, Math.max(gameScore, TCoin) * 0.01)),
            s = getBetScope(b);
        betAmount = b - b % s;
        setStoreState( {"BET_CALCULATE": true } );
        return betAmount;
    }
    return betAmount;
}

export function getMaxBet() {
    if (!checkLogin()) return 500000;
    let gameBase = getDataByKey("gameBase");
    let { TCoin, TScore, gameScore } = gameBase.toJS();
    let b = Math.min(Math.max(gameScore, TCoin), 500000),
        s = getBetScope(b);
    b = b - b%s;
    return b;
}

let baseInit = true, queryLock = false, isPlaying;
export function queryUserAccount(timeout) {
    if (!checkLogin()) return;
    let gameStatus;
    gameStatus = getDataByKey("gameStatus");
    isPlaying = (gameStatus!=="PLAY_INIT" && gameStatus!=="PLAY_END");
    if (!baseInit && (isPlaying||queryLock)) return;
    queryLock = true;
    setTimeout(()=> queryLock=false, 10000);
    $.ajax({
        url: `?act=game_gamebase&st=queryUserAccount&gameId=${gameId}&Type=1`,
        timeout: timeout || 5000,
        success: data=> {
            gameStatus = getDataByKey("gameStatus");
            isPlaying = (gameStatus!=="PLAY_INIT" && gameStatus!=="PLAY_END");
            if (!baseInit && (isPlaying || typeof data !== "object")) return;
            setStoreState({ gameBase: Immutable.fromJS(data) });
            if (baseInit) {
                baseInit = null;
                setStoreState({ bet:  getDefaultBet() });
            }
        }
    });
}
queryUserAccount(15000);
window.GM && ( GM.updateUserAmount = queryUserAccount );

// 处理人机游戏 socket的, 包括倒霉险、救济金等
export function socketExec(obj) {
    if (window.GM && GM.socket_RJ) {
        if (GM.socket_RJ.exec) {
            GM.socket_RJ.exec(obj);
        }
        var getMoney = GM.socket_RJ.getMoney;
        if( getMoney && getMoney() > 0 ) {
            queryUserAccount();
        }
    }
}

function newError(data) {
    let err = new Error(data.message || data.msg);
    err.code = data.code || data.statusCode;
    return err;
}

/*var d = new Date();
var hours = d.getHours(), seconds = d.getSeconds();
if (window.localStorage&&hours==16&&seconds%3===0&&!localStorage.getItem(">_<")) {
    console.log("\n%c{\\_/}\n(•-•)\n/つ%c♥%c♥%c♥ \n\n", "color:#ff66a5;", "color:#ff2424", "color:#ff2424", "color:#ff2424; padding:5px 0; font-size: 1.5em");
    localStorage.setItem(">_<", 1);
}*/