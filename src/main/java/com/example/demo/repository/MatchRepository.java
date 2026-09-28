package com.example.demo.repository;

import com.example.demo.entity.Match;
import com.example.demo.entity.MatchStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MatchRepository extends JpaRepository<Match, Long> {
    List<Match> findByStatus(MatchStatus status);
    List<Match> findAllByOrderByMatchDateDesc();
}
