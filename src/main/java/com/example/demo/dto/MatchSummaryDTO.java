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
public class MatchSummaryDTO {
    private Long matchId;
    private String matchTitle;
    private String venue;
    private MatchStatus status;
    private String team1Name;
    private String team1Score;
    private String team2Name;
    private String team2Score;
    private String result;
    private String tossMessage;
    private String topBatsman;
    private String topBowler;
}
