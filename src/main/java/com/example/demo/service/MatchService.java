package com.example.demo.service;

import com.example.demo.dto.*;
import com.example.demo.entity.*;
import com.example.demo.exception.InvalidMatchException;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.repository.InningsRepository;
import com.example.demo.repository.MatchRepository;
import com.example.demo.repository.TeamRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MatchService {

    private final MatchRepository matchRepository;
    private final TeamRepository teamRepository;
    private final InningsRepository inningsRepository;
    private final TeamService teamService;
    private final ScoreService scoreService;

    @Transactional(readOnly = true)
    public List<MatchDTO> getAllMatches() {
        return matchRepository.findAllByOrderByMatchDateDesc().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<MatchDTO> getLiveMatches() {
        return matchRepository.findByStatus(MatchStatus.LIVE).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public MatchDTO getMatchById(Long id) {
        Match match = matchRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Match not found with id: " + id));
        return mapToDTO(match);
    }

    @Transactional
    public MatchDTO createMatch(MatchRequestDTO request) {
        if (request.getTeam1Id() == null || request.getTeam2Id() == null) {
            throw new InvalidMatchException("Both Team 1 and Team 2 must be provided");
        }
        if (request.getTeam1Id().equals(request.getTeam2Id())) {
            throw new InvalidMatchException("Match cannot have the same team on both sides");
        }
        if (request.getTotalOvers() == null || request.getTotalOvers() <= 0) {
            throw new InvalidMatchException("Total overs must be positive");
        }
        if (request.getVenue() == null || request.getVenue().trim().isEmpty()) {
            throw new InvalidMatchException("Match venue cannot be empty");
        }

        Team team1 = teamRepository.findById(request.getTeam1Id())
                .orElseThrow(() -> new ResourceNotFoundException("Team 1 not found with id: " + request.getTeam1Id()));

        Team team2 = teamRepository.findById(request.getTeam2Id())
                .orElseThrow(() -> new ResourceNotFoundException("Team 2 not found with id: " + request.getTeam2Id()));

        Team tossWinner = null;
        if (request.getTossWinnerId() != null) {
            tossWinner = teamRepository.findById(request.getTossWinnerId())
                    .orElseThrow(() -> new ResourceNotFoundException("Toss winner team not found with id: " + request.getTossWinnerId()));
            if (!tossWinner.getId().equals(team1.getId()) && !tossWinner.getId().equals(team2.getId())) {
                throw new InvalidMatchException("Toss winner must be one of the participating teams");
            }
        }

        Match match = Match.builder()
                .team1(team1)
                .team2(team2)
                .venue(request.getVenue().trim())
                .matchDate(request.getMatchDate() != null ? request.getMatchDate() : LocalDateTime.now())
                .matchType(request.getMatchType() != null ? request.getMatchType() : MatchType.T20)
                .status(MatchStatus.UPCOMING)
                .totalOvers(request.getTotalOvers())
                .tossWinner(tossWinner)
                .tossDecision(request.getTossDecision())
                .build();

        Match savedMatch = matchRepository.save(match);

        // If toss winner and decision are supplied, auto-create 1st innings and start match LIVE
        if (tossWinner != null && request.getTossDecision() != null) {
            startMatchWithInnings(savedMatch, tossWinner, request.getTossDecision());
        }

        return mapToDTO(savedMatch);
    }

    @Transactional
    public MatchDTO updateMatch(Long id, MatchRequestDTO request) {
        Match match = matchRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Match not found with id: " + id));

        if (request.getVenue() != null && !request.getVenue().trim().isEmpty()) {
            match.setVenue(request.getVenue().trim());
        }
        if (request.getTotalOvers() != null && request.getTotalOvers() > 0) {
            match.setTotalOvers(request.getTotalOvers());
        }
        if (request.getMatchType() != null) {
            match.setMatchType(request.getMatchType());
        }
        if (request.getTossWinnerId() != null) {
            Team tossWinner = teamRepository.findById(request.getTossWinnerId())
                    .orElseThrow(() -> new ResourceNotFoundException("Toss winner not found: " + request.getTossWinnerId()));
            match.setTossWinner(tossWinner);
        }
        if (request.getTossDecision() != null) {
            match.setTossDecision(request.getTossDecision().toUpperCase());
        }

        return mapToDTO(matchRepository.save(match));
    }

    @Transactional
    public void deleteMatch(Long id) {
        if (!matchRepository.existsById(id)) {
            throw new ResourceNotFoundException("Match not found with id: " + id);
        }
        matchRepository.deleteById(id);
    }

    @Transactional
    public InningsDTO startInnings(Long matchId, Integer inningsNumber) {
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new ResourceNotFoundException("Match not found with id: " + matchId));

        if (match.getStatus() == MatchStatus.COMPLETED) {
            throw new InvalidMatchException("Cannot create innings for a completed match");
        }

        Team battingTeam;
        Team bowlingTeam;

        if (inningsNumber == 1) {
            if (match.getTossWinner() != null && "BAT".equalsIgnoreCase(match.getTossDecision())) {
                battingTeam = match.getTossWinner();
                bowlingTeam = battingTeam.getId().equals(match.getTeam1().getId()) ? match.getTeam2() : match.getTeam1();
            } else if (match.getTossWinner() != null && "BOWL".equalsIgnoreCase(match.getTossDecision())) {
                bowlingTeam = match.getTossWinner();
                battingTeam = bowlingTeam.getId().equals(match.getTeam1().getId()) ? match.getTeam2() : match.getTeam1();
            } else {
                battingTeam = match.getTeam1();
                bowlingTeam = match.getTeam2();
            }
        } else {
            // 2nd innings reverses batting and bowling
            Innings firstInnings = inningsRepository.findByMatchIdAndInningsNumber(matchId, 1)
                    .orElseThrow(() -> new InvalidMatchException("Cannot start 2nd innings before 1st innings is created"));
            battingTeam = firstInnings.getBowlingTeam();
            bowlingTeam = firstInnings.getBattingTeam();
        }

        Innings innings = Innings.builder()
                .match(match)
                .battingTeam(battingTeam)
                .bowlingTeam(bowlingTeam)
                .inningsNumber(inningsNumber)
                .totalRuns(0)
                .wickets(0)
                .legalBalls(0)
                .extras(0)
                .isCompleted(false)
                .build();

        match.setStatus(MatchStatus.LIVE);
        matchRepository.save(match);

        Innings savedInnings = inningsRepository.save(innings);
        return mapInningsToDTO(savedInnings);
    }

    @Transactional(readOnly = true)
    public List<InningsDTO> getInningsByMatch(Long matchId) {
        if (!matchRepository.existsById(matchId)) {
            throw new ResourceNotFoundException("Match not found with id: " + matchId);
        }
        return inningsRepository.findByMatchIdOrderByInningsNumberAsc(matchId).stream()
                .map(this::mapInningsToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public InningsDTO getInningsById(Long inningsId) {
        Innings innings = inningsRepository.findById(inningsId)
                .orElseThrow(() -> new ResourceNotFoundException("Innings not found with id: " + inningsId));
        return mapInningsToDTO(innings);
    }

    private void startMatchWithInnings(Match match, Team tossWinner, String tossDecision) {
        Team battingTeam;
        Team bowlingTeam;

        if ("BAT".equalsIgnoreCase(tossDecision)) {
            battingTeam = tossWinner;
            bowlingTeam = tossWinner.getId().equals(match.getTeam1().getId()) ? match.getTeam2() : match.getTeam1();
        } else {
            bowlingTeam = tossWinner;
            battingTeam = bowlingTeam.getId().equals(match.getTeam1().getId()) ? match.getTeam2() : match.getTeam1();
        }

        Innings innings = Innings.builder()
                .match(match)
                .battingTeam(battingTeam)
                .bowlingTeam(bowlingTeam)
                .inningsNumber(1)
                .totalRuns(0)
                .wickets(0)
                .legalBalls(0)
                .extras(0)
                .isCompleted(false)
                .build();

        match.setStatus(MatchStatus.LIVE);
        inningsRepository.save(innings);
    }

    public MatchDTO mapToDTO(Match match) {
        if (match == null) return null;

        ScoreResponseDTO currentScore = null;
        try {
            currentScore = scoreService.getMatchScore(match.getId());
        } catch (Exception ignored) {}

        String statusDesc = match.getStatus().name();
        if (match.getStatus() == MatchStatus.LIVE && currentScore != null) {
            statusDesc = currentScore.getBattingTeam() + " " + currentScore.getRuns() + "/" + currentScore.getWickets() + " (" + currentScore.getOvers() + " ov)";
        }

        return MatchDTO.builder()
                .id(match.getId())
                .team1(teamService.mapToDTO(match.getTeam1()))
                .team2(teamService.mapToDTO(match.getTeam2()))
                .venue(match.getVenue())
                .matchDate(match.getMatchDate())
                .matchType(match.getMatchType())
                .status(match.getStatus())
                .totalOvers(match.getTotalOvers())
                .tossWinner(teamService.mapToDTO(match.getTossWinner()))
                .tossDecision(match.getTossDecision())
                .currentScore(currentScore)
                .statusDescription(statusDesc)
                .build();
    }

    public InningsDTO mapInningsToDTO(Innings inn) {
        if (inn == null) return null;
        return InningsDTO.builder()
                .id(inn.getId())
                .matchId(inn.getMatch().getId())
                .battingTeamId(inn.getBattingTeam().getId())
                .battingTeamName(inn.getBattingTeam().getTeamName())
                .bowlingTeamId(inn.getBowlingTeam().getId())
                .bowlingTeamName(inn.getBowlingTeam().getTeamName())
                .inningsNumber(inn.getInningsNumber())
                .totalRuns(inn.getTotalRuns())
                .wickets(inn.getWickets())
                .legalBalls(inn.getLegalBalls())
                .overs(ScoreService.formatOvers(inn.getLegalBalls()))
                .runRate(ScoreService.calculateRate(inn.getTotalRuns(), inn.getLegalBalls()))
                .extras(inn.getExtras())
                .isCompleted(inn.getIsCompleted())
                .build();
    }
}
