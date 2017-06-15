
// use std::io::prelude::*;

extern crate sdl2;
extern crate rand;

use sdl2::event::Event;
use sdl2::keyboard::Keycode;
use sdl2::pixels::Color;
use sdl2::render::Renderer;
use sdl2::rect::Rect;
use std::collections::LinkedList;
use std::time::{Duration};

const WINDOW_WIDTH:u32 = 500;
const WINDOW_HEIGHT:u32 = 500;
const SNAKE_TILE_WIDTH: u32 = 10;
const SNAKE_TILE_HEIGHT: u32 = 10;
const TILES_X: u32 = WINDOW_WIDTH / SNAKE_TILE_WIDTH;
const TILES_Y: u32 = WINDOW_HEIGHT / SNAKE_TILE_HEIGHT;

struct Snake {
    tiles: LinkedList<Tile>,
    x: i32,
    y: i32,
    vec_x: i8,
    vec_y: i8,
    moved: bool
}

impl Snake {

    fn new(x: i32, y: i32) -> Snake {
        Snake {
            tiles: LinkedList::new(),
            x: x,
            y: y,
            vec_x: 0i8,
            vec_y: 0i8,
            moved: false
        }
    }

    fn render(&self, renderer: &mut Renderer){
        for tile in self.tiles.iter() {
            tile.render(renderer);
        }
    }

    fn grow(&mut self, color: Color) {
        let mut x: i32 = self.x;
        let mut y: i32 = self.y;
        if let Some(tile) = self.tiles.back() {
            x = tile.x;
            y = tile.y;
        }

        let tile = Tile::new(x, y, color);
        self.tiles.push_back(tile);
    }

    fn move_snake(&mut self){
        self.x += self.vec_x as i32;
        self.y += self.vec_y as i32;

        if self.x < 0 { self.x = TILES_X as i32 - 1; }
            else if self.x >= TILES_X as i32 { self.x = 0; }

        if self.y < 0 { self.y = TILES_Y as i32 - 1; }
            else if self.y >= TILES_Y as i32 { self.y = 0; }


        let mut tile = self.tiles.pop_back().unwrap();
        tile.x = self.x;
        tile.y = self.y;
        self.tiles.push_front(tile);
        self.moved = false;
    }

    fn up(&mut self) {
        if self.vec_y == 0 && !self.moved {
            self.vec_y = -1i8;
            self.vec_x = 0i8;
            self.moved = true;
        }
    }

    fn down(&mut self) {
        if self.vec_y == 0 && !self.moved {
            self.vec_y = 1i8;
            self.vec_x = 0i8;
            self.moved = true;
        }
    }

    fn right(&mut self) {
        if self.vec_x == 0 && !self.moved {
            self.vec_y = 0i8;
            self.vec_x = 1i8;
            self.moved = true;
        }
    }

    fn left(&mut self) {
        if self.vec_x == 0 && !self.moved {
            self.vec_y = 0i8;
            self.vec_x = -1i8;
            self.moved = true;
        }
    }

    fn hits(&self, tile: &Tile) -> bool {
        for t in &self.tiles {
            if t.x == tile.x && t.y == tile.y {
                return true;
            }
        }
        return false;
    }

}

struct Tile {
    x: i32,
    y: i32,
    color: Color
}

impl Tile {

    fn new(x: i32, y: i32, color: Color) -> Tile {
        Tile { x: x, y: y, color: color }
    }

    fn new_random() -> Tile {
        let mut tile = Tile::new(0, 0, Tile::random_color());
        tile.random_pos();

        // println!("Tile(x: {:?}, y: {:?})", tile.x, tile.y);

        tile
    }

    fn random_pos(&mut self) {
        self.x = (rand::random::<u32>() % TILES_X) as i32;
        self.y = (rand::random::<u32>() % TILES_Y) as i32;
    }

    fn random_color() -> Color {
        let r = rand::random::<u8>();
        if r < 85 { Color::RGB(255, 0, 0) }
            else if r < 170 { Color::RGB(0, 255, 0) }
                else { Color::RGB(255, 255, 0) }
    }

    fn render(&self, renderer: &mut Renderer) {
        renderer.set_draw_color( self.color );
        match renderer.draw_rect(Rect::new(self.x * (SNAKE_TILE_WIDTH as i32), self.y * (SNAKE_TILE_HEIGHT as i32), SNAKE_TILE_WIDTH, SNAKE_TILE_HEIGHT )) {
            Err(err) => {
                println!("Error: {:?}", err);
            },
            Ok(_) => {}
        }
    }

}


fn main() {
    println!("Hello, world!");

    let sdl_context = sdl2::init().unwrap();
    let video_subsystem = sdl_context.video().unwrap();
    let window = video_subsystem.window("Pythagoras: Hallo, Welt!", WINDOW_WIDTH, WINDOW_HEIGHT)
        .position_centered()
        .opengl()
        .build()
        .unwrap();

    let mut renderer = window.renderer()
        .build()
        .unwrap();

    let mut snake = Snake::new((WINDOW_WIDTH / SNAKE_TILE_WIDTH / 2) as i32, (WINDOW_HEIGHT / SNAKE_TILE_HEIGHT / 2) as i32);
    for _ in 0..12 { snake.grow(Tile::random_color()); }

    let mut tiles: Vec<Tile> = vec!();
    for _ in 0..5 { tiles.push( Tile::new_random() ) }

    let mut event_pump = sdl_context.event_pump().unwrap();
    'mainloop: loop {
        for event in event_pump.poll_iter() {
            match event {
                Event::Quit {..} => {
                    break 'mainloop;
                },
                Event::KeyDown { keycode, .. } => {
                    match keycode.unwrap() {
                        Keycode::Escape => {
                            break 'mainloop;
                        },
                        Keycode::Up => { snake.up(); },
                        Keycode::Down => { snake.down(); },
                        Keycode::Left => { snake.left(); },
                        Keycode::Right => { snake.right(); },
                        _ => {}
                    }
                },
                _ => {}
            }
        }

        renderer.set_draw_color( Color::RGB(0, 0, 0) );
        renderer.clear();

        snake.render(&mut renderer);
        snake.move_snake();

        for i in 0..tiles.len() {
            let ref mut tile = tiles[i];
            tile.render(&mut renderer);
            if snake.hits(&tile) {
                snake.grow(tile.color);
                tile.random_pos();
            }
        }

        renderer.present();



        if !(snake.vec_x == 0 && snake.vec_y == 0) {
            let mut iter = snake.tiles.iter();
            iter.next();
            while let Some(tile) = iter.next() {
                if tile.x == snake.x && tile.y == snake.y {
                    println!("Game Over!");
                    break 'mainloop;
                }
            }
        }

        std::thread::sleep(Duration::from_millis(100));
    }

    println!("Score: {:?}", snake.tiles.len());
}
