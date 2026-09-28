package com.example.demo.config;

import com.example.demo.entity.*;
import com.example.demo.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Initializes realistic sample cricket data on initial startup when the database is empty.
 * Ensures the system is immediately demonstrable without manual data entry.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final TeamRepository teamRepository;
    private final PlayerRepository playerRepository;
    private final MatchRepository matchRepository;
    private final InningsRepository inningsRepository;
    private final BallEventRepository ballEventRepository;

    @Override
    @Transactional
    public void run(String... args) {
        if (teamRepository.count() > 0) {
            log.info("Database already contains data. Skipping sample data initialization.");
            return;
        }

        log.info("Initializing sample cricket data...");

        // 1. Create Teams
        Team india = teamRepository.save(Team.builder()
                .teamName("India")
                .shortName("IND")
                .country("India")
                .logoUrl("https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=128&q=80")
                .build());

        Team australia = teamRepository.save(Team.builder()
                .teamName("Australia")
                .shortName("AUS")
                .country("Australia")
                .logoUrl("https://images.unsplash.com/photo-1531415074868-036b1c575351?w=128&q=80")
                .build());

        Team england = teamRepository.save(Team.builder()
                .teamName("England")
                .shortName("ENG")
                .country("England")
                .logoUrl("https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=128&q=80")
                .build());

        // 2. Create Players for India (11 players)
        List<Player> indSquad = new ArrayList<>();
        indSquad.add(createPlayer("Rohit Sharma", PlayerRole.BATSMAN, 45, india));
        indSquad.add(createPlayer("Virat Kohli", PlayerRole.BATSMAN, 18, india));
        indSquad.add(createPlayer("Suryakumar Yadav", PlayerRole.BATSMAN, 63, india));
        indSquad.add(createPlayer("Rishabh Pant", PlayerRole.WICKET_KEEPER, 17, india));
        indSquad.add(createPlayer("Hardik Pandya", PlayerRole.ALL_ROUNDER, 33, india));
        indSquad.add(createPlayer("Ravindra Jadeja", PlayerRole.ALL_ROUNDER, 8, india));
        indSquad.add(createPlayer("Axar Patel", PlayerRole.ALL_ROUNDER, 20, india));
        indSquad.add(createPlayer("Kuldeep Yadav", PlayerRole.BOWLER, 23, india));
        indSquad.add(createPlayer("Jasprit Bumrah", PlayerRole.BOWLER, 93, india));
        indSquad.add(createPlayer("Mohammed Siraj", PlayerRole.BOWLER, 73, india));
        indSquad.add(createPlayer("Arshdeep Singh", PlayerRole.BOWLER, 2, india));
        playerRepository.saveAll(indSquad);

        // 3. Create Players for Australia (11 players)
        List<Player> ausSquad = new ArrayList<>();
        ausSquad.add(createPlayer("Travis Head", PlayerRole.BATSMAN, 62, australia));
        ausSquad.add(createPlayer("David Warner", PlayerRole.BATSMAN, 31, australia));
        ausSquad.add(createPlayer("Mitchell Marsh", PlayerRole.ALL_ROUNDER, 8, australia));
        ausSquad.add(createPlayer("Glenn Maxwell", PlayerRole.ALL_ROUNDER, 32, australia));
        ausSquad.add(createPlayer("Marcus Stoinis", PlayerRole.ALL_ROUNDER, 17, australia));
        ausSquad.add(createPlayer("Tim David", PlayerRole.BATSMAN, 85, australia));
        ausSquad.add(createPlayer("Matthew Wade", PlayerRole.WICKET_KEEPER, 13, australia));
        ausSquad.add(createPlayer("Pat Cummins", PlayerRole.BOWLER, 30, australia));
        ausSquad.add(createPlayer("Mitchell Starc", PlayerRole.BOWLER, 56, australia));
        ausSquad.add(createPlayer("Adam Zampa", PlayerRole.BOWLER, 88, australia));
        ausSquad.add(createPlayer("Josh Hazlewood", PlayerRole.BOWLER, 38, australia));
        playerRepository.saveAll(ausSquad);

        // 4. Create Players for England (11 players)
        List<Player> engSquad = new ArrayList<>();
        engSquad.add(createPlayer("Jos Buttler", PlayerRole.WICKET_KEEPER, 63, england));
        engSquad.add(createPlayer("Phil Salt", PlayerRole.BATSMAN, 42, england));
        engSquad.add(createPlayer("Jonny Bairstow", PlayerRole.BATSMAN, 51, england));
        engSquad.add(createPlayer("Harry Brook", PlayerRole.BATSMAN, 88, england));
        engSquad.add(createPlayer("Moeen Ali", PlayerRole.ALL_ROUNDER, 18, england));
        engSquad.add(createPlayer("Liam Livingstone", PlayerRole.ALL_ROUNDER, 23, england));
        engSquad.add(createPlayer("Sam Curran", PlayerRole.ALL_ROUNDER, 58, england));
        engSquad.add(createPlayer("Chris Jordan", PlayerRole.BOWLER, 34, england));
        engSquad.add(createPlayer("Jofra Archer", PlayerRole.BOWLER, 22, england));
        engSquad.add(createPlayer("Adil Rashid", PlayerRole.BOWLER, 95, england));
        engSquad.add(createPlayer("Mark Wood", PlayerRole.BOWLER, 33, england));
        playerRepository.saveAll(engSquad);

        // 5. Create Match 1: India vs Australia (LIVE)
        // Scenario matching requirement:
        // India chasing target of 179 (AUS made 178/7 in 20 ov)
        // Score: India 145/4 in 16.3 overs (Target 179, 34 runs needed in 21 balls, CRR: 8.78)
        Match match1 = matchRepository.save(Match.builder()
                .team1(india)
                .team2(australia)
                .venue("Wankhede Stadium, Mumbai")
                .matchDate(LocalDateTime.now().minusHours(2))
                .matchType(MatchType.T20)
                .status(MatchStatus.LIVE)
                .totalOvers(20)
                .tossWinner(india)
                .tossDecision("BOWL")
                .build());

        // Australia 1st Innings: 178/7 in 20.0 overs (120 legal balls)
        Innings ausInnings = inningsRepository.save(Innings.builder()
                .match(match1)
                .battingTeam(australia)
                .bowlingTeam(india)
                .inningsNumber(1)
                .totalRuns(178)
                .wickets(7)
                .legalBalls(120)
                .extras(10)
                .isCompleted(true)
                .build());

        // Create sample balls for AUS innings to give stats
        seedAusInningsBalls(ausInnings, ausSquad, indSquad);

        // India 2nd Innings: 145/4 in 16.3 overs (99 legal balls)
        // Batters:
        // Player 1 (Virat Kohli): 72 off 45 balls (7 4s, 2 6s, SR 160.00)
        // Player 2 (Suryakumar Yadav): 38 off 27 balls (4 4s, 1 6s, SR 140.74)
        // Bowler 1 (Mitchell Starc): 3.3 overs (21 legal balls), 28 runs conceded, 1 wicket (ECO 8.00)
        Innings indInnings = inningsRepository.save(Innings.builder()
                .match(match1)
                .battingTeam(india)
                .bowlingTeam(australia)
                .inningsNumber(2)
                .totalRuns(145)
                .wickets(4)
                .legalBalls(99)
                .extras(7)
                .isCompleted(false)
                .build());

        seedIndInningsBalls(indInnings, indSquad, ausSquad);

        // 6. Create Match 2: England vs Australia (COMPLETED)
        Match match2 = matchRepository.save(Match.builder()
                .team1(england)
                .team2(australia)
                .venue("Melbourne Cricket Ground (MCG), Melbourne")
                .matchDate(LocalDateTime.now().minusDays(2))
                .matchType(MatchType.T20)
                .status(MatchStatus.COMPLETED)
                .totalOvers(20)
                .tossWinner(england)
                .tossDecision("BAT")
                .build());

        Innings engInnings = inningsRepository.save(Innings.builder()
                .match(match2)
                .battingTeam(england)
                .bowlingTeam(australia)
                .inningsNumber(1)
                .totalRuns(165)
                .wickets(6)
                .legalBalls(120)
                .extras(8)
                .isCompleted(true)
                .build());
        seedEngInningsBalls(engInnings, engSquad, ausSquad);

        Innings ausChasingInnings = inningsRepository.save(Innings.builder()
                .match(match2)
                .battingTeam(australia)
                .bowlingTeam(england)
                .inningsNumber(2)
                .totalRuns(168)
                .wickets(4)
                .legalBalls(116)
                .extras(6)
                .isCompleted(true)
                .build());
        seedAusChaseBalls(ausChasingInnings, ausSquad, engSquad);

        // 7. Create Match 3: India vs England (UPCOMING)
        matchRepository.save(Match.builder()
                .team1(india)
                .team2(england)
                .venue("Eden Gardens, Kolkata")
                .matchDate(LocalDateTime.now().plusDays(1))
                .matchType(MatchType.T20)
                .status(MatchStatus.UPCOMING)
                .totalOvers(20)
                .tossWinner(null)
                .tossDecision(null)
                .build());

        log.info("Sample cricket data successfully initialized!");
    }

    private Player createPlayer(String name, PlayerRole role, int jersey, Team team) {
        return Player.builder()
                .playerName(name)
                .role(role)
                .jerseyNumber(jersey)
                .team(team)
                .build();
    }

    private void seedIndInningsBalls(Innings innings, List<Player> indSquad, List<Player> ausSquad) {
        Player rohit = indSquad.get(0);
        Player virat = indSquad.get(1);
        Player surya = indSquad.get(2);
        Player pant = indSquad.get(3);
        Player hardik = indSquad.get(4);

        Player starc = ausSquad.get(8);
        Player cummins = ausSquad.get(7);
        Player zampa = ausSquad.get(9);
        Player hazlewood = ausSquad.get(10);

        List<BallEvent> events = new ArrayList<>();
        LocalDateTime baseTime = LocalDateTime.now().minusMinutes(75);

        // Rohit Sharma: 15 (11b, 2x4) - dismissed bowled by Starc
        events.add(createBall(innings, 1, 1, rohit, starc, 4, 0, null, false, null, null, baseTime.plusSeconds(30)));
        events.add(createBall(innings, 1, 2, rohit, starc, 1, 0, null, false, null, null, baseTime.plusSeconds(60)));
        events.add(createBall(innings, 1, 3, virat, starc, 0, 0, null, false, null, null, baseTime.plusSeconds(90)));
        events.add(createBall(innings, 1, 4, virat, starc, 1, 0, null, false, null, null, baseTime.plusSeconds(120)));
        events.add(createBall(innings, 1, 5, rohit, starc, 4, 0, null, false, null, null, baseTime.plusSeconds(150)));
        events.add(createBall(innings, 1, 6, rohit, starc, 0, 0, null, false, null, null, baseTime.plusSeconds(180)));

        events.add(createBall(innings, 2, 1, virat, hazlewood, 1, 0, null, false, null, null, baseTime.plusSeconds(210)));
        events.add(createBall(innings, 2, 2, rohit, hazlewood, 2, 0, null, false, null, null, baseTime.plusSeconds(240)));
        events.add(createBall(innings, 2, 3, rohit, hazlewood, 0, 0, null, false, null, null, baseTime.plusSeconds(270)));
        events.add(createBall(innings, 2, 4, rohit, hazlewood, 4, 0, null, false, null, null, baseTime.plusSeconds(300)));
        events.add(createBall(innings, 2, 5, rohit, hazlewood, 0, 0, null, true, WicketType.BOWLED, rohit, baseTime.plusSeconds(330)));
        events.add(createBall(innings, 2, 6, pant, hazlewood, 1, 0, null, false, null, null, baseTime.plusSeconds(360)));

        // Rishabh Pant: 12 (10b) dismissed caught by Cummins
        events.add(createBall(innings, 3, 1, pant, cummins, 4, 0, null, false, null, null, baseTime.plusSeconds(390)));
        events.add(createBall(innings, 3, 2, pant, cummins, 1, 0, null, false, null, null, baseTime.plusSeconds(420)));
        events.add(createBall(innings, 3, 3, virat, cummins, 2, 0, null, false, null, null, baseTime.plusSeconds(450)));
        events.add(createBall(innings, 3, 4, virat, cummins, 0, 0, null, false, null, null, baseTime.plusSeconds(480)));
        events.add(createBall(innings, 3, 5, virat, cummins, 4, 0, null, false, null, null, baseTime.plusSeconds(510)));
        events.add(createBall(innings, 3, 6, virat, cummins, 1, 0, null, false, null, null, baseTime.plusSeconds(540)));

        events.add(createBall(innings, 4, 1, pant, zampa, 2, 0, null, false, null, null, baseTime.plusSeconds(570)));
        events.add(createBall(innings, 4, 2, pant, zampa, 0, 0, null, false, null, null, baseTime.plusSeconds(600)));
        events.add(createBall(innings, 4, 3, pant, zampa, 4, 0, null, false, null, null, baseTime.plusSeconds(630)));
        events.add(createBall(innings, 4, 4, pant, zampa, 1, 0, null, false, null, null, baseTime.plusSeconds(660)));
        events.add(createBall(innings, 4, 5, virat, zampa, 1, 0, null, false, null, null, baseTime.plusSeconds(690)));
        events.add(createBall(innings, 4, 6, pant, zampa, 0, 0, null, true, WicketType.CAUGHT, pant, baseTime.plusSeconds(720)));

        // Hardik Pandya: 8 (6b) dismissed LBW by Zampa
        events.add(createBall(innings, 5, 1, hardik, hazlewood, 1, 0, null, false, null, null, baseTime.plusSeconds(750)));
        events.add(createBall(innings, 5, 2, virat, hazlewood, 4, 0, null, false, null, null, baseTime.plusSeconds(780)));
        events.add(createBall(innings, 5, 3, virat, hazlewood, 1, 0, null, false, null, null, baseTime.plusSeconds(810)));
        events.add(createBall(innings, 5, 4, hardik, hazlewood, 4, 0, null, false, null, null, baseTime.plusSeconds(840)));
        events.add(createBall(innings, 5, 5, hardik, hazlewood, 2, 0, null, false, null, null, baseTime.plusSeconds(870)));
        events.add(createBall(innings, 5, 6, hardik, hazlewood, 1, 0, null, false, null, null, baseTime.plusSeconds(900)));

        events.add(createBall(innings, 6, 1, hardik, zampa, 0, 0, null, true, WicketType.LBW, hardik, baseTime.plusSeconds(930)));
        events.add(createBall(innings, 6, 2, surya, zampa, 1, 0, null, false, null, null, baseTime.plusSeconds(960)));
        events.add(createBall(innings, 6, 3, virat, zampa, 2, 0, null, false, null, null, baseTime.plusSeconds(990)));
        events.add(createBall(innings, 6, 4, virat, zampa, 1, 0, null, false, null, null, baseTime.plusSeconds(1020)));
        events.add(createBall(innings, 6, 5, surya, zampa, 4, 0, null, false, null, null, baseTime.plusSeconds(1050)));
        events.add(createBall(innings, 6, 6, surya, zampa, 1, 0, null, false, null, null, baseTime.plusSeconds(1080)));

        // Middle overs consolidation: Virat & Surya partnership
        // Let's create realistic bulk balls from over 7 to 15
        for (int ov = 7; ov <= 15; ov++) {
            Player bowler = (ov % 3 == 0) ? cummins : (ov % 2 == 0 ? zampa : hazlewood);
            for (int b = 1; b <= 6; b++) {
                Player striker = (b % 2 == 1) ? virat : surya;
                int runs = (b == 3 && ov % 2 == 0) ? 4 : (b == 5 ? 2 : 1);
                if (b == 6 && ov == 12) runs = 6; // Virat six
                if (b == 4 && ov == 14) runs = 6; // Surya six
                events.add(createBall(innings, ov, b, striker, bowler, runs, 0, null, false, null, null, baseTime.plusSeconds(ov * 60 + b * 5)));
            }
        }

        // Over 16: Bowled by Pat Cummins
        events.add(createBall(innings, 16, 1, virat, cummins, 1, 0, null, false, null, null, LocalDateTime.now().minusSeconds(120)));
        events.add(createBall(innings, 16, 2, surya, cummins, 4, 0, null, false, null, null, LocalDateTime.now().minusSeconds(100)));
        events.add(createBall(innings, 16, 3, surya, cummins, 0, 0, null, false, null, null, LocalDateTime.now().minusSeconds(85)));
        events.add(createBall(innings, 16, 4, surya, cummins, 2, 0, null, false, null, null, LocalDateTime.now().minusSeconds(70)));
        events.add(createBall(innings, 16, 5, surya, cummins, 1, 0, null, false, null, null, LocalDateTime.now().minusSeconds(55)));
        events.add(createBall(innings, 16, 6, virat, cummins, 6, 0, null, false, null, null, LocalDateTime.now().minusSeconds(40)));

        // Over 17 (3 balls bowled so far -> 16.3 overs): Bowled by Mitchell Starc (Recent balls: 1, 4, 1)
        events.add(createBall(innings, 17, 1, virat, starc, 1, 0, null, false, null, null, LocalDateTime.now().minusSeconds(25)));
        events.add(createBall(innings, 17, 2, surya, starc, 4, 0, null, false, null, null, LocalDateTime.now().minusSeconds(15)));
        events.add(createBall(innings, 17, 3, surya, starc, 1, 0, null, false, null, null, LocalDateTime.now().minusSeconds(5)));

        ballEventRepository.saveAll(events);
    }

    private void seedAusInningsBalls(Innings innings, List<Player> ausSquad, List<Player> indSquad) {
        Player head = ausSquad.get(0);
        Player warner = ausSquad.get(1);
        Player marsh = ausSquad.get(2);
        Player maxwell = ausSquad.get(3);
        Player stoinis = ausSquad.get(4);

        Player bumrah = indSquad.get(8);
        Player siraj = indSquad.get(9);
        Player kuldeep = indSquad.get(7);

        List<BallEvent> events = new ArrayList<>();
        LocalDateTime baseTime = LocalDateTime.now().minusHours(2);

        // Travis Head 54 (32b, 6x4, 2x6)
        // Mitchell Marsh 48 (28b, 4x4, 3x6)
        // Glenn Maxwell 35 (18b, 3x4, 2x6)
        events.add(createBall(innings, 1, 1, head, bumrah, 4, 0, null, false, null, null, baseTime.plusSeconds(10)));
        events.add(createBall(innings, 1, 2, head, bumrah, 0, 0, null, false, null, null, baseTime.plusSeconds(20)));
        events.add(createBall(innings, 1, 3, head, bumrah, 1, 0, null, false, null, null, baseTime.plusSeconds(30)));
        events.add(createBall(innings, 1, 4, warner, bumrah, 0, 0, null, true, WicketType.BOWLED, warner, baseTime.plusSeconds(40)));
        events.add(createBall(innings, 1, 5, marsh, bumrah, 1, 0, null, false, null, null, baseTime.plusSeconds(50)));
        events.add(createBall(innings, 1, 6, head, bumrah, 4, 0, null, false, null, null, baseTime.plusSeconds(60)));

        events.add(createBall(innings, 2, 1, marsh, siraj, 6, 0, null, false, null, null, baseTime.plusSeconds(70)));
        events.add(createBall(innings, 2, 2, marsh, siraj, 1, 0, null, false, null, null, baseTime.plusSeconds(80)));
        events.add(createBall(innings, 2, 3, head, siraj, 4, 0, null, false, null, null, baseTime.plusSeconds(90)));
        events.add(createBall(innings, 2, 4, head, siraj, 1, 0, null, false, null, null, baseTime.plusSeconds(100)));
        events.add(createBall(innings, 2, 5, marsh, siraj, 0, 0, null, false, null, null, baseTime.plusSeconds(110)));
        events.add(createBall(innings, 2, 6, marsh, siraj, 4, 0, null, false, null, null, baseTime.plusSeconds(120)));

        events.add(createBall(innings, 3, 1, head, kuldeep, 1, 0, null, false, null, null, baseTime.plusSeconds(130)));
        events.add(createBall(innings, 3, 2, marsh, kuldeep, 6, 0, null, false, null, null, baseTime.plusSeconds(140)));
        events.add(createBall(innings, 3, 3, marsh, kuldeep, 1, 0, null, false, null, null, baseTime.plusSeconds(150)));
        events.add(createBall(innings, 3, 4, head, kuldeep, 6, 0, null, false, null, null, baseTime.plusSeconds(160)));
        events.add(createBall(innings, 3, 5, head, kuldeep, 0, 0, null, true, WicketType.CAUGHT, head, baseTime.plusSeconds(170)));
        events.add(createBall(innings, 3, 6, maxwell, kuldeep, 1, 0, null, false, null, null, baseTime.plusSeconds(180)));

        events.add(createBall(innings, 4, 1, maxwell, bumrah, 4, 0, null, false, null, null, baseTime.plusSeconds(190)));
        events.add(createBall(innings, 4, 2, maxwell, bumrah, 6, 0, null, false, null, null, baseTime.plusSeconds(200)));
        events.add(createBall(innings, 4, 3, maxwell, bumrah, 0, 0, null, true, WicketType.LBW, maxwell, baseTime.plusSeconds(210)));
        events.add(createBall(innings, 4, 4, stoinis, bumrah, 1, 0, null, false, null, null, baseTime.plusSeconds(220)));
        events.add(createBall(innings, 4, 5, marsh, bumrah, 1, 0, null, false, null, null, baseTime.plusSeconds(230)));
        events.add(createBall(innings, 4, 6, stoinis, bumrah, 2, 0, null, false, null, null, baseTime.plusSeconds(240)));

        ballEventRepository.saveAll(events);
    }

    private void seedEngInningsBalls(Innings innings, List<Player> engSquad, List<Player> ausSquad) {
        Player buttler = engSquad.get(0);
        Player salt = engSquad.get(1);
        Player brook = engSquad.get(3);
        Player starc = ausSquad.get(8);
        Player cummins = ausSquad.get(7);

        List<BallEvent> events = new ArrayList<>();
        LocalDateTime baseTime = LocalDateTime.now().minusDays(2);

        events.add(createBall(innings, 1, 1, buttler, starc, 4, 0, null, false, null, null, baseTime.plusSeconds(10)));
        events.add(createBall(innings, 1, 2, buttler, starc, 6, 0, null, false, null, null, baseTime.plusSeconds(20)));
        events.add(createBall(innings, 1, 3, buttler, starc, 1, 0, null, false, null, null, baseTime.plusSeconds(30)));
        events.add(createBall(innings, 1, 4, salt, starc, 0, 0, null, true, WicketType.CAUGHT, salt, baseTime.plusSeconds(40)));
        events.add(createBall(innings, 1, 5, brook, starc, 4, 0, null, false, null, null, baseTime.plusSeconds(50)));
        events.add(createBall(innings, 1, 6, brook, starc, 1, 0, null, false, null, null, baseTime.plusSeconds(60)));

        events.add(createBall(innings, 2, 1, brook, cummins, 2, 0, null, false, null, null, baseTime.plusSeconds(70)));
        events.add(createBall(innings, 2, 2, brook, cummins, 4, 0, null, false, null, null, baseTime.plusSeconds(80)));
        events.add(createBall(innings, 2, 3, brook, cummins, 1, 0, null, false, null, null, baseTime.plusSeconds(90)));
        events.add(createBall(innings, 2, 4, buttler, cummins, 6, 0, null, false, null, null, baseTime.plusSeconds(100)));
        events.add(createBall(innings, 2, 5, buttler, cummins, 0, 0, null, false, null, null, baseTime.plusSeconds(110)));
        events.add(createBall(innings, 2, 6, buttler, cummins, 1, 0, null, false, null, null, baseTime.plusSeconds(120)));

        ballEventRepository.saveAll(events);
    }

    private void seedAusChaseBalls(Innings innings, List<Player> ausSquad, List<Player> engSquad) {
        Player head = ausSquad.get(0);
        Player warner = ausSquad.get(1);
        Player archer = engSquad.get(8);
        Player rashid = engSquad.get(9);

        List<BallEvent> events = new ArrayList<>();
        LocalDateTime baseTime = LocalDateTime.now().minusDays(2).plusHours(2);

        events.add(createBall(innings, 1, 1, head, archer, 4, 0, null, false, null, null, baseTime.plusSeconds(10)));
        events.add(createBall(innings, 1, 2, head, archer, 4, 0, null, false, null, null, baseTime.plusSeconds(20)));
        events.add(createBall(innings, 1, 3, head, archer, 6, 0, null, false, null, null, baseTime.plusSeconds(30)));
        events.add(createBall(innings, 1, 4, head, archer, 1, 0, null, false, null, null, baseTime.plusSeconds(40)));
        events.add(createBall(innings, 1, 5, warner, archer, 1, 0, null, false, null, null, baseTime.plusSeconds(50)));
        events.add(createBall(innings, 1, 6, head, archer, 0, 0, null, false, null, null, baseTime.plusSeconds(60)));

        events.add(createBall(innings, 2, 1, warner, rashid, 2, 0, null, false, null, null, baseTime.plusSeconds(70)));
        events.add(createBall(innings, 2, 2, warner, rashid, 4, 0, null, false, null, null, baseTime.plusSeconds(80)));
        events.add(createBall(innings, 2, 3, warner, rashid, 1, 0, null, false, null, null, baseTime.plusSeconds(90)));
        events.add(createBall(innings, 2, 4, head, rashid, 6, 0, null, false, null, null, baseTime.plusSeconds(100)));
        events.add(createBall(innings, 2, 5, head, rashid, 1, 0, null, false, null, null, baseTime.plusSeconds(110)));
        events.add(createBall(innings, 2, 6, warner, rashid, 4, 0, null, false, null, null, baseTime.plusSeconds(120)));

        ballEventRepository.saveAll(events);
    }

    private BallEvent createBall(Innings innings, int over, int ball, Player bat, Player bowl,
                                 int runs, int extras, ExtraType extraType, boolean wicket,
                                 WicketType wicketType, Player dismissed, LocalDateTime time) {
        return BallEvent.builder()
                .innings(innings)
                .overNumber(over)
                .ballNumber(ball)
                .batsman(bat)
                .bowler(bowl)
                .runsOffBat(runs)
                .extras(extras)
                .extraType(extraType)
                .wicket(wicket)
                .wicketType(wicketType)
                .dismissedPlayer(dismissed)
                .timestamp(time)
                .build();
    }
}
