package com.h2o.app.repository;

import com.h2o.app.entity.CustomerOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface OrderRepository extends JpaRepository<CustomerOrder, Long> {
    List<CustomerOrder> findAllByOrderByIdDesc();
    List<CustomerOrder> findByCustomerEmailOrderByIdDesc(String customerEmail);
}
