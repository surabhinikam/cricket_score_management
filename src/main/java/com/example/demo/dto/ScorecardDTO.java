package com.example.demo.dto;

import com.example.demo.entity.MatchStatus;
import com.example.demo.entity.MatchType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ScorecardDTO {
    private Long matchId;
    private String matchTitle;
    private MatchStatus status;
    private String venue;
    private MatchType matchType;
    private Integer totalOvers;
    private String tossMessage;
    private String result;
    private List<InningsScorecardDTO> inningsList;
}
