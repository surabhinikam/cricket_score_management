package com.example.demo.controller;

import com.example.demo.dto.BallEventRequestDTO;
import com.example.demo.dto.BallEventResponseDTO;
import com.example.demo.dto.InningsDTO;
import com.example.demo.dto.ScoreResponseDTO;
import com.example.demo.service.MatchService;
import com.example.demo.service.ScoreService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/innings")
@RequiredArgsConstructor
public class InningsController {

    private final MatchService matchService;
    private final ScoreService scoreService;

    @GetMapping("/{inningsId}")
    public ResponseEntity<InningsDTO> getInningsById(@PathVariable Long inningsId) {
        return ResponseEntity.ok(matchService.getInningsById(inningsId));
    }

    @GetMapping("/{inningsId}/balls")
    public ResponseEntity<List<BallEventResponseDTO>> getBallEvents(@PathVariable Long inningsId) {
        return ResponseEntity.ok(scoreService.getBallEvents(inningsId));
    }

    @PostMapping("/{inningsId}/balls")
    public ResponseEntity<ScoreResponseDTO> recordBallEvent(
            @PathVariable Long inningsId,
            @RequestBody BallEventRequestDTO request) {
        ScoreResponseDTO response = scoreService.recordBallEvent(inningsId, request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }
}
