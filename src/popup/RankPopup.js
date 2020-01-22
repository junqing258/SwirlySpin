import socket from "ctrl/socket";
import { popup } from "utils/decorators";
import { DButtonDecorator as $btn } from "common/Custom";
import { checkLogin, toLogin, ellipsis, getUserId } from "utils/util";

const { Event, Handler } = Laya;

@popup
export default class RankPopup extends ui.popup.RankUI {

    getAsset() {
        return [
            { url: "popup/bg_1.png", type: "image" },
            { url: "rank/inner_wrap.png", type: "image" },
            { url: "res/atlas/rank.atlas", type: "atlas" }
        ];
    }

    constructor() {
        super();
        this.init();
    }

    init() {
        $btn(this.btnClose).on(Event.CLICK, this, this.close);
        this.rankTypeList.vScrollBarSkin = this.rankMyList.vScrollBarSkin = "";
        
        this.rankTab.selectHandler = new Laya.Handler(this, (index)=> {
            switch(index) {
				case 0:
                case 1:
                case 2:
                    this.rankContent.selectedIndex = 0;
                    this.setTypeRank(index);
                    break;
                case 3:
                    this.rankContent.selectedIndex = 1;
                    this.setMyRecord();
                    break;
            }
        });

        this.rankTypeList.renderHandler = new Handler(this.rankTypeList, function(cell, index) {
            let { rankNum } = cell.dataSource;
            if (Number(rankNum)<=3) {
                let rankIcon = cell.rankIcon = new Laya.Image(`rank/r${rankNum}.png`);
                rankIcon.pos(75, 5);
                cell.addChild(rankIcon);
            } else if (cell.rankIcon) {
                cell.rankIcon.destroy();
            }
        });
        
        this.loginTips. underline = true;
        this.loginTips.on(Event.CLICK, this, ()=> {
            switch(this.loginTips.status) {
                case 0:
                    return toLogin();
                case 1:
                case 2:
                case 3:
                    return this.close();
            }
        });

    }

    setTypeRank(index) {
        if (checkLogin()) {
            this.tFooter.visible = true;
            this.loginTips.text = "正在加载...";
        } else {
            this.tFooter.visible = false;
        }
    }

    setTypeRank(index) {
        let listPanle = this.rankTypeList;
        listPanle.array = [];
        let type = ["day", "week", "month"][index];
        this.setPrompt("正在加载...");
        this.tFooter.visible = false;
        this.loginTips.visible = false;
        this.loginTips.text = checkLogin()? "正在加载...": "您还未登录，请登录获取排行榜信息!";
        this.loginTips.status = checkLogin()? 1: 0;
        let url =  `/?act=game_gamecommon&st=get_rank&gameAct=game_zuma&userId=${ getUserId() }&type=${type}`;
        $.ajax({
            url: url,
            success: (rep)=> {
                if (rep.code|0==0||rep.statusCode|0==0) {
                    if (this.rankTab.selectedIndex!==index) return;
                    if (!(rep.list&&rep.list.length)) {
                        this.setPrompt("暂无记录...");
                    } else {
                        this.setPrompt(null);
                        let list = rep.list.map((v,i) => {
                            return {
                                "rankNum": v.rank,
                                "userName": ellipsis(v.nickName, 12),
                                "prizeAmout": parseInt(v.amount),
                                "trend": parseInt(v.rank_trend)-1
                            };
                        });
                        listPanle.array = list;
                    }

                    if (checkLogin()) {
                        let { myRank, myAmount, myName, myRankTrend } = rep;
                        if (!myRank) {
                            this.tFooter.visible = false;
                            this.loginTips.visible = true;
                            this.loginTips.text = "您还未进入排行榜，赶紧游戏冲击榜单吧！";
                            this.loginTips.status = 3;
                            return;
                        }
                        this.tFooter.visible = true;
                        this.loginTips.visible = false;
                        this.tFooter.getChildByName("userName").text = ellipsis(myName||GM.userName, 12);
                        this.tFooter.getChildByName("rankNum").text = parseInt(myRank) || ">50";
                        this.tFooter.getChildByName("prizeAmout").text = parseInt(myAmount) || "0";
                        let noTrend = this.tFooter.getChildByName("no_trend"),
                            trandClip = this.tFooter.getChildByName("trend");
                        noTrend.visible = !myRankTrend;
                        trandClip.visible = !!myRankTrend;
                        if (myRankTrend) trandClip.index = parseInt(myRankTrend)-1;
                    } else {
                        this.loginTips.visible = true;
                        this.loginTips.text = "您还未登录，请登录获取排行榜信息!";
                        this.loginTips.status = 0;
                    }
                } else {
                    this.setPrompt("暂无记录...");
                    this.tFooter.visible = false;
                    this.loginTips.text = "暂无游戏记录，赶紧游戏获得奖励吧！";
                }
            },
            error:()=> {
                this.setPrompt("暂无记录...");
                this.tFooter.visible = false;
                this.loginTips.text = "暂无游戏记录，赶紧游戏获得奖励吧！";
            }
        });
    }

    setMyRecord() {
        let listPanle = this.rankMyList;
        listPanle.array = [];
        if (!checkLogin()) {
            this.setPrompt("您暂未登录，点击登录", toLogin, true);
            return false;
        }
        this.setPrompt("正在加载...");

        socket.once("myPrizeList", rep=> {
            if (rep.code|0==0) {
                if (!(rep.res.list&&rep.res.list.length)) {
                    return this.setPrompt("暂无游戏记录，赶紧游戏获得奖励吧！");
                }
                this.setPrompt(null);
                    let list = rep.res.list.map((v,i) => {
                        return {
                        "rankNum": i+1,
                        "prizeAmout": parseInt(v.amount || v.total_prize),
                        "timeStamp": v.raw_add_time
                        };
                    });
                listPanle.array = list;
            } else {
                this.setPrompt("暂无游戏记录，赶紧游戏获得奖励吧！");
            }
        });
        socket.send("myPrizeList");
    }

    setTopRich() {
        $.ajax({
            url: `/?act=game_gamecommon&st=get_rich&gameAct=game_zuma`,
            success: rep=> {
                let list = rep.list || [];
                for(let i=0; i<3; i++) {
                    let item = this[`rich${i}`];
                    let nameLable = item.getChildAt(1),
                        amountLable = item.getChildAt(2);
                    let data = list[i];
                    if (data) {
                        nameLable.set({ y: 20, text: ellipsis(data.nickName, 7)  });
                        amountLable.set({ text: data.amount });
                    } else {
                        nameLable.set({ y: 38, text: "虚位以待" });
                    }
                }
            }
        });
        
    }

    setPrompt(msg, cb, hasLine) {
        if (msg) {
            this.tPrompt.text = msg;
            this.tPrompt.visible = true;
        } else {
            this.tPrompt.text = "";
            this.tPrompt.visible = false;
        }
        this.tPrompt.__cb = cb; 
        this.tPrompt.underline = !!hasLine;
        if (!this.__binedPrompt) {
            this.__binedPrompt = true;
            this.tPrompt.on(Event.CLICK, this, ()=> {
                if (typeof this.tPrompt.__cb==="function") this.tPrompt.__cb();
            });
        }
    }

    popup() {
        this.rankTab.selectedIndex = 0;
        this.setTypeRank(0);
        this.setTopRich();
        super.popup();
    }

}