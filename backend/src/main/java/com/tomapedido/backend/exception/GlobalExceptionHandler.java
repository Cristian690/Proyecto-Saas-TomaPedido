package com.tomapedido.backend.exception;

import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.validation.FieldError;
import com.tomapedido.backend.dto.ValidationError;


@RestControllerAdvice

public class GlobalExceptionHandler {

    @ResponseStatus(HttpStatus.BAD_REQUEST)
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ValidationError handleValidation(MethodArgumentNotValidException ex) {

        FieldError error = ex.getBindingResult().getFieldError();        

        return new ValidationError(
            error.getField(),
            error.getDefaultMessage()
        );

    }

}