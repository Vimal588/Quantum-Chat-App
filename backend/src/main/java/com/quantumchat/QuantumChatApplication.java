package com.quantumchat;

import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.security.Security;

@SpringBootApplication
public class QuantumChatApplication {

    public static void main(String[] args) {
        // Register Bouncy Castle Security Provider for Post-Quantum Algorithms (ML-KEM, ML-DSA)
        Security.addProvider(new BouncyCastleProvider());
        SpringApplication.run(QuantumChatApplication.class, args);
    }
}
