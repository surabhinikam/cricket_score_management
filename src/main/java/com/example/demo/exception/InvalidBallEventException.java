package com.example.demo.exception;

public class InvalidBallEventException extends RuntimeException {
    public InvalidBallEventException(String message) {
        super(message);
    }
}
