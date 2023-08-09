import Cookies from 'js-cookie';
import React from 'react';
import { MouseEvent } from 'react';
import { Socket, io } from 'socket.io-client';

enum KeyBindings {
    UP = "ArrowUp",
    DOWN = "ArrowDown",
}

export class GameCustom {
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
    private ballSize: number = 40;
    private paddleWidth: number = 18;
    private paddleHeight: number = 120;
    private wallOffset: number = 12;
    private exit: boolean = false;
    private scoreWin: number = 5;
    public static nameUser = Cookies.get('token');
    private giveScore: boolean = false;
    private backgroundImage: HTMLImageElement;

    constructor(gameref: React.RefObject<HTMLCanvasElement>,
        otherPlayer: string, 
        status: string,
        updateExit: (value: number) => void,
        updateEnd: (value: number) => void,
        setNamePlayer: (value: string[]) => void) {
        
        this.backgroundImage = new Image();
        this.backgroundImage.src = '/img/bg-game.jpg';

    this.backgroundImage.onload = () => {
      this.draw();
    };
            
        this.setNamePlayer = setNamePlayer;
        this.updateExit = updateExit;
        this.updateEnd = updateEnd;
        this.gameCanvas = gameref.current;
        GameCustom.socket = io('http://localhost:3001/gameplay');
        GameCustom.socketUser = io('http://localhost:3001/user');

        this.gameContext = this.gameCanvas!.getContext("2d");
        this.gameContext!.font = "2.5rem sans-serif";

        window.addEventListener("keydown", function (e) {
            if (e.key === "ArrowUp") {
                GameCustom.keysPressed[KeyBindings.UP] = true;
            } else if (e.key === "ArrowDown") {
                GameCustom.keysPressed[KeyBindings.DOWN] = true;
            }
        });

        window.addEventListener("keyup", function (e) {
            if (e.key === "ArrowUp") {
                GameCustom.keysPressed[KeyBindings.UP] = false;
            } else if (e.key === "ArrowDown") {
                GameCustom.keysPressed[KeyBindings.DOWN] = false;
            }
        });

        window.addEventListener("blur", () => {
            GameCustom.keysPressed["ArrowUp"] = false;
            GameCustom.keysPressed["ArrowDown"] = false;
        })

        this.playerLeft = new PaddleLeft(this.paddleWidth, this.paddleHeight, this.wallOffset, this.gameCanvas!.height / 2 - this.paddleHeight / 2, this.gameContext!);
        this.playerRight = new PaddleRight(this.paddleWidth, this.paddleHeight, this.gameCanvas!.width - (this.wallOffset + this.paddleWidth), this.gameCanvas!.height / 2 - this.paddleHeight / 2, this.gameContext!);
        this.ball = new Ball(this.ballSize, this.ballSize, this.gameCanvas!.width / 2 - this.ballSize / 2, this.gameCanvas!.height / 2 - this.ballSize / 2, this.gameContext!);
        GameCustom.socket.emit('registeredRoom', {name : GameCustom.nameUser, otherPlayer : otherPlayer, status: status});
        if (status === 'invited'){
            GameCustom.socket.on('player left suddenly', () => {
                this.updateExit(3);
                this.gameFinished();
                return;
            })
        }
        GameCustom.socket.once('room', (nameRoom: string, player: string) => {
            GameCustom.nameRoom = nameRoom;
            GameCustom.whichPlayer = player;
            if (GameCustom.whichPlayer === 'playerLeft') {
                if (GameCustom.nameUser) {
                    setNamePlayer([GameCustom.nameUser, 'Waiting ...'])
                }
                GameCustom.socket.emit('dataPaddle', { name: GameCustom.nameRoom, width: this.paddleWidth, height: this.paddleHeight });
                GameCustom.socket.emit('dataBall', { name: GameCustom.nameRoom, width: this.ballSize, height: this.ballSize, x: this.gameCanvas!.width / 2 - this.ballSize / 2, y: this.gameCanvas!.height / 2 - this.ballSize / 2 });
            }
        })

        GameCustom.socket.on('beginGame', (playerLeft: string, playerRight: string) => {
            if (this.exit === false) {
                if (GameCustom.nameUser) {
                    setNamePlayer([playerLeft, playerRight]);
                }
                GameCustom.socketUser.emit('user modify');
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
        window.location.href = "http://localhost:3000/custom/noMatchMaking";
    }

    public cleanGame = () => {
        window.removeEventListener("keydown", function (e) {
            if (e.key === "ArrowUp") {
                GameCustom.keysPressed[KeyBindings.UP] = true;
            } else if (e.key === "ArrowDown") {
                GameCustom.keysPressed[KeyBindings.DOWN] = true;
            }
        });

        window.removeEventListener("keyup", function (e) {
            if (e.key === "ArrowUp") {
                GameCustom.keysPressed[KeyBindings.UP] = false;
            } else if (e.key === "ArrowDown") {
                GameCustom.keysPressed[KeyBindings.DOWN] = false;
            }
        });

        window.removeEventListener("blur", () => {
            GameCustom.keysPressed["ArrowUp"] = false;
            GameCustom.keysPressed["Arrowdown"] = false;
        })
        cancelAnimationFrame(this.animationId);
    }

    drawBoardDetails() {
        this.gameContext!.fillStyle = "#fff";
        this.gameContext!.fillText(String(GameCustom.playerRightScore), (this.gameCanvas!.width * 0.75), (this.gameCanvas!.height * 0.07));
        this.gameContext!.fillText(String(GameCustom.playerLeftScore), (this.gameCanvas!.width * 0.24), (this.gameCanvas!.height * 0.07));
    }
    update() {
        if (GameCustom.whichPlayer === 'playerLeft') {
            this.playerLeft.update(this.gameCanvas!);
        }
        if (GameCustom.whichPlayer === 'playerRight') {
            this.playerRight.update(this.gameCanvas!);
        }
        this.ball.update(this.playerRight, this.playerLeft, this.gameCanvas!);
    }
    draw() {
        if (this.backgroundImage.complete) {
          this.gameContext!.drawImage(this.backgroundImage, 0, 0, this.gameCanvas!.width, this.gameCanvas!.height);
        } else {
          this.gameContext!.fillStyle = "#000";
          this.gameContext!.fillRect(0, 0, this.gameCanvas!.width, this.gameCanvas!.height);
        }
    
        this.drawBoardDetails();
        this.playerLeft.draw(this.gameContext!);
        this.playerRight.draw(this.gameContext!);
        this.ball.draw(this.gameContext!);
      }

    gameFinished() {
        this.updateEnd(1);
        this.gameContext!.clearRect(0, 0, this.gameCanvas!.width, this.gameCanvas!.height);
        this.cleanGame();
        GameCustom.socket.off('beginGame');
        GameCustom.socket.off('youWinOrLoose');
        GameCustom.socket.off('player left suddenly');
        GameCustom.socket.off('yPaddleRightMove');
        GameCustom.socket.off('yPaddleLeftMove');
        GameCustom.socket.off('handleUpdateBall');       
        GameCustom.socket.emit('finished');
    }
    gameLoop = () => {
        if (this.exit === false && GameCustom.playerRightScore === this.scoreWin) {
            GameCustom.socket.emit('whoWinorLoose', { name: GameCustom.nameRoom, score: this.scoreWin, player: GameCustom.whichPlayer });
        }
        if (this.exit === false && GameCustom.playerLeftScore === this.scoreWin) {
            GameCustom.socket.emit('whoWinorLoose', { name: GameCustom.nameRoom, score: this.scoreWin, player: GameCustom.whichPlayer });
        }
        GameCustom.socket.on('youWinOrLoose', (numberUpdateExit: number) => {
            this.updateExit(numberUpdateExit);
            this.exit = true;
            if (this.exit === true && this.giveScore === false) {
                GameCustom.socket.emit('finalScore', { room: GameCustom.nameRoom, player: GameCustom.whichPlayer });
                GameCustom.socket.emit('updateGame', { room: GameCustom.nameRoom, user: GameCustom.nameUser });
                this.giveScore = true;
            }
            this.gameFinished();
            return;
        })
        GameCustom.socket.on('player left suddenly', () => {
            this.updateExit(3);
            this.gameFinished();
            return;
        })

        GameCustom.socket.on('yPaddleRightMove', (y: number) => {
            this.playerRight.updateOtherPlayer(y);
        })
        GameCustom.socket.on('yPaddleLeftMove', (y: number) => {
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
    private paddleImage: HTMLImageElement;
    private gameContext: CanvasRenderingContext2D;

    constructor(width: number, height: number, x: number, y: number, gameContext: CanvasRenderingContext2D) {
        super(width, height, x, y);
        this.paddleImage = new Image();
        this.paddleImage.src = '/img/spaceship.png';

        this.gameContext = gameContext;

        this.paddleImage.onload = () => {
        this.draw(this.gameContext);
        };

        this.paddleImage.onerror = () => {
        console.error("Failed to load the paddle image.");
        };
    }

    draw(context: CanvasRenderingContext2D) {
        if (this.paddleImage.complete) {
        context.drawImage(this.paddleImage, this.x, this.y, this.width, this.height);
        }
    }

    update(canvas: HTMLCanvasElement) {
        if (GameCustom.keysPressed[KeyBindings.UP]) {
            this.yVel = -1;
            if (this.y <= 20) {
                this.yVel = 0
            }
        } else if (GameCustom.keysPressed[KeyBindings.DOWN]) {
            this.yVel = 1;
            if (this.y + this.height >= canvas.height - 20) {
                this.yVel = 0;
            }
        } else {
            this.yVel = 0;
        }
        this.y += this.yVel * this.speed;
        GameCustom.socket.emit('yPaddleRight', { y: this.y, room: GameCustom.nameRoom });
    }
    updateOtherPlayer(y: number) {
        this.y = y;
    }
}

class PaddleLeft extends Entity {
    private speed: number = 10;
    private paddleImage: HTMLImageElement;
    private gameContext: CanvasRenderingContext2D;
  
    constructor(width: number, height: number, x: number, y: number, gameContext: CanvasRenderingContext2D) {
        super(width, height, x, y);
      this.paddleImage = new Image();
      this.paddleImage.src = '/img/spaceship.png';
  
      this.gameContext = gameContext;

      this.paddleImage.onload = () => {
        this.draw(this.gameContext);
      };
  
      this.paddleImage.onerror = () => {
        console.error("Failed to load the paddle image.");
      };
    }
  
    draw(context: CanvasRenderingContext2D) {
      if (this.paddleImage.complete) {
        context.drawImage(this.paddleImage, this.x, this.y, this.width, this.height);
      }
    }

    update(canvas: HTMLCanvasElement) {
        if (GameCustom.keysPressed[KeyBindings.UP]) {
            this.yVel = -1;
            if (this.y <= 20) {
                this.yVel = 0
            }
        } else if (GameCustom.keysPressed[KeyBindings.DOWN]) {
            this.yVel = 1;
            if (this.y + this.height >= canvas.height - 20) {
                this.yVel = 0;
            }
        } else {
            this.yVel = 0;
        }
        this.y += this.yVel * this.speed;
        GameCustom.socket.emit('yPaddleLeft', { y: this.y, room: GameCustom.nameRoom });
    }
    updateOtherPlayer(y: number) {
        this.y = y;
    }
}

class Ball extends Entity {
    private ballImage: HTMLImageElement;
    private gameContext: CanvasRenderingContext2D;
    private lastUpdateTime: number = 0;
    private updateDelay: number = 25;

    constructor(width: number, height: number, x: number, y: number, gameContext: CanvasRenderingContext2D) {
        super(width, height, x, y);
        this.ballImage = new Image();
        this.ballImage.src = '/img/moon.png';

        this.gameContext = gameContext;

        this.ballImage.onload = () => {
            this.draw(this.gameContext);
        };

        this.ballImage.onerror = () => {
            console.error("Failed to load the ball image.");
        };
    }

    draw(context: CanvasRenderingContext2D) {
        if (this.ballImage.complete) {
            if (this.x < 0) this.x = 0;
            if (this.y < 0) this.y = 0;
            if (this.x > context.canvas.width - this.width) this.x = context.canvas.width - this.width;
            if (this.y > context.canvas.height - this.height) this.y = context.canvas.height - this.height;

            context.drawImage(this.ballImage, this.x, this.y, this.width, this.height);
        }
    }

    update(playerRight: PaddleRight, playerLeft: PaddleLeft, canvas: HTMLCanvasElement) {
        const now = performance.now();
        const elapsed = now - this.lastUpdateTime;

        if (elapsed > this.updateDelay) {
            const data = {
                nameRoom: GameCustom.nameRoom,
                xPlayerRight: playerRight.x,
                yPlayerRight: playerRight.y,
                xPlayerLeft: playerLeft.x,
                yPlayerLeft: playerLeft.y,
                widthCanvas: canvas.width,
                heightCanvas: canvas.height,
            };

            GameCustom.socket.emit('updateBall', data);
            GameCustom.socket.on('handleUpdateBall', (data: { x: number, y: number, scoreLeft: number, scoreRight: number }) => {
                const { x, y, scoreLeft, scoreRight } = data;

                this.x = x;
                this.y = y;
                GameCustom.playerLeftScore = scoreLeft;
                GameCustom.playerRightScore = scoreRight;
            });

            this.lastUpdateTime = now;
        }
    }
}