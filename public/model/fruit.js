import {BOARD_SIZE} from "./constants.js";

export class Fruit {

    x = -1;
    y = -1;

    board;

    constructor(board) {
        this.board = board;
        this.resetFruit();
    }

    fruitCollision(part) {
        return part.x === this.x && part.y === this.y;
    }

    resetFruit() {
        let x = this.randomNumber();
        let y = this.randomNumber();

        if (this.board[y][x] === true) {
            return this.resetFruit();
        }
        this.x = x;
        this.y = y;
    }

    randomNumber() {
        return Math.floor(Math.random() * BOARD_SIZE);
    }

}
