package com.example.demo.dto;

import com.example.demo.entity.ExtraType;
import com.example.demo.entity.WicketType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BallEventResponseDTO {
    private Long id;
    private Long inningsId;
    private Integer overNumber;
    private Integer ballNumber;
    private Long batsmanId;
    private String batsmanName;
    private Long bowlerId;
    private String bowlerName;
    private Integer runsOffBat;
    private Integer extras;
    private ExtraType extraType;
    private Boolean wicket;
    private WicketType wicketType;
    private String dismissedPlayerName;
    private String displayText; // e.g., "0", "1", "4", "6", "W", "1wd", "1nb", "2b", "1lb"
    private LocalDateTime timestamp;
}
