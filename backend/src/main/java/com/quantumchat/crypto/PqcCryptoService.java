package com.quantumchat.crypto;

import com.quantumchat.exception.CryptoException;
import com.quantumchat.util.CryptoUtils;
import org.bouncycastle.pqc.crypto.mldsa.MLDSAParameters;
import org.bouncycastle.pqc.crypto.mldsa.MLDSAPublicKeyParameters;
import org.bouncycastle.pqc.crypto.mldsa.MLDSASigner;
import org.bouncycastle.pqc.crypto.mlkem.MLKEMParameters;
import org.bouncycastle.pqc.crypto.mlkem.MLKEMPublicKeyParameters;
import org.springframework.stereotype.Service;

import java.util.Base64;

@Service
public class PqcCryptoService {

    public static final int ML_KEM_768_PUBLIC_KEY_SIZE = 1184;
    public static final int ML_KEM_768_CIPHERTEXT_SIZE = 1088;
    public static final int ML_DSA_65_PUBLIC_KEY_SIZE = 1952;
    public static final int ML_DSA_65_SIGNATURE_SIZE = 3309;

    /**
     * Validates that an ML-KEM-768 public key matches the FIPS 203 standard length (1184 bytes).
     */
    public boolean validateMlKemPublicKey(byte[] publicKeyBytes) {
        if (publicKeyBytes == null || publicKeyBytes.length != ML_KEM_768_PUBLIC_KEY_SIZE) {
            return false;
        }
        try {
            new MLKEMPublicKeyParameters(MLKEMParameters.ml_kem_768, publicKeyBytes);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Validates that an ML-DSA-65 public key matches the FIPS 204 standard length (1952 bytes).
     */
    public boolean validateMlDsaPublicKey(byte[] publicKeyBytes) {
        if (publicKeyBytes == null || publicKeyBytes.length != ML_DSA_65_PUBLIC_KEY_SIZE) {
            return false;
        }
        try {
            new MLDSAPublicKeyParameters(MLDSAParameters.ml_dsa_65, publicKeyBytes);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Verifies an ML-DSA-65 digital signature on given data.
     */
    public boolean verifySignature(byte[] publicKeyBytes, byte[] messageBytes, byte[] signatureBytes) {
        if (!validateMlDsaPublicKey(publicKeyBytes)) {
            throw new CryptoException("Invalid ML-DSA-65 public key length or format");
        }
        if (signatureBytes == null || signatureBytes.length != ML_DSA_65_SIGNATURE_SIZE) {
            throw new CryptoException("Invalid ML-DSA-65 signature length: " + (signatureBytes != null ? signatureBytes.length : 0));
        }

        try {
            MLDSAPublicKeyParameters pubKeyParams = new MLDSAPublicKeyParameters(MLDSAParameters.ml_dsa_65, publicKeyBytes);
            MLDSASigner verifier = new MLDSASigner();
            verifier.init(false, pubKeyParams);
            verifier.update(messageBytes, 0, messageBytes.length);
            return verifier.verifySignature(signatureBytes);
        } catch (Exception e) {
            throw new CryptoException("Error during ML-DSA-65 signature verification: " + e.getMessage(), e);
        }
    }
}
