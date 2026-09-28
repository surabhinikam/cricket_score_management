package com.example.demo.service;

import com.example.demo.dto.PlayerDTO;
import com.example.demo.entity.Player;
import com.example.demo.entity.Team;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.repository.PlayerRepository;
import com.example.demo.repository.TeamRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PlayerService {

    private final PlayerRepository playerRepository;
    private final TeamRepository teamRepository;

    @Transactional(readOnly = true)
    public List<PlayerDTO> getAllPlayers() {
        return playerRepository.findAll().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PlayerDTO getPlayerById(Long id) {
        Player player = playerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Player not found with id: " + id));
        return mapToDTO(player);
    }

    @Transactional(readOnly = true)
    public List<PlayerDTO> getPlayersByTeamId(Long teamId) {
        if (!teamRepository.existsById(teamId)) {
            throw new ResourceNotFoundException("Team not found with id: " + teamId);
        }
        return playerRepository.findByTeamIdOrderByJerseyNumberAsc(teamId).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public PlayerDTO createPlayer(PlayerDTO dto) {
        if (dto.getPlayerName() == null || dto.getPlayerName().trim().isEmpty()) {
            throw new IllegalArgumentException("Player name cannot be empty");
        }
        if (dto.getRole() == null) {
            throw new IllegalArgumentException("Player role cannot be empty");
        }
        if (dto.getTeamId() == null) {
            throw new IllegalArgumentException("Player must belong to a team");
        }

        Team team = teamRepository.findById(dto.getTeamId())
                .orElseThrow(() -> new ResourceNotFoundException("Team not found with id: " + dto.getTeamId()));

        Player player = Player.builder()
                .playerName(dto.getPlayerName().trim())
                .role(dto.getRole())
                .jerseyNumber(dto.getJerseyNumber())
                .team(team)
                .build();

        return mapToDTO(playerRepository.save(player));
    }

    @Transactional
    public PlayerDTO updatePlayer(Long id, PlayerDTO dto) {
        Player player = playerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Player not found with id: " + id));

        if (dto.getPlayerName() != null && !dto.getPlayerName().trim().isEmpty()) {
            player.setPlayerName(dto.getPlayerName().trim());
        }
        if (dto.getRole() != null) {
            player.setRole(dto.getRole());
        }
        if (dto.getJerseyNumber() != null) {
            player.setJerseyNumber(dto.getJerseyNumber());
        }
        if (dto.getTeamId() != null && !dto.getTeamId().equals(player.getTeam().getId())) {
            Team newTeam = teamRepository.findById(dto.getTeamId())
                    .orElseThrow(() -> new ResourceNotFoundException("Team not found with id: " + dto.getTeamId()));
            player.setTeam(newTeam);
        }

        return mapToDTO(playerRepository.save(player));
    }

    @Transactional
    public void deletePlayer(Long id) {
        if (!playerRepository.existsById(id)) {
            throw new ResourceNotFoundException("Player not found with id: " + id);
        }
        playerRepository.deleteById(id);
    }

    public PlayerDTO mapToDTO(Player player) {
        if (player == null) return null;
        return PlayerDTO.builder()
                .id(player.getId())
                .playerName(player.getPlayerName())
                .role(player.getRole())
                .jerseyNumber(player.getJerseyNumber())
                .teamId(player.getTeam() != null ? player.getTeam().getId() : null)
                .teamName(player.getTeam() != null ? player.getTeam().getTeamName() : null)
                .build();
    }
}
