package com.nuvaya.repository;

import com.nuvaya.entity.ProductCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ProductCategoryRepository extends JpaRepository<ProductCategory, Long> {
    List<ProductCategory> findByActiveTrueOrderByDisplayOrderAscNameAsc();
    List<ProductCategory> findAllByOrderByDisplayOrderAscNameAsc();
    List<ProductCategory> findByParentCategoryId(Long parentCategoryId);
    Optional<ProductCategory> findBySlug(String slug);
    boolean existsByNameIgnoreCase(String name);
    boolean existsBySlug(String slug);
}
