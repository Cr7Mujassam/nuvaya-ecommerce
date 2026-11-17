package com.nuvaya.config;

import com.nuvaya.entity.*;
import com.nuvaya.entity.enums.*;
import com.nuvaya.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.util.List;

@Component @RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {
    private final AdminRepository adminRepository;
    private final ProductCategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final StoreSettingsRepository settingsRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${nuvaya.admin.default-username}") private String adminUser;
    @Value("${nuvaya.admin.default-password}") private String adminPass;
    @Value("${nuvaya.store.default-whatsapp}") private String whatsapp;

    @Override @Transactional
    public void run(String... args) {
        if (!adminRepository.existsByUsername(adminUser)) {
            adminRepository.save(Admin.builder().username(adminUser)
                    .passwordHash(passwordEncoder.encode(adminPass)).role("ROLE_ADMIN").active(true).build());
        }
        if (settingsRepository.count() == 0) {
            settingsRepository.save(StoreSettings.builder().id(1L).whatsappNumber(whatsapp)
                    .storeEmail("care@nuvaya.co.in").storePhone("+91 90000 00000")
                    .storeAddress("Narsingi, Hyderabad, Telangana, India")
                    .instagramUrl("https://instagram.com/nuvaya.in").facebookUrl("https://facebook.com/nuvaya.in")
                    .announcementText("Complimentary Pan-India Delivery on Orders Above ₹1,499 | Pack of 3 & 5 Bundles Live")
                    .defaultDeliveryCharge(new BigDecimal("60.00"))
                    .freeDeliveryThresholdEnabled(true).freeDeliveryThreshold(new BigDecimal("1499.00")).build());
        }
        if (categoryRepository.count() == 0) {
            List<String> cats = List.of("Hijabs", "Abayas", "Premium Hijabs", "Everyday Hijabs",
                    "Chiffon Hijabs", "Jersey Hijabs", "Cotton Hijabs", "Premium Abayas",
                    "Everyday Abayas", "Accessories", "New Arrivals", "Best Sellers");
            int ord = 1;
            for (String name : cats) {
                categoryRepository.save(ProductCategory.builder().name(name)
                        .slug(name.toLowerCase().replaceAll("[^a-z0-9]+", "-"))
                        .description("Curated " + name + " by NUVAYA.")
                        .active(true).displayOrder(ord++).build());
            }
        }
        if (productRepository.count() == 0) {
            ProductCategory jerseyCat = categoryRepository.findBySlug("jersey-hijabs").orElseThrow();
            ProductCategory chiffonCat = categoryRepository.findBySlug("chiffon-hijabs").orElseThrow();
            ProductCategory abayaCat = categoryRepository.findBySlug("premium-abayas").orElseThrow();

            Product p1 = Product.builder()
                    .name("Cloud-Soft Premium Jersey Hijab").slug("cloud-soft-premium-jersey-hijab").sku("NVY-HJ-JRS-001")
                    .description("Pin-free modal-cotton stretch jersey engineered for all-day breathability and effortless drape.")
                    .specifications("185cm x 72cm | 190 GSM | Opaque & Non-Slip")
                    .fabric("Modal Cotton Jersey").availableSizes(List.of("Standard (185x72 cm)")).category(jerseyCat)
                    .basePrice(new BigDecimal("349.00")).discountPrice(new BigDecimal("299.00")).stockQuantity(150)
                    .status(ProductStatus.ACTIVE).featured(true).newArrival(true).bestSeller(true)
                    .deliveryChargeType(DeliveryChargeType.PER_PACK_OPTION).deliveryChargeAmount(new BigDecimal("50.00")).build();
            p1.getColors().addAll(List.of(
                    ProductColor.builder().product(p1).name("Black").hexCode("#191817").displayOrder(1).build(),
                    ProductColor.builder().product(p1).name("Beige").hexCode("#D8C7B4").displayOrder(2).build(),
                    ProductColor.builder().product(p1).name("Mocha").hexCode("#7B5E4B").displayOrder(3).build(),
                    ProductColor.builder().product(p1).name("Olive").hexCode("#5E664B").displayOrder(4).build(),
                    ProductColor.builder().product(p1).name("Chocolate").hexCode("#432E24").displayOrder(5).build(),
                    ProductColor.builder().product(p1).name("Dusty Rose").hexCode("#C49492").displayOrder(6).build()
            ));
            p1.getImages().addAll(List.of(
                    ProductImage.builder().product(p1).colorName("Mocha").primaryImage(true).displayOrder(1)
                            .imageUrl("https://images.unsplash.com/photo-1583391733956-6c78276477e2?auto=format&fit=crop&w=900&q=80").build(),
                    ProductImage.builder().product(p1).colorName("Black").primaryImage(false).displayOrder(2)
                            .imageUrl("https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=900&q=80").build()
            ));
            p1.getPacks().addAll(List.of(
                    ProductPack.builder().product(p1).packName("Single Piece").pieceCount(1).packPrice(new BigDecimal("349.00"))
                            .discountPrice(new BigDecimal("299.00")).packDeliveryCharge(new BigDecimal("50.00")).allowMixedColors(false).stockQuantity(120).build(),
                    ProductPack.builder().product(p1).packName("Pack of 3").pieceCount(3).packPrice(new BigDecimal("1047.00"))
                            .discountPrice(new BigDecimal("799.00")).packDeliveryCharge(BigDecimal.ZERO).allowMixedColors(true).stockQuantity(80).build(),
                    ProductPack.builder().product(p1).packName("Pack of 5").pieceCount(5).packPrice(new BigDecimal("1745.00"))
                            .discountPrice(new BigDecimal("1299.00")).packDeliveryCharge(BigDecimal.ZERO).allowMixedColors(true).stockQuantity(60).build()
            ));
            productRepository.save(p1);

            Product p2 = Product.builder()
                    .name("Pearl Matte Chiffon Hijab").slug("pearl-matte-chiffon-hijab").sku("NVY-HJ-CHF-002")
                    .description("Featherlight crepe chiffon with rolled baby-hem edges that holds crisp pleats effortlessly.")
                    .specifications("190cm x 75cm | Lightweight Georgette Chiffon")
                    .fabric("Matte Crepe Chiffon").availableSizes(List.of("Standard")).category(chiffonCat)
                    .basePrice(new BigDecimal("299.00")).discountPrice(new BigDecimal("249.00")).stockQuantity(140)
                    .status(ProductStatus.ACTIVE).featured(true).newArrival(true).bestSeller(false)
                    .deliveryChargeType(DeliveryChargeType.FIXED_PER_PRODUCT).deliveryChargeAmount(new BigDecimal("49.00")).build();
            p2.getColors().addAll(List.of(
                    ProductColor.builder().product(p2).name("Warm Ivory").hexCode("#F6F1E9").displayOrder(1).build(),
                    ProductColor.builder().product(p2).name("Muted Rose").hexCode("#C99A98").displayOrder(2).build(),
                    ProductColor.builder().product(p2).name("Espresso").hexCode("#3C2A21").displayOrder(3).build()
            ));
            p2.getImages().add(ProductImage.builder().product(p2).colorName("Warm Ivory").primaryImage(true).displayOrder(1)
                    .imageUrl("https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80").build());
            p2.getPacks().addAll(List.of(
                    ProductPack.builder().product(p2).packName("Single Piece").pieceCount(1).packPrice(new BigDecimal("299.00"))
                            .discountPrice(new BigDecimal("249.00")).packDeliveryCharge(new BigDecimal("49.00")).allowMixedColors(false).stockQuantity(100).build(),
                    ProductPack.builder().product(p2).packName("Pack of 3").pieceCount(3).packPrice(new BigDecimal("897.00"))
                            .discountPrice(new BigDecimal("699.00")).packDeliveryCharge(BigDecimal.ZERO).allowMixedColors(true).stockQuantity(60).build()
            ));
            productRepository.save(p2);

            Product p3 = Product.builder()
                    .name("Aaliya Pleated Korean Nidha Abaya").slug("aaliya-pleated-korean-nidha-abaya").sku("NVY-AB-PRM-003")
                    .description("Fluid open-front Korean Nidha abaya with concealed pockets, waist tie, and matching sheer hijab.")
                    .specifications("Korean Matte Nidha | Includes Belt & Hijab | Deep Side Pockets")
                    .fabric("Korean Nidha").availableSizes(List.of("52", "54", "56", "58")).category(abayaCat)
                    .basePrice(new BigDecimal("2199.00")).discountPrice(new BigDecimal("1799.00")).stockQuantity(45)
                    .status(ProductStatus.ACTIVE).featured(true).newArrival(false).bestSeller(true)
                    .deliveryChargeType(DeliveryChargeType.FREE).deliveryChargeAmount(BigDecimal.ZERO).build();
            p3.getColors().addAll(List.of(
                    ProductColor.builder().product(p3).name("Obsidian Black").hexCode("#141414").displayOrder(1).build(),
                    ProductColor.builder().product(p3).name("Soft Taupe").hexCode("#9F8C7A").displayOrder(2).build()
            ));
            p3.getImages().add(ProductImage.builder().product(p3).colorName("Soft Taupe").primaryImage(true).displayOrder(1)
                    .imageUrl("https://images.unsplash.com/photo-1539008835657-9e8e9680c956?auto=format&fit=crop&w=900&q=80").build());
            productRepository.save(p3);
        }
    }
}
