import { randomNum, createSkeleton, createBackOut } from "utils/util";
import { COLORS, LAYOUT, V_LAYOUT, BR_POINTS, JELLO } from "const/config";
import { PubSub, setStoreState, addWinAll, subscribeStore, playStart, getNoWinningGraph, roundEnd, getDataByKey } from "ctrl/playCtrl";
import SymbolCell from "components/SymbolCell";
import WinCoins from "components/WinCoins";
import Trench from "./Trench";
import Sound from "common/Sound";

const { Tween, Ease, Event, Handler, Sprite, Text } = Laya;

export default class SpinBase extends Laya.Sprite {

    static getInstance() {
        if (!this.instance || this.instance.destroyed) this.instance = new this();
        return this.instance;
    }

    constructor() {
        super();
        this.initShake();
    }

    initShake() {
        let self = this;
        let i = 0, interval = 32, degree = 0.70;
        const loop = function () {
            if (i >= JELLO.length) return Laya.timer.clear(self, loop);
            let c = JELLO[i] * degree;
            let sc = (1 + Math.abs(c / 90)) * 1;
            Tween.to(self, { rotation: c * 1.2 }, interval, Ease.sineOut, null, 0, true);
            i++;
        };
        PubSub.on("SHOCK_LINE", this, () => {
            i = 0;
            Laya.timer.loop(interval, this, loop);
        });
    }

    init() { }

    freshStart() { }

    roundStart(cb) {
        let i = 0;
        const _loop = () => {
            if (i++ >= this.allSymbols.length - 1) {
                if (typeof cb === "function") cb();
                return Laya.timer.clear(this, _loop);
            }
            let symbol = this.allSymbols[i];
            symbol.visible = true;
            Tween.from(symbol, { alpha: 0 }, 400, Ease.linearNone);
            Tween.from(symbol, { scaleX: 0.5, scaleY: 0.5 }, 250, createBackOut(5));
        };
        Sound.play("reelSpin");
        Laya.timer.loop(64, this, _loop);
    }

    fillSymbols(graphdata) {
        this.destroySymbols();
        this.allSymbols = [];
        graphdata = graphdata || getNoWinningGraph();
        for (let i = 1; i <= 25; i++) {
            let color = graphdata[i];
            let symbol = new SymbolCell(color, i);
            this.addChild(symbol);
            this.allSymbols[i] = symbol;
            let { x, y } = SymbolCell.getSymbolPos(i);
            symbol.pos(x, y);
        }
    }

    dealNextPage(before) {
        this._dealNextPage();
    }

    _dealNextPage() {
        let resultData = this.resultData;
        let pageData = resultData.card_info[this.pageIndex];
        if (!pageData || !pageData.erase || !pageData.erase.length > 0) {
            return this.onOver();
        }
        this.eraseIndex = 0;
        this.bombSymbos = [];
        this.jokerSymbos = [];
        this.bombWin = 0;
        this.eliminateLines(pageData.erase);
    }

    eliminateLines(eraseList) {
        let erase = eraseList[this.eraseIndex];
        let { line, bomb, type, prize, W } = erase;
        this.bombSymbos = this.bombSymbos.concat(line, bomb);
        if (this.jokerSymbos.indexOf(W) === -1) this.jokerSymbos.push(W);
        this.bombWin += prize;

        let isHorizontal = false;
        LAYOUT.forEach(lineargs => {
            if (isHorizontal) return;
            let c = 0;
            for (let i = 0, len = line.length; i < len; i++) {
                if (lineargs.includes(line[i]) && ++c >= 2) {
                    isHorizontal = true;
                    break;
                }
            }
        });
        let _layoutArr = isHorizontal ? LAYOUT : V_LAYOUT;
        let _layout = _layoutArr.find(list => list.includes(line[0]));
        Array.isArray(_layout) && (line = line.sort((a, b) => _layout.indexOf(a) > _layout.indexOf(b)));
        if (erase.prize > 0) this.lineFlash(line, erase.prize, isHorizontal);

        Laya.timer.once(800, this, () => {
            if (++this.eraseIndex <= eraseList.length - 1) {
                this.eliminateLines(eraseList);
            } else {
                this.bombsLines();
            }
        });
    }

