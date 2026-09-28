package com.example.demo.dto;

import com.example.demo.entity.ExtraType;
import com.example.demo.entity.WicketType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BallEventRequestDTO {
    private Integer overNumber;
    private Integer ballNumber;
    private Long batsmanId;
    private Long bowlerId;
    private Integer runsOffBat;
    private Integer extras;
    private ExtraType extraType;
    private Boolean wicket;
    private WicketType wicketType;
    private Long dismissedPlayerId;
}
