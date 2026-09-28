package com.example.demo;

import com.example.demo.dto.BallEventRequestDTO;
import com.example.demo.dto.BattingStatDTO;
import com.example.demo.dto.BowlingStatDTO;
import com.example.demo.dto.ScoreResponseDTO;
import com.example.demo.entity.*;
import com.example.demo.repository.*;
import com.example.demo.service.ScoreService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
public class CricketScoringEngineTest {

    @Autowired
    private ScoreService scoreService;

    @Autowired
    private TeamRepository teamRepository;

    @Autowired
    private PlayerRepository playerRepository;

    @Autowired
    private MatchRepository matchRepository;

    @Autowired
    private InningsRepository inningsRepository;

    @Autowired
    private BallEventRepository ballEventRepository;

    private Team teamA;
    private Team teamB;
    private Player batsman1;
    private Player bowler1;
    private Match match;
    private Innings innings;

    @BeforeEach
    void setUp() {
        teamA = teamRepository.save(Team.builder()
                .teamName("Test India")
                .shortName("T-IND")
                .country("India")
                .build());

        teamB = teamRepository.save(Team.builder()
                .teamName("Test Australia")
                .shortName("T-AUS")
                .country("Australia")
                .build());

        batsman1 = playerRepository.save(Player.builder()
                .playerName("Virat Test")
                .role(PlayerRole.BATSMAN)
                .jerseyNumber(18)
                .team(teamA)
                .build());

        bowler1 = playerRepository.save(Player.builder()
                .playerName("Starc Test")
                .role(PlayerRole.BOWLER)
                .jerseyNumber(56)
                .team(teamB)
                .build());

        match = matchRepository.save(Match.builder()
                .team1(teamA)
                .team2(teamB)
                .venue("Test Stadium")
                .matchDate(LocalDateTime.now())
                .matchType(MatchType.T20)
                .status(MatchStatus.LIVE)
                .totalOvers(20)
                .tossWinner(teamA)
                .tossDecision("BAT")
                .build());

        innings = inningsRepository.save(Innings.builder()
                .match(match)
                .battingTeam(teamA)
                .bowlingTeam(teamB)
                .inningsNumber(1)
                .totalRuns(0)
                .wickets(0)
                .legalBalls(0)
                .extras(0)
                .isCompleted(false)
                .build());
    }

    @Test
    @DisplayName("Format overs conversion verification")
    void testFormatOvers() {
        assertEquals("0.0", ScoreService.formatOvers(0));
        assertEquals("0.5", ScoreService.formatOvers(5));
        assertEquals("1.0", ScoreService.formatOvers(6));
        assertEquals("1.1", ScoreService.formatOvers(7));
        assertEquals("1.5", ScoreService.formatOvers(11));
        assertEquals("2.0", ScoreService.formatOvers(12));
        assertEquals("16.3", ScoreService.formatOvers(99));
    }

    @Test
    @DisplayName("TEST 1: 6 legal balls result in 1 completed over (1.0)")
    void testSixLegalBalls() {
        for (int i = 1; i <= 6; i++) {
            BallEventRequestDTO ball = BallEventRequestDTO.builder()
                    .batsmanId(batsman1.getId())
                    .bowlerId(bowler1.getId())
                    .runsOffBat(1)
                    .extras(0)
                    .wicket(false)
                    .build();
            scoreService.recordBallEvent(innings.getId(), ball);
        }

        Innings updatedInnings = inningsRepository.findById(innings.getId()).orElseThrow();
        assertEquals(6, updatedInnings.getLegalBalls());
        assertEquals("1.0", ScoreService.formatOvers(updatedInnings.getLegalBalls()));
        assertEquals(6, updatedInnings.getTotalRuns());
    }

    @Test
    @DisplayName("TEST 2: 5 legal balls + 1 wide -> 5 legal balls, displayed overs 0.5")
    void testFiveLegalBallsPlusOneWide() {
        // 5 legal balls
        for (int i = 1; i <= 5; i++) {
            BallEventRequestDTO ball = BallEventRequestDTO.builder()
                    .batsmanId(batsman1.getId())
                    .bowlerId(bowler1.getId())
                    .runsOffBat(0)
                    .extras(0)
                    .wicket(false)
                    .build();
            scoreService.recordBallEvent(innings.getId(), ball);
        }

        // 1 wide ball
        BallEventRequestDTO wideBall = BallEventRequestDTO.builder()
                .batsmanId(batsman1.getId())
                .bowlerId(bowler1.getId())
                .runsOffBat(0)
                .extras(1)
                .extraType(ExtraType.WIDE)
                .wicket(false)
                .build();
        scoreService.recordBallEvent(innings.getId(), wideBall);

        Innings updatedInnings = inningsRepository.findById(innings.getId()).orElseThrow();
        assertEquals(5, updatedInnings.getLegalBalls(), "Wide must NOT increment legal balls count");
        assertEquals("0.5", ScoreService.formatOvers(updatedInnings.getLegalBalls()));
        assertEquals(1, updatedInnings.getTotalRuns());
        assertEquals(1, updatedInnings.getExtras());
    }

