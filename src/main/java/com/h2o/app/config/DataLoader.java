package com.h2o.app.config;

import com.h2o.app.entity.*;
import com.h2o.app.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DataLoader {

    @Bean
    CommandLineRunner seedData(UserRepository userRepository,
                               TankerRepository tankerRepository,
                               ProductRepository productRepository) {
        return args -> {
            if (userRepository.count() == 0) {
                User admin = new User();
                admin.setName("Admin");
                admin.setEmail("admin@h2o.com");
                admin.setPhone("9000000000");
                admin.setPassword("admin123");
                admin.setRole("ADMIN");
                userRepository.save(admin);
            }

            if (tankerRepository.count() == 0) {
                tankerRepository.save(makeTanker("Hyderabad", "Kukatpally", "500072", "RESIDENTIAL", 5000, 1200.0, true, "Ramesh", "9876501111", "TS09AB1234"));
                tankerRepository.save(makeTanker("Hyderabad", "Kukatpally", "500072", "COMMERCIAL", 12000, 2800.0, true, "Mahesh", "9876502222", "TS09CD5678"));
                tankerRepository.save(makeTanker("Hyderabad", "Madhapur", "500081", "RESIDENTIAL", 6000, 1500.0, true, "Ravi", "9876503333", "TS09EF9988"));
            }

            if (productRepository.count() == 0) {
                productRepository.save(makeProduct("Hyderabad", "Kukatpally", "500072", "Kinley", "20L Water Can", "1 can", 90.0, 120, true, "DRINKING_WATER"));
                productRepository.save(makeProduct("Hyderabad", "Kukatpally", "500072", "Tata Copper+", "1L Bottle Pack", "12 bottles", 240.0, 60, true, "DRINKING_WATER"));
                productRepository.save(makeProduct("Hyderabad", "Madhapur", "500081", "Coca-Cola", "Soft Drink Crate", "24 bottles", 720.0, 30, true, "SOFT_DRINK"));
                productRepository.save(makeProduct("Hyderabad", "Kukatpally", "500072", "Thums Up", "Party Pack", "12 bottles", 480.0, 40, true, "SOFT_DRINK"));
            }
        };
    }

    private Tanker makeTanker(String city, String area, String pincode, String usageType, int litres, double price, boolean available,
                              String driverName, String driverPhone, String vehicle) {
        Tanker t = new Tanker();
        t.setCity(city);
        t.setArea(area);
        t.setPincode(pincode);
        t.setUsageType(usageType);
        t.setCapacityLitres(litres);
        t.setPrice(price);
        t.setAvailable(available);
        t.setDriverName(driverName);
        t.setDriverPhone(driverPhone);
        t.setVehicleNumber(vehicle);
        return t;
    }

    private Product makeProduct(String city, String area, String pincode, String brand, String name, String unit, double price,
                                int stock, boolean available, String serviceType) {
        Product p = new Product();
        p.setCity(city);
        p.setArea(area);
        p.setPincode(pincode);
        p.setBrand(brand);
        p.setName(name);
        p.setUnit(unit);
        p.setPrice(price);
        p.setStock(stock);
        p.setAvailable(available);
        p.setServiceType(serviceType);
        return p;
    }
}
