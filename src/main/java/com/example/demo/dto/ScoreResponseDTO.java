package com.example.demo.dto;

import com.example.demo.entity.MatchStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ScoreResponseDTO {
    private Long matchId;
    private Long inningsId;
    private Integer inningsNumber;
    private String team; // Current batting team name (as specified in requirement #14)
    private String battingTeam;
    private String bowlingTeam;
    private Integer runs;
    private Integer wickets;
    private String overs; // e.g. "16.3"
    private Double runRate; // e.g. 8.78
    private Integer extras;
    private Integer target;
    private Integer requiredRuns;
    private Integer requiredBalls;
    private Double requiredRunRate;
    private MatchStatus status;
    private String tossMessage;
    private String matchResult;
}
