package com.example.demo.controller;

import com.example.demo.dto.PlayerDTO;
import com.example.demo.service.PlayerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class PlayerController {

    private final PlayerService playerService;

    @GetMapping("/api/players")
    public ResponseEntity<List<PlayerDTO>> getAllPlayers() {
        return ResponseEntity.ok(playerService.getAllPlayers());
    }

    @GetMapping("/api/players/{id}")
    public ResponseEntity<PlayerDTO> getPlayerById(@PathVariable Long id) {
        return ResponseEntity.ok(playerService.getPlayerById(id));
    }

    @GetMapping("/api/teams/{teamId}/players")
    public ResponseEntity<List<PlayerDTO>> getPlayersByTeamId(@PathVariable Long teamId) {
        return ResponseEntity.ok(playerService.getPlayersByTeamId(teamId));
    }

    @PostMapping("/api/players")
    public ResponseEntity<PlayerDTO> createPlayer(@RequestBody PlayerDTO playerDTO) {
        return new ResponseEntity<>(playerService.createPlayer(playerDTO), HttpStatus.CREATED);
    }

    @PutMapping("/api/players/{id}")
    public ResponseEntity<PlayerDTO> updatePlayer(@PathVariable Long id, @RequestBody PlayerDTO playerDTO) {
        return ResponseEntity.ok(playerService.updatePlayer(id, playerDTO));
    }

    @DeleteMapping("/api/players/{id}")
    public ResponseEntity<Void> deletePlayer(@PathVariable Long id) {
        playerService.deletePlayer(id);
        return ResponseEntity.noContent().build();
    }
}
