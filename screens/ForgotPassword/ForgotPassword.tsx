import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet
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
import { ForgotPasswordFormData } from '../../types/database';

export default function ForgotPassword() {
  const [formData, setFormData] = useState<ForgotPasswordFormData>({
    email: '',
  });
  const [loading, setLoading] = useState(false);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  const router = useRouter();

  const handleInputChange = (field: keyof ForgotPasswordFormData, value: string) => {
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
    if (!formData.email.includes('@')) {
      setSnackbarMessage('Please enter a valid email address');
      setShowSnackbar(true);
      return false;
    }
    return true;
  };

  const handleResetPassword = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        formData.email.trim().toLowerCase(),
        {
          redirectTo: 'smart-shelf://reset-password',
        }
      );

      if (error) {
        console.error('Password reset error:', error);
        setSnackbarMessage('Failed to send reset email. Please try again.');
        setShowSnackbar(true);
        return;
      }

      setEmailSent(true);
      setSnackbarMessage('Password reset email sent! Check your inbox.');
      setShowSnackbar(true);
    } catch (error) {
      console.error('Unexpected error:', error);
      setSnackbarMessage('An unexpected error occurred. Please try again.');
      setShowSnackbar(true);
    } finally {
      setLoading(false);
    }
  };

  const navigateToLogin = () => {
    router.push('/auth/login' as any);
  };

  if (emailSent) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <Card style={styles.card}>
            <Card.Content style={styles.cardContent}>
              <Title style={styles.title}>Check Your Email</Title>
              <Paragraph style={styles.subtitle}>
                We've sent a password reset link to {formData.email}
              </Paragraph>
              
              <Paragraph style={styles.instructions}>
                Please check your email and click the link to reset your password. 
                If you don't see the email, check your spam folder.
              </Paragraph>

              <Button
                mode="contained"
                onPress={navigateToLogin}
                style={styles.backButton}
              >
                Back to Sign In
              </Button>

              <Button
                mode="text"
                onPress={() => setEmailSent(false)}
                style={styles.resendButton}
              >
                Didn't receive the email? Try again
              </Button>
            </Card.Content>
          </Card>
        </ScrollView>

        {/* Snackbar for messages */}
        <Snackbar
          visible={showSnackbar}
          onDismiss={() => setShowSnackbar(false)}
          duration={4000}
        >
          {snackbarMessage}
        </Snackbar>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <Card style={styles.card}>
            <Card.Content style={styles.cardContent}>
              <Title style={styles.title}>Reset Password</Title>
              <Paragraph style={styles.subtitle}>
                Enter your email address and we'll send you a link to reset your password
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

              {/* Reset Button */}
              <Button
                mode="contained"
                onPress={handleResetPassword}
                style={styles.resetButton}
                disabled={loading}
                loading={loading}
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </Button>

              {/* Back to Login Link */}
              <Button
                mode="text"
                onPress={navigateToLogin}
                style={styles.backToLoginButton}
                disabled={loading}
              >
                Back to Sign In
              </Button>
            </Card.Content>
          </Card>
        </ScrollView>

        {/* Snackbar for messages */}
        <Snackbar
          visible={showSnackbar}
          onDismiss={() => setShowSnackbar(false)}
          duration={4000}
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
  instructions: {
    textAlign: 'center',
    marginBottom: 32,
    color: '#666',
    fontSize: 14,
    lineHeight: 20,
  },
  input: {
    marginBottom: 16,
  },
  resetButton: {
    marginTop: 8,
    marginBottom: 16,
    paddingVertical: 8,
  },
  backButton: {
    marginTop: 8,
    marginBottom: 16,
    paddingVertical: 8,
  },
  resendButton: {
    marginBottom: 16,
  },
  backToLoginButton: {
    marginTop: 16,
  },
});
