import { create } from 'zustand';
import api from '../services/api';
import { generatePostQuantumKeyPairs, computeFingerprint } from '../crypto/pqc';
import { saveIdentityKeys, getIdentityKeys, clearIdentityKeys } from '../crypto/keystore';
import wsService from '../services/websocket';

export const useAuthStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem('qc_token') || null,
  isAuthenticated: false,
  isLoading: true,
  localKeys: null, // holds local PQC keypair loaded from IndexedDB

  initAuth: async () => {
    const token = localStorage.getItem('qc_token');
    if (!token) {
      set({ isAuthenticated: false, isLoading: false });
      return;
    }

    try {
      const res = await api.get('/users/me');
      const user = res.data;
      
      // Load local private keys from IndexedDB
      let keys = await getIdentityKeys(user.id);
      
      // If user has no local keys yet (e.g. new browser device), generate and register them
      if (!keys) {
        console.log('Generating fresh Post-Quantum Keypair for device...');
        const generated = generatePostQuantumKeyPairs();
        await saveIdentityKeys(user.id, {
          kemPrivateKey: generated.kem.privateKey,
          kemPublicKey: generated.kem.publicKey,
          dsaPrivateKey: generated.dsa.privateKey,
          dsaPublicKey: generated.dsa.publicKey,
        });
        
        // Register public keys on backend
        await api.post('/keys', {
          mlKemPublicKey: generated.kem.publicKey,
          mlDsaPublicKey: generated.dsa.publicKey,
          deviceName: navigator.userAgent.split(' ')[0] || 'Web Browser',
        });
        
        keys = await getIdentityKeys(user.id);
      }

      set({
        user,
        token,
        isAuthenticated: true,
        localKeys: keys,
        isLoading: false,
      });

      // Connect WebSocket
      wsService.connect(token);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        console.log('Stored authentication token is expired or invalid. Cleared session.');
      } else {
        console.error('Failed to initialize session:', err);
      }
      localStorage.removeItem('qc_token');
      localStorage.removeItem('qc_refresh_token');
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }
  },

  register: async (fullName, email, password) => {
    set({ isLoading: true });
    try {
      // 1. Generate client-side Post-Quantum Keypair (ML-KEM-768 and ML-DSA-65)
      const pqcKeys = generatePostQuantumKeyPairs();
      
      // 2. Submit registration with public keys to backend
      const res = await api.post('/auth/register', {
        fullName,
        email,
        password,
        mlKemPublicKey: pqcKeys.kem.publicKey,
        mlDsaPublicKey: pqcKeys.dsa.publicKey,
      });

      const { token, refreshToken, userId } = res.data;
      localStorage.setItem('qc_token', token);
      localStorage.setItem('qc_refresh_token', refreshToken);

      // 3. Securely store private decryption keys ONLY on client in IndexedDB
      await saveIdentityKeys(userId, {
        kemPrivateKey: pqcKeys.kem.privateKey,
        kemPublicKey: pqcKeys.kem.publicKey,
        dsaPrivateKey: pqcKeys.dsa.privateKey,
        dsaPublicKey: pqcKeys.dsa.publicKey,
      });

      const userRes = await api.get('/users/me');

      set({
        user: userRes.data,
        token,
        isAuthenticated: true,
        localKeys: {
          kemPrivateKey: pqcKeys.kem.privateKey,
          kemPublicKey: pqcKeys.kem.publicKey,
          dsaPrivateKey: pqcKeys.dsa.privateKey,
          dsaPublicKey: pqcKeys.dsa.publicKey,
        },
        isLoading: false,
      });

      wsService.connect(token);
      return { success: true };
    } catch (err) {
      set({ isLoading: false });
      const message = err.response?.data?.message 
        || (err.code === 'ERR_NETWORK' || !err.response 
            ? 'Cannot reach server at http://localhost:8080. Ensure Spring Boot is running.' 
            : 'Registration failed');
      return { success: false, error: message };
    }
  },

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const res = await api.post('/auth/login', { email, password });
      const { token, refreshToken, userId } = res.data;

      localStorage.setItem('qc_token', token);
      localStorage.setItem('qc_refresh_token', refreshToken);

      // Check if this device already has the keys for this user
      let keys = await getIdentityKeys(userId);
      if (!keys) {
        // Provision new keypair for this device
        const pqcKeys = generatePostQuantumKeyPairs();
        await saveIdentityKeys(userId, {
          kemPrivateKey: pqcKeys.kem.privateKey,
          kemPublicKey: pqcKeys.kem.publicKey,
          dsaPrivateKey: pqcKeys.dsa.privateKey,
          dsaPublicKey: pqcKeys.dsa.publicKey,
        });
        await api.post('/keys', {
          mlKemPublicKey: pqcKeys.kem.publicKey,
          mlDsaPublicKey: pqcKeys.dsa.publicKey,
          deviceName: navigator.userAgent.split(' ')[0] || 'Web Browser',
        });
        keys = await getIdentityKeys(userId);
      }

      const userRes = await api.get('/users/me');

      set({
        user: userRes.data,
        token,
        isAuthenticated: true,
        localKeys: keys,
        isLoading: false,
      });

      wsService.connect(token);
      return { success: true };
    } catch (err) {
      set({ isLoading: false });
      const message = err.response?.data?.message 
        || (err.code === 'ERR_NETWORK' || !err.response 
            ? 'Cannot reach server at http://localhost:8080. Ensure Spring Boot is running.' 
            : 'Invalid email or password');
      return { success: false, error: message };
    }
  },

  logout: async () => {
    wsService.disconnect();
    localStorage.removeItem('qc_token');
    localStorage.removeItem('qc_refresh_token');
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      localKeys: null,
    });
  },

  rotateKeys: async () => {
    const { user } = get();
    if (!user) return;

    try {
      const pqcKeys = generatePostQuantumKeyPairs();
      await saveIdentityKeys(user.id, {
        kemPrivateKey: pqcKeys.kem.privateKey,
        kemPublicKey: pqcKeys.kem.publicKey,
        dsaPrivateKey: pqcKeys.dsa.privateKey,
        dsaPublicKey: pqcKeys.dsa.publicKey,
      });

      await api.post('/keys', {
        mlKemPublicKey: pqcKeys.kem.publicKey,
        mlDsaPublicKey: pqcKeys.dsa.publicKey,
        deviceName: 'Manual Rotation',
      });

      const userRes = await api.get('/users/me');
      set({
        user: userRes.data,
        localKeys: {
          kemPrivateKey: pqcKeys.kem.privateKey,
          kemPublicKey: pqcKeys.kem.publicKey,
          dsaPrivateKey: pqcKeys.dsa.privateKey,
          dsaPublicKey: pqcKeys.dsa.publicKey,
        }
      });
      return { success: true };
    } catch (err) {
      console.error('Key rotation failed:', err);
      return { success: false, error: err.message };
    }
  },

  updateProfile: async (profileData) => {
    try {
      const res = await api.put('/users/profile', profileData);
      set((state) => ({
        user: { ...state.user, ...res.data }
      }));
      return { success: true, user: res.data };
    } catch (err) {
      console.error('Failed to update profile:', err);
      return {
        success: false,
        error: err.response?.data?.message || err.message || 'Failed to update profile'
      };
    }
  }
}));
