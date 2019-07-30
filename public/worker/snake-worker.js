// https://github.com/Trott/music-routing?source=post_page---------------------------
// https://github.com/supergoat/snake/blob/master/index.html
// https://github.com/jeffreytgilbert/goto-booth/blob/master/public/js/workers/controls.js

Canvas = HTMLCanvasElement = OffscreenCanvas;
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

let faceTracking;

let runtimeInfo = {
    video: {
        width: 0,
        height: 0
    },
    ui: {
        width: 0,
        height: 0
    }
};

let workingCanvas,
    workingContext;

onmessage = (event) => {
    switch (event.data.route) {
        case 'init':
            // do terrible things to the worker's global namespace to fool tensorflow
            for (let key in event.data.fakeWindow) {
                if (!self[key]) {
                    self[key] = event.data.fakeWindow[key];
                }
            }
            window = Window = self;
            localStorage = new Storage();
            // console.log('*faked* Window object for the worker', window);

            for (let key in event.data.fakeDocument) {
                if (document[key]) { continue; }

                let d = event.data.fakeDocument[key];
                // request to create a fake function (instead of doing a proxy trap, fake better)
                if (d && d.type && d.type === '*function*') {
                    document[key] = function(){ console.log('FAKE instance', key, 'type', document[key].name, '(',document[key].arguments,')'); };
                    document[key].name = d.name;
                } else {
                    document[key] = d;
                }
            }
            // console.log('*faked* Document object for the worker', document);

        function createElement(element) {
            // console.log('FAKE ELELEMT instance', createElement, 'type', createElement, '(', createElement.arguments, ')');
            switch(element) {
                case 'canvas':
                    // console.log('creating canvas');
                    let canvas = new Canvas(1,1);
                    canvas.localName = 'canvas';
                    canvas.nodeName = 'CANVAS';
                    canvas.tagName = 'CANVAS';
                    canvas.nodeType = 1;
                    canvas.innerHTML = '';
                    canvas.remove = () => { console.log('nope'); };
                    // console.log('returning canvas', canvas);
                    return canvas;
                default:
                    console.log('arg', element);
                    break;
            }
        }

            document.createElement = createElement;
            document.location = self.location;
            // console.log('*faked* Document object for the worker', document);

            importScripts(
                '/js/libs/faker.js',
                '/js/libs/face-api.js',
                '/js/workers/controls/face-tracking.js'
            );

            runtimeInfo = event.data.runtimeInfo;
            workingCanvas = new Canvas(runtimeInfo.video.width, runtimeInfo.video.height);
            workingContext = workingCanvas.getContext('2d');

            /////////////////////////////////////////////////////
            faceTracking = new FaceTracking(vip=>{
                if (vip){
                    // console.log('New VIP!', vip.uuid);
                    postMessage({route: 'updateFacePosition', vip});
                } else {
                    postMessage({route: 'noFacesFound'});
                }
            }, runtimeInfo.video.width, runtimeInfo.video.height);

            faceTracking.startFaceTracking().then(()=>{
                postMessage({route: 'initialized'});
            });
            ////////////////////////////////////////////////////////

            break;
        case 'videoFrameUpdate':
            if(!faceTracking) { return; }
            // console.log('processing video', event);

            // const imageData = new ImageData(
            // 	new Uint8ClampedArray( event.data.buffer ),
            // 	runtimeInfo.video.width,
            // 	runtimeInfo.video.height
            // );

            // ctx.putImageData(imageData, dx, dy, dirtyX, dirtyY, dirtyWidth, dirtyHeight)
            // workingContext.putImageData(imageData, 0, 0, 0, 0, runtimeInfo.video.width, runtimeInfo.video.height);

            // void ctx.drawImage(image, dx, dy);
            // void ctx.drawImage(image, dx, dy, dWidth, dHeight);
            // void ctx.drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);
            workingContext.drawImage(event.data.bitmap, 0, 0, runtimeInfo.video.width, runtimeInfo.video.height);
            event.data.bitmap.close();

            // console.log('detecting a face with this:', imageData, workingContext, workingCanvas);
            faceTracking.detect(workingCanvas).then((allProfiles)=>{
                // console.log('all profiles:', allProfiles);
                postMessage({route: 'readyForNewImage'});
            }).catch(err=>{
                console.warn('detection exited with an error:', err);
                postMessage({route: 'readyForNewImage'}); // Maybe we continue?
            });
            break;
        default:
            postMessage({yo: 'had issues, dont even know what to do with this:' + event.data.route });
    }
};
