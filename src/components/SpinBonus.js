
import { mixin } from "utils/util";
import SpinBase from "./SpinBase";
import FieryMode from "components/gamemode/FieryMode";
import BarMode from "components/gamemode/BarMode";

export default class SpinBonus extends SpinBase {

    static getInstance() {
        if (!this.instance||this.instance.destroyed) this.instance = new this();
        return this.instance;
    }

    constructor() {
        super();
        this.init();
    }

    static applyMode(modetype) {
        const MODE = [FieryMode, BarMode][modetype];
        mixin(this, MODE);
    }

    init() {
        
    }


}


