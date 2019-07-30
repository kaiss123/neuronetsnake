export class Appbase {
    constructor() {
    }

}
const body = document.body,
    doc = document,
    video = document.createElement('video');

const visualsWorker = new Worker('http://localhost:8000/workers/snake-worker.js'),
    // controlsWorker = new Worker('http://localhost:8000/js/workers/controls.js'),
    videoApp = new VideoApp();

// once these are set, they're set. No changes allowed.
let appDims = {
    width: 0,
    height: 0
};

let startButton;

const msTimeBetweenDetections = 500;

let boxRotationDims = {
    x: 0,
    y: 0
};
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

let detectionAvailable = false;

// can't tell if these are hanging around or not. Chrome's debug tab is filled with instances
window.onbeforeunload = ()=>{
    if(visualsWorker) { visualsWorker.terminate(); }
};

function initializeApp () {
    return new Promise(resolve => {
        // it's this value forever now
        appDims.width = window.innerWidth;
        appDims.height = window.innerHeight;

        const domCanvas = doc.createElement('canvas');
        domCanvas.width = appDims.width;
        domCanvas.height = appDims.height;
        domCanvas.style.background = '#000';
        body.style.background = '#000';
        const uiCanvas = domCanvas.transferControlToOffscreen(); // creates an offscreen canvas element that can be transfered to a web worker and keeps it linked to the original canvas
        body.appendChild(domCanvas);

        var screenCopy = {};
        for(let key in screen){
            screenCopy[key] = +screen[key];
        }
        screenCopy.orientation = {};
        for(let key in screen.orientation){
            if (typeof screen.orientation[key] !== 'function') {
                screenCopy.orientation[key] = screen.orientation[key];
            }
        }

        let visualViewportCopy = {};
        if (typeof window['visualViewport'] !== 'undefined') {
            for(let key in visualViewport){
                if(typeof visualViewport[key] !== 'function') {
                    visualViewportCopy[key] = +visualViewport[key];
                }
            }
        }

        var styleMediaCopy = {};
        if (typeof window['styleMedia'] !== 'undefined') {
            for(let key in styleMedia){
                if(typeof styleMedia[key] !== 'function') {
                    styleMediaCopy[key] = styleMedia[key];
                }
            }
        }

        let fakeWindow = {};
        Object.getOwnPropertyNames(window).forEach(name => {
            try {
                if (typeof window[name] !== 'function'){
                    if (typeof window[name] !== 'object' &&
                        name !== 'undefined' &&
                        name !== 'NaN' &&
                        name !== 'Infinity' &&
                        name !== 'event' &&
                        name !== 'name'
                    ) {
                        fakeWindow[name] = window[name];
                    }
                }
            } catch (ex){
                console.log('Access denied for a window property');
            }
        });

        fakeWindow.screen = screenCopy;
        fakeWindow.visualViewport = visualViewportCopy;
        fakeWindow.styleMedia = styleMediaCopy;
        console.log(fakeWindow);

        let fakeDocument = {};
        for(let name in document){
            try {
                if(name === 'all') {
                    // o_O
                } else if (typeof document[name] !== 'function' && typeof document[name] !== 'object') {
                    fakeDocument[name] = document[name];
                } else if (typeof document[name] === 'object') {
                    fakeDocument[name] = null;
                } else if(typeof document[name] === 'function') {
                    fakeDocument[name] = { type:'*function*', name: document[name].name };
                }
            } catch (ex){
                console.log('Access denied for a window property');
            }
        }

        runtimeInfo.video.width = video.videoWidth;
        runtimeInfo.video.height = video.videoHeight;
        runtimeInfo.ui.width = appDims.width;
        runtimeInfo.ui.height = appDims.height;

        let startupPromises = [];

        startupPromises.push(new Promise(r=>{
            visualsWorker.onmessage = (event) => {
                if (event.data.yo) {
                    console.log('visual worker says:', event.data.yo, event.data);
                } else {
                    switch (event.data.route) {
                        case 'initialized':
                            r();
                            console.log('initialized visuals');
                            break;
                        default:
                            console.log('not sure what to do here', event.data);
                    }
                }
            };
        }));

        visualsWorker.postMessage({route:'init', fakeWindow, fakeDocument, runtimeInfo, uiCanvas}, [uiCanvas]); // window is copied, ui is "transfered" via 0 copy

        Promise.all(startupPromises).then(()=>{
            resolve();
        });

    });
}

// const stats = new window.Stats(); // included by index.html
// stats.showPanel( 0 ); // 0: fps, 1: ms, 2: mb, 3+: custom
// body.appendChild( stats.dom );

let vidCanvas,
    vidCanvasCtx,
    d1,d2,d3,d4,
    controlsData,
    uiData,
    controlsBitmap;

const raf = ()=>{
    // stats.begin();
    d1=null;
    d2=null;
    d3=null;
    const startTime = Date.now();

    // update this with a boolean representing processing state on worker
    // This should be throttled so it runs when the detections arent already running on a still
    if(detectionAvailable){
        detectionAvailable = false;

        // createImageBitmap(image[, options]).then(function(response) { ... });
        // createImageBitmap(image, sx, sy, sw, sh[, options]).then(function(response) { ... });
        d1 = Date.now() - startTime;
        createImageBitmap(video, 0, 0, video.videoWidth, video.videoHeight).then(bitmap=>{
            d2 = Date.now() - startTime;
            controlsWorker.postMessage({
                route: 'videoFrameUpdate',
                bitmap: bitmap
            }, [bitmap]); // "transfered"
            d3 = Date.now() - startTime;
            console.log('video capture:', d3);
        });
    }

    d4 = Date.now() - startTime;
    // stats.end();
    requestAnimationFrame(raf);
}

videoApp.startVideo().then((videoMetaData)=>{
    console.log('video loadedmetadata received', videoMetaData);
    startButton = doc.createElement('button');
    startButton.innerText = 'Ready?';
    startButton.style.width = '100%';
    startButton.style.height = window.innerHeight+'px';
    startButton.addEventListener('click', ()=>{
        initializeApp().then(()=>{
            console.log('startup has completed');
            /*
            body.addEventListener('mousemove', (evt) => {
                if (perspectiveUpdatePending) { return; }
                perspectiveUpdatePending = setTimeout(()=>{
                    perspectiveUpdatePending = null;
                }, 200); // delay 200ms between mousemove updates. updates happening too often can cause jank
                updatePerspective(evt);
            });
            */
            requestAnimationFrame(raf);
        });
    });
    body.appendChild(startButton);

    vidCanvas = new OffscreenCanvas(video.videoWidth, video.videoHeight);
    // vidCanvas.width = video.videoWidth;
    // vidCanvas.height = video.videoHeight;
    vidCanvasCtx = vidCanvas.getContext('2d');
});
