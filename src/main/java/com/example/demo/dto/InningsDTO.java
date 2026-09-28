package com.example.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InningsDTO {
    private Long id;
    private Long matchId;
    private Long battingTeamId;
    private String battingTeamName;
    private Long bowlingTeamId;
    private String bowlingTeamName;
    private Integer inningsNumber;
    private Integer totalRuns;
    private Integer wickets;
    private Integer legalBalls;
    private String overs;
    private Double runRate;
    private Integer extras;
    private Boolean isCompleted;
}
