package main

import (
    "os"
    "os/exec"
    "strings"
    "strconv"
    "fmt"
)

func TermGetSize() (int, int, bool) {
    cmd := exec.Command("stty", "size")
    cmd.Stdin = os.Stdin
    out, err := cmd.Output()

    if err != nil || !cmd.ProcessState.Success() {
        return 0, 0, false
    }

    fields := strings.Fields(string(out));

    height, err1 := strconv.Atoi(fields[0])
    width, err2 := strconv.Atoi(fields[1])

    if (err1 != nil || err2 != nil) {
        return 0, 0, false
    }

    return width, height, true
}

func TermClear() { fmt.Print("\033[2J") }

func TermBlue(s string) string { return fmt.Sprintf("\x1B[34m%s\x1B[0m", s) }

func TermRed(s string) string { return fmt.Sprintf("\x1B[31m%s\x1B[0m", s) }

func TermYellow(s string) string { return fmt.Sprintf("\x1B[33m%s\x1B[0m", s) }


// func TermMoveUp(y int) { fmt.Printf("\033[%dA", y) }

// func TermMoveDown(y int) { fmt.Printf("\033[%dB", y) }

// func TermMoveRight(x int) { fmt.Printf("\033[%dC", x) }

// func TermMoveLeft(x int) { fmt.Printf("\033[%dD", x) }

func TermGoTo(x, y int) { fmt.Printf("\033[%d;%dH", y, x) }
