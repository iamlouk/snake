let canvas = document.querySelector('#canvas');
canvas.width = canvas.offsetWidth;
canvas.height = canvas.offsetHeight;
let ctx = canvas.getContext('2d');

// Constants for rendering, must be 'let' becouse they change on 'resize'
let CELL_WIDTH = canvas.width / 50,
CELL_HEIGHT = canvas.height / 50,
WIDTH = canvas.width / CELL_WIDTH,
HEIGHT = canvas.height / CELL_HEIGHT;

// Timeout in ms between two frames
const SPEED = 50,
BERRY_COLOR = 'rgb(255, 184, 0)';


let calcDistance = (a, b) => {
	let vecX = b.x - a.x;
	let vecY = b.y - a.y;
	return Math.sqrt(vecX*vecX + vecY*vecY);
};


window.addEventListener('resize', (event) => {
	canvas.width = canvas.offsetWidth;
	canvas.height = canvas.offsetHeight;

	WIDTH = Math.floor(canvas.width / CELL_WIDTH);
	HEIGHT = Math.floor(canvas.height / CELL_HEIGHT);

	// After Resize, we need to redraw or everything will look strange
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.fillStyle = BERRY_COLOR;
	for (let i = 0; i < berrys.berrys.length; i++)
	berrys.berrys[i].draw();
	for (let snake of snakes) {
		ctx.fillStyle = snake.color;
		for (var i = 0; i < snake.cells.length; i++)
		snake.cells[i].draw();
	}

}, false);

class Cell {
	constructor(x, y) {
		this.x = x;
		this.y = y;
	}

	draw(){ ctx.fillRect(this.x * CELL_WIDTH, this.y * CELL_HEIGHT, CELL_WIDTH, CELL_HEIGHT); }

	clear(){ ctx.clearRect(this.x * CELL_WIDTH, this.y * CELL_HEIGHT, CELL_WIDTH, CELL_HEIGHT); }

}

// A Berry,
// TODO: Special Berrys like 'Speedup'
class Berry extends Cell {
	constructor(x, y){
		super(x, y);
	}
}

class Snake {
	constructor(x, y, color, initialLength = 7) {
		this.id = color;
		this.pos = { x: x, y: y };
		this.cells = [];
		for (var i = 0; i < initialLength; i++)
		this.cells.push( new Cell(x, y) );

		this.vec = { x: 0, y: 0 };
		this.color = color;
	}

	update(){
		let newx = this.pos.x + this.vec.x,
		newy = this.pos.y + this.vec.y;

		if (newx >= WIDTH) newx = 0;
		else if (newx < 0) newx = WIDTH - 1;

		if (newy >= HEIGHT) newy = 0;
		else if (newy < 0) newy = HEIGHT - 1;

		this.pos.x = newx;
		this.pos.y = newy;

		if (!(this.vec.x == 0 && this.vec.y == 0)) {
			for (var i = 0; i < this.cells.length; i++) {
				if (this.cells[i].x == newx && this.cells[i].y == newy) {
					this.snakeHitItself();
				}
			}
		}

		let cell = this.cells.pop();
		cell.clear();
		cell.x = this.pos.x;
		cell.y = this.pos.y;
		this.cells.unshift(cell);
	}

	// Override this method
	snakeHitItself(){
		console.error();
	}

	// Override this method
	hitSnake(otherSnake){
		console.error();
	}

	eat(berry, index){
		berry.clear();
		berrys.berrys.splice(index, 1);
		let lastCell = this.cells[this.cells.length-1];
		this.cells.push( new Cell(lastCell.x, lastCell.y) );
		ctx.fillStyle = this.color;
		this.cells[0].draw();
		berrys.spawn();
	}
}

// Sake controlled by the Player with Arrow-Keys
class GreenSnake extends Snake {
	constructor(x, y, initialLength) {
		const UP = { x: 0, y: -1 },
		DOWN = { x: 0, y: 1 },
		RIGHT = { x: 1, y: 0 },
		LEFT = { x: -1, y: 0 };

		super(x, y, '#99cf00', initialLength);

		this.nextDirection = { x: 0, y: 0 };
		window.addEventListener('keydown', (event) => {
			switch (event.keyCode) {
				case 38:
				if (this.vec != DOWN)
				this.nextDirection = UP;
				break;
				case 39:
				if (this.vec != LEFT)
				this.nextDirection = RIGHT;
				break;
				case 40:
				if (this.vec != UP)
				this.nextDirection = DOWN;
				break;
				case 37:
				if (this.vec != RIGHT)
				this.nextDirection = LEFT;
				break;
				default:
				break;
			}
		}, false);
	}

	snakeHitItself(){
		gameOver(this);
	}

	hitSnake(otherSnake){
		gameOver(this);
	}

	update(){
		this.vec = this.nextDirection;
		super.update();
	}
}

// KI-Snake
class RedSnake extends Snake {

	constructor(color, x, y) {
		super(x, y, color);
		this.target = { x: this.x, y: this.y };
	}

	selectTarget(){
		let selectedBerry = berrys.berrys[0];
		let distance = calcDistance(this.pos, selectedBerry);
		for (let berry of berrys.berrys) {
			let dist = calcDistance(this.pos, berry);
			if (dist < distance) {
				selectedBerry = berry;
				distance = dist;
			}
		}

		this.target.x = selectedBerry.x;
		this.target.y = selectedBerry.y;
	}

	selectRandomTarget(){
		let index = Math.floor(Math.random() * berrys.berrys.length);
		let berry = berrys.berrys[index];
		this.target.x = berry.x;
		this.target.y = berry.y;
	}

