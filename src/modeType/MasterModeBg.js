import { PubSub, subscribeStore } from "ctrl/playCtrl";
import { createSkeleton, randomNum } from "utils/util";
import { JELLO } from "const/config";

import Background from "components/Background";
import SpinBase from "components/SpinBase";
import Sound from "common/Sound";

import HelpPopup from "popup/HelpPopup";

const { Tween, Ease, Event } = Laya;



export default class MasterModeBg extends Background {

    init() {
        let self = this, stage = Laya.stage;
        let bgtexture = Laya.loader.getRes("bg/bg.jpg");
        this.pivot(stage.width/2, stage/2);
        this.pos(stage.width/2, stage/2);
        this.once(Event.ADDED, this, ()=> {
            this.initTreeAndGrass();
            this.initCharacter();
            this.resizable(()=> {
                let centerY = stage.height/2;
                this.character.y = stage.height - 375;
                this.grass.y = stage.height - 375;
                this.tree.y = stage.height/2+220;
                this.graphics.clear();
                this.graphics.drawTexture(bgtexture, 0 , Laya.stage.height/2-667);
                this.pivotY = this.y = centerY;
                this.bgcloud.y = centerY;
                this.keystore.y = Laya.stage.height - 240;
            });
        });
        
        PubSub.on("SHOCK_LINE", self, shockLine);
        
        let i = 0, interval = 60, degree = 1.0;
        function shockLine(len, starLen) {
            if (self.destroyed) return PubSub.off("SHOCK_LINE", shockLine);
            degree = Math.min(4, len / 2);
            i = 0;
            Laya.timer.loop(interval, self, loop);
            ["grass", "grasstree", "tree"].forEach(key=> {
                let ani = self[key];
                ani.once(Event.STOPPED, ani, ()=> ani.play(0, true));
                ani.play(1, false);
            });
        }

        
        function loop() {
            if (i>=JELLO.length) return Laya.timer.clear(self, loop); 
            let c = JELLO[i] * degree;
            let sc = (1 + Math.abs(c/90)) * 1;
            Tween.to(self, { rotation: c*1.2 , scaleX: sc, scaleY: sc }, interval, Ease.sineOut, null, 0, true);
            i++;
        }

    }

    initTreeAndGrass() {
        let stage = Laya.stage, wrapView = this.parent;

        let grass = this.grass = createSkeleton("ani/master/grass");
        grass.zOrder = 6;
        grass.x = 667;
        wrapView.addChild(grass);
        grass.play(0, true);

        let grasstree = this.grasstree = createSkeleton("ani/master/grass_tree");
        grasstree.zOrder = 1;
        grasstree.pos(1200, 255/2);
        wrapView.addChild(grasstree);
        grasstree.play(0, true);

        let tree = this.tree = createSkeleton("ani/master/tree");
        tree.pos(1250, stage.height/2+220);
        wrapView.addChild(tree);
        tree.play(0, true);

        let bgcloud = this.bgcloud = createSkeleton("ani/master/bg_cloud");
        bgcloud.pos(667, Laya.stage.height/2);
        this.addChild(bgcloud);
        bgcloud.play(0, true);

        let keystore = this.keystore = new Laya.Image("fragment/key_wrap.png");
        keystore.zOrder = 10;
        keystore.x = 1022;
        let keycount = new Laya.Text();
        keycount.set( { font: "key_count", width:117, y: 48, align: "center" } );
        
        keystore.addChild(keycount);
        wrapView.addChild(keystore);

        keystore.on(Event.CLICK, this, ()=> {
            HelpPopup.getInstance().popup(2);
        });

        subscribeStore("keyCount", (data)=> {
            keycount.text = data>=1000? "999+": data;
        }, this);

    }

    initCharacter() {
        let wrapView = this.parent;
        let character = this.character = createSkeleton("ani/master/character");
        character.zOrder = 5;
        character.set({ x: 667, y: 375 });
        wrapView.addChild(character);
        this.changeCharacterStatus("sit_down");

        PubSub.on("WIN_COINS", this, this.changeCharacterStatus, ["stand_up"]);
    }

    changeCharacterStatus(status) {
        if (this.destroyed) return PubSub.off("WIN_COINS", this);
        let character = this.character; 
        switch (status) {
            case "sit_down":
                character.play(status, true);
                break;
            case "stand_up":
                Sound.play("play_over");
                character.once(Event.STOPPED, this, this.changeCharacterStatus, ["stand_stay"]);
                character.play(status, false);
                break;
            case "stand_stay":
                character.once(Event.STOPPED, this, this.changeCharacterStatus, ["sit"]);
                character.play(status, false);
                break;
            case "sit":
                character.once(Event.STOPPED, this, this.changeCharacterStatus, ["sit_down"]);
                character.play(status, false);
                break;
        }
        this.characterStatus = status;
    }


};