package com.quantumchat.repository;

import com.quantumchat.entity.BenchmarkRun;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface BenchmarkRunRepository extends JpaRepository<BenchmarkRun, UUID> {
    List<BenchmarkRun> findTop30ByOrderByCreatedAtDesc();
    List<BenchmarkRun> findByUserIdOrderByCreatedAtDesc(UUID userId);
}
