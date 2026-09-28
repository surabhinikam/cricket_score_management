package com.example.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InningsScorecardDTO {
    private Long inningsId;
    private Integer inningsNumber;
    private Long battingTeamId;
    private String battingTeamName;
    private Long bowlingTeamId;
    private String bowlingTeamName;
    private Integer totalRuns;
    private Integer wickets;
    private String overs;
    private Double runRate;
    private Integer extras;
    private Boolean isCompleted;
    private List<BattingStatDTO> battingStats;
    private List<BowlingStatDTO> bowlingStats;
    private List<String> recentBalls;
}
