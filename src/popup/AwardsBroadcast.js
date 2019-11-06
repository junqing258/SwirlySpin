
import { toThousands, checkLogin, ellipsis } from 'utils/util';
import { subscribeStore, getDataByKey } from 'ctrl/playCtrl';

const { Sprite, Event, Handler, Text, Tween, Ease, Skeleton, Templet } = Laya;

let msgList = [], checkTimer;
let inBroadcast = false;

export default class AwardsBroadcast extends Laya.Sprite {

	constructor() {
		super();
		this.loadImage("popup/broadcast.png");
	}

	static getInstance() {
        if (!this.instance || this.instance.destroyed) this.instance = new this();
        return this.instance;
    }

	initCont(userName, msg, amount) {
		let stage = Laya.stage;

		this.msgCont = new Sprite().set({ width: 300, height: 117, y: 18, x: 20 });
		this.addChild(this.msgCont);

		this.nameTitle = new Text();
		this.nameTitle.text = ellipsis(userName, 12);
		this.nameTitle.set({ stroke: 4, strokeColor: "#180000", fontSize: 24, color: "#ffee9f",  width: 300, align: "center" });
		this.msgCont.addChild(this.nameTitle);
		
		var contdata = msg.split(/(\[.*\])/);
		
		var msgSpan = new Sprite();
		msgSpan.width = 0;
		contdata.forEach( v => {
			let span = new Laya.Text();
			span.set({ stroke: 2, strokeColor: "#1d1328", fontSize: 24, y: 49 });
			if (/\[.*\]/.test(v)) {
				span.color = "#00ffde";
				span.text = v.match(/\[(.*)\]/)[1];
			} else {
				span.color = "#ffffff";
				span.text = v;
			}
			msgSpan.addChild(span);
			span.x = msgSpan.width;
			msgSpan.width += span.textWidth;
		});
		msgSpan.x = (this.msgCont.width-msgSpan.width)/2;
		this.msgCont.addChild(msgSpan);

		var amountCont = new Text();
		amountCont.set( { font: "key_count", width: 300, y: 88, align: "center" } );
		amountCont.text = amount;
		this.msgCont.addChild(amountCont);
		
	}

	show(userName, gameName, amount) {
		let props = props || {};
		this.set( { x: 1334-this.width, y: (Laya.stage.height-this.height)/2-100, scaleX: 1 } );
		this.initCont(userName, `在 [${gameName}] 斩获`, amount);
		Tween.from(this, { x: 1334+this.width/2 , scaleX: 0.1 }, 160, Ease.backOut );
		Laya.stage.addChild(this);
		Laya.timer.once(4500, this, this.close);
	}

	close() {
		Tween.to(this, { x: 1334+this.width/2 , scaleX: 0.1 }, 160, null, Handler.create(null, ()=> {
			this.msgCont.destroy();
			this.event("close");
			this.destroy();
		}) );
	}


	static listenSocketRJ () {
        if(window.GM && GM.socket_RJ && GM.socket_RJ.listen){
            GM.socket_RJ.listen('dajiangbobao', function(data) {
                var commMsg = data.commMsg || {};
                if (!commMsg || !commMsg.nickName || !commMsg.gameName) return;
                var { nickName, gameName, winAmount } = commMsg;
				msgList.push({ nickName,gameName,winAmount });
				let gameStatus = getDataByKey("gameStatus");
				if (gameStatus=="PLAY_INIT"||gameStatus=="PLAY_END"||gameStatus=="PLAY_BONUS") {
					AwardsBroadcast.checkAwardsMessage();
				}
            }, this);
		}
		
		subscribeStore("gameStatus", (data)=> {
            switch (data) {
				case "PLAY_START":
				case "PLAY_ING":
					break;
				case "PLAY_BONUS":
					clearTimeout(checkTimer);
					checkTimer = setTimeout(()=> AwardsBroadcast.checkAwardsMessage(), 4500);
                    break;
                case "PLAY_INIT":
				case "PLAY_END":
					clearTimeout(checkTimer);
					checkTimer = setTimeout(()=> AwardsBroadcast.checkAwardsMessage(), 2500);
                    break;
            }
        }, this);
    }

	static checkAwardsMessage() {
		clearTimeout(checkTimer);
		let gameStatus = getDataByKey("gameStatus");
		if (msgList.length>=1 && !inBroadcast) {
			inBroadcast = true;
			setTimeout(()=> inBroadcast = false, 5500);
			let commMsg = msgList.shift();
		 	let { nickName, gameName, winAmount } = commMsg;
			AwardsBroadcast.getInstance().show(nickName, gameName, winAmount);
		}
		if (gameStatus==="PLAY_END") {
			checkTimer = setTimeout( () => AwardsBroadcast.checkAwardsMessage(), 6000);
		}
	}

}