package com.example.demo.dto;

import com.example.demo.entity.MatchType;
import com.example.demo.entity.MatchStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MatchRequestDTO {
    private Long team1Id;
    private Long team2Id;
    private String venue;
    private LocalDateTime matchDate;
    private MatchType matchType;
    private Integer totalOvers;
    private Long tossWinnerId;
    private String tossDecision; // "BAT" or "BOWL"
}
