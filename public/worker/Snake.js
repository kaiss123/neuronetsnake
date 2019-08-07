export class Snake {

    constructor() {

    }

    BOARD_SIZE = 25;

    CONTROLSAI = {
        LEFT: 2,
        UP: 0,
        RIGHT: 3,
        DOWN: 1
    };

    COLORS = {
        GAME_OVER: '#D24D57',
        FRUIT: '#EC644B',
        HEAD: '#336E7B',
        BODY: '#C8F7C5',
        BOARD: '#86B5BD',
        OBSTACLE: '#383522'
    };

    interval = 0;
    timer;
    score = 0;
    lifeTime = 0;
    lifeLeft = 200;
    fitness = 1;
    vision;
    // netResult;
    // isdeadNow = false;
    //     // parentsFitness = -1;

    direction = this.CONTROLSAI.LEFT;

    //parts = [];
    board = [];
    tempDirection = this.CONTROLSAI.LEFT;

    // replay;

    isDeadResolver;
    isDead = false;

    fruit = {x: -1, y: -1};
    snake = {
        direction: this.CONTROLSAI.LEFT,
        parts: []
    };

    brain;

    getBrain = () => this.brain;
    getFitness = () => this.fitness;

    start = () => {
        this.setBoard();
        this.initBain();
        for (let i = 0; i < 3; i++) {
            this.snake.parts.push({x: Math.floor(this.BOARD_SIZE / 2 + i),
                y: Math.floor(this.BOARD_SIZE / 2)});
        }
        this.resetFruit();
        this.updatePositions();
    };

    setBoard = () => {
        this.board = [];

        for (let i = 0; i < this.BOARD_SIZE; i++) {
            this.board[i] = [];
            for (let j = 0; j < this.BOARD_SIZE; j++) {
                this.board[i][j] = false;
            }
        }
    };

    randomBoardNumber = () => {
        return Math.floor(Math.random() * this.BOARD_SIZE);
    };

    fruitCollision = (part) => {
        return part.x === this.fruit.x && part.y === this.fruit.y;
    };

    resetFruit = () => {
        let x = this.randomBoardNumber();
        let y = this.randomBoardNumber();

        if (this.board[y][x] === true) {
            debugger;
            return this.resetFruit();
        }
        this.fruit.x = x;
        this.fruit.y = y;
    };

    eatFruit = () => {
        this.score++;

        let tail = Object.assign({}, this.snake.parts[this.snake.parts.length - 1]);

        this.snake.parts.push(tail);
        this.resetFruit();
    };

    selfCollision = (part) => {
        if (part.x < this.BOARD_SIZE - 1 && part.y < this.BOARD_SIZE) {
            return this.board[part.y][part.x] === true;
        }
    };

    boardCollision = (part) => {
        return part.x === this.BOARD_SIZE || part.x === -1 || part.y === this.BOARD_SIZE || part.y === -1;
    };

    repositionHead = () => {
        let newHead = Object.assign({}, this.snake.parts[0]);

        if (this.tempDirection === this.CONTROLSAI.LEFT) {
            newHead.x -= 1;
        } else if (this.tempDirection === this.CONTROLSAI.RIGHT) {
            newHead.x += 1;
        } else if (this.tempDirection === this.CONTROLSAI.UP) {
            newHead.y -= 1;
        } else if (this.tempDirection === this.CONTROLSAI.DOWN) {
            newHead.y += 1;
        }

        return newHead;
    };

    getStatus = () => {
        return new Promise(resolve => {
            return this.isDeadResolver = resolve;
        });
    };

    dead = ()  => {
        this.isDead = true;
        this.isDeadResolver(true);
        clearTimeout(this.timer);
        this.calculateFitness();
    };

    updatePositions = async () => {
        this.lookAround();
        await this.think();
        let newHead = this.repositionHead();

        if (this.boardCollision(newHead)) {
            this.dead();
            //this.isDeadResolver(true);
            return;
        }

        if (this.selfCollision(newHead)) {
            this.dead();
            // this.isDeadResolver(true);
            return;
        } else if (this.fruitCollision(newHead)) {
            this.eatFruit();
        }

        let oldTail = this.snake.parts.pop();
        this.board[oldTail.y][oldTail.x] = false;

        this.snake.parts.unshift(newHead);
        this.board[newHead.y][newHead.x] = true;

        this.lifeTime++;
        this.lifeLeft--;

        this.direction = this.tempDirection;

        timer = setTimeout(() => {
            this.updatePositions();
        }, this.interval);
    };

    calculateFitness = () => {
        if (this.score < 10) {
            this.fitness = Math.floor(this.lifeTime * this.lifeTime) * Math.pow(2, this.score);
        } else {
            this.fitness = Math.floor(this.lifeTime * this.lifeTime);
            this.fitness *= Math.pow(2, 10);
            this.fitness *= (this.score - 9);
        }
        return this.fitness;
    };

    lookAround = () => {

        this.vision = [...this.lookInDirection({x: -1, y: 0}),
            ...this.lookInDirection({x: -1, y: -1}),
            ...this.lookInDirection({x: 0, y: -1}),
            ...this.lookInDirection({x: 1, y: -1}),
            ...this.lookInDirection({x: 1, y: 0}),
            ...this.lookInDirection({x: 1, y: 1}),
            ...this.lookInDirection({x: 0, y: 1}),
            ...this.lookInDirection({x: -1, y: 1}),
        ];
        // console.table(vision);
    };

    lookInDirection = (directionVector) => {
        let head = {...this.snake.parts[0]};
        let look = new Array(3).fill(0);
        let distance = 0;
        let foodCollision = false;
        let bodyCollision = false;
        let pos = head;

        pos.x += directionVector.x;
        pos.y += directionVector.y;
        distance += 1;

        while (!this.boardCollision(pos)) {
            if (!foodCollision && this.fruitCollision(pos)) {
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
    };

    think = async () => {
        let output = await this.decide(this.vision);
        let brainResult = output.dataSync();
        // console.table(brainResult);
        const indexOfMaxValue = brainResult.indexOf(Math.max(...brainResult));
        this.tempDirection = indexOfMaxValue;
        //console.log('output: ', result, indexOfMaxValue);
    };

    clone = () => {
        // return new Snake(-1, this.interval, this.mind)
    };

    initBain = () => {
        this.brain = tf.sequential();
        this.brain.add(tf.layers.dense({inputShape: [24], units: 1}));
        this.brain.add(tf.layers.dense({units: 24, activation: 'sigmoid',
            useBias: true,
            biasInitializer: 'randomNormal'}));
        this.brain.add(tf.layers.dense({units: 24, activation: 'sigmoid',
            useBias: true,
            biasInitializer: 'randomNormal'}));
        this.brain.add(tf.layers.dense({units: 4}));
    };

    decide = async (input) => {
        //console.log('input: ', input);
        return tf.tidy(() => {
            return this.brain.predict(tf.tensor([input]));
        });
    };
}