	checkTarget(){
		if (this.pos.x == this.target.x && this.pos.y == this.target.y)
		return this.selectTarget();

		let exists = false;
		for (let berry of berrys.berrys) {
			if (berry.x == this.target.x && berry.y == this.target.y) {
				exists = true;
				break;
			}
		}

		if (exists == false)
		this.selectTarget();
	}

	calcVecYX(){
		let vec = { x: 0, y: 0 };

		if (this.target.y > this.pos.y)
		vec.y = 1;
		else if (this.target.y < this.pos.y)
		vec.y = -1;
		else if (this.target.x > this.pos.x)
		vec.x = 1;
		else if (this.target.x < this.pos.x)
		vec.x = -1;

		return vec;
	}

	calcVecXY(){
		let vec = { x: 0, y: 0 };

		if (this.target.x > this.pos.x)
		vec.x = 1;
		else if (this.target.x < this.pos.x)
		vec.x = -1;
		else if (this.target.y > this.pos.y)
		vec.y = 1;
		else if (this.target.y < this.pos.y)
		vec.y = -1;

		return vec;
	}

	calcVec(){
		let a = this.calcVecXY();
		if (!this.willHitSomething(a))
		return (this.vec = a);

		let b = this.calcVecYX();
		if (!this.willHitSomething(b))
		return (this.vec = b);


		for (var i = 0; i < 4; i++) {
			let vec = { x: 0, y: 0 };
			if (i == 0) {
				vec.x = 1;
				vec.y = 0;
			} else if (i == 1) {
				vec.x = -1;
				vec.y = 0;
			} else if (i == 2) {
				vec.x = 0;
				vec.y = 1;
			} else if (i == 3) {
				vec.x = 0;
				vec.y = -1;
			}
			if (!this.willHitSomething(vec))
			return (this.vec = vec);
		}

		console.warn("Kein Weg gefunden :(");
		this.vec = { x: 0, y: 0 };
		this.update = () => {};
	}

	willHitSomething(vec){
		let x = this.pos.x + vec.x;
		let y = this.pos.y + vec.y;
		for (let snake of snakes) {
			for (let cell of snake.cells) {
				if (cell.x == x && cell.y == y)
				return true;
			}
		}
		return false;
	}

	update(){
		this.checkTarget();

		this.calcVec();

		super.update();
	}

	hitSnake(otherSnake){
		this.vec = { x: 0, y: 0 };
		this.update = () => {};
		console.warn('Snake#'+this.id+' died!');
	}

}



let berrys = ({

	berrys: [],

	spawn: function(){
		let x = 4+Math.floor(Math.random() * (WIDTH-8));
		let y = 4+Math.floor(Math.random() * (HEIGHT-8));

		for (let snake of snakes)
		for (let cell of snake.cells)
		if (x == cell.x && y == cell.y)
		return this.spawn();

		for (let berry of this.berrys)
		if (berry.x == x && berry.y == y)
		return this.spawn();

		let berry = new Berry(x, y);
		ctx.fillStyle = BERRY_COLOR;
		berry.draw();
		this.berrys.push( berry );
	},

});



let snakes = [
	new GreenSnake(/*               */ Math.floor(WIDTH / 3),     Math.floor(WIDTH / 3)    ),
	// new RedSnake('rgb(255,   0,   0)', Math.floor(WIDTH / 3),     Math.floor(WIDTH / 3)    ),
	new RedSnake('rgb(255, 255,   0)', Math.floor(WIDTH / 3),     Math.floor(WIDTH / 3) * 2),
	/*new RedSnake('rgb(  0,   0, 255)', Math.floor(WIDTH / 3) * 2, Math.floor(WIDTH / 3)    ),
	new RedSnake('rgb(  0, 255, 255)', Math.floor(WIDTH / 3) * 2, Math.floor(WIDTH / 3) * 2),
	new RedSnake('rgb(  0, 255, 100)', Math.floor(WIDTH / 5) * 2, Math.floor(WIDTH / 3) * 2),
	new RedSnake('rgb(  0, 100, 255)', Math.floor(WIDTH / 5) * 2, Math.floor(WIDTH / 3) * 2),
	new RedSnake('rgb(  0, 100, 255)', Math.floor(WIDTH / 5) * 2, Math.floor(WIDTH / 3) * 2),
	new RedSnake('rgb(  100, 0, 255)', Math.floor(WIDTH / 3) * 2, Math.floor(WIDTH / 5) * 2),
	new RedSnake('rgb(  50, 50, 255)', Math.floor(WIDTH / 3) * 2, Math.floor(WIDTH / 5) * 2),*/
];


for (let i = 0; i<5; i++)
berrys.spawn();

let paused = false;
let onframe = () => {
	if (paused === false) {
		for (let snake of snakes) {
			snake.update();

			ctx.fillStyle = snake.color;
			snake.cells[0].draw();

			for (let i = 0; i<berrys.berrys.length; i++) {
				let berry = berrys.berrys[i];
				if (berry.x === snake.pos.x && berry.y === snake.pos.y)
				snake.eat(berry, i);
			}

			for (let _snake of snakes) {
				if (_snake.id !== snake.id) {
					for (let cell of _snake.cells) {
						if (snake.pos.x === cell.x && snake.pos.y === cell.y)
						snake.hitSnake(_snake);
					}
				}
			}
		}
	}
};

setInterval(onframe, SPEED);

let gameOver = (snake) => {
	gameOver = () => {};
	let score = snake.cells.length * (1 / SPEED * 1000);
	paused = true;
	require('electron').remote.dialog.showMessageBox({
		type: 'warning',
		message: 'Game Over!',
		detail: 'Score: '+score,
		buttons: [ 'Ok...' ]
	}, () => window.close());
};

window.addEventListener('blur', (event) => { paused = true; }, false);
window.addEventListener('focus', (event) => { paused = false; }, false);
