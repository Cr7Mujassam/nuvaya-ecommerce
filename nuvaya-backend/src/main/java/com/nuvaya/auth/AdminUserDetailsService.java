package com.nuvaya.auth;

import com.nuvaya.entity.Admin;
import com.nuvaya.repository.AdminRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;
import java.util.List;

@Service @RequiredArgsConstructor
public class AdminUserDetailsService implements UserDetailsService {
    private final AdminRepository adminRepository;
    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        Admin admin = adminRepository.findByUsernameAndActiveTrue(username)
                .orElseThrow(() -> new UsernameNotFoundException("Admin not found"));
        return new User(admin.getUsername(), admin.getPasswordHash(), List.of(new SimpleGrantedAuthority(admin.getRole())));
    }
}
