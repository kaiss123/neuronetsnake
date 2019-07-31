// const User = require('model/snake.js');
import {Snake} from './model/snake.js';
// Instantiate User:
let user = new Snake();

export class Population {

    canvasMock = [];

    workerCount = 4;
    populationCount = 20;
    worker = [];

    constructor() {
        this.setup();
    }

    async setup() {
        this.canvasMock = this.initCanvasMock();
        let kaisss = await this.initWorker();
        debugger;
    }

    initWorker() {
        return new Promise(resolve => {
            let startupPromises = [];
            for (let i = 1; i <= this.workerCount; i++) {
                let snakeWorker =  new Worker('http://localhost:8000/worker/snake-worker.js');
                this.worker.push({i: snakeWorker});
                startupPromises.push(new Promise(r => {
                    snakeWorker.onmessage = (event) => {
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

                let fakeWindow = this.canvasMock[0];
                let fakeDocument = this.canvasMock[1];
                let runtimeInfo = this.canvasMock[2];
                // let uiCanvas = Object.assign(this.canvasMock[3], {});

                //first canvas can be detached with transferControlToOffscreen, multiple transferControlToOffscreen -> clone error
                // hack to pass offscreens of clones of original...
                let canvasClone = this.canvasMock[4].cloneNode();
                let uiCanvas = canvasClone.transferControlToOffscreen();
                //this.canvasMock[4].parentNode.replaceChild(canvasClone, this.canvasMock[4]);

                snakeWorker.postMessage({route: 'init', fakeWindow, fakeDocument, runtimeInfo, uiCanvas}, [uiCanvas]); // window is copied, ui is "transfered" via 0 copy

                Promise.all(startupPromises).then(() => {
                    resolve();
                });
            }
        });
    }

    initCanvasMock() {
        const body = document.body,
            doc = document,
            video = document.createElement('video');
        let appDims = {
            width: 0,
            height: 0
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

        window.onbeforeunload = () => {
            if (visualsWorker) {
                visualsWorker.terminate();
            }
        };

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
        for (let key in screen) {
            screenCopy[key] = +screen[key];
        }
        screenCopy.orientation = {};
        for (let key in screen.orientation) {
            if (typeof screen.orientation[key] !== 'function') {
                screenCopy.orientation[key] = screen.orientation[key];
            }
        }

        let visualViewportCopy = {};
        if (typeof window['visualViewport'] !== 'undefined') {
            for (let key in visualViewport) {
                if (typeof visualViewport[key] !== 'function') {
                    visualViewportCopy[key] = +visualViewport[key];
                }
            }
        }

        var styleMediaCopy = {};
        if (typeof window['styleMedia'] !== 'undefined') {
            for (let key in styleMedia) {
                if (typeof styleMedia[key] !== 'function') {
                    styleMediaCopy[key] = styleMedia[key];
                }
            }
        }

        let fakeWindow = {};
        Object.getOwnPropertyNames(window).forEach(name => {
            try {
                if (typeof window[name] !== 'function') {
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
            } catch (ex) {
                console.log('Access denied for a window property');
            }
        });

        fakeWindow.screen = screenCopy;
        fakeWindow.visualViewport = visualViewportCopy;
        fakeWindow.styleMedia = styleMediaCopy;
        console.log(fakeWindow);

        let fakeDocument = {};
        for (let name in document) {
            try {
                if (name === 'all') {
                    // o_O
                } else if (typeof document[name] !== 'function' && typeof document[name] !== 'object') {
                    fakeDocument[name] = document[name];
                } else if (typeof document[name] === 'object') {
                    fakeDocument[name] = null;
                } else if (typeof document[name] === 'function') {
                    fakeDocument[name] = {type: '*function*', name: document[name].name};
                }
            } catch (ex) {
                console.log('Access denied for a window property');
            }
        }

        runtimeInfo.video.width = video.videoWidth;
        runtimeInfo.video.height = video.videoHeight;
        runtimeInfo.ui.width = appDims.width;
        runtimeInfo.ui.height = appDims.height;

        return [fakeWindow, fakeDocument, runtimeInfo, uiCanvas, domCanvas];
    }
}

let popuplation = new Population();
