package com.nuvaya.repository;
import com.nuvaya.entity.Product;
import com.nuvaya.entity.enums.ProductStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import java.util.List;
public interface ProductRepository extends JpaRepository<Product, Long>, JpaSpecificationExecutor<Product> {
    List<Product> findTop12ByStatusAndFeaturedTrueOrderByCreatedAtDesc(ProductStatus status);
    List<Product> findTop12ByStatusAndBestSellerTrueOrderByCreatedAtDesc(ProductStatus status);
    List<Product> findTop12ByStatusAndNewArrivalTrueOrderByCreatedAtDesc(ProductStatus status);
    long countByStatus(ProductStatus status);
    long countByStockQuantityLessThanEqual(int threshold);
}
