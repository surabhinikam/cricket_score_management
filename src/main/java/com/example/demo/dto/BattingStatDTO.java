package com.example.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BattingStatDTO {
    private Long playerId;
    private String playerName;
    private Integer runs;
    private Integer balls;
    private Integer fours;
    private Integer sixes;
    private Double strikeRate;
    private Boolean isOut;
    private String dismissalInfo; // e.g. "not out", "b Starc", "c Smith b Cummins", "run out"
}
