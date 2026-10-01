package com.tomapedido.backend.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.tomapedido.backend.dto.TrialPeriodResponse;
import com.tomapedido.backend.service.TrialPeriodService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/tenant")
@RequiredArgsConstructor
public class TrialPeriodController {

    private final TrialPeriodService trialPeriodService;

    @GetMapping("/trial")
    public TrialPeriodResponse getTrialPeriod() {
        return trialPeriodService.getTrialPeriod();
    }
}
