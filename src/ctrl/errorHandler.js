import Confirm from 'popup/Confirm';
import RechargePopup from 'popup/RechargePopup'; 
import SenseManager from "utils/SenseManager";

/**
 * [checkRes description]
 * @param  {[type]}   err      [description]
 * @param  {Function} cb       [description]
 * @param  {[type]}   args     [description]
 * @param  {Boolean}  callbackAfter [do Something after errorHandle]
 * @return {[type]}            [description]
 */
export function checkError(err, cb, args, callbackAfter) {
    let code = err.code || err.statusCode ||  err.errorCode;
    if (Number(code)===0) return true;
    if (typeof cb==="function") {
        if (callbackAfter) {
            errorHandle(err, cb);
        } else {
            args = args || [errorHandle.bind(null,err)];
            cb(...args);
        }
    } else {
        errorHandle(err);
    }
    return false;
}

export function errorHandle(res, callback) {
    let code = String(res.code || res.statusCode ||  res.errorCode);
    let msg = res.message || res.msg || "网络开小差啦！";
    callback = typeof callback==="function"? callback : function(){};
    switch(code) {
        case "NET_ERROR":
            Confirm.getInstance().popup("网络开小差啦！");//，已将本次投币返还，如未返还请刷新界面或重新进入游戏！
            break;
        case "loseRemind": //输分提醒
            if (window.GM && GM.loseRemind && GM.loseRemind.showLevel_1) {
                GM.loseRemind.showLevel_1();
            }
            break;
        // 系统异常
        case "1001":
            Confirm.getInstance().popup(msg, {
                close: ()=> location.reload()
            });
            break;
        case "1010":
            break;
        case "maintain":
            return location.reload();
        case "addict": //防沉迷
            break;
        case "100":
        case "003":
        case "121":
            window.GM && (GM.userLogged = false);
            break;
        case "81":
            location.href = "/?act=otp&st=otpPage";
            break;
        case "99999":
            // 黑名单
            GM.jumpToHomePage && GM.jumpToHomePage("blacklist_disable");
            break;
        case "1100":
        case "5":
        case "221":
            Confirm.getInstance().popup("您的余额不足了，是否充值？", {
                type: 5,
                sure: ()=> RechargePopup.getInstance().popup()
            });
            break;
        case "50":
            Confirm.getInstance().popup("土豪，您投币金额达到万里通单笔限额，请往万里通设置！");
            break;
        case "51":
            Confirm.getInstance().popup("您积分或欢乐值超过当日最大使用额度，若要继续游戏，请充值欢乐豆！", {
                type: 5,
                sure: ()=> RechargePopup.getInstance().popup()
            });
            break;
        case "6":
            Confirm.getInstance().popup("查询积分失败");
            break;
        case "114":
            Confirm.getInstance().popup("提示积分或欢乐值超过当日最大使用额度，若要继续游戏，请充值欢乐豆！");
            break;
        case "405":
        case "408":
            Confirm.getInstance().popup("游戏被禁用了");
            break;
        case "80":
            Confirm.getInstance().popup("很抱歉！经系统检测，您的账号存在异常，无法进行该游戏。如有疑问，请联系客服：4001081768");
            break;
        case "1000":
        case "100": //投币异常
        default:
            if (msg=="系统异常"||msg=="状态错误") msg = "网络开小差啦！";
            Confirm.getInstance().popup(msg);
            break;
    }
    callback();
}