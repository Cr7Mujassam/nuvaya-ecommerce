package com.nuvaya.service;

import com.nuvaya.dto.request.ProductRequest;
import com.nuvaya.dto.response.ProductResponse;
import com.nuvaya.entity.*;
import com.nuvaya.entity.enums.ProductStatus;
import com.nuvaya.exception.ResourceNotFoundException;
import com.nuvaya.mapper.ProductMapper;
import com.nuvaya.repository.ProductCategoryRepository;
import com.nuvaya.repository.ProductRepository;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service @RequiredArgsConstructor
public class ProductService {
    private final ProductRepository productRepository;
    private final ProductCategoryRepository categoryRepository;
    private final ProductMapper productMapper;

    @Transactional(readOnly = true)
    public Page<ProductResponse> searchPublicProducts(
            String search, String categorySlug, String color, String fabric,
            BigDecimal minPrice, BigDecimal maxPrice, Boolean featured,
            Boolean bestSeller, Boolean newArrival, String sortBy, int page, int size) {

        Sort sort = switch (sortBy != null ? sortBy : "newest") {
            case "price_asc" -> Sort.by(Sort.Direction.ASC, "basePrice");
            case "price_desc" -> Sort.by(Sort.Direction.DESC, "basePrice");
            default -> Sort.by(Sort.Direction.DESC, "createdAt");
        };

        Specification<Product> spec = (root, query, cb) -> {
            query.distinct(true);
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("status"), ProductStatus.ACTIVE));

