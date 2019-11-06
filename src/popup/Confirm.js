
import { getCharLength } from "utils/util";
import { DButtonDecorator as $btn, DButton } from "common/Custom";

const { Event } = Laya;

export default class Confirm extends ui.popup.ConfirmUI {

    constructor() {
        super();
        this.isConfirm = true;
        this.init();
    }

    static getInstance() {
        if (!this.instance || this.instance.destroyed) this.instance = new this();
        return this.instance;
    }

    init() {
        $btn(this.btnClose).on(Event.CLICK, this, ()=> this.close());
        $btn(this.btnCancel).on(Event.CLICK, this, ()=> this._cancelCallback());
        $btn(this.btnSure).on(Event.CLICK, this, ()=> this._sureCallback());
    }

    show(msg, props) {
        return this.popup(msg, props);
    }

    popup(msg, props) {
        // if (this.showed) return console.warn(msg);  
        props = props || { type: 1 };
        props.type = props.type || 1;
        this.showed = true;
        let { btnSure, btnCancel, msgCont, titleCont } = this;
        msgCont.align = (props.align) || (getCharLength(msg)>=16*2? "left": "center");
        msgCont.text = msg;
        if (props.title) {
            titleCont.visible = true;
            titleCont.text = props.title;
        } else {
            titleCont.visible = false;
        }
        this.curType = props.type;
        switch(props.type) {
            case 2:
                btnSure.skin = "popup/b_sure.png";
                btnCancel.visible = true;
                btnSure.centerX = 129;
                break;
            case 4:
                btnSure.skin = "popup/b_sure.png";
                btnCancel.visible = true;
                btnCancel.skin = "popup/b_mind.png";
                btnSure.centerX = 129;
                break;
            case 5:
                btnSure.skin = "popup/b_recharge.png";
                btnCancel.visible = false;
                btnSure.centerX = -4;
                break;
            case 1:
            default:
                btnSure.skin = "popup/b_sure.png";
                btnCancel.visible = false;
                btnSure.centerX = -4;
                break;
        }
        this._sureCallback = typeof props.sure==="function"? function() { 
            Laya.Dialog.manager.once("close", this, props.sure);
            this.close() 
        }: this.close.bind(this);
        this._cancelCallback = typeof props.cancle==="function"? function() { 
            Laya.Dialog.manager.once("close", this, props.cancle);
            this.close() 
        }: this.close.bind(this);
        this._closeCallback = props.close;
        super.popup();

    }

    counTick() {
        this.countdown--;
        let { countLable } = this;
        if (this.countdown>=0) {
            countLable.text = this.countdown;
        } else {
            this.close();
        }
    }

    close() {
        Laya.timer.clearAll(this);
        this.showed = false;
        if (typeof this._closeCallback==="function") {
            Laya.Dialog.manager.once("close", this, ()=> {
                this._closeCallback();
            });
        }
        super.close();
    }

}


/*setTimeout(()=> {
    Confirm.getInstance().popup("您的余额不足了，是否充值？", {
        type: 4
    });
}, 3000);*/
