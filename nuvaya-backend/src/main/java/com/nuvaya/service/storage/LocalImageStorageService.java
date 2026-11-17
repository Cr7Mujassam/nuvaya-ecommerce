package com.nuvaya.service.storage;

import com.nuvaya.exception.BusinessValidationException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.nio.file.*;
import java.util.Set;
import java.util.UUID;

@Service
public class LocalImageStorageService implements ImageStorageService {
    private static final Set<String> ALLOWED = Set.of("image/jpeg", "image/png", "image/webp");
    @Value("${nuvaya.storage.upload-dir}") private String uploadDir;
    @Value("${nuvaya.storage.public-base-url}") private String publicBaseUrl;

    @Override
    public String store(MultipartFile file, String folder) {
        if (file == null || file.isEmpty()) throw new BusinessValidationException("File is empty");
        if (file.getSize() > 5L * 1024 * 1024) throw new BusinessValidationException("Max file size is 5MB");
        if (file.getContentType() == null || !ALLOWED.contains(file.getContentType()))
            throw new BusinessValidationException("Only JPG, PNG, or WebP images allowed");
        try {
            Path dir = Paths.get(uploadDir, folder).toAbsolutePath().normalize();
            Files.createDirectories(dir);
            String orig = file.getOriginalFilename();
            String ext = (orig != null && orig.contains(".")) ? orig.substring(orig.lastIndexOf(".")) : ".jpg";
            String name = UUID.randomUUID() + ext;
            Files.copy(file.getInputStream(), dir.resolve(name), StandardCopyOption.REPLACE_EXISTING);
            return publicBaseUrl + "/uploads/" + folder + "/" + name;
        } catch (IOException e) {
            throw new BusinessValidationException("Image upload failed: " + e.getMessage());
        }
    }
}