            if (search != null && !search.isBlank()) {
                String pattern = "%" + search.toLowerCase().trim() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("name")), pattern),
                        cb.like(cb.lower(root.get("description")), pattern),
                        cb.like(cb.lower(root.get("fabric")), pattern)
                ));
            }
            if (categorySlug != null && !categorySlug.isBlank() && !categorySlug.equals("all")) {
                if (categorySlug.equals("new-arrivals")) predicates.add(cb.isTrue(root.get("newArrival")));
                else if (categorySlug.equals("best-sellers")) predicates.add(cb.isTrue(root.get("bestSeller")));
                else {
                    var matchedCat = categoryRepository.findBySlug(categorySlug).orElse(null);
                    if (matchedCat != null) {
                        var childIds = categoryRepository.findByParentCategoryId(matchedCat.getId())
                                .stream().map(ProductCategory::getId).toList();
                        if (!childIds.isEmpty()) {
                            var allowedIds = new ArrayList<Long>();
                            allowedIds.add(matchedCat.getId());
                            allowedIds.addAll(childIds);
                            predicates.add(root.get("category").get("id").in(allowedIds));
                        } else {
                            predicates.add(cb.equal(root.get("category").get("id"), matchedCat.getId()));
                        }
                    } else {
                        predicates.add(cb.equal(root.get("category").get("slug"), categorySlug));
                    }
                }
            }
            if (color != null && !color.isBlank()) {
                Join<Product, ProductColor> colorJoin = root.join("colors", JoinType.INNER);
                predicates.add(cb.equal(cb.lower(colorJoin.get("name")), color.toLowerCase().trim()));
            }
            if (fabric != null && !fabric.isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("fabric")), "%" + fabric.toLowerCase().trim() + "%"));
            }
            if (minPrice != null) predicates.add(cb.greaterThanOrEqualTo(root.get("basePrice"), minPrice));
            if (maxPrice != null) predicates.add(cb.lessThanOrEqualTo(root.get("basePrice"), maxPrice));
            if (Boolean.TRUE.equals(featured)) predicates.add(cb.isTrue(root.get("featured")));
            if (Boolean.TRUE.equals(bestSeller)) predicates.add(cb.isTrue(root.get("bestSeller")));
            if (Boolean.TRUE.equals(newArrival)) predicates.add(cb.isTrue(root.get("newArrival")));

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return productRepository.findAll(spec, PageRequest.of(page, size, sort)).map(productMapper::toResponse);
    }

    @Transactional(readOnly = true)
    public ProductResponse getById(Long id) {
        Product p = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + id));
        return productMapper.toResponse(p);
    }

    @Transactional(readOnly = true)
    public List<ProductResponse> getFeatured() {
        return productRepository.findTop12ByStatusAndFeaturedTrueOrderByCreatedAtDesc(ProductStatus.ACTIVE)
                .stream().map(productMapper::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<ProductResponse> getBestSellers() {
        return productRepository.findTop12ByStatusAndBestSellerTrueOrderByCreatedAtDesc(ProductStatus.ACTIVE)
                .stream().map(productMapper::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public Page<ProductResponse> getAllAdminProducts(int page, int size) {
        return productRepository.findAll(PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")))
                .map(productMapper::toResponse);
    }

    @Transactional
    public ProductResponse createProduct(ProductRequest req) {
        Product product = new Product();
        applyRequest(product, req);
        return productMapper.toResponse(productRepository.save(product));
    }

    @Transactional
    public ProductResponse updateProduct(Long id, ProductRequest req) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + id));
        product.getColors().clear();
        product.getImages().clear();
        product.getPacks().clear();
        applyRequest(product, req);
        return productMapper.toResponse(productRepository.save(product));
    }

    @Transactional
    public void deleteProduct(Long id) {
        if (!productRepository.existsById(id)) throw new ResourceNotFoundException("Product not found: " + id);
        productRepository.deleteById(id);
    }

    private void applyRequest(Product p, ProductRequest req) {
        ProductCategory category = categoryRepository.findById(req.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"));
        p.setName(req.getName().trim());
        p.setSlug(req.getName().toLowerCase().replaceAll("[^a-z0-9]+", "-") + "-" + req.getSku().toLowerCase());
        p.setSku(req.getSku().trim().toUpperCase());
        p.setDescription(req.getDescription());
        p.setSpecifications(req.getSpecifications());
        p.setFabric(req.getFabric());
        p.setAvailableSizes(req.getAvailableSizes() != null ? req.getAvailableSizes() : new ArrayList<>());
        p.setCategory(category);
        p.setBasePrice(req.getBasePrice());
        p.setDiscountPrice(req.getDiscountPrice());
        p.setStockQuantity(req.getStockQuantity());
        p.setStatus(req.getStatus() != null ? req.getStatus() : ProductStatus.ACTIVE);
        p.setFeatured(req.isFeatured());
        p.setNewArrival(req.isNewArrival());
        p.setBestSeller(req.isBestSeller());
        p.setDeliveryChargeType(req.getDeliveryChargeType());
        p.setDeliveryChargeAmount(req.getDeliveryChargeAmount() != null ? req.getDeliveryChargeAmount() : BigDecimal.ZERO);

        if (req.getColors() != null) {
            int i = 1;
            for (ProductRequest.ColorDto c : req.getColors()) {
                p.getColors().add(ProductColor.builder()
                        .product(p).name(c.getName()).hexCode(c.getHexCode()).inStock(c.isInStock()).displayOrder(i++).build());
            }
        }
        if (req.getImages() != null) {
            int i = 1;
            for (ProductRequest.ImageDto img : req.getImages()) {
                p.getImages().add(ProductImage.builder()
                        .product(p).imageUrl(img.getImageUrl()).colorName(img.getColorName())
                        .primaryImage(img.isPrimaryImage()).displayOrder(i++).build());
            }
        }
        if (req.getPacks() != null) {
            for (ProductRequest.PackDto pk : req.getPacks()) {
                p.getPacks().add(ProductPack.builder()
                        .product(p).packName(pk.getPackName()).pieceCount(pk.getPieceCount())
                        .packPrice(pk.getPackPrice()).discountPrice(pk.getDiscountPrice())
                        .packDeliveryCharge(pk.getPackDeliveryCharge() != null ? pk.getPackDeliveryCharge() : BigDecimal.ZERO)
                        .allowMixedColors(pk.isAllowMixedColors())
                        .stockQuantity(pk.getStockQuantity() != null ? pk.getStockQuantity() : 50).build());
            }
        }
    }
}
