#include <stdlib.h>
#include <stdio.h>
#include <stdbool.h>
#include <time.h>
#include <pthread.h>
#include <SDL.h>

#define SPEED 15
#define WIDTH 300
#define HEIGHT 300
#define CELL_WIDTH 10
#define CELL_HEIGHT 10
#define BERRYS 3
#define SNAKE_START_LENGTH 3

static const int CELLS_X = WIDTH / CELL_WIDTH;
static const int CELLS_Y = HEIGHT / CELL_HEIGHT;

static bool quit = false;

static SDL_Window *window = NULL;
static SDL_Surface *surface = NULL;
static SDL_Renderer *renderer = NULL;

typedef struct cell {
	int x;
	int y;
	struct cell *next;
} cell;
typedef struct snake_t {
	int x;
	int y;
	int vec_x;
	int vec_y;
	int next_vec_x;
	int next_vec_y;
	struct cell *head;
} snake_t;
static volatile snake_t snake;
static cell berrys[BERRYS];

int randomX(void){
	return rand() % CELLS_X;
}

int randomY(void){
	return rand() % CELLS_Y;
}

void drawCell(cell *c){
	int x = c->x * CELL_WIDTH;
	int y = c->y * CELL_HEIGHT;

	SDL_Rect rect = { x, y, CELL_WIDTH, CELL_HEIGHT };

	if (SDL_RenderFillRect(renderer, &rect) < 0) {
		printf("SDL_RenderFillRect failed: %s", SDL_GetError());
		exit(EXIT_FAILURE);
	}
}

void clearCell(cell *c){
	int x = c->x * CELL_WIDTH;
	int y = c->y * CELL_HEIGHT;

	SDL_Rect rect = { x, y, CELL_WIDTH, CELL_HEIGHT };

	SDL_SetRenderDrawColor(renderer, 0x00, 0x00, 0x00, SDL_ALPHA_OPAQUE);
	if (SDL_RenderFillRect(renderer, &rect) < 0) {
		printf("SDL_RenderFillRect failed: %s", SDL_GetError());
		exit(EXIT_FAILURE);
	}
}

void incrementSnakeSize(void){
	cell *c = malloc(sizeof(cell));
	c->next = NULL;

	if (snake.head == NULL) {
		c->x = snake.x;
		c->y = snake.y;
		snake.head = c;
		return;
	}

	cell *last = snake.head;
	while (last->next != NULL)
		last = last->next;

	c->x = last->x;
	c->y = last->y;
	last->next = c;
}

void moveSnake(void){
	int x = snake.x + snake.vec_x;
	int y = snake.y + snake.vec_y;

	if (x < 0)             x = CELLS_X - 1;
	else if (x >= CELLS_X) x = 0;

	if (y < 0)             y = CELLS_Y - 1;
	else if (y >= CELLS_Y) y = 0;

	snake.x = x;
	snake.y = y;

	cell *last = snake.head, *drag = NULL;
	while (last->next != NULL) {
		drag = last;
		last = last->next;
	}

	if (!(drag->x == last->x && drag->y == last->y)) {
		bool clear = true;
		for (int i = 0; i < BERRYS; i++) {
			cell *berry = &berrys[i];
			if (berry->x == last->x && berry->y == last->y) {
				clear = false;
				break;
			}
		}

		if (clear)
			clearCell(last);
	}


	drag->next = NULL;
	last->next = snake.head;
	last->x = x;
	last->y = y;
	snake.head = last;

	SDL_SetRenderDrawColor(renderer, 0xFF, 0xFF, 0xFF, SDL_ALPHA_OPAQUE);
	drawCell(last);
}

