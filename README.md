# H2O Final Project

Features included:
- Signup and login
- Tanker booking (Residential / Commercial)
- Drinking water ordering
- Soft drinks ordering
- COD and online payment hook
- Order placement with pricing and status
- Order tracking by order ID
- My orders view by logged-in email
- Admin dashboard analytics
- Admin order status updates
- Admin driver assignment
- Admin inventory add product
- Availability and stock handling

## Run

```bash
mvn spring-boot:run
```

Open:
- http://localhost:8080
- http://localhost:8080/admin.html
- http://localhost:8080/h2-console

H2 console:
- JDBC URL: `jdbc:h2:mem:h2odb`
- User: `sa`
- Password: leave blank

Demo admin:
- Email: `admin@h2o.com`
- Password: `admin123`
