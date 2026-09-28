package com.example.demo.dto;

import com.example.demo.entity.PlayerRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlayerDTO {
    private Long id;
    private String playerName;
    private PlayerRole role;
    private Integer jerseyNumber;
    private Long teamId;
    private String teamName;
}
