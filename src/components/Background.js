

export default class Background extends Laya.Sprite {

    static getInstance() {
        if (!this.instance||this.instance.destroyed) this.instance = new this();
        return this.instance;
    }

    constructor() {
        super();
        this.init();
    }

    init() {}
    

}