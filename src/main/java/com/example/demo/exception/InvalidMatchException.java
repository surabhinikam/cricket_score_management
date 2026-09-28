package com.example.demo.exception;

public class InvalidMatchException extends RuntimeException {
    public InvalidMatchException(String message) {
        super(message);
    }
}
