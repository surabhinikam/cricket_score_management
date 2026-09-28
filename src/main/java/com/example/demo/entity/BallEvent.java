package com.example.demo.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "ball_events")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BallEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "innings_id", nullable = false)
    private Innings innings;

    @Column(nullable = false)
    private Integer overNumber;

    @Column(nullable = false)
    private Integer ballNumber;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "batsman_id", nullable = false)
    private Player batsman;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "bowler_id", nullable = false)
    private Player bowler;

    @Column(nullable = false)
    @Builder.Default
    private Integer runsOffBat = 0;

    @Column(nullable = false)
    @Builder.Default
    private Integer extras = 0;

    @Enumerated(EnumType.STRING)
    private ExtraType extraType;

    @Column(nullable = false)
    @Builder.Default
    private Boolean wicket = false;

    @Enumerated(EnumType.STRING)
    private WicketType wicketType;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "dismissed_player_id")
    private Player dismissedPlayer;

    private LocalDateTime timestamp;
}
