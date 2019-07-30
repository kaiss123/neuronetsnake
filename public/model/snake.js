import {BOARD_SIZE, CONTROLSAI} from "./constants.js";
import {Fruit} from "./fruit.js";

export class Snake extends NeuroNet {

    interval = 50;
    timer;
    score = 0;
    lifeTime = 0;
    lifeLeft = 200;
    fitness = 1;
    vision;
    netResult;
    isdeadNow = false;
    parentsFitness = -1;

    direction = CONTROLSAI.LEFT;
    parts = [];
    board = [];
    fruit;
    tempDirection = CONTROLSAI.LEFT;

    replay;
    isDeadResolver;
    isDead;

    constructor(id, interval, mind = undefined, parentsFitness = -1) {
        super(mind);
        this.interval = interval;
        this.parentsFitness = parentsFitness;
        this.setBoard();
        // this.start();
    }

    start() {
        for (let i = 0; i < 3; i++) {
            this.parts.push({x: 8 + i, y: 8});
        }
        this.fruit.resetFruit();
        this.updatePositions();
    }

    setBoard() {
        this.board = [];

        for (let i = 0; i < BOARD_SIZE; i++) {
            this.board[i] = [];
            for (let j = 0; j < BOARD_SIZE; j++) {
                this.board[i][j] = false;
            }
        }
        this.fruit = new Fruit(this.board);
    }

    eatFruit() {
        this.score++;

        let tail = Object.assign({}, this.parts[this.parts.length - 1]);

        this.parts.push(tail);
        this.fruit.resetFruit();
    }

    selfCollision(part) {
        if (part.x < BOARD_SIZE - 1 && part.y < BOARD_SIZE) {
            return this.board[part.y][part.x] === true;
        }
    }

    boardCollision(part) {
        return part.x === BOARD_SIZE || part.x === -1 || part.y === BOARD_SIZE || part.y === -1;
    }

    updatePositions() {
        // this.look();
        // this.think();
        let newHead = this.repositionHead();
        let me = this;

        if (this.boardCollision(newHead)) {
            this.dead();
            this.isDeadResolver(true);
            return;
        }

        if (this.selfCollision(newHead)) {
            this.dead();
            this.isDeadResolver(true);
            return;
        } else if (this.fruit.fruitCollision(newHead)) {
            this.eatFruit();
        }

        let oldTail = this.parts.pop();
        this.board[oldTail.y][oldTail.x] = false;

        this.parts.unshift(newHead);
        this.board[newHead.y][newHead.x] = true;

        this.lifeTime++;
        this.lifeLeft--;

        this.direction = this.tempDirection;

        this.timer = setTimeout(() => {
            me.updatePositions();
        }, this.interval);
    }

    repositionHead() {
        let newHead = Object.assign({}, this.parts[0]);
        if (this.tempDirection === CONTROLSAI.LEFT) {
            newHead.x -= 1;
        } else if (this.tempDirection === CONTROLSAI.RIGHT) {
            newHead.x += 1;
        } else if (this.tempDirection === CONTROLSAI.UP) {
            newHead.y -= 1;
        } else if (this.tempDirection === CONTROLSAI.DOWN) {
            newHead.y += 1;
        }

        return newHead;
    }

    getStatus() {
        return new Promise < boolean > (resolve => {
            return this.isDeadResolver = resolve;
        });
    }

    dead() {
        this.isdeadNow = true;
        clearTimeout(this.timer);
        this.calculateFitness();
    }

    calculateFitness() {
        if (this.score < 10) {
            this.fitness = Math.floor(this.lifeTime * this.lifeTime) * Math.pow(2, this.score);
        } else {
            this.fitness = Math.floor(this.lifeTime * this.lifeTime);
            this.fitness *= Math.pow(2, 10);
            this.fitness *= (this.score - 9);
        }
    }

    look() {

        this.vision = [...this.lookInDirection({x: -1, y: 0}),
            ...this.lookInDirection({x: -1, y: -1}),
            ...this.lookInDirection({x: 0, y: -1}),
            ...this.lookInDirection({x: 1, y: -1}),
            ...this.lookInDirection({x: 1, y: 0}),
            ...this.lookInDirection({x: 1, y: 1}),
            ...this.lookInDirection({x: 0, y: 1}),
            ...this.lookInDirection({x: -1, y: 1}),
        ];
    }

    lookInDirection(directionVector) {
        var head = {...this.parts[0]};
        var look = new Array(3).fill(0);
        var distance = 0;
        var foodCollision = false;
        var bodyCollision = false;
        var pos = head;

        pos.x += directionVector.x;
        pos.y += directionVector.y;
        distance += 1;

        while (!this.boardCollision(pos)) {
            if (!foodCollision && this.fruit.fruitCollision(pos)) {
                foodCollision = true;
                look[0] = 1;
            }
            if (!bodyCollision && this.selfCollision(pos)) {
                bodyCollision = true;
                look[1] = 1;
            }

            pos.x += directionVector.x;
            pos.y += directionVector.y;
            distance += 1;

            look[2] = 1 / distance;
        }
        return look;
    }

    async think() {
        var output = await this.decide(this.vision);
        this.netResult = output.dataSync();
        const indexOfMaxValue = this.netResult.indexOf(Math.max(...this.netResult));
        this.tempDirection = indexOfMaxValue;
        //console.log('output: ', result, indexOfMaxValue);
    }

    clone() {
        return new Snake(-1, this.interval, this.mind)
    }
}
