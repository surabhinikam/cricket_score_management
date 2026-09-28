package com.example.demo.controller;

import com.example.demo.dto.InningsDTO;
import com.example.demo.dto.MatchDTO;
import com.example.demo.dto.MatchRequestDTO;
import com.example.demo.service.MatchService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/matches")
@RequiredArgsConstructor
public class MatchController {

    private final MatchService matchService;

    @GetMapping
    public ResponseEntity<List<MatchDTO>> getAllMatches() {
        return ResponseEntity.ok(matchService.getAllMatches());
    }

    @GetMapping("/live")
    public ResponseEntity<List<MatchDTO>> getLiveMatches() {
        return ResponseEntity.ok(matchService.getLiveMatches());
    }

    @GetMapping("/{id}")
    public ResponseEntity<MatchDTO> getMatchById(@PathVariable Long id) {
        return ResponseEntity.ok(matchService.getMatchById(id));
    }

    @PostMapping
    public ResponseEntity<MatchDTO> createMatch(@RequestBody MatchRequestDTO request) {
        return new ResponseEntity<>(matchService.createMatch(request), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<MatchDTO> updateMatch(@PathVariable Long id, @RequestBody MatchRequestDTO request) {
        return ResponseEntity.ok(matchService.updateMatch(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMatch(@PathVariable Long id) {
        matchService.deleteMatch(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{matchId}/innings")
    public ResponseEntity<List<InningsDTO>> getMatchInnings(@PathVariable Long matchId) {
        return ResponseEntity.ok(matchService.getInningsByMatch(matchId));
    }

    @PostMapping("/{matchId}/innings")
    public ResponseEntity<InningsDTO> startInnings(
            @PathVariable Long matchId,
            @RequestParam(defaultValue = "1") Integer inningsNumber) {
        return new ResponseEntity<>(matchService.startInnings(matchId, inningsNumber), HttpStatus.CREATED);
    }
}
