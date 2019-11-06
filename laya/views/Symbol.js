import { COLORS, LAYOUT, BR_POINTS, SYMB_WIDTH, SYMB_HEIGHT, V_LAYOUT } from "const/config";
import Trench from "./Trench";
import { backOut, createSkeleton } from "utils/util";
import Sound from "common/Sound";
const { Tween, Event, Handler, Ease } = Laya;

const B_WIDTH = SYMB_WIDTH;
const B_HEIGHT = SYMB_HEIGHT;
const OFF_X = 38, OFF_Y = 26;
const KEY_POINTS = Object.keys(BR_POINTS).map(v=> Number(v)).sort((a,b)=> a-b);
const LAYOUT_COMBINE = LAYOUT.reduce((sc, cur) => sc.concat(cur));

const MAGIC_TYPES = ['A', 'B', 'C', 'D', 'E', 'F'];

export default class Symbol extends Laya.Sprite {

    constructor(color, number) {
        super();
        this.size(B_WIDTH, B_HEIGHT);
        this.pivot(B_WIDTH/2, B_HEIGHT/2);
        this.bombed = false;
        this.color = color;
        this.number = number || 0;
    }

    set color(val) {
        this._color = val;
        this.graphics.clear();
        if (this.ani) this.ani.destroy();
        this.zOrder = 1;
        if (val=="W") { // star
            let ani = this.ani = createSkeleton("ani/star");
            ani.pos(B_WIDTH/2-4, B_HEIGHT/2);
            ani.once(Event.STOPPED, this, ()=> ani.play("stay") );
            ani.play("create");
            this.addChild(ani);
        } else if (val=="K") { //key
            let ani = this.ani = createSkeleton("ani/icecube");
            ani.pos(B_WIDTH/2+8, B_HEIGHT/2+16);
            ani.once(Event.STOPPED, this, ()=> ani.play("11") );
            this.timer.once(350, this, ()=> ani.play("1"));
            this.addChild(ani);
        } else if (val=="F") { //diamond
            let ani = this.ani = createSkeleton("ani/diamond");
            ani.pos(B_WIDTH/2+4, B_HEIGHT/2+4);
            ani.play(0, true);
            ani.stop();
            this.addChild(ani);
            this.timer.loop(3000, this, ()=> {
                if (!ani||ani.destroyed) return;
                ani.play(1, false);
            });
        }  else if (val=="CW") { //goldcoin
            let ani = this.ani = createSkeleton("ani/goldcoin");
            ani.pos(B_WIDTH/2, B_HEIGHT/2);
            ani.play(0, true);
            this.addChild(ani);
        } else if (val!=null) {
            let texture = (val.charAt(0)!=="_")?  Laya.loader.getRes(`symbol/${this._color}.png`): 
                        Laya.loader.getRes(`symbolfire/${this._color}.png`);
            if (texture) {
                this.graphics.drawTexture(texture, (B_WIDTH-texture.width)/2, (B_HEIGHT-texture.height)/2,
                    Math.min(B_WIDTH, texture.width), Math.min(B_HEIGHT, texture.height));
            }
        }
    }

    get color() {
        return this._color;
    }

    moveTo(number, cb) {
        this._timernumber = 0;
        this._numbersticky = this.number;
        this._targeNumber = number;
        this._tempnumber = this._targeNumber - 1;
        this._movestep =  this._targeNumber -  this._numbersticky;
        this._moveCallBack = cb;
        this._timernumber = 0;
        Laya.timer.frameLoop(1, this, this._loopMove);
    }

    _loopMove() {
        let self = this;
        if (this._numbersticky+1 < this._targeNumber) {
            this._numbersticky += 0.1667;
            this._tempnumber = this._numbersticky;
        } else {
            Laya.timer.clear(this, this._loopMove);
            this.number = this._targeNumber;
            let { x, y } = Symbol.getSymbolPos(this.number);
            Tween.to(this, { x, y }, 16*26, (t,b,c,d,s)=> {
                s = 1.70158*1.8;
                let rs = c *((t=t / d-1)*t *((s+1)*t+s)+1)+b;
                self._numbersticky = self._tempnumber + rs;
                if (self._color == "K") self.keyLinkage();
                return rs;
            }, Handler.create(this, ()=> {
                if (typeof this._moveCallBack==="function") this._moveCallBack();
            }));
            return;
        }
        let { x, y } = Symbol.getSymbolPos(this._numbersticky);
        this.pos(x, y);
        if (this._color == "K") this.keyLinkage();
    }

    keyLinkage() {
        Trench.getInstance().updateMask(this._numbersticky);
        let tflag = false;
        if (this.keystatus!=2 && this.keystatus!=3 && this._numbersticky>=16) {
            this.keystatus = 2, tflag = true;
        } else if (this.keystatus!=3 && this._numbersticky>=21) {
            this.keystatus = 3, tflag = true;
        }
        if (tflag) {
            this.ani.once(Event.STOPPED, this, ()=> this.ani.play(`${this.keystatus}1`, true));
            this.ani.play(this.keystatus);
        }
    }

