package com.example.demo.service;

import com.example.demo.dto.TeamDTO;
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
public class TeamService {

    private final TeamRepository teamRepository;
    private final PlayerRepository playerRepository;

    @Transactional(readOnly = true)
    public List<TeamDTO> getAllTeams() {
        return teamRepository.findAll().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public TeamDTO getTeamById(Long id) {
        Team team = teamRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Team not found with id: " + id));
        return mapToDTO(team);
    }

    @Transactional
    public TeamDTO createTeam(TeamDTO dto) {
        if (dto.getTeamName() == null || dto.getTeamName().trim().isEmpty()) {
            throw new IllegalArgumentException("Team name cannot be empty");
        }
        if (dto.getShortName() == null || dto.getShortName().trim().isEmpty()) {
            throw new IllegalArgumentException("Team short name cannot be empty");
        }
        if (dto.getCountry() == null || dto.getCountry().trim().isEmpty()) {
            throw new IllegalArgumentException("Team country cannot be empty");
        }

        Team team = Team.builder()
                .teamName(dto.getTeamName().trim())
                .shortName(dto.getShortName().trim().toUpperCase())
                .country(dto.getCountry().trim())
                .logoUrl(dto.getLogoUrl())
                .build();

        return mapToDTO(teamRepository.save(team));
    }

    @Transactional
    public TeamDTO updateTeam(Long id, TeamDTO dto) {
        Team team = teamRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Team not found with id: " + id));

        if (dto.getTeamName() != null && !dto.getTeamName().trim().isEmpty()) {
            team.setTeamName(dto.getTeamName().trim());
        }
        if (dto.getShortName() != null && !dto.getShortName().trim().isEmpty()) {
            team.setShortName(dto.getShortName().trim().toUpperCase());
        }
        if (dto.getCountry() != null && !dto.getCountry().trim().isEmpty()) {
            team.setCountry(dto.getCountry().trim());
        }
        if (dto.getLogoUrl() != null) {
            team.setLogoUrl(dto.getLogoUrl());
        }

        return mapToDTO(teamRepository.save(team));
    }

    @Transactional
    public void deleteTeam(Long id) {
        if (!teamRepository.existsById(id)) {
            throw new ResourceNotFoundException("Team not found with id: " + id);
        }
        teamRepository.deleteById(id);
    }

    public TeamDTO mapToDTO(Team team) {
        if (team == null) return null;
        int count = playerRepository.findByTeamId(team.getId()).size();
        return TeamDTO.builder()
                .id(team.getId())
                .teamName(team.getTeamName())
                .shortName(team.getShortName())
                .country(team.getCountry())
                .logoUrl(team.getLogoUrl())
                .playerCount(count)
                .build();
    }
}
