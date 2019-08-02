function Snake() {
    const BOARD_SIZE = 25;

    const CONTROLSAI = {
        LEFT: 2,
        UP: 0,
        RIGHT: 3,
        DOWN: 1
    };

    const COLORS = {
        GAME_OVER: '#D24D57',
        FRUIT: '#EC644B',
        HEAD: '#336E7B',
        BODY: '#C8F7C5',
        BOARD: '#86B5BD',
        OBSTACLE: '#383522'
    };

    let interval = 50;
    let timer;
    let score = 0;
    let lifeTime = 0;
    let lifeLeft = 200;
    let fitness = 1;
    let vision;
    // netResult;
    // isdeadNow = false;
    //     // parentsFitness = -1;

    let direction = CONTROLSAI.LEFT;

    //parts = [];
    let board = [];
    let tempDirection = CONTROLSAI.LEFT;

    // replay;

    let isDeadResolver;
    let isDead = false;

    let fruit = {x: -1, y: -1};
    let snake = {
        direction: CONTROLSAI.LEFT,
        parts: []
    };

    let brain;

    this.start = () => {
        this.setBoard();
        this.initBain();
        for (let i = 0; i < 3; i++) {
            snake.parts.push({x: Math.floor(BOARD_SIZE / 2 + i), y: Math.floor(BOARD_SIZE / 2)});
        }
        this.resetFruit();
        this.updatePositions();
    };

    this.setBoard = () => {
        board = [];

        for (let i = 0; i < BOARD_SIZE; i++) {
            board[i] = [];
            for (let j = 0; j < BOARD_SIZE; j++) {
                board[i][j] = false;
            }
        }
    };

    this.randomBoardNumber = () => {
        return Math.floor(Math.random() * BOARD_SIZE);
    };

    this.fruitCollision = (part) => {
        return part.x === fruit.x && part.y === fruit.y;
    };

    this.resetFruit = () => {
        let x = this.randomBoardNumber();
        let y = this.randomBoardNumber();

        if (board[y][x] === true) {
            debugger;
            return this.resetFruit();
        }
        fruit.x = x;
        fruit.y = y;
    };

    this.eatFruit = () => {
        score++;

        let tail = Object.assign({}, snake.parts[snake.parts.length - 1]);

        snake.parts.push(tail);
        this.resetFruit();
    };

    this.selfCollision = (part) => {
        if (part.x < BOARD_SIZE - 1 && part.y < BOARD_SIZE) {
            return board[part.y][part.x] === true;
        }
    };

    this.boardCollision = (part) => {
        return part.x === BOARD_SIZE || part.x === -1 || part.y === BOARD_SIZE || part.y === -1;
    };

    this.repositionHead = () => {
        let newHead = Object.assign({}, snake.parts[0]);

        if (tempDirection === CONTROLSAI.LEFT) {
            newHead.x -= 1;
        } else if (tempDirection === CONTROLSAI.RIGHT) {
            newHead.x += 1;
        } else if (tempDirection === CONTROLSAI.UP) {
            newHead.y -= 1;
        } else if (tempDirection === CONTROLSAI.DOWN) {
            newHead.y += 1;
        }

        return newHead;
    };

    this.getStatus = () => {
        return new Promise(resolve => {
            return isDeadResolver = resolve;
        });
    };

    this.dead = ()  => {
        isDead = true;
        isDeadResolver(true);
        clearTimeout(timer);
        // this.calculateFitness();
    };

    this.updatePositions = async () => {
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

        let oldTail = snake.parts.pop();
        board[oldTail.y][oldTail.x] = false;

        snake.parts.unshift(newHead);
        board[newHead.y][newHead.x] = true;

        lifeTime++;
        lifeLeft--;

        direction = tempDirection;

        timer = setTimeout(() => {
            this.updatePositions();
        }, interval);
    };

    this.calculateFitness = () => {
        if (score < 10) {
            fitness = Math.floor(lifeTime * lifeTime) * Math.pow(2, score);
        } else {
            fitness = Math.floor(lifeTime * lifeTime);
            fitness *= Math.pow(2, 10);
            fitness *= (score - 9);
        }
        return fitness;
    };

    this.lookAround = () => {

        vision = [...this.lookInDirection({x: -1, y: 0}),
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

    this.lookInDirection = (directionVector) => {
        let head = {...snake.parts[0]};
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

    this.think = async () => {
        let output = await this.decide(vision);
        let brainResult = output.dataSync();
        // console.table(brainResult);
        const indexOfMaxValue = brainResult.indexOf(Math.max(...brainResult));
        tempDirection = indexOfMaxValue;
        //console.log('output: ', result, indexOfMaxValue);
    };

    const clone = () => {
        // return new Snake(-1, this.interval, this.mind)
    }

    this.initBain = () => {
        brain = tf.sequential();
        brain.add(tf.layers.dense({inputShape: [24], units: 1}));
        brain.add(tf.layers.dense({units: 24, activation: 'sigmoid',
            useBias: true,
            biasInitializer: 'randomNormal'}));
        brain.add(tf.layers.dense({units: 24, activation: 'sigmoid',
            useBias: true,
            biasInitializer: 'randomNormal'}));
        brain.add(tf.layers.dense({units: 4}));
    };

    this.decide = async (input) => {
        //console.log('input: ', input);
        return tf.tidy(() => {
            return brain.predict(tf.tensor([input]));
        });
    };
}
