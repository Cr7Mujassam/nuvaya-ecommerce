package com.nuvaya.repository;
import com.nuvaya.entity.Admin;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
public interface AdminRepository extends JpaRepository<Admin, Long> {
    Optional<Admin> findByUsernameAndActiveTrue(String username);
    boolean existsByUsername(String username);
}
