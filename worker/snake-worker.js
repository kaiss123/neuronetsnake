// https://github.com/Trott/music-routing?source=post_page---------------------------
// https://github.com/supergoat/snake/blob/master/index.html
// https://github.com/jeffreytgilbert/goto-booth/blob/master/public/js/workers/controls.js


anvas = HTMLCanvasElement = OffscreenCanvas;
HTMLCanvasElement.name = 'HTMLCanvasElement';
Canvas.name = 'Canvas';

function HTMLImageElement(){}
function HTMLVideoElement(){}

Image = HTMLImageElement;
Video = HTMLVideoElement;

// Canvas.prototype = Object.create(OffscreenCanvas.prototype);

function Storage () {
    let _data = {};
    this.clear = function(){ return _data = {}; };
    this.getItem = function(id){ return _data.hasOwnProperty(id) ? _data[id] : undefined; };
    this.removeItem = function(id){ return delete _data[id]; };
    this.setItem = function(id, val){ return _data[id] = String(val); };
}
class Document extends EventTarget {}

let window, document = new Document();

// More really bad practices to fix closed libraries. Here we overload setTimeout to replace it with a flawed promise implementation which sometimes cant be canceled.

let callStackCount = 0;
const maxiumCallStackSize = 500; // chrome specific 10402, of 774 in my tests

const fakeCancel = { cancelable: false };
