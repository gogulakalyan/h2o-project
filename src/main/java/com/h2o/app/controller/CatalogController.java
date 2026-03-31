package com.h2o.app.controller;

import com.h2o.app.entity.Product;
import com.h2o.app.entity.Tanker;
import com.h2o.app.repository.ProductRepository;
import com.h2o.app.repository.TankerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/catalog")
@CrossOrigin
public class CatalogController {

    @Autowired
    private TankerRepository tankerRepository;

    @Autowired
    private ProductRepository productRepository;

    @GetMapping("/tankers")
    public List<Tanker> tankers(@RequestParam String city,
                                @RequestParam String location,
                                @RequestParam String usageType) {

        String key = location.trim().toLowerCase();

        List<Tanker> filteredTankers = tankerRepository
                .findByCityIgnoreCaseAndUsageTypeIgnoreCaseAndAvailableTrue(city, usageType)
                .stream()
                .filter(t ->
                        (t.getArea() != null && t.getArea().toLowerCase().contains(key)) ||
                        (t.getPincode() != null && t.getPincode().contains(location.trim()))
                )
                .toList();

        // If no exact area match, show all available tankers in that city
        if (filteredTankers.isEmpty()) {
            return tankerRepository
                    .findByCityIgnoreCaseAndUsageTypeIgnoreCaseAndAvailableTrue(city, usageType);
        }

        return filteredTankers;
    }

    @GetMapping("/products")
    public List<Product> products(@RequestParam String city,
                                  @RequestParam String location,
                                  @RequestParam String serviceType) {

        String key = location.trim().toLowerCase();

        List<Product> filteredProducts = productRepository
                .findByCityIgnoreCaseAndServiceTypeIgnoreCaseAndAvailableTrue(city, serviceType)
                .stream()
                .filter(p ->
                        (p.getArea() != null && p.getArea().toLowerCase().contains(key)) ||
                        (p.getPincode() != null && p.getPincode().contains(location.trim()))
                )
                .toList();

        // If no exact area match, show all available products in city
        if (filteredProducts.isEmpty()) {
            return productRepository
                    .findByCityIgnoreCaseAndServiceTypeIgnoreCaseAndAvailableTrue(city, serviceType);
        }

        return filteredProducts;
    }
}