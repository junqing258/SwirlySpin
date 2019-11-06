
import Keyboard from "utils/Keyboard";
import { popup } from "utils/decorators";
import { toRecharge } from "utils/util";
import { DButtonDecorator as $btn, DInputDecorator as $input } from "common/Custom";
import Tips from "popup/Tips";

const { Event } = Laya;
const ITEMS_Val = [10, 50, 100, 500];

@popup
export default class RechargePopup extends ui.popup.RechargeUI {

    constructor() {
        super();
        this.init();
    }

    getAsset() {
        return [
            { url: "popup/bg_1.png", type: "image" },
            { url: "res/atlas/recharge.atlas", type: "atlas" }
        ];
    }

    set curItem(val) {
        if (this._curItem>=0)  this.goodList.getChildAt(this._curItem).skin = "recharge/item_d.png";
        if (val>=0) this.goodList.getChildAt(val).skin = "recharge/item_c.png";
        this._curItem = val;
        if (val>=0) {
            let _amoutVal = ITEMS_Val[val];
            if (_amoutVal!==this.amountVal) this.amountVal = _amoutVal;
        }
        this.showInted = true;
    }
    get curItem() {
        return this._curItem;
    }

    set amountVal(val) {
        let itemindex = ITEMS_Val.indexOf(Number(val));
        if (this.curItem!==itemindex) this.curItem = itemindex;
        this._amountVal = val;
        this.input.text = this._amountVal;
        if (this.showInted) {
            
        }
    }
    get amountVal() {
        return this._amountVal;
    }

    init() {
        let { goodList, input } = this;
        $btn(this.btnClose).on(Event.CLICK, this, this.close);
        $btn(this.btnSure).on(Event.CLICK, this, ()=> {
            if (parseInt(this.amountVal)) {
                this.close();
                toRecharge(parseInt(this.amountVal));
            }
            else Tips.getInstance().show("请输入大于0的整数");
        });

        this.rechargeTips.text = rechargeContent;

        for (let i=0,len=this.goodList.numChildren; i<len; i++) {
            let item = this.goodList.getChildAt(i);
            item.on(Event.CLICK, this, ()=> {
                this.curItem = i;
            });
        };

        $input(input);
        this.inputWrap.on(Event.CLICK, input, input.focusIn);
        input.value = input.text|0;
        input.on(Event.FOCUS, input, () => {
            let { stage, Tween } = Laya;
            input.text = input.value = "";
            let keyboard = Keyboard.getInstance({
                maxLength: 8,
                curVal: input.value
            });
            input.set({ color: "#652f1b" });
            
            if (!keyboard.bindInput) {
                keyboard.bindInput = true;
                Keyboard.getInstance().on("INPUT_VALUE", this, value => {
                    input.value = value;
                    this.amountVal = value;
                });
            }

            var ty = this.y, zy;
            keyboard.once("open", this, () => {
                zy = stage.height - keyboard.height - this.height*0.85 + this.pivotY;
                if (zy < ty) Tween.to(this, { y: zy }, 150);
            });

            keyboard.once("close", this, () => {
                input.focusOut();
                if (!input.value) {
                    input.text = "请输入大于0的整数";
                    input.set({ color: "#a87664" });
                }
                if (zy !== ty) Tween.to(this, { y: (stage.height - this.height) / 2  + this.pivotY}, 150);
            });

            keyboard.open(input.value);
        });

    }

    popup() {
        if (window.qudao_user_flag == 1) {
            location.href = qudao_interchange_url;
            return this;
        }
        if(GM.appStorePay == 1 && (window.wltgame && wltgame.suportStorePay == 1) || GM.appStorePay == 2) {
            location.href = "/?act=ios_applepay&st=applepay_game_vertical&gameId=" + GM.gameId + "&redirect_uri=" + redirect_uri;
            return this;
        }
        this.showInted = false;
        this.curItem = 2;
        super.popup();
    }

}
