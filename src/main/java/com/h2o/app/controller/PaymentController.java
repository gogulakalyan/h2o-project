package com.h2o.app.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/payments")
@CrossOrigin
public class PaymentController {
    @Value("${razorpay.key-id:}")
    private String razorpayKeyId;

    @GetMapping("/config")
    public Map<String, Object> config() {
        Map<String, Object> map = new HashMap<>();
        map.put("enabled", razorpayKeyId != null && !razorpayKeyId.isBlank());
        map.put("keyId", razorpayKeyId == null ? "" : razorpayKeyId);
        return map;
    }

    @PostMapping("/create-order")
    public Map<String, Object> createOrder(@RequestBody Map<String, Object> payload) {
        Map<String, Object> map = new HashMap<>();
        map.put("amount", 10000);
        map.put("status", "CREATED");
        return map;
    }
}
