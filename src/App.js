import "utils/laya.custom.js";
import "utils/helptool.js";
import "ui/layaUI.max.all.js";

import { socket } from "ctrl/socket";
import SenseManager from "utils/SenseManager";
import LoaddingSense from "senses/LoaddingSense";
import { LOADDING_ASSET } from "const/assets";
import CompSetting from "common/CompSetting";

const { Stage, Sprite, Event, Handler, Text } = Laya;

export default function App() {
    var stage;
    Laya.init(1334, 750, Laya.WebGL);

    Laya.WorkerLoader.workerPath = "libs/worker.js";
    //开启worker线程
    Laya.WorkerLoader.enable = false;

    Laya.loader.maxLoader = 12;

    stage = Laya.stage;
    stage.frameRate = "fast";
    stage.scaleMode = Stage.SCALE_FIXED_WIDTH;
    stage.alignH = Stage.ALIGN_CENTER;
    stage.alignV = Stage.ALIGN_MIDDLE;
    stage.screenMode = Stage.SCREEN_HORIZONTAL;
    stage.bgColor = "#ffffff";
    Laya.URL.basePath = BASE_PATH || "/";
    Laya.URL.useMultipleBasePath = Laya.URL.basePath instanceof Array; //

    Laya.loader.load(LOADDING_ASSET, Handler.create(null, ()=> {
        if (window.bigRender) window.bigRender.clear();
        CompSetting.init();
        SenseManager.load('/loadding');
    }));
    
}