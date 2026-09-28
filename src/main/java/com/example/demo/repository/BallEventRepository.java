package com.example.demo.repository;

import com.example.demo.entity.BallEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BallEventRepository extends JpaRepository<BallEvent, Long> {
    List<BallEvent> findByInningsIdOrderByOverNumberAscBallNumberAsc(Long inningsId);
    List<BallEvent> findByInningsIdOrderByTimestampAsc(Long inningsId);
    List<BallEvent> findTop12ByInningsIdOrderByTimestampDesc(Long inningsId);
    List<BallEvent> findByInningsId(Long inningsId);
}
