package com.h2o.app.controller;

import com.h2o.app.entity.*;
import com.h2o.app.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin
public class OrderController {
    @Autowired private OrderRepository orderRepository;
    @Autowired private TankerRepository tankerRepository;
    @Autowired private ProductRepository productRepository;

    @PostMapping
    public CustomerOrder placeOrder(@RequestBody CustomerOrder order) {
        if (order.getQuantity() == null || order.getQuantity() < 1) order.setQuantity(1);
        order.setOrderStatus("PENDING");
        if (order.getPaymentMethod() == null || order.getPaymentMethod().isBlank()) order.setPaymentMethod("COD");
        order.setPaymentStatus("ONLINE".equalsIgnoreCase(order.getPaymentMethod()) ? "INITIATED" : "PENDING_AT_DELIVERY");

        if ("TANKER".equalsIgnoreCase(order.getServiceType())) {
            Tanker tanker = tankerRepository.findById(order.getItemId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tanker not found"));
            if (Boolean.FALSE.equals(tanker.getAvailable())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tanker unavailable");
            }
            order.setItemName(tanker.getCapacityLitres() + " Litres Tanker");
            order.setTotalPrice(tanker.getPrice() * order.getQuantity());
            order.setDriverName(tanker.getDriverName());
            order.setDriverPhone(tanker.getDriverPhone());
            order.setVehicleNumber(tanker.getVehicleNumber());
        } else {
            Product product = productRepository.findById(order.getItemId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));
            if (Boolean.FALSE.equals(product.getAvailable()) || product.getStock() < order.getQuantity()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Product unavailable or insufficient stock");
            }
            product.setStock(product.getStock() - order.getQuantity());
            if (product.getStock() <= 0) product.setAvailable(false);
            productRepository.save(product);
            order.setItemName(product.getName());
            order.setTotalPrice(product.getPrice() * order.getQuantity());
        }
        return orderRepository.save(order);
    }

    @GetMapping("/{id}")
    public CustomerOrder getOrder(@PathVariable Long id) {
        return orderRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));
    }

    @GetMapping
    public List<CustomerOrder> myOrders(@RequestParam(required = false) String email) {
        if (email != null && !email.isBlank()) {
            return orderRepository.findByCustomerEmailOrderByIdDesc(email);
        }
        return orderRepository.findAllByOrderByIdDesc();
    }
}
