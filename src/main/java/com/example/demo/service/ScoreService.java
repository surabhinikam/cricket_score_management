package com.example.demo.service;

import com.example.demo.dto.*;
import com.example.demo.entity.*;
import com.example.demo.exception.InvalidBallEventException;
import com.example.demo.exception.InvalidMatchException;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.repository.BallEventRepository;
import com.example.demo.repository.InningsRepository;
import com.example.demo.repository.MatchRepository;
import com.example.demo.repository.PlayerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ScoreService {

    private final InningsRepository inningsRepository;
    private final BallEventRepository ballEventRepository;
    private final MatchRepository matchRepository;
    private final PlayerRepository playerRepository;

    /**
     * Converts legal ball count to official cricket overs notation (e.g. 11 balls -> "1.5", 12 balls -> "2.0").
     */
    public static String formatOvers(int legalBalls) {
        int completedOvers = legalBalls / 6;
        int remainingBalls = legalBalls % 6;
        return completedOvers + "." + remainingBalls;
    }

    /**
     * Calculates Run Rate or Economy given runs and legal balls bowled.
     * Formula: (runs * 6.0) / legalBalls
     */
    public static double calculateRate(int runs, int legalBalls) {
        if (legalBalls <= 0) return 0.0;
        double rate = (runs * 6.0) / legalBalls;
        return round(rate, 2);
    }

    public static double round(double value, int places) {
        if (Double.isNaN(value) || Double.isInfinite(value)) return 0.0;
        BigDecimal bd = BigDecimal.valueOf(value);
        bd = bd.setScale(places, RoundingMode.HALF_UP);
        return bd.doubleValue();
    }

    /**
     * Records a ball event, updates innings totals, bowler/batsman statistics, and checks match progress.
     */
    @Transactional
    public ScoreResponseDTO recordBallEvent(Long inningsId, BallEventRequestDTO request) {
        // 1. Validate Innings
        Innings innings = inningsRepository.findById(inningsId)
                .orElseThrow(() -> new ResourceNotFoundException("Innings not found with id: " + inningsId));

        Match match = innings.getMatch();

        // 2. Validate Match Status
        if (match.getStatus() != MatchStatus.LIVE) {
            throw new InvalidMatchException("Cannot record ball event: Match is not LIVE (current status: " + match.getStatus() + ")");
        }

        if (Boolean.TRUE.equals(innings.getIsCompleted())) {
            throw new InvalidBallEventException("Cannot record ball event: This innings is already completed");
        }

        // 3. Validate Players
        Player batsman = playerRepository.findById(request.getBatsmanId())
                .orElseThrow(() -> new ResourceNotFoundException("Batsman not found with id: " + request.getBatsmanId()));

        Player bowler = playerRepository.findById(request.getBowlerId())
                .orElseThrow(() -> new ResourceNotFoundException("Bowler not found with id: " + request.getBowlerId()));

        if (!batsman.getTeam().getId().equals(innings.getBattingTeam().getId())) {
            throw new InvalidBallEventException("Batsman " + batsman.getPlayerName() + " does not belong to batting team: " + innings.getBattingTeam().getTeamName());
        }

        if (!bowler.getTeam().getId().equals(innings.getBowlingTeam().getId())) {
            throw new InvalidBallEventException("Bowler " + bowler.getPlayerName() + " does not belong to bowling team: " + innings.getBowlingTeam().getTeamName());
        }

        Player dismissedPlayer = null;
        if (Boolean.TRUE.equals(request.getWicket())) {
            if (request.getDismissedPlayerId() != null) {
                dismissedPlayer = playerRepository.findById(request.getDismissedPlayerId())
                        .orElseThrow(() -> new ResourceNotFoundException("Dismissed player not found with id: " + request.getDismissedPlayerId()));
            } else {
                dismissedPlayer = batsman; // Default to striker if not explicitly specified
            }
            if (!dismissedPlayer.getTeam().getId().equals(innings.getBattingTeam().getId())) {
                throw new InvalidBallEventException("Dismissed player must belong to the batting team");
            }
            if (request.getWicketType() == null) {
                request.setWicketType(WicketType.BOWLED);
            }
        }

        int runsOffBat = request.getRunsOffBat() != null ? Math.max(0, request.getRunsOffBat()) : 0;
        int extras = request.getExtras() != null ? Math.max(0, request.getExtras()) : 0;

        // Auto-assign default extras if extraType is set but extras count is 0
        if (request.getExtraType() != null && extras == 0) {
            if (request.getExtraType() == ExtraType.WIDE || request.getExtraType() == ExtraType.NO_BALL) {
                extras = 1;
            }
        }

        // Determine if delivery is legal
        boolean isLegalBall = true;
        if (request.getExtraType() == ExtraType.WIDE || request.getExtraType() == ExtraType.NO_BALL) {
            isLegalBall = false;
        }

        // 4. Save Ball Event
        BallEvent ballEvent = BallEvent.builder()
                .innings(innings)
                .overNumber(request.getOverNumber() != null ? request.getOverNumber() : (innings.getLegalBalls() / 6) + 1)
                .ballNumber(request.getBallNumber() != null ? request.getBallNumber() : (innings.getLegalBalls() % 6) + (isLegalBall ? 1 : 0))
                .batsman(batsman)
                .bowler(bowler)
                .runsOffBat(runsOffBat)
                .extras(extras)
                .extraType(request.getExtraType())
                .wicket(Boolean.TRUE.equals(request.getWicket()))
                .wicketType(request.getWicketType())
                .dismissedPlayer(dismissedPlayer)
                .timestamp(LocalDateTime.now())
                .build();

        ballEventRepository.save(ballEvent);

        // 5. Update Innings Score
        int totalBallRuns = runsOffBat + extras;
        innings.setTotalRuns(innings.getTotalRuns() + totalBallRuns);
        innings.setExtras(innings.getExtras() + extras);

        if (isLegalBall) {
            innings.setLegalBalls(innings.getLegalBalls() + 1);
        }

        if (Boolean.TRUE.equals(request.getWicket())) {
            innings.setWickets(innings.getWickets() + 1);
        }

        // 6. Check Completion of Innings / Match
        checkAndHandleInningsCompletion(innings, match);

        inningsRepository.save(innings);
        matchRepository.save(match);

        return getMatchScore(match.getId());
    }

    private void checkAndHandleInningsCompletion(Innings innings, Match match) {
        int maxLegalBalls = match.getTotalOvers() * 6;
        boolean oversFinished = innings.getLegalBalls() >= maxLegalBalls;
        boolean allOut = innings.getWickets() >= 10;

        // Check if 2nd innings chase target
        if (innings.getInningsNumber() == 2) {
            Innings firstInnings = inningsRepository.findByMatchIdAndInningsNumber(match.getId(), 1)
                    .orElse(null);

            if (firstInnings != null) {
                int target = firstInnings.getTotalRuns() + 1;
                // Target achieved
                if (innings.getTotalRuns() >= target) {
                    innings.setIsCompleted(true);
                    match.setStatus(MatchStatus.COMPLETED);
                    return;
                }
            }
        }

        if (oversFinished || allOut) {
            innings.setIsCompleted(true);
            if (innings.getInningsNumber() == 2) {
                match.setStatus(MatchStatus.COMPLETED);
            } else if (innings.getInningsNumber() == 1) {
                // If 1st innings finished, prepare 2nd innings if not already present
                Optional<Innings> secondInningsOpt = inningsRepository.findByMatchIdAndInningsNumber(match.getId(), 2);
                if (secondInningsOpt.isEmpty()) {
                    Innings secondInnings = Innings.builder()
                            .match(match)
                            .battingTeam(innings.getBowlingTeam())
                            .bowlingTeam(innings.getBattingTeam())
                            .inningsNumber(2)
                            .totalRuns(0)
                            .wickets(0)
                            .legalBalls(0)
                            .extras(0)
                            .isCompleted(false)
                            .build();
                    inningsRepository.save(secondInnings);
                }
            }
        }
    }

    @Transactional(readOnly = true)
    public ScoreResponseDTO getMatchScore(Long matchId) {
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new ResourceNotFoundException("Match not found with id: " + matchId));

        List<Innings> inningsList = inningsRepository.findByMatchIdOrderByInningsNumberAsc(matchId);
        if (inningsList.isEmpty()) {
            return ScoreResponseDTO.builder()
                    .matchId(match.getId())
                    .status(match.getStatus())
                    .team(match.getTeam1().getTeamName())
                    .battingTeam(match.getTeam1().getTeamName())
                    .bowlingTeam(match.getTeam2().getTeamName())
                    .runs(0)
                    .wickets(0)
                    .overs("0.0")
                    .runRate(0.0)
                    .extras(0)
                    .tossMessage(getTossMessage(match))
                    .matchResult(determineMatchResult(match, Collections.emptyList()))
                    .build();
        }

        // Active innings is the latest incomplete innings, or the last completed innings
        Innings currentInnings = inningsList.stream()
                .filter(i -> !Boolean.TRUE.equals(i.getIsCompleted()))
                .findFirst()
                .orElse(inningsList.get(inningsList.size() - 1));

        double runRate = calculateRate(currentInnings.getTotalRuns(), currentInnings.getLegalBalls());

        Integer target = null;
        Integer requiredRuns = null;
        Integer requiredBalls = null;
        Double requiredRunRate = null;

        if (currentInnings.getInningsNumber() == 2 && inningsList.size() >= 2) {
            Innings firstInnings = inningsList.get(0);
            target = firstInnings.getTotalRuns() + 1;
            requiredRuns = Math.max(0, target - currentInnings.getTotalRuns());
            int totalMaxBalls = match.getTotalOvers() * 6;
            requiredBalls = Math.max(0, totalMaxBalls - currentInnings.getLegalBalls());
            if (requiredBalls > 0 && requiredRuns > 0) {
                requiredRunRate = round((requiredRuns * 6.0) / requiredBalls, 2);
            } else if (requiredRuns == 0) {
                requiredRunRate = 0.0;
            }
        }

        return ScoreResponseDTO.builder()
                .matchId(match.getId())
                .inningsId(currentInnings.getId())
                .inningsNumber(currentInnings.getInningsNumber())
                .team(currentInnings.getBattingTeam().getTeamName())
                .battingTeam(currentInnings.getBattingTeam().getTeamName())
                .bowlingTeam(currentInnings.getBowlingTeam().getTeamName())
                .runs(currentInnings.getTotalRuns())
                .wickets(currentInnings.getWickets())
                .overs(formatOvers(currentInnings.getLegalBalls()))
                .runRate(runRate)
                .extras(currentInnings.getExtras())
                .target(target)
                .requiredRuns(requiredRuns)
                .requiredBalls(requiredBalls)
                .requiredRunRate(requiredRunRate)
                .status(match.getStatus())
                .tossMessage(getTossMessage(match))
                .matchResult(determineMatchResult(match, inningsList))
                .build();
    }

    @Transactional(readOnly = true)
    public List<BattingStatDTO> getBattingStats(Long matchId) {
        List<Innings> inningsList = inningsRepository.findByMatchIdOrderByInningsNumberAsc(matchId);
        if (inningsList.isEmpty()) return Collections.emptyList();

        Innings currentInnings = inningsList.stream()
                .filter(i -> !Boolean.TRUE.equals(i.getIsCompleted()))
                .findFirst()
                .orElse(inningsList.get(inningsList.size() - 1));

        return calculateBattingStatsForInnings(currentInnings.getId());
    }

    @Transactional(readOnly = true)
    public List<BowlingStatDTO> getBowlingStats(Long matchId) {
        List<Innings> inningsList = inningsRepository.findByMatchIdOrderByInningsNumberAsc(matchId);
        if (inningsList.isEmpty()) return Collections.emptyList();

        Innings currentInnings = inningsList.stream()
                .filter(i -> !Boolean.TRUE.equals(i.getIsCompleted()))
                .findFirst()
                .orElse(inningsList.get(inningsList.size() - 1));

        return calculateBowlingStatsForInnings(currentInnings.getId());
    }

    @Transactional(readOnly = true)
    public ScorecardDTO getScorecard(Long matchId) {
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new ResourceNotFoundException("Match not found with id: " + matchId));

        List<Innings> inningsList = inningsRepository.findByMatchIdOrderByInningsNumberAsc(matchId);
        List<InningsScorecardDTO> inningsScorecards = new ArrayList<>();

        for (Innings inn : inningsList) {
            List<BattingStatDTO> battingStats = calculateBattingStatsForInnings(inn.getId());
            List<BowlingStatDTO> bowlingStats = calculateBowlingStatsForInnings(inn.getId());
            List<String> recentBalls = getRecentBallsDisplay(inn.getId(), 12);

            InningsScorecardDTO innDTO = InningsScorecardDTO.builder()
                    .inningsId(inn.getId())
                    .inningsNumber(inn.getInningsNumber())
                    .battingTeamId(inn.getBattingTeam().getId())
                    .battingTeamName(inn.getBattingTeam().getTeamName())
                    .bowlingTeamId(inn.getBowlingTeam().getId())
                    .bowlingTeamName(inn.getBowlingTeam().getTeamName())
                    .totalRuns(inn.getTotalRuns())
                    .wickets(inn.getWickets())
                    .overs(formatOvers(inn.getLegalBalls()))
                    .runRate(calculateRate(inn.getTotalRuns(), inn.getLegalBalls()))
                    .extras(inn.getExtras())
                    .isCompleted(inn.getIsCompleted())
                    .battingStats(battingStats)
                    .bowlingStats(bowlingStats)
                    .recentBalls(recentBalls)
                    .build();

            inningsScorecards.add(innDTO);
        }

        String title = match.getTeam1().getShortName() + " vs " + match.getTeam2().getShortName();

        return ScorecardDTO.builder()
                .matchId(match.getId())
                .matchTitle(title)
                .status(match.getStatus())
                .venue(match.getVenue())
                .matchType(match.getMatchType())
                .totalOvers(match.getTotalOvers())
                .tossMessage(getTossMessage(match))
                .result(determineMatchResult(match, inningsList))
                .inningsList(inningsScorecards)
                .build();
    }

    @Transactional(readOnly = true)
    public MatchSummaryDTO getMatchSummary(Long matchId) {
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new ResourceNotFoundException("Match not found with id: " + matchId));

        List<Innings> inningsList = inningsRepository.findByMatchIdOrderByInningsNumberAsc(matchId);

        String team1Score = "Yet to bat";
        String team2Score = "Yet to bat";

        for (Innings inn : inningsList) {
            String scoreStr = inn.getTotalRuns() + "/" + inn.getWickets() + " (" + formatOvers(inn.getLegalBalls()) + " ov)";
            if (inn.getBattingTeam().getId().equals(match.getTeam1().getId())) {
                team1Score = scoreStr;
            } else {
                team2Score = scoreStr;
            }
        }

        // Top batsman and bowler across match
        String topBatsman = "N/A";
        String topBowler = "N/A";
        int maxRuns = -1;
        int maxWickets = -1;

        for (Innings inn : inningsList) {
            List<BattingStatDTO> batStats = calculateBattingStatsForInnings(inn.getId());
            for (BattingStatDTO b : batStats) {
                if (b.getRuns() > maxRuns) {
                    maxRuns = b.getRuns();
                    topBatsman = b.getPlayerName() + " (" + b.getRuns() + " off " + b.getBalls() + "b)";
                }
            }

            List<BowlingStatDTO> bowlStats = calculateBowlingStatsForInnings(inn.getId());
            for (BowlingStatDTO bowl : bowlStats) {
                if (bowl.getWickets() > maxWickets) {
                    maxWickets = bowl.getWickets();
                    topBowler = bowl.getPlayerName() + " (" + bowl.getWickets() + "/" + bowl.getRunsConceded() + ")";
                }
            }
        }

        String result = determineMatchResult(match, inningsList);

        return MatchSummaryDTO.builder()
                .matchId(match.getId())
                .matchTitle(match.getTeam1().getTeamName() + " vs " + match.getTeam2().getTeamName())
                .venue(match.getVenue())
                .status(match.getStatus())
                .team1Name(match.getTeam1().getTeamName())
                .team1Score(team1Score)
                .team2Name(match.getTeam2().getTeamName())
                .team2Score(team2Score)
                .result(result)
                .tossMessage(getTossMessage(match))
                .topBatsman(topBatsman)
                .topBowler(topBowler)
                .build();
    }

    public List<BallEventResponseDTO> getBallEvents(Long inningsId) {
        return ballEventRepository.findByInningsIdOrderByTimestampAsc(inningsId).stream()
                .map(this::mapBallEventToDTO)
                .collect(Collectors.toList());
    }

    public List<String> getRecentBallsDisplay(Long inningsId, int limit) {
        List<BallEvent> events = ballEventRepository.findTop12ByInningsIdOrderByTimestampDesc(inningsId);
        List<String> list = new ArrayList<>();
        for (BallEvent b : events) {
            list.add(getBallDisplayText(b));
        }
        Collections.reverse(list);
        if (list.size() > limit) {
            return list.subList(list.size() - limit, list.size());
        }
        return list;
    }

    public List<BattingStatDTO> calculateBattingStatsForInnings(Long inningsId) {
        List<BallEvent> balls = ballEventRepository.findByInningsIdOrderByTimestampAsc(inningsId);
        Map<Long, BattingStatDTO> statMap = new LinkedHashMap<>();

        for (BallEvent b : balls) {
            Player striker = b.getBatsman();
            statMap.putIfAbsent(striker.getId(), BattingStatDTO.builder()
                    .playerId(striker.getId())
                    .playerName(striker.getPlayerName())
                    .runs(0)
                    .balls(0)
                    .fours(0)
                    .sixes(0)
                    .strikeRate(0.0)
                    .isOut(false)
                    .dismissalInfo("not out")
                    .build());

            BattingStatDTO stat = statMap.get(striker.getId());

            // Batsman gets runs only from off the bat (not byes, leg-byes, wides)
            int batRuns = b.getRunsOffBat() != null ? b.getRunsOffBat() : 0;
            stat.setRuns(stat.getRuns() + batRuns);

            if (batRuns == 4) {
                stat.setFours(stat.getFours() + 1);
            } else if (batRuns == 6) {
                stat.setSixes(stat.getSixes() + 1);
            }

            // Balls faced increases on legal balls and no-balls (NOT on wide)
            if (b.getExtraType() != ExtraType.WIDE) {
                stat.setBalls(stat.getBalls() + 1);
            }

            // Wicket checks
            if (Boolean.TRUE.equals(b.getWicket()) && b.getDismissedPlayer() != null) {
                Long dismissedId = b.getDismissedPlayer().getId();
                statMap.putIfAbsent(dismissedId, BattingStatDTO.builder()
                        .playerId(dismissedId)
                        .playerName(b.getDismissedPlayer().getPlayerName())
                        .runs(0)
                        .balls(0)
                        .fours(0)
                        .sixes(0)
                        .strikeRate(0.0)
                        .isOut(false)
                        .dismissalInfo("not out")
                        .build());

                BattingStatDTO outPlayer = statMap.get(dismissedId);
                outPlayer.setIsOut(true);
                outPlayer.setDismissalInfo(formatDismissal(b));
            }
        }

        // Calculate strike rates
        for (BattingStatDTO stat : statMap.values()) {
            if (stat.getBalls() > 0) {
                double sr = (stat.getRuns() * 100.0) / stat.getBalls();
                stat.setStrikeRate(round(sr, 2));
            } else {
                stat.setStrikeRate(0.0);
            }
        }

        return new ArrayList<>(statMap.values());
    }

    public List<BowlingStatDTO> calculateBowlingStatsForInnings(Long inningsId) {
        List<BallEvent> balls = ballEventRepository.findByInningsIdOrderByTimestampAsc(inningsId);
        Map<Long, BowlingStatDTO> statMap = new LinkedHashMap<>();

        // Group balls by over to calculate maidens
        Map<Long, Map<Integer, List<BallEvent>>> bowlerOvers = new HashMap<>();

        for (BallEvent b : balls) {
            Player bowler = b.getBowler();
            statMap.putIfAbsent(bowler.getId(), BowlingStatDTO.builder()
                    .playerId(bowler.getId())
                    .playerName(bowler.getPlayerName())
                    .overs("0.0")
                    .legalBalls(0)
                    .maidens(0)
                    .runsConceded(0)
                    .wickets(0)
                    .economy(0.0)
                    .build());

            BowlingStatDTO stat = statMap.get(bowler.getId());

            boolean isLegal = (b.getExtraType() != ExtraType.WIDE && b.getExtraType() != ExtraType.NO_BALL);
            if (isLegal) {
                stat.setLegalBalls(stat.getLegalBalls() + 1);
            }

            // Bowler runs conceded = runs off bat + wides + no balls (byes and leg byes are NOT bowler conceded)
            int conceded = (b.getRunsOffBat() != null ? b.getRunsOffBat() : 0);
            if (b.getExtraType() == ExtraType.WIDE || b.getExtraType() == ExtraType.NO_BALL) {
                conceded += (b.getExtras() != null ? b.getExtras() : 0);
            }
            stat.setRunsConceded(stat.getRunsConceded() + conceded);

            // Bowler wickets: BOWLED, CAUGHT, LBW, STUMPED, HIT_WICKET (RUN_OUT not credited to bowler)
            if (Boolean.TRUE.equals(b.getWicket()) && b.getWicketType() != null && b.getWicketType() != WicketType.RUN_OUT) {
                stat.setWickets(stat.getWickets() + 1);
            }

            bowlerOvers.computeIfAbsent(bowler.getId(), k -> new HashMap<>())
                    .computeIfAbsent(b.getOverNumber(), k -> new ArrayList<>())
                    .add(b);
        }

        // Calculate overs, maidens, economy
        for (BowlingStatDTO stat : statMap.values()) {
            stat.setOvers(formatOvers(stat.getLegalBalls()));
            stat.setEconomy(calculateRate(stat.getRunsConceded(), stat.getLegalBalls()));

            // Maiden over check: 6 legal balls bowled in that over and 0 runs conceded
            Map<Integer, List<BallEvent>> oversMap = bowlerOvers.get(stat.getPlayerId());
            int maidens = 0;
            if (oversMap != null) {
                for (List<BallEvent> overBalls : oversMap.values()) {
                    long legalInOver = overBalls.stream()
                            .filter(ev -> ev.getExtraType() != ExtraType.WIDE && ev.getExtraType() != ExtraType.NO_BALL)
                            .count();
                    int overRunsConceded = overBalls.stream()
                            .mapToInt(ev -> {
                                int c = (ev.getRunsOffBat() != null ? ev.getRunsOffBat() : 0);
                                if (ev.getExtraType() == ExtraType.WIDE || ev.getExtraType() == ExtraType.NO_BALL) {
                                    c += (ev.getExtras() != null ? ev.getExtras() : 0);
                                }
                                return c;
                            }).sum();
                    if (legalInOver == 6 && overRunsConceded == 0) {
                        maidens++;
                    }
                }
            }
            stat.setMaidens(maidens);
        }

        return new ArrayList<>(statMap.values());
    }

    private String formatDismissal(BallEvent b) {
        if (b.getWicketType() == null) return "out";
        String bowlerName = b.getBowler() != null ? b.getBowler().getPlayerName() : "";
        switch (b.getWicketType()) {
            case BOWLED:
                return "b " + bowlerName;
            case CAUGHT:
                return "c & b " + bowlerName;
            case LBW:
                return "lbw b " + bowlerName;
            case STUMPED:
                return "st b " + bowlerName;
            case HIT_WICKET:
                return "hit wicket b " + bowlerName;
            case RUN_OUT:
                return "run out";
            default:
                return "out";
        }
    }

    private String getBallDisplayText(BallEvent b) {
        if (Boolean.TRUE.equals(b.getWicket())) {
            return "W";
        }
        if (b.getExtraType() == ExtraType.WIDE) {
            int ex = b.getExtras() != null ? b.getExtras() : 1;
            return ex > 1 ? ex + "wd" : "Wd";
        }
        if (b.getExtraType() == ExtraType.NO_BALL) {
            int runs = (b.getRunsOffBat() != null ? b.getRunsOffBat() : 0) + (b.getExtras() != null ? b.getExtras() : 1);
            return runs + "nb";
        }
        if (b.getExtraType() == ExtraType.BYE) {
            return (b.getExtras() != null ? b.getExtras() : 1) + "b";
        }
        if (b.getExtraType() == ExtraType.LEG_BYE) {
            return (b.getExtras() != null ? b.getExtras() : 1) + "lb";
        }
        return String.valueOf(b.getRunsOffBat() != null ? b.getRunsOffBat() : 0);
    }

    private BallEventResponseDTO mapBallEventToDTO(BallEvent b) {
        return BallEventResponseDTO.builder()
                .id(b.getId())
                .inningsId(b.getInnings().getId())
                .overNumber(b.getOverNumber())
                .ballNumber(b.getBallNumber())
                .batsmanId(b.getBatsman() != null ? b.getBatsman().getId() : null)
                .batsmanName(b.getBatsman() != null ? b.getBatsman().getPlayerName() : null)
                .bowlerId(b.getBowler() != null ? b.getBowler().getId() : null)
                .bowlerName(b.getBowler() != null ? b.getBowler().getPlayerName() : null)
                .runsOffBat(b.getRunsOffBat())
                .extras(b.getExtras())
                .extraType(b.getExtraType())
                .wicket(b.getWicket())
                .wicketType(b.getWicketType())
                .dismissedPlayerName(b.getDismissedPlayer() != null ? b.getDismissedPlayer().getPlayerName() : null)
                .displayText(getBallDisplayText(b))
                .timestamp(b.getTimestamp())
                .build();
    }

    private String getTossMessage(Match match) {
        if (match.getTossWinner() != null && match.getTossDecision() != null) {
            return match.getTossWinner().getTeamName() + " won the toss and elected to " + match.getTossDecision().toLowerCase() + " first.";
        }
        return "Toss yet to take place.";
    }

    private String determineMatchResult(Match match, List<Innings> inningsList) {
        if (match.getStatus() == MatchStatus.UPCOMING) {
            return "Match has not started yet";
        }
        if (match.getStatus() == MatchStatus.ABANDONED) {
            return "Match abandoned";
        }
        if (inningsList.size() < 2) {
            if (match.getStatus() == MatchStatus.LIVE) {
                return "1st Innings in progress";
            }
            return "Match in progress";
        }

        Innings inn1 = inningsList.get(0);
        Innings inn2 = inningsList.get(1);

        if (match.getStatus() == MatchStatus.LIVE) {
            int target = inn1.getTotalRuns() + 1;
            int needed = target - inn2.getTotalRuns();
            int ballsLeft = (match.getTotalOvers() * 6) - inn2.getLegalBalls();
            return inn2.getBattingTeam().getTeamName() + " need " + needed + " runs in " + ballsLeft + " balls to win";
        }

        if (inn2.getTotalRuns() > inn1.getTotalRuns()) {
            int wicketsRemaining = 10 - inn2.getWickets();
            return inn2.getBattingTeam().getTeamName() + " won by " + wicketsRemaining + " wickets";
        } else if (inn1.getTotalRuns() > inn2.getTotalRuns()) {
            int runMargin = inn1.getTotalRuns() - inn2.getTotalRuns();
            return inn1.getBattingTeam().getTeamName() + " won by " + runMargin + " runs";
        } else {
            return "Match tied";
        }
    }
}