void *rendererThread(){
	while (!quit) {
		// printf("snake { x: %d, y: %d, vx: %d, vy: %d } (A)\n", snake.x, snake.y, snake.vec_x, snake.vec_y);

		snake.vec_x = snake.next_vec_x;
		snake.vec_y = snake.next_vec_y;

		if (snake.vec_x != 0 || snake.vec_y != 0)
			moveSnake();

		if (snake.vec_x != 0 || snake.vec_y != 0) {
			cell *c = snake.head->next;
			while (c != NULL) {
				if (c->x == snake.x && c->y == snake.y) {
					printf("Game Over!\n");
					SDL_DestroyWindow(window);
					SDL_Quit();
					exit(EXIT_FAILURE);
				}
				c = c->next;
			}
		}

		for (int i = 0; i < BERRYS; i++) {
			cell *berry = &berrys[i];
			if (berry->x == snake.x && berry->y == snake.y) {
				incrementSnakeSize();
				berry->x = randomX();
				berry->y = randomY();

				SDL_SetRenderDrawColor(renderer, 0x00, 0xFF, 0xFF, SDL_ALPHA_OPAQUE);
				drawCell(berry);
			}
		}

		SDL_RenderPresent(renderer);
		SDL_Delay(1000 / SPEED);
	}
	return NULL;
}

int main(int argc, char *argv[]) {
	srand(time(NULL));
	if (SDL_Init( SDL_INIT_VIDEO ) < 0) {
		printf("SDL_Init failed: %s\n", SDL_GetError());
		return EXIT_FAILURE;
	}

	window = SDL_CreateWindow("C Snake!", SDL_WINDOWPOS_UNDEFINED, SDL_WINDOWPOS_UNDEFINED, WIDTH, HEIGHT, SDL_WINDOW_SHOWN);
	if (window == NULL) {
		printf("SDL_CreateWindow failed: %s\n", SDL_GetError());
		return EXIT_FAILURE;
	}

	surface = SDL_GetWindowSurface(window);
	if (surface == NULL) {
		printf("SDL_GetWindowSurface failed: %s\n", SDL_GetError());
		return EXIT_FAILURE;
	}

	renderer = SDL_GetRenderer(window);
	if (renderer == NULL) {
		printf("SDL_GetRenderer failed: %s\n", SDL_GetError());
		return EXIT_FAILURE;
	}

	SDL_SetRenderDrawColor(renderer, 0x00, 0x00, 0x00, SDL_ALPHA_OPAQUE);
	SDL_RenderClear(renderer);
	SDL_RenderPresent(renderer);


	snake.x = CELLS_X / 2;
	snake.y = CELLS_Y / 2;
	snake.head = NULL;
	for (int i = 0; i < SNAKE_START_LENGTH; i++)
		incrementSnakeSize();

	SDL_SetRenderDrawColor(renderer, 0x00, 0xFF, 0xFF, SDL_ALPHA_OPAQUE);
	for (int i = 0; i < BERRYS; i++) {
		cell c = { randomX(), randomY(), NULL };
		drawCell(&c);
		berrys[i] = c;
	}
	SDL_SetRenderDrawColor(renderer, 0xFF, 0xFF, 0xFF, SDL_ALPHA_OPAQUE);
	drawCell(snake.head);

	pthread_t renderer_thread;
	pthread_create(&renderer_thread, NULL, rendererThread, NULL);

	SDL_Event evt;
	while (quit == false && SDL_WaitEvent(&evt)) {
		if (evt.type == SDL_QUIT) {
			quit = true;
		} else if (evt.type == SDL_KEYDOWN) {
			switch (evt.key.keysym.sym) {
			case SDLK_UP:
				if (snake.vec_y == 1) break;

				snake.next_vec_x = 0;
				snake.next_vec_y = -1;
				break;
			case SDLK_DOWN:
				if (snake.vec_y == -1) break;

				snake.next_vec_x = 0;
				snake.next_vec_y = 1;
				break;
			case SDLK_LEFT:
				if (snake.vec_x == 1) break;

				snake.next_vec_x = -1;
				snake.next_vec_y = 0;
				break;
			case SDLK_RIGHT:
				if (snake.vec_x == -1) break;

				snake.next_vec_x = 1;
				snake.next_vec_y = 0;
				break;
			case SDLK_ESCAPE:
				quit = true;
				break;
				default:
				break;
			}
		}
	}

	pthread_join(renderer_thread, NULL);
	SDL_DestroyWindow(window);
	SDL_Quit();
	return EXIT_SUCCESS;
}
