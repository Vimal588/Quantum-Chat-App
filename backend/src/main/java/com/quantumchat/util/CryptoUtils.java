package com.quantumchat.util;

import org.bouncycastle.util.encoders.Hex;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;

public final class CryptoUtils {

    private CryptoUtils() {}

    /**
     * Computes a standard 64-character hex SHA-256 fingerprint of raw or base64 key material.
     */
    public static String computeFingerprint(String base64OrRawKey) {
        if (base64OrRawKey == null || base64OrRawKey.trim().isEmpty()) {
            return "";
        }
        try {
            byte[] keyBytes;
            try {
                keyBytes = Base64.getDecoder().decode(base64OrRawKey.trim());
            } catch (IllegalArgumentException e) {
                keyBytes = base64OrRawKey.getBytes(StandardCharsets.UTF_8);
            }
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(keyBytes);
            return Hex.toHexString(hash).toUpperCase();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not available", e);
        }
    }

    /**
     * Formats a 64-character fingerprint into friendly 4-character grouped Safety Numbers
     * e.g. "A1B2 C3D4 E5F6 ..."
     */
    public static String formatFingerprintBlocks(String fingerprint) {
        if (fingerprint == null) return "";
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < fingerprint.length(); i++) {
            if (i > 0 && i % 4 == 0) {
                sb.append(" ");
            }
            sb.append(fingerprint.charAt(i));
        }
        return sb.toString();
    }
}
