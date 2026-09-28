package com.example.demo.controller;

import com.example.demo.dto.*;
import com.example.demo.service.ScoreService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/matches/{matchId}")
@RequiredArgsConstructor
public class ScoreController {

    private final ScoreService scoreService;

    @GetMapping("/score")
    public ResponseEntity<ScoreResponseDTO> getMatchScore(@PathVariable Long matchId) {
        return ResponseEntity.ok(scoreService.getMatchScore(matchId));
    }

    @GetMapping("/scorecard")
    public ResponseEntity<ScorecardDTO> getScorecard(@PathVariable Long matchId) {
        return ResponseEntity.ok(scoreService.getScorecard(matchId));
    }

    @GetMapping("/batting")
    public ResponseEntity<List<BattingStatDTO>> getBattingStats(@PathVariable Long matchId) {
        return ResponseEntity.ok(scoreService.getBattingStats(matchId));
    }

    @GetMapping("/bowling")
    public ResponseEntity<List<BowlingStatDTO>> getBowlingStats(@PathVariable Long matchId) {
        return ResponseEntity.ok(scoreService.getBowlingStats(matchId));
    }

    @GetMapping("/summary")
    public ResponseEntity<MatchSummaryDTO> getMatchSummary(@PathVariable Long matchId) {
        return ResponseEntity.ok(scoreService.getMatchSummary(matchId));
    }
}
