package com.example.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BowlingStatDTO {
    private Long playerId;
    private String playerName;
    private String overs; // e.g. "3.3"
    private Integer legalBalls;
    private Integer maidens;
    private Integer runsConceded;
    private Integer wickets;
    private Double economy;
}
