import { popup } from "utils/decorators";
import { DButtonDecorator as $btn } from "common/Custom";

@popup
export default class HelpPopup extends ui.popup.HelpUI {
    
    constructor(){
        super();
        this.init();
    }

    getAsset() {
        return [
            { url: "popup/bg_1.png", type: "image" },
            { url: "help/1.png", type: "image" },
            { url: "help/2.png", type: "image" },
            { url: "help/3.png", type: "image" },
            { url: "help/4.png", type: "image" },
            // { url: "help/inner_wrap.png", type: "image" },
            { url: "res/atlas/help.atlas", type: "atlas" }
        ];
    }

    init(){
        $btn(this.closeBtn).on(Laya.Event.CLICK, this, ()=>{
            this.close();
        });

        $btn(this.dropBtn).on(Laya.Event.CLICK, this, ()=>{
            this.close();            
        });

        let slider = this.slider = new zsySlider(this.helpWarp);
        $btn(this.leftBtn).on(Laya.Event.CLICK, this, ()=>{
            slider.prev();
        });

        $btn(this.rightBtn).on(Laya.Event.CLICK, this, ()=>{
            slider.next();
        });
        window.slider = slider;
    }

    popup(index) {
        if (index||index===0) setTimeout(()=> this.slider.paginationHandler(index, false), 0);
        super.popup();
    }

    show(){
        super.popup();
    }

    close(){
        super.close();
    }
}