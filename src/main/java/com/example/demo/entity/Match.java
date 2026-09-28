package com.example.demo.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "matches")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Match {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "team1_id", nullable = false)
    private Team team1;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "team2_id", nullable = false)
    private Team team2;

    @Column(nullable = false)
    private String venue;

    private LocalDateTime matchDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MatchType matchType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MatchStatus status;

    @Column(nullable = false)
    private Integer totalOvers;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "toss_winner_id")
    private Team tossWinner;

    private String tossDecision; // "BAT" or "BOWL"
}