    static getSymbolPos(p) {
        let x, y;
        let i = KEY_POINTS.findIndex(v=> v>=p) - 1;
        if (i <= -1) {
            x  = OFF_X + B_WIDTH/2, y = B_HEIGHT*(5-p) + OFF_Y + B_HEIGHT/2;
            return { x, y };
        }
        let m0 = KEY_POINTS[i], m1 = KEY_POINTS[i+1];
        let t0 = BR_POINTS[m0], t1 = BR_POINTS[m1];
        let cf = (p - m0)/(m1 - m0);
        x = t0[0] + (t1[0] - t0[0])* cf + OFF_X  + B_WIDTH/2;
        y = t0[1] + (t1[1]- t0[1])* cf + OFF_Y + B_HEIGHT/2;
        return { x, y };
    }

    bombOut(callback, color) {
        if (this.bombed) return;
        if (this.color==="K") {
            return Log.error("bomb key");
        } else if (this.color==="W") {
            this.ani.once(Event.STOPPED, this, ()=> {
                this.ani.destroy();
                this.destroy();
                if (typeof callback==="function") callback();
            });
            this.ani.play("bomb");
        } else {
            let bombAni = createSkeleton("ani/bomb");
            bombAni.pos(this.x-4, this.y);
            this.parent.addChild(bombAni);
            bombAni.once(Event.STOPPED, this, ()=> {
                bombAni.destroy();
                if (typeof callback==="function") callback();
            });
            bombAni.play("bomb");
            if (this.color!=="CW"&&this.color!=="_CW") Tween.to(this, { scaleX: 1.1, scaleY: 1.1, alpha: 0 }, 150, null, Handler.create(this, ()=> {
                this.destroy();
            }));
        }
        if (this.color!=="CW"&&this.color!=="_CW") this.bombed = true;
    }

    /**
     * 占星
     */
    changeAstral() {
        this._color = "W";
        let ani = createSkeleton("ani/star");
        ani.pos(B_WIDTH/2-4, B_HEIGHT/2);
        ani.once(Event.STOPPED, this, ()=> ani.play("stay") );
        ani.play("stay");
        let col = V_LAYOUT.findIndex(list=> list.includes(this.number)) || 2;
        Tween.from(ani, { y: -450, x: (col-2)*150, scaleX: 4, scaleY: 4 }, 300, Ease.sineInOut, Handler.create(this, ()=> {
            this.graphics.clear();
            if (this.ani) this.ani.destroy();
            this.ani = ani;
            let astralToAni = createSkeleton("ani/astral_to").pos(B_WIDTH/2, B_HEIGHT/2);
            this.addChildAt(astralToAni, Math.max(0, this.numChildren-2));
            astralToAni.playbackRate(2);
            astralToAni.once(Event.STOPPED, astralToAni, astralToAni.destroy);
            astralToAni.play(0, false);
            this.zOrder = 1;
        }));
        this.zOrder = 5;
        this.addChild(ani);
    }

    /**
     * 火龙
     */
    catchFire(cb) {
        let symFireAni = createSkeleton('ani/bonus4/sym_fire');
        symFireAni.scale(6,6);
        symFireAni.pos(B_WIDTH*0.8, B_HEIGHT*1);
        symFireAni.once(Event.STOPPED, symFireAni, ()=> {
            symFireAni.destroy();
            if (typeof cb === "function") cb();
        });
        symFireAni.play(0, false);
        this.addChild(symFireAni);
    }

    /**
     * 宝藏
     */
    changeMagic(color, cb) {
        let self = this;
        let magicIndex = MAGIC_TYPES.indexOf(this.color);
        this.color = null;

        let tempsk = [];
        MAGIC_TYPES.forEach((typecolor, i)=> {
            let skeleton = createSkeleton(`ani/bonus6/shift_${typecolor}`);
            skeleton.pos(B_WIDTH/2, B_HEIGHT/2);
            tempsk[i] = skeleton;
        });
        let count = 0;
        const loop = function() {
            let sk = tempsk[magicIndex];
            self.addChild(sk);
            if (count++>MAGIC_TYPES.length && MAGIC_TYPES[magicIndex]==color) {
                sk.once(Event.STOPPED, self, ()=> {
                    tempsk.forEach(isk=> isk.destroy());
                    self.color = color;
                    if (typeof cb === "function") cb();
                });
                sk.play(0 ,false,true,0, 375);
            } else {
                magicIndex = (magicIndex+1)%MAGIC_TYPES.length;
                if (magicIndex==1||magicIndex==2) return loop();
                sk.once(Event.STOPPED, self, ()=> {
                    sk.removeSelf();
                    loop();
                });
                sk.play(0 ,false);
            }
            
        };

        loop();
    }
 
    magicBlink() {
        let blinkAni = this.blinkAni = createSkeleton("ani/bonus6/sym_blink");
        blinkAni.pos(B_WIDTH/2, B_HEIGHT/2);
        this.addChild(blinkAni);
        blinkAni.play(0, true);
    }

    /**
     * 酒吧
     */
    barSplash(color) {
        this.color = color;
        this.scale(1,1);
        this.alpha = 1;
        this.rotation = 0;
        Tween.from(this, { scaleX: 1.5, scaleY: 1.5 }, 350, Ease.sineIn);
        let splash = createSkeleton("ani/bonus5/splash");
        splash.pos(this.x, this.y);
        this.parent.addChildAt(splash, 0);
        splash.once(Event.STOPPED, splash, splash.destroy);
        splash.play(0, false);
    }

    rotateOut() {
        Tween.to(this, { scaleX: 0, scaleY: 0 , alpha: 0.2, rotation: 180 }, 350, null);
    }

}