    @Test
    @DisplayName("TEST 3: 5 legal balls + 1 no-ball -> legal balls remain 5")
    void testFiveLegalBallsPlusOneNoBall() {
        // 5 legal balls
        for (int i = 1; i <= 5; i++) {
            BallEventRequestDTO ball = BallEventRequestDTO.builder()
                    .batsmanId(batsman1.getId())
                    .bowlerId(bowler1.getId())
                    .runsOffBat(0)
                    .extras(0)
                    .wicket(false)
                    .build();
            scoreService.recordBallEvent(innings.getId(), ball);
        }

        // 1 no-ball
        BallEventRequestDTO noBall = BallEventRequestDTO.builder()
                .batsmanId(batsman1.getId())
                .bowlerId(bowler1.getId())
                .runsOffBat(1)
                .extras(1)
                .extraType(ExtraType.NO_BALL)
                .wicket(false)
                .build();
        scoreService.recordBallEvent(innings.getId(), noBall);

        Innings updatedInnings = inningsRepository.findById(innings.getId()).orElseThrow();
        assertEquals(5, updatedInnings.getLegalBalls(), "No ball must NOT increment legal balls count");
        assertEquals("0.5", ScoreService.formatOvers(updatedInnings.getLegalBalls()));
        assertEquals(2, updatedInnings.getTotalRuns()); // 1 run off bat + 1 extra
        assertEquals(1, updatedInnings.getExtras());
    }

    @Test
    @DisplayName("TEST 4: 4 runs off the bat updates runs and fours counter")
    void testFourRuns() {
        BallEventRequestDTO fourBall = BallEventRequestDTO.builder()
                .batsmanId(batsman1.getId())
                .bowlerId(bowler1.getId())
                .runsOffBat(4)
                .extras(0)
                .wicket(false)
                .build();
        scoreService.recordBallEvent(innings.getId(), fourBall);

        Innings updatedInnings = inningsRepository.findById(innings.getId()).orElseThrow();
        assertEquals(4, updatedInnings.getTotalRuns());

        List<BattingStatDTO> batStats = scoreService.getBattingStats(match.getId());
        assertEquals(1, batStats.size());
        BattingStatDTO virat = batStats.get(0);
        assertEquals(4, virat.getRuns());
        assertEquals(1, virat.getBalls());
        assertEquals(1, virat.getFours());
        assertEquals(0, virat.getSixes());
        assertEquals(400.0, virat.getStrikeRate());
    }

    @Test
    @DisplayName("TEST 5: 6 runs off the bat updates runs and sixes counter")
    void testSixRuns() {
        BallEventRequestDTO sixBall = BallEventRequestDTO.builder()
                .batsmanId(batsman1.getId())
                .bowlerId(bowler1.getId())
                .runsOffBat(6)
                .extras(0)
                .wicket(false)
                .build();
        scoreService.recordBallEvent(innings.getId(), sixBall);

        Innings updatedInnings = inningsRepository.findById(innings.getId()).orElseThrow();
        assertEquals(6, updatedInnings.getTotalRuns());

        List<BattingStatDTO> batStats = scoreService.getBattingStats(match.getId());
        BattingStatDTO virat = batStats.get(0);
        assertEquals(6, virat.getRuns());
        assertEquals(1, virat.getBalls());
        assertEquals(1, virat.getSixes());
        assertEquals(0, virat.getFours());
        assertEquals(600.0, virat.getStrikeRate());
    }

    @Test
    @DisplayName("TEST 6: Wicket increments innings wickets count")
    void testWicket() {
        BallEventRequestDTO wicketBall = BallEventRequestDTO.builder()
                .batsmanId(batsman1.getId())
                .bowlerId(bowler1.getId())
                .runsOffBat(0)
                .extras(0)
                .wicket(true)
                .wicketType(WicketType.BOWLED)
                .dismissedPlayerId(batsman1.getId())
                .build();
        ScoreResponseDTO res = scoreService.recordBallEvent(innings.getId(), wicketBall);

        assertEquals(1, res.getWickets());

        List<BowlingStatDTO> bowlStats = scoreService.getBowlingStats(match.getId());
        assertEquals(1, bowlStats.size());
        assertEquals(1, bowlStats.get(0).getWickets());
    }

    @Test
    @DisplayName("Bowling economy calculation uses exact legal balls")
    void testBowlingEconomyCalculation() {
        // Bowler gives 28 runs in 21 legal balls (3.3 overs)
        // Economy = (28 * 6) / 21 = 8.00
        double economy = ScoreService.calculateRate(28, 21);
        assertEquals(8.00, economy, 0.001);
    }
}
