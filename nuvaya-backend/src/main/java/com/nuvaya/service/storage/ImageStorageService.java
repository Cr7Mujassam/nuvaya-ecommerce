package com.nuvaya.service.storage;
import org.springframework.web.multipart.MultipartFile;
public interface ImageStorageService {
    String store(MultipartFile file, String folder);
}
