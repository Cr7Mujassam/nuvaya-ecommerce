package com.nuvaya.controller;

import com.nuvaya.entity.ProductCategory;
import com.nuvaya.exception.ResourceNotFoundException;
import com.nuvaya.repository.ProductCategoryRepository;
import com.nuvaya.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Locale;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/categories")
@RequiredArgsConstructor
public class AdminCategoryController {
    private final ProductCategoryRepository categoryRepository;
    private final ProductRepository productRepository;

    @GetMapping
    public ResponseEntity<?> listAll() {
        return ResponseEntity.ok(categoryRepository.findAllByOrderByDisplayOrderAscNameAsc());
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Map<String, Object> body) {
        String name = body.get("name") != null ? String.valueOf(body.get("name")).trim() : "";
        if (name.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Category name is required."));
        }
        if (categoryRepository.existsByNameIgnoreCase(name)) {
            return ResponseEntity.badRequest().body(Map.of("message", "Category '" + name + "' already exists."));
        }

        Long parentId = null;
        String parentName = null;
        Object rawParent = body.get("parentCategoryId");
        if (rawParent != null && !String.valueOf(rawParent).isBlank() && !"null".equals(String.valueOf(rawParent))) {
            parentId = Long.valueOf(String.valueOf(rawParent));
            ProductCategory parent = categoryRepository.findById(parentId)
                    .orElseThrow(() -> new ResourceNotFoundException("Parent category not found"));
            if (parent.getParentCategoryId() != null) {
                return ResponseEntity.badRequest().body(Map.of("message", "Sub-categories can only be added under a Main Category."));
            }
            parentName = parent.getName();
        }

        String baseSlug = name.toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("(^-|-$)", "");
        if (baseSlug.isEmpty()) baseSlug = "category";
        String slug = baseSlug;
        int counter = 2;
        while (categoryRepository.existsBySlug(slug)) {
            slug = baseSlug + "-" + counter++;
        }

        String description = body.get("description") != null ? String.valueOf(body.get("description")).trim() : "";
        int displayOrder = body.get("displayOrder") != null && !String.valueOf(body.get("displayOrder")).isBlank()
                ? Integer.parseInt(String.valueOf(body.get("displayOrder")))
                : (parentId == null ? 10 : 50);

        ProductCategory saved = categoryRepository.save(ProductCategory.builder()
                .name(name)
                .slug(slug)
                .description(description)
                .parentCategoryId(parentId)
                .parentCategoryName(parentName)
                .active(true)
                .displayOrder(displayOrder)
                .build());

        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        ProductCategory cat = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"));
        if (!categoryRepository.findByParentCategoryId(id).isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Delete or move sub-categories under '" + cat.getName() + "' first."));
        }
        long linkedProducts = productRepository.findAll().stream()
                .filter(p -> p.getCategory() != null && id.equals(p.getCategory().getId()))
                .count();
        if (linkedProducts > 0) {
            return ResponseEntity.badRequest().body(Map.of("message", "Cannot delete '" + cat.getName() + "' because " + linkedProducts + " product(s) use it."));
        }
        categoryRepository.delete(cat);
        return ResponseEntity.ok(Map.of("status", "deleted"));
    }
}
