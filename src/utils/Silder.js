
var element, container, slides, slidePos, width, length, options,
    index, speed;

const { Event, Handler, Tween, Ease } = Laya;
/**
 * 
 * @param {Laya.Sprite} component 
 * @param {any} option 
 */
export default function Slider(_container, _options) {
    container = _container;
    element = container.getChildAt(0);
    options = _options || {};
    index = parseInt(options.startSlide, 10) || 0;
    speed = options.speed || 300;
    options.continuous = options.continuous !== undefined ? options.continuous : true;
    width = container.width;
    setUp();
}


function setUp() {
    slides = element._childs;
    length = slides.length;
    if (slides.length < 2) options.continuous = false;

    container.viewport = new Laya.Rectangle(0,0, container.width, container.height );

    initEvent();
    /* if (options.continuous && slides.length < 3) {
        element.addChildAt();
        element.appendChild(slides[0].cloneNode(true));
        element.appendChild(element.children[1].cloneNode(true));
      } */
}

function initEvent() {
    container.on(Event.MOUSE_DOWN, container, handleStart);
    container.on(Event.MOUSE_MOVE, container, handleMove);
    container.on(Event.MOUSE_UP, container, handleEnd);
    // container.on(Event.MOUSE_OUT, container, handleOut);
}

function circle(index) {
    return (slides.length + (index % slides.length)) % slides.length;
}

function prev() {
    if (options.continuous) slide(index-1);
    else if (index) slide(index-1);
}

function next() {
    if (options.continuous) slide(index+1);
    else if (index < slides.length - 1) slide(index+1);
}

function slide(to, slideSpeed) {
    if (index == to) return;

    var direction = Math.abs(index - to) / (index - to);

    if (options.continuous) {
        var natural_direction = direction;
        direction = -slidePos[circle(to)] / width;
        if (direction !== natural_direction) to = -direction * slides.length + to;
    }

    var diff = Math.abs(index - to) - 1;
    while (diff--) move(circle((to > index ? to : index) - diff - 1), width * direction, 0);
    to = circle(to);
    move(index, width * direction, slideSpeed || speed);
    move(to, 0, slideSpeed || speed);
    if (options.continuous) move(circle(to - direction), -(width * direction), 0);
    index = to;
    offloadFn(options.callback && options.callback(index, slides[index]));
}

function move(index, dist, speed) {
    translate(index, dist, speed);
    slidePos[index] = dist;
}
function translate(index, dist, speed) {
    var slide = slides[index];
    Tween.to(element, { x: dist }, width/speed, null, Laya.Handler.create(element, ()=> {
        options.transitionEnd && options.transitionEnd.call(event, index, slides[index]);
    }));
}

var start, end;
function handleStart(event) {
    var touches = event.touches[0];
    start = {
        x: touches.stageX,
        y: touches.stageY,
        time: +new Date
    };
}
function handleMove(event) {
    if ( event.touches.length > 1 || event.scale && event.scale !== 1) return;
    var touches = event.touches[0];
    delta = {
        x: touches.stageX - start.x,
        y: touches.stageY - start.y
    };
}
function handleEnd(event) {

}
