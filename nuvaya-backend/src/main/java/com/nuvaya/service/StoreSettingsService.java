package com.nuvaya.service;

import com.nuvaya.entity.StoreSettings;
import com.nuvaya.repository.StoreSettingsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service @RequiredArgsConstructor
public class StoreSettingsService {
    private final StoreSettingsRepository repository;

    @Transactional(readOnly = true)
    public StoreSettings getEntity() {
        return repository.findById(1L).orElseThrow();
    }

    @Transactional
    public StoreSettings update(StoreSettings updated) {
        StoreSettings existing = getEntity();
        existing.setWhatsappNumber(updated.getWhatsappNumber());
        existing.setStoreEmail(updated.getStoreEmail());
        existing.setStorePhone(updated.getStorePhone());
        existing.setStoreAddress(updated.getStoreAddress());
        existing.setInstagramUrl(updated.getInstagramUrl());
        existing.setFacebookUrl(updated.getFacebookUrl());
        existing.setAnnouncementText(updated.getAnnouncementText());
        existing.setDefaultDeliveryCharge(updated.getDefaultDeliveryCharge());
        existing.setFreeDeliveryThresholdEnabled(updated.isFreeDeliveryThresholdEnabled());
        existing.setFreeDeliveryThreshold(updated.getFreeDeliveryThreshold());

        existing.setSaleActive(updated.isSaleActive());
        existing.setSaleType(updated.getSaleType());
        existing.setSaleBadgeText(updated.getSaleBadgeText());
        existing.setSaleTitle(updated.getSaleTitle());
        existing.setSaleSubtitle(updated.getSaleSubtitle());
        existing.setSaleBannerImageUrl(updated.getSaleBannerImageUrl());
        existing.setSaleCtaText(updated.getSaleCtaText());
        existing.setSaleCtaLink(updated.getSaleCtaLink());
        return repository.save(existing);
    }
}
