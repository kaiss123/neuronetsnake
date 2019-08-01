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

    // interval = 50;
    // timer;
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
    //
    // isDeadResolver;
    // isDead;

    let fruit = {x: -1, y: -1};
    let snake = {
        direction: CONTROLSAI.LEFT,
        parts: []
    };

    this.start = () => {
        debugger;
        for (let i = 0; i < 3; i++) {
            snake.parts.push({x: Math.floor(BOARD_SIZE / 2 + i), y: Math.floor(BOARD_SIZE / 2)});
        }
        this.resetFruit();
        this.updatePositions();
    };

    this.setBoard = () => {
        board = [];

        debugger;
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
        resetFruit();
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

    this.updatePositions = () => {
        this.lookAround();
        //this.think();
        let newHead = this.repositionHead();

        if (this.boardCollision(newHead)) {
            //dead();
            //this.isDeadResolver(true);
            return;
        }

        if (this.selfCollision(newHead)) {
            // this.dead();
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

        // this.timer = setTimeout(() => {
        //     me.updatePositions();
        // }, this.interval);
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

    // const think = async () => {
    //     var output = await this.decide(this.vision);
    //     this.netResult = output.dataSync();
    //     const indexOfMaxValue = this.netResult.indexOf(Math.max(...this.netResult));
    //     this.tempDirection = indexOfMaxValue;
    //     //console.log('output: ', result, indexOfMaxValue);
    // };
    //
    // const clone = () => {
    //     // return new Snake(-1, this.interval, this.mind)
    // }
}