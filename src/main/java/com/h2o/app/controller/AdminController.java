package com.h2o.app.controller;

import com.h2o.app.dto.DriverAssignRequest;
import com.h2o.app.dto.StatusUpdateRequest;
import com.h2o.app.entity.CustomerOrder;
import com.h2o.app.entity.Product;
import com.h2o.app.repository.OrderRepository;
import com.h2o.app.repository.ProductRepository;
import com.h2o.app.repository.TankerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin
public class AdminController {
    @Autowired private OrderRepository orderRepository;
    @Autowired private ProductRepository productRepository;
    @Autowired private TankerRepository tankerRepository;

    @GetMapping("/orders")
    public List<CustomerOrder> orders() {
        return orderRepository.findAllByOrderByIdDesc();
    }

    @PutMapping("/orders/{id}/status")
    public CustomerOrder updateStatus(@PathVariable Long id, @RequestBody StatusUpdateRequest request) {
        CustomerOrder order = orderRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));
        order.setOrderStatus(request.getOrderStatus());
        if ("DELIVERED".equalsIgnoreCase(request.getOrderStatus()) && "ONLINE".equalsIgnoreCase(order.getPaymentMethod())) {
            order.setPaymentStatus("PAID");
        }
        if ("DELIVERED".equalsIgnoreCase(request.getOrderStatus()) && "COD".equalsIgnoreCase(order.getPaymentMethod())) {
            order.setPaymentStatus("PAID_AT_DELIVERY");
        }
        return orderRepository.save(order);
    }

    @PutMapping("/orders/{id}/assign-driver")
    public CustomerOrder assignDriver(@PathVariable Long id, @RequestBody DriverAssignRequest request) {
        CustomerOrder order = orderRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));
        order.setDriverName(request.getDriverName());
        order.setDriverPhone(request.getDriverPhone());
        order.setVehicleNumber(request.getVehicleNumber());
        return orderRepository.save(order);
    }

    @GetMapping("/analytics")
    public Map<String, Object> analytics() {
        List<CustomerOrder> orders = orderRepository.findAll();
        Map<String, Object> map = new HashMap<>();
        map.put("totalRevenue", orders.stream().mapToDouble(o -> o.getTotalPrice() == null ? 0 : o.getTotalPrice()).sum());
        map.put("totalOrders", orders.size());
        map.put("totalTankers", tankerRepository.count());
        map.put("totalProducts", productRepository.count());
        map.put("tankerOrders", orders.stream().filter(o -> "TANKER".equalsIgnoreCase(o.getServiceType())).count());
        map.put("drinkingWaterOrders", orders.stream().filter(o -> "DRINKING_WATER".equalsIgnoreCase(o.getServiceType())).count());
        map.put("softDrinkOrders", orders.stream().filter(o -> "SOFT_DRINK".equalsIgnoreCase(o.getServiceType())).count());
        map.put("paidOrders", orders.stream().filter(o -> o.getPaymentStatus() != null && o.getPaymentStatus().startsWith("PAID")).count());
        return map;
    }

    @PostMapping("/products")
    public Product addProduct(@RequestBody Product product) {
        if (product.getAvailable() == null) product.setAvailable(true);
        return productRepository.save(product);
    }
}
