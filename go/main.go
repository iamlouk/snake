package main

import (
    "fmt"
    "os"
    "time"
    "math/rand"
    "github.com/nsf/termbox-go"
)

const (
    BoxDrawingCornerTopLeft = "╔"
    BoxDrawingCornerTopRight = "╗"
    BoxDrawingCornerBottomLeft = "╚"
    BoxDrawingCornerBottomRight = "╝"
    BoxDrawingHorizontal = "═"
    BoxDrawingVertical = "║"
)

var width, height int

type Vec struct {
    X, Y int
}

type Snake struct {
    Direction Vec
    Head, Tail *SnakeSection
}

type SnakeSection struct {
    Pos Vec
    Prev, Next *SnakeSection
}

func CreateSnake() Snake {
    snake := Snake{ Vec{0, 0}, nil, nil }

    x, y := width / 2, height / 2

    head := new(SnakeSection)
    head.Pos = Vec{ x, y }

    sec2 := new(SnakeSection)
    sec2.Prev = head
    sec2.Pos = Vec{ x, y }

    sec3 := new(SnakeSection)
    sec3.Prev = sec2
    sec3.Pos = Vec{ x, y }

    sec4 := new(SnakeSection)
    sec4.Prev = sec3
    sec4.Pos = Vec{ x, y }

    tail := new(SnakeSection)
    tail.Prev = sec4
    tail.Pos = Vec{ x, y }

    head.Next = sec2
    sec2.Next = sec3
    sec3.Next = sec4
    sec4.Next = tail

    snake.Head = head
    snake.Tail = tail

    return snake
}

func (snake *Snake) Grow() {
    sec := new(SnakeSection)
    sec.Pos = snake.Tail.Pos
    sec.Prev = snake.Tail
    snake.Tail.Next = sec
    snake.Tail = sec
}

func (snake *Snake) Len() int {
    i, sec := 0, snake.Head
    for sec != nil {
        i++
        sec = sec.Next
    }
    return i
}

func DrawBorder() {
    TermClear()
    TermGoTo(0, 0)
    fmt.Print(BoxDrawingCornerTopLeft)
    for i := 1; i < width - 1; i++ {
        fmt.Print(BoxDrawingHorizontal)
    }
    fmt.Print(BoxDrawingCornerTopRight)


    for i := 2; i < height; i++ {
        TermGoTo(0, i)
        fmt.Print(BoxDrawingVertical)

        TermGoTo(width, i)
        fmt.Print(BoxDrawingVertical)
    }


    TermGoTo(0, height)
    fmt.Print(BoxDrawingCornerBottomLeft)
    for i := 1; i < width - 1; i++ {
        fmt.Print(BoxDrawingHorizontal)
    }
    fmt.Print(BoxDrawingCornerBottomRight)
}

func HandleEvents(dirchan chan Vec, quitchan chan bool) {
    for {
        if event := termbox.PollEvent(); event.Type == termbox.EventKey {
            switch event.Key {
            case termbox.KeyArrowUp:
                dirchan <- Vec{ X:  0, Y: -1 }
            case termbox.KeyArrowDown:
                dirchan <- Vec{ X:  0, Y:  1 }
            case termbox.KeyArrowLeft:
                dirchan <- Vec{ X: -1, Y:  0 }
            case termbox.KeyArrowRight:
                dirchan <- Vec{ X:  1, Y:  0 }
            case termbox.KeyCtrlC:
                fallthrough
            case termbox.KeyEsc:
                quitchan <- true
                return
            }
        }
    }
}

func RandomPos() Vec {
    return Vec {
        5 + (rand.Int() % (width - 10)),
        5 + (rand.Int() % (height - 10)),
    }
}

func main() {
    w, h, ok := TermGetSize()
    width = w
    height = h
    if !ok {
        fmt.Fprintf(os.Stderr, "stdin isn't a terminal or some other error ocured\n")
        os.Exit(1)
    }
    // fmt.Printf("%d x %d\n", width, height)
    if err := termbox.Init(); err != nil {
        panic(err)
    }
    DrawBorder()

    rand.Seed(time.Now().UnixNano())

    snake := CreateSnake()

    dirchan := make(chan Vec)
    quitchan := make(chan bool)
    go HandleEvents(dirchan, quitchan)

    var berrys [3]Vec
    berrys[0] = RandomPos()
    berrys[1] = RandomPos()
    berrys[2] = RandomPos()

    for i := 0; i < len(berrys); i++ {
        berry := berrys[i]
        TermGoTo(berry.X, berry.Y)
        fmt.Print(TermYellow("█"))
    }

    mainloop: for {
        TermGoTo(snake.Tail.Pos.X, snake.Tail.Pos.Y)
        fmt.Print(" ")
        for i := 0; i < len(berrys); i++ {
            berry := berrys[i]
            if berry.X == snake.Tail.Pos.X && berry.Y == snake.Tail.Pos.Y {
                TermGoTo(berry.X, berry.Y)
                fmt.Print(TermYellow("█"))
            }
        }

        sec := snake.Tail

        x := snake.Head.Pos.X + snake.Direction.X
        y := snake.Head.Pos.Y + snake.Direction.Y

        if x >= width { 
            x = 2 
        } else if x <= 1 {
            x = width - 1
        }

        if y >= height {
            y = 2
        } else if y <= 1 {
            y = height -1
        }

        sec.Pos = Vec{x, y}

        snake.Tail = sec.Prev
        snake.Tail.Next = nil
        sec.Next = snake.Head
        sec.Next.Prev = sec
        sec.Prev = nil
        snake.Head = sec

        if snake.Direction.X != 0 || snake.Direction.Y != 0 {
            drag := sec.Next
            for drag != nil {
                if x == drag.Pos.X && y == drag.Pos.Y {
                    break mainloop
                }
                drag = drag.Next
            }
        }

        for i := 0; i < len(berrys); i++ {
            berry := berrys[i]
            if sec.Pos.X == berry.X && sec.Pos.Y == berry.Y {
                berrys[i] = RandomPos()
                TermGoTo(berrys[i].X, berrys[i].Y)
                fmt.Print(TermYellow("█"))
                snake.Grow()
            }
        }


        TermGoTo(sec.Pos.X, sec.Pos.Y)
        fmt.Print(TermRed("█"))


        select {
        case dir := <-dirchan:
            snake.Direction = dir
        case <-quitchan:
            break mainloop
        default:
        }

        time.Sleep(100 * time.Millisecond)
    }
    termbox.Close()
    fmt.Printf("Score: %d\n", snake.Len())
}
