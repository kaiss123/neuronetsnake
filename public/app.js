// const User = require('model/Snake.js');
// import {Snake} from './model/Snake.js';
// // Instantiate User:
// let user = new Snake();

const { Observable } = rxjs;

class Population {
    canvasMock = [];

    workerCount = 2;
    populationCount = 2;
    worker = [];
    snakes = [];

    workerSubscription;
    constructor() {
        this.setup();
    }

    async setup() {
        this.canvasMock = this.initCanvasMock();
        this.workerSubscription = await this.initWorker().subscribe( (e) => {
            if(e[0].route === 'initialized') {
                this.worker = e.map(w => w.data);
                this.snakes = this.startSnakes();
            }
            if(e[0].route === 'snakeLogic') {
                //this.snakes = this.startSnakes();
                console.table(e.map(i => i.data.fitSum));
            }
        });
    }

    startSnakes() {
        let workerLoad = Math.floor(this.populationCount / this.workerCount);
        this.worker.map((w) => {
            w.postMessage({route: 'snakeLogic', workerLoad: workerLoad});
        });
    }

    isFirstWorker = true;

    initWorker() {
        let startupObservables = [];
        let tmpWorker = [];
        for (let i = 1; i <= this.workerCount; i++) {
            let snakeWorker = new Worker('http://localhost:8000/worker/snake-worker.js');
            tmpWorker.push({i: snakeWorker});
            startupObservables.push(new Observable(observer => {
                snakeWorker.onmessage = (event) => {
                    if (event.data.yo) {
                        console.log('visual worker says:', event.data.yo, event.data);
                    } else {
                        switch (event.data.route) {
                            case 'initialized':
                                observer.next({route: 'initialized', data: snakeWorker});
                                console.log('initialized visuals');
                                break;
                            case 'snakeLogic':
                                observer.next({route: 'snakeLogic', data: event.data});
                                console.log('initialized snakeLogic');
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
            // first worker gets original canvas offscreen, others get cloned ones
            let canvasClone;

            if(this.isFirstWorker) {
                canvasClone = this.canvasMock[4];
                this.isFirstWorker = false;
            } else {
                canvasClone = this.canvasMock[4].cloneNode();
            }
            let uiCanvas = canvasClone.transferControlToOffscreen();
            //this.canvasMock[4].parentNode.replaceChild(canvasClone, this.canvasMock[4]);

            snakeWorker.postMessage({
                    route: 'init',
                    fakeWindow,
                    fakeDocument,
                    runtimeInfo,
                    uiCanvas
                },
                [uiCanvas]);

        }
        return rxjs.zip(...startupObservables);
    }

    // initWorker() {
    //     return new Promise(resolve => {
    //         let startupPromises = [];
    //         let tmpWorker = [];
    //         for (let i = 1; i <= this.workerCount; i++) {
    //             let snakeWorker =  new Worker('http://localhost:8000/worker/snake-worker.js');
    //             tmpWorker.push({i: snakeWorker});
    //             startupPromises.push(new Promise(r => {
    //                 snakeWorker.onmessage = (event) => {
    //                     if (event.data.yo) {
    //                         console.log('visual worker says:', event.data.yo, event.data);
    //                     } else {
    //                         switch (event.data.route) {
    //                             case 'initialized':
    //                                 r();
    //                                 console.log('initialized visuals');
    //                                 break;
    //                             case 'snakeLogic':
    //
    //                                 break;
    //                             default:
    //                                 console.log('not sure what to do here', event.data);
    //                         }
    //                     }
    //                 };
    //             }));
    //
    //             let fakeWindow = this.canvasMock[0];
    //             let fakeDocument = this.canvasMock[1];
    //             let runtimeInfo = this.canvasMock[2];
    //             // let uiCanvas = Object.assign(this.canvasMock[3], {});
    //
    //             //first canvas can be detached with transferControlToOffscreen, multiple transferControlToOffscreen -> clone error
    //             // hack to pass offscreens of clones of original...
    //             let canvasClone = this.canvasMock[4].cloneNode();
    //             let uiCanvas = canvasClone.transferControlToOffscreen();
    //             //this.canvasMock[4].parentNode.replaceChild(canvasClone, this.canvasMock[4]);
    //
    //             snakeWorker.postMessage({route: 'init',
    //                 fakeWindow,
    //                 fakeDocument,
    //                 runtimeInfo,
    //                 uiCanvas},
    //                 [uiCanvas]);
    //
    //         }
    //         Promise.all(startupPromises).then(() => {
    //             resolve(tmpWorker);
    //         });
    //     });
    // }

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
        const uiCanvas = null; // creates an offscreen canvas element that can be transfered to a web worker and keeps it linked to the original canvas
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