    bombsLines() {
        let starSymbos = this.bombSymbos.filter(num => this.allSymbols[num].color === "W");
        this.bombSymbos.forEach(num => {
            this.allSymbols[num].bombOut();
        });

        if (starSymbos.length >= 1) Sound.play(["wildExplode", "wildSpawn", "wildSpoiler"][randomNum(2)]);
        else Sound.play("syml_bomb");

        Laya.timer.once(50, this, () => {
            this.jokerSymbos.forEach(num => {
                if (num == "") return;
                let symbol = new SymbolCell("W", num);
                this.addChild(symbol);
                this.allSymbols[num] = symbol;
                let { x, y } = SymbolCell.getSymbolPos(num);
                symbol.pos(x, y);
                Tween.from(symbol, { scaleX: 3, scaleY: 3 }, 150, null);
            });
            this.jokerSymbos = [];
        });
        PubSub.event("SHOCK_LINE", [this.bombSymbos.length, starSymbos.length]);
        this.bombSymbos = [];

        this.gameWin();
        Laya.timer.once(1000, this, this.moveSymbols);
    }

    //展示中奖线, 显示金额
    lineFlash(line, winNum, isHorizontal) {
        let len = line.length,
            c1 = Math.floor((len - 1) / 2), c2 = c1 + 1;
        let { x, y } = SymbolCell.getSymbolPos(line[c1]);
        if (len % 2 == 0) {
            let p = SymbolCell.getSymbolPos(line[c2]), x2 = p.x, y2 = p.y;
            x = (x + x2) / 2, y = (y + y2) / 2;
        }
        let lineShine = createSkeleton("ani/line_win");
        lineShine.pos(x, y);
        lineShine.once(Event.STOPPED, this, () => lineShine.destroy());
        lineShine.play(`${len + (isHorizontal ? '' : '1')}`);
        lineShine.zOrder = 10;
        this.addChild(lineShine);

        Sound.play("line_shine");
        line.forEach(num => {
            let symbol = this.allSymbols[num];
            Tween.from(symbol, { scaleX: 1.3, scaleY: 1.3 }, 350, Ease.sineInOut);
        });

        let winLable = new Laya.Text();
        winLable.text = winNum;
        winLable.set({ font: "line_win", align: "center", valign: "middle", width: 300, height: 100 });
        this.addChild(winLable);
        winLable.pivot(150, 50);
        winLable.zOrder = 10;
        winLable.pos(x, y);

        let props = isHorizontal ?
            [{ x: x - 50, alpha: 0 }, { x: x + 20, alpha: 0.1 }] :
            [{ y: y - 50, alpha: 0 }, { y: y + 20, alpha: 0.1 }];
        Tween.from(winLable, props[0], 650, Ease.sineOut, Handler.create(this, () => {
            Laya.timer.once(300, this, () => {
                Tween.to(winLable, props[1], 350, Ease.sineIn, Handler.create(winLable, winLable.destroy));
            });
        }));

    }

    moveSymbols() {
        let bombCount = 0;
        let allSymbols = [];
        for (let i = 25; i >= 1; i--) {
            let symbol = this.allSymbols[i];
            if (!symbol || symbol.destroyed || symbol.bombed) {
                bombCount++;
                continue;
            } else if (bombCount > 0) {
                let num = symbol.number + bombCount;
                symbol._moveToNum = num;
                allSymbols[num] = symbol;
            } else {
                allSymbols[i] = symbol;
            }
        }
        let nextCardInfo = this.resultData.card_info[++this.pageIndex];
        let { graph, erase } = nextCardInfo;
        for (let j = 0; j > -bombCount; j--) {
            let num = bombCount + j,
                color = graph[num];
            if (!color) {
                Log.error(num, graph);
            }
            let symbol = new SymbolCell(color, j);
            let { x, y } = SymbolCell.getSymbolPos(j);
            symbol.pos(x, y);
            this.addChild(symbol);
            symbol._moveToNum = num;
            allSymbols[num] = symbol;
        }

        Laya.timer.once(200, this, () => {
            let j = 0;
            let symbmove = allSymbols.filter(symbol => symbol._moveToNum !== undefined),
                len = symbmove.length;
            if (!len) return Laya.timer.once(500, this, this.dealNextPage);
            allSymbols.forEach(symbol => {
                if (symbol._moveToNum == undefined || symbol.number == symbol._moveToNum) return;
                symbol.moveTo(symbol._moveToNum, () => {
                    symbol.number = symbol._moveToNum;
                    symbol._moveToNum = undefined;
                    if (++j === len) {
                        this.allSymbols = allSymbols;
                        Laya.timer.once(500, this, this.dealNextPage);
                    }
                }, len);
            });
        });
    }

    destroySymbols() {
        if (this._childs) {
            for (let i = this._childs.length - 1; i > -1; i--) {
                if (this._childs[i].symbolFlag) this._childs[i].destroy(true);
            }
        }
    }

    gameWin() { }

    onOver() { }
}