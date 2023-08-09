import Cookies from 'js-cookie';
import React from 'react';
import { MouseEvent } from 'react';
import { Socket, io } from 'socket.io-client';

enum KeyBindings {
    UP = "ArrowUp",
    DOWN = "ArrowDown",
}

export class GameClassic {
    private gameContext: CanvasRenderingContext2D | null;
    private animationId: number = 0;
    public static keysPressed: { [key: string]: boolean } = {};
    public static playerLeftScore: number = 0;
    public static playerRightScore: number = 0;
    public gameCanvas: HTMLCanvasElement | null;
    public static socket: Socket;
    public static socketUser: Socket;
    public static nameRoom: string = '';
    public static whichPlayer: string = '';
    private updateExit: (value: number) => void;
    private updateEnd: (value: number) => void;
    setNamePlayer: (value: string[]) => void;
    public playerRight: PaddleRight;
    public playerLeft: PaddleLeft;
    private ball: Ball;
    private ballSize: number = 20;
    private paddleWidth: number = 18;
    private paddleHeight: number = 120;
    private wallOffset: number = 12;
    private exit: boolean = false;
    private scoreWin: number = 5;
    public static nameUser = Cookies.get('token');
    private giveScore: boolean = false;

    constructor(gameref: React.RefObject<HTMLCanvasElement>,
        otherPlayer: string, 
        status: string,
        updateExit: (value: number) => void,
        updateEnd: (value: number) => void,
        setNamePlayer: (value: string[]) => void) {
            
        this.setNamePlayer = setNamePlayer;
        this.updateExit = updateExit;
        this.updateEnd = updateEnd;
        this.gameCanvas = gameref.current;
        GameClassic.socket = io('http://localhost:3001/gameplay');
        GameClassic.socketUser = io('http://localhost:3001/user');

        this.gameContext = this.gameCanvas!.getContext("2d");
        this.gameContext!.font = "2.5rem sans-serif";

        window.addEventListener("keydown", function (e) {
            if (e.key === "ArrowUp") {
                GameClassic.keysPressed[KeyBindings.UP] = true;
            } else if (e.key === "ArrowDown") {
                GameClassic.keysPressed[KeyBindings.DOWN] = true;
            }
        });

        window.addEventListener("keyup", function (e) {
            if (e.key === "ArrowUp") {
                GameClassic.keysPressed[KeyBindings.UP] = false;
            } else if (e.key === "ArrowDown") {
                GameClassic.keysPressed[KeyBindings.DOWN] = false;
            }
        });

        window.addEventListener("blur", () => {
            GameClassic.keysPressed["ArrowUp"] = false;
            GameClassic.keysPressed["ArrowDown"] = false;
        })

        this.playerLeft = new PaddleLeft(this.paddleWidth, this.paddleHeight, this.wallOffset, this.gameCanvas!.height / 2 - this.paddleHeight / 2);
        this.playerRight = new PaddleRight(this.paddleWidth, this.paddleHeight, this.gameCanvas!.width - (this.wallOffset + this.paddleWidth), this.gameCanvas!.height / 2 - this.paddleHeight / 2);
        this.ball = new Ball(this.ballSize, this.ballSize, this.gameCanvas!.width / 2 - this.ballSize / 2, this.gameCanvas!.height / 2 - this.ballSize / 2);
        GameClassic.socket.emit('registeredRoom', {name : GameClassic.nameUser, otherPlayer : otherPlayer, status: status});
        if (status === 'invited'){
            GameClassic.socket.on('player left suddenly', () => {
                this.updateExit(3);
                this.gameFinished();
                return;
            })
        }
        GameClassic.socket.once('room', (nameRoom: string, player: string) => {
            GameClassic.nameRoom = nameRoom;
            GameClassic.whichPlayer = player;
            if (GameClassic.whichPlayer === 'playerLeft') {
                if (GameClassic.nameUser) {
                    setNamePlayer([GameClassic.nameUser, 'Waiting ...'])
                }
                GameClassic.socket.emit('dataPaddle', { name: GameClassic.nameRoom, width: this.paddleWidth, height: this.paddleHeight });
                GameClassic.socket.emit('dataBall', { name: GameClassic.nameRoom, width: this.ballSize, height: this.ballSize, x: this.gameCanvas!.width / 2 - this.ballSize / 2, y: this.gameCanvas!.height / 2 - this.ballSize / 2 });
            }
        })

        GameClassic.socket.on('beginGame', (playerLeft: string, playerRight: string) => {
            if (this.exit === false) {
                if (GameClassic.nameUser) {
                    setNamePlayer([playerLeft, playerRight]);
                }
                GameClassic.socketUser.emit('user modify');
                this.gameLoop();
            }
        })
    }

    public clickHandler = (e: MouseEvent): void => {
        e.preventDefault();
        this.cleanGame();
        window.location.href = "http://localhost:3000/game";
    }

    public clickRetry = (e: MouseEvent): void => {
        e.preventDefault();
        this.cleanGame();
        window.location.href = "http://localhost:3000/gameplay/noMatchMaking";
    }

    public cleanGame = () => {
        window.removeEventListener("keydown", function (e) {
            if (e.key === "ArrowUp") {
                GameClassic.keysPressed[KeyBindings.UP] = true;
            } else if (e.key === "ArrowDown") {
                GameClassic.keysPressed[KeyBindings.DOWN] = true;
            }
        });

        window.removeEventListener("keyup", function (e) {
            if (e.key === "ArrowUp") {
                GameClassic.keysPressed[KeyBindings.UP] = false;
            } else if (e.key === "ArrowDown") {
                GameClassic.keysPressed[KeyBindings.DOWN] = false;
            }
        });

        window.removeEventListener("blur", () => {
            GameClassic.keysPressed["ArrowUp"] = false;
            GameClassic.keysPressed["Arrowdown"] = false;
        })
        cancelAnimationFrame(this.animationId);
    }

    drawBoardDetails() {
        this.gameContext!.fillStyle = "#fff";
        this.gameContext!.fillText(String(GameClassic.playerRightScore), (this.gameCanvas!.width * 0.75), (this.gameCanvas!.height * 0.07));
        this.gameContext!.fillText(String(GameClassic.playerLeftScore), (this.gameCanvas!.width * 0.24), (this.gameCanvas!.height * 0.07));
    }
    update() {
        if (GameClassic.whichPlayer === 'playerLeft') {
            this.playerLeft.update(this.gameCanvas!);
        }
        if (GameClassic.whichPlayer === 'playerRight') {
            this.playerRight.update(this.gameCanvas!);
        }
        this.ball.update(this.playerRight, this.playerLeft, this.gameCanvas!);
    }
    draw() {
        this.gameContext!.fillStyle = "#000";
        this.gameContext!.fillRect(0, 0, this.gameCanvas!.width, this.gameCanvas!.height);
        this.drawBoardDetails();
        this.playerLeft.draw(this.gameContext!);
        this.playerRight.draw(this.gameContext!);
        this.ball.draw(this.gameContext!);
    }

    gameFinished() {
        this.updateEnd(1);
        this.gameContext!.clearRect(0, 0, this.gameCanvas!.width, this.gameCanvas!.height);
        this.cleanGame();
        GameClassic.socket.off('beginGame');
        GameClassic.socket.off('youWinOrLoose');
        GameClassic.socket.off('player left suddenly');
        GameClassic.socket.off('yPaddleRightMove');
        GameClassic.socket.off('yPaddleLeftMove');
        GameClassic.socket.off('handleUpdateBall');       
        GameClassic.socket.emit('finished');
    }
    gameLoop = () => {
        if (this.exit === false && GameClassic.playerRightScore === this.scoreWin) {
            GameClassic.socket.emit('whoWinorLoose', { name: GameClassic.nameRoom, score: this.scoreWin, player: GameClassic.whichPlayer });
        }
        if (this.exit === false && GameClassic.playerLeftScore === this.scoreWin) {
            GameClassic.socket.emit('whoWinorLoose', { name: GameClassic.nameRoom, score: this.scoreWin, player: GameClassic.whichPlayer });
        }
        GameClassic.socket.on('youWinOrLoose', (numberUpdateExit: number) => {
            this.updateExit(numberUpdateExit);
            this.exit = true;
            if (this.exit === true && this.giveScore === false) {
                GameClassic.socket.emit('finalScore', { room: GameClassic.nameRoom, player: GameClassic.whichPlayer });
                GameClassic.socket.emit('updateGame', { room: GameClassic.nameRoom, user: GameClassic.nameUser });
                this.giveScore = true;
            }
            this.gameFinished();
            return;
        })
        GameClassic.socket.on('player left suddenly', () => {
            this.updateExit(3);
            this.gameFinished();
            return;
        })

        GameClassic.socket.on('yPaddleRightMove', (y: number) => {
            this.playerRight.updateOtherPlayer(y);
        })
        GameClassic.socket.on('yPaddleLeftMove', (y: number) => {
            this.playerLeft.updateOtherPlayer(y);
        })
        this.update();
        this.draw();
        this.animationId = requestAnimationFrame(this.gameLoop.bind(this));
    }
}

class Entity {
    width: number;
    height: number;
    x: number;
    y: number;
    xVel: number = 0;
    yVel: number = 0;
    constructor(w: number, h: number, x: number, y: number) {
        this.width = w;
        this.height = h;
        this.x = x;
        this.y = y;
    }
    draw(context: CanvasRenderingContext2D) {
        context.fillStyle = "#fff";
        context.fillRect(this.x, this.y, this.width, this.height);
    }
}

class PaddleRight extends Entity {

    private speed: number = 10;

    update(canvas: HTMLCanvasElement) {
        if (GameClassic.keysPressed[KeyBindings.UP]) {
            this.yVel = -1;
            if (this.y <= 20) {
                this.yVel = 0
            }
        } else if (GameClassic.keysPressed[KeyBindings.DOWN]) {
            this.yVel = 1;
            if (this.y + this.height >= canvas.height - 20) {
                this.yVel = 0;
            }
        } else {
            this.yVel = 0;
        }
        this.y += this.yVel * this.speed;
        GameClassic.socket.emit('yPaddleRight', { y: this.y, room: GameClassic.nameRoom });
    }
    updateOtherPlayer(y: number) {
        this.y = y;
    }
}

class PaddleLeft extends Entity {

    private speed: number = 10;

    update(canvas: HTMLCanvasElement) {
        if (GameClassic.keysPressed[KeyBindings.UP]) {
            this.yVel = -1;
            if (this.y <= 20) {
                this.yVel = 0
            }
        } else if (GameClassic.keysPressed[KeyBindings.DOWN]) {
            this.yVel = 1;
            if (this.y + this.height >= canvas.height - 20) {
                this.yVel = 0;
            }
        } else {
            this.yVel = 0;
        }
        this.y += this.yVel * this.speed;
        GameClassic.socket.emit('yPaddleLeft', { y: this.y, room: GameClassic.nameRoom });
    }
    updateOtherPlayer(y: number) {
        this.y = y;
    }
}

class Ball extends Entity {

    update(playerRight: PaddleRight, playerLeft: PaddleLeft, canvas: HTMLCanvasElement) {
        const data = {
            nameRoom: GameClassic.nameRoom,
            xPlayerRight: playerRight.x,
            yPlayerRight: playerRight.y,
            xPlayerLeft: playerLeft.x,
            yPlayerLeft: playerLeft.y,
            widthCanvas: canvas.width,
            heightCanvas: canvas.height,
        };

        GameClassic.socket.emit('updateBall', data);
        GameClassic.socket.on('handleUpdateBall', (data: { x: number, y: number, scoreLeft: number, scoreRight: number }) => {
            const { x, y, scoreLeft, scoreRight } = data;
            this.x = x;
            this.y = y;
            GameClassic.playerLeftScore = scoreLeft;
            GameClassic.playerRightScore = scoreRight;
        });
    }
}