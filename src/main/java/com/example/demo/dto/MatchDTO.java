package com.example.demo.dto;

import com.example.demo.entity.MatchStatus;
import com.example.demo.entity.MatchType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MatchDTO {
    private Long id;
    private TeamDTO team1;
    private TeamDTO team2;
    private String venue;
    private LocalDateTime matchDate;
    private MatchType matchType;
    private MatchStatus status;
    private Integer totalOvers;
    private TeamDTO tossWinner;
    private String tossDecision;
    private ScoreResponseDTO currentScore;
    private String statusDescription;
}
