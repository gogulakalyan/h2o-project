package com.h2o.app.repository;

import com.h2o.app.entity.Tanker;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TankerRepository extends JpaRepository<Tanker, Long> {
    List<Tanker> findByCityIgnoreCaseAndUsageTypeIgnoreCaseAndAvailableTrue(String city, String usageType);
}
