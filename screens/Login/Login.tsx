import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import {
  Button,
  Card,
  Paragraph,
  Snackbar,
  TextInput,
  Title
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../supabase/supabase';
import { LoginFormData } from '../../types/database';

export default function Login() {
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  const router = useRouter();

  // Check biometric availability and settings on component mount
  useEffect(() => {
    checkBiometricAvailability();
    checkBiometricSettings();
  }, []);

  const checkBiometricAvailability = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
      
      console.log('Biometric check:', { hasHardware, isEnrolled, supportedTypes });
      
      const isAvailable = hasHardware && isEnrolled && supportedTypes.length > 0;
      console.log('Biometric available:', isAvailable);
      setBiometricAvailable(isAvailable);
    } catch (error) {
      console.error('Error checking biometric availability:', error);
      setBiometricAvailable(false);
    }
  };

  const checkBiometricSettings = async () => {
    try {
      const enabled = await AsyncStorage.getItem('biometricEnabled');
      setBiometricEnabled(enabled === 'true');
    } catch (error) {
      console.error('Error checking biometric settings:', error);
      setBiometricEnabled(false);
    }
  };

  const authenticateWithBiometrics = async () => {
    if (!biometricAvailable) {
      setSnackbarMessage('Biometric authentication is not available on this device');
      setShowSnackbar(true);
      return;
    }

    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to login to SmartShelf',
        cancelLabel: 'Cancel',
        fallbackLabel: 'Use Password',
        disableDeviceFallback: false,
      });

      if (result.success) {
        // Get stored credentials
        const storedEmail = await AsyncStorage.getItem('userEmail');
        const storedPassword = await AsyncStorage.getItem('userPassword');
        
        if (storedEmail && storedPassword) {
          // Auto-fill form and login
          setFormData({
            email: storedEmail,
            password: storedPassword,
          });
          
          // Perform login
          await performLogin(storedEmail, storedPassword);
        } else {
          setSnackbarMessage('No saved credentials found. Please login manually first.');
          setShowSnackbar(true);
        }
      } else if (result.error === 'user_cancel') {
        // User cancelled, do nothing
      } else {
        setSnackbarMessage('Biometric authentication failed. Please try again.');
        setShowSnackbar(true);
      }
    } catch (error) {
      console.error('Biometric authentication error:', error);
      setSnackbarMessage('Biometric authentication error. Please try again.');
      setShowSnackbar(true);
    }
  };

  const saveCredentialsForBiometric = async (email: string, password: string) => {
    try {
      await AsyncStorage.setItem('userEmail', email);
      await AsyncStorage.setItem('userPassword', password);
      await AsyncStorage.setItem('biometricEnabled', 'true');
      setBiometricEnabled(true);
    } catch (error) {
      console.error('Error saving credentials:', error);
    }
  };

  const handleInputChange = (field: keyof LoginFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.email.trim()) {
      setSnackbarMessage('Please enter your email address');
      setShowSnackbar(true);
      return false;
    }
    if (!formData.password.trim()) {
      setSnackbarMessage('Please enter your password');
      setShowSnackbar(true);
      return false;
    }
    if (!formData.email.includes('@')) {
      setSnackbarMessage('Please enter a valid email address');
      setShowSnackbar(true);
      return false;
    }
    return true;
  };

  const performLogin = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: password,
      });

      if (error) {
        console.error('Login error:', error);
        if (error.message.includes('Invalid login credentials')) {
          setSnackbarMessage('Invalid email or password. Please try again.');
        } else {
          setSnackbarMessage('Login failed. Please try again.');
        }
        setShowSnackbar(true);
        return false;
      }

      if (data.user) {
        setSnackbarMessage('Login successful!');
        setShowSnackbar(true);
        
        // Save credentials for biometric login if not already saved
        if (!biometricEnabled) {
          await saveCredentialsForBiometric(email, password);
        }
        
        // Navigate to main app after successful login
        setTimeout(() => {
          router.replace('/(tabs)' as any);
        }, 1000);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Unexpected error:', error);
      setSnackbarMessage('An unexpected error occurred. Please try again.');
      setShowSnackbar(true);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!validateForm()) return;
    await performLogin(formData.email, formData.password);
  };

  const navigateToSignup = () => {
    router.push('/auth/signup' as any);
  };

  const navigateToForgotPassword = () => {
    router.push('/auth/forgot-password' as any);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <Card style={styles.card}>
            <Card.Content style={styles.cardContent}>
              <Title style={styles.title}>Welcome Back</Title>
              <Paragraph style={styles.subtitle}>
                Sign in to your SmartShelf account
              </Paragraph>

              {/* Email Input */}
              <TextInput
                label="Email Address"
                value={formData.email}
                onChangeText={(value) => handleInputChange('email', value)}
                mode="outlined"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                style={styles.input}
                disabled={loading}
              />

              {/* Password Input */}
              <TextInput
                label="Password"
                value={formData.password}
                onChangeText={(value) => handleInputChange('password', value)}
                mode="outlined"
                secureTextEntry={!showPassword}
                autoComplete="password"
                style={styles.input}
                disabled={loading}
                right={
                  <TextInput.Icon
                    icon={showPassword ? 'eye-off' : 'eye'}
                    onPress={() => setShowPassword(!showPassword)}
                  />
                }
              />

              {/* Login Button */}
              <Button
                mode="contained"
                onPress={handleLogin}
                style={styles.loginButton}
                disabled={loading}
                loading={loading}
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </Button>

              {/* Biometric Login Button */}
              <Button
                mode="outlined"
                onPress={authenticateWithBiometrics}
                style={styles.biometricButton}
                disabled={loading}
                icon="fingerprint"
              >
                {Platform.OS === 'ios' ? 'Sign in with Face ID' : 'Sign in with Fingerprint'}
              </Button>

              {/* Forgot Password Link */}
              <Button
                mode="text"
                onPress={navigateToForgotPassword}
                style={styles.forgotPasswordButton}
                disabled={loading}
              >
                Forgot Password?
              </Button>

              {/* Divider */}
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Paragraph style={styles.dividerText}>or</Paragraph>
                <View style={styles.dividerLine} />
              </View>

              {/* Sign Up Link */}
              <Button
                mode="outlined"
                onPress={navigateToSignup}
                style={styles.signupButton}
                disabled={loading}
              >
                Create New Account
              </Button>
            </Card.Content>
          </Card>
        </ScrollView>

        {/* Snackbar for messages */}
        <Snackbar
          visible={showSnackbar}
          onDismiss={() => setShowSnackbar(false)}
          duration={3000}
        >
          {snackbarMessage}
        </Snackbar>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  cardContent: {
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 32,
    color: '#666',
    fontSize: 16,
  },
  input: {
    marginBottom: 16,
  },
  loginButton: {
    marginTop: 8,
    marginBottom: 16,
    paddingVertical: 8,
  },
  biometricButton: {
    marginBottom: 24,
    paddingVertical: 8,
    borderColor: '#4CAF50',
  },
  forgotPasswordButton: {
    marginBottom: 24,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#666',
  },
  signupButton: {
    paddingVertical: 8,
  },
});
