package com.example.demo.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "innings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Innings {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "match_id", nullable = false)
    private Match match;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "batting_team_id", nullable = false)
    private Team battingTeam;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "bowling_team_id", nullable = false)
    private Team bowlingTeam;

    @Column(nullable = false)
    private Integer inningsNumber; // 1 or 2

    @Column(nullable = false)
    @Builder.Default
    private Integer totalRuns = 0;

    @Column(nullable = false)
    @Builder.Default
    private Integer wickets = 0;

    @Column(nullable = false)
    @Builder.Default
    private Integer legalBalls = 0;

    @Column(nullable = false)
    @Builder.Default
    private Integer extras = 0;

    @Column(nullable = false)
    @Builder.Default
    private Boolean isCompleted = false;
}
