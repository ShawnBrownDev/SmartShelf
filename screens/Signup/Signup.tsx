import { useRouter } from 'expo-router';
import React, { useState } from 'react';
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
import { SignupFormData } from '../../types/database';

export default function Signup() {
  const [formData, setFormData] = useState<SignupFormData>({
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
    firstName: '',
    lastName: '',
  });
  const [loading, setLoading] = useState(false);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const router = useRouter();

  const handleInputChange = (field: keyof SignupFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Clear previous errors when user starts typing
    if (field === 'username') {
      setUsernameError('');
    } else if (field === 'email') {
      setEmailError('');
    }
  };

  // Debounced username validation
  const validateUsernameDebounced = async (username: string) => {
    if (username.length < 3) {
      setUsernameError('');
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setUsernameError('Username can only contain letters, numbers, and underscores');
      return;
    }

    setCheckingUsername(true);
    const isAvailable = await checkUsernameAvailability(username);
    setCheckingUsername(false);

    if (!isAvailable) {
      setUsernameError('This username is already taken');
    } else {
      setUsernameError('');
    }
  };

  // Debounced email validation
  const validateEmailDebounced = async (email: string) => {
    if (!email.includes('@')) {
      setEmailError('');
      return;
    }

    setCheckingEmail(true);
    const isAvailable = await checkEmailAvailability(email);
    setCheckingEmail(false);

    if (!isAvailable) {
      setEmailError('An account with this email already exists');
    } else {
      setEmailError('');
    }
  };

  const validateForm = (): boolean => {
    if (!formData.username.trim()) {
      setSnackbarMessage('Please enter a username');
      setShowSnackbar(true);
      return false;
    }
    if (formData.username.length < 3) {
      setSnackbarMessage('Username must be at least 3 characters long');
      setShowSnackbar(true);
      return false;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      setSnackbarMessage('Username can only contain letters, numbers, and underscores');
      setShowSnackbar(true);
      return false;
    }
    if (usernameError) {
      setSnackbarMessage(usernameError);
      setShowSnackbar(true);
      return false;
    }
    if (!formData.firstName.trim()) {
      setSnackbarMessage('Please enter your first name');
      setShowSnackbar(true);
      return false;
    }
    if (!formData.lastName.trim()) {
      setSnackbarMessage('Please enter your last name');
      setShowSnackbar(true);
      return false;
    }
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
    if (emailError) {
      setSnackbarMessage(emailError);
      setShowSnackbar(true);
      return false;
    }
    if (!formData.password.trim()) {
      setSnackbarMessage('Please enter a password');
      setShowSnackbar(true);
      return false;
    }
    if (formData.password.length < 6) {
      setSnackbarMessage('Password must be at least 6 characters long');
      setShowSnackbar(true);
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setSnackbarMessage('Passwords do not match');
      setShowSnackbar(true);
      return false;
    }
    return true;
  };

  const checkUsernameAvailability = async (username: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('username')
        .eq('username', username.toLowerCase())
        .single();

      if (error && error.code === 'PGRST116') {
        // No rows found, username is available
        return true;
      }
      
      if (data) {
        // Username exists
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error checking username:', error);
      return true; // Allow signup to proceed, database will catch duplicates
    }
  };

  const checkEmailAvailability = async (email: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('email')
        .eq('email', email.toLowerCase())
        .single();

      if (error && error.code === 'PGRST116') {
        // No rows found, email is available
        return true;
      }
      
      if (data) {
        // Email exists
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error checking email:', error);
      return true; // Allow signup to proceed, database will catch duplicates
    }
  };

  const handleSignup = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Check username availability
      const isUsernameAvailable = await checkUsernameAvailability(formData.username.trim());
      if (!isUsernameAvailable) {
        setSnackbarMessage('This username is already taken. Please choose a different one.');
        setShowSnackbar(true);
        setLoading(false);
        return;
      }

      // Check email availability
      const isEmailAvailable = await checkEmailAvailability(formData.email.trim());
      if (!isEmailAvailable) {
        setSnackbarMessage('An account with this email already exists. Please sign in instead.');
        setShowSnackbar(true);
        setLoading(false);
        return;
      }

      // Create account with minimal data to avoid any trigger issues
      const { data, error } = await supabase.auth.signUp({
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        options: {
          emailRedirectTo: undefined, // Disable email confirmation for now
        }
      });

      if (error) {
        console.error('Signup error:', error);
        console.error('Full error details:', JSON.stringify(error, null, 2));
        
        if (error.message.includes('User already registered')) {
          setSnackbarMessage('An account with this email already exists. Please sign in instead.');
        } else if (error.message.includes('Password should be at least')) {
          setSnackbarMessage('Password must be at least 6 characters long');
        } else if (error.message.includes('Database error')) {
          setSnackbarMessage('Signup temporarily unavailable. Please try again in a few minutes.');
        } else {
          setSnackbarMessage(`Signup failed: ${error.message}`);
        }
        setShowSnackbar(true);
        return;
      }

      if (data.user) {
        // Check if email confirmation is required
        if (data.user.email_confirmed_at) {
          // Email is already confirmed, proceed with profile creation
          try {
            const { error: profileError } = await supabase
              .from('user_profiles')
              .insert({
                user_id: data.user.id,
                username: formData.username.trim().toLowerCase(),
                first_name: formData.firstName.trim(),
                last_name: formData.lastName.trim(),
                email: formData.email.trim().toLowerCase(),
              });

            if (profileError) {
              console.error('Profile creation error:', profileError);
              setSnackbarMessage('Account created but profile setup failed. Please try logging in and complete your profile.');
              setShowSnackbar(true);
            } else {
              // Create app settings
              const { error: settingsError } = await supabase
                .from('app_settings')
                .insert({
                  user_id: data.user.id,
                });

              if (settingsError) {
                console.error('App settings creation error:', settingsError);
                console.warn('App settings creation failed, but profile was created');
              }

              setSnackbarMessage('Account created successfully! You can now sign in.');
              setShowSnackbar(true);
            }
          } catch (profileCreationError) {
            console.error('Unexpected error creating profile:', profileCreationError);
            setSnackbarMessage('Account created but profile setup failed. Please try logging in and complete your profile.');
            setShowSnackbar(true);
          }
        } else {
          // Email confirmation is required
          setSnackbarMessage('Account created successfully! Please check your email and click the verification link, then sign in.');
          setShowSnackbar(true);
        }
        
        // Navigate to login after successful signup
        setTimeout(() => {
          router.replace('/auth/login' as any);
        }, 2000);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      setSnackbarMessage('An unexpected error occurred. Please try again.');
      setShowSnackbar(true);
    } finally {
      setLoading(false);
    }
  };

  const navigateToLogin = () => {
    router.push('/auth/Login' as any);
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
              <Title style={styles.title}>Create Account</Title>
              <Paragraph style={styles.subtitle}>
                Join SmartShelf and start tracking your food items
              </Paragraph>

              {/* Username Input */}
              <TextInput
                label="Username"
                value={formData.username}
                onChangeText={(value) => {
                  handleInputChange('username', value);
                  // Debounce the validation
                  setTimeout(() => validateUsernameDebounced(value), 500);
                }}
                mode="outlined"
                autoCapitalize="none"
                autoComplete="username"
                style={styles.input}
                disabled={loading}
                error={!!usernameError}
                right={checkingUsername ? <TextInput.Icon icon="loading" /> : undefined}
              />
              {usernameError ? (
                <Paragraph style={styles.errorText}>{usernameError}</Paragraph>
              ) : null}

              {/* First Name Input */}
              <TextInput
                label="First Name"
                value={formData.firstName}
                onChangeText={(value) => handleInputChange('firstName', value)}
                mode="outlined"
                autoCapitalize="words"
                autoComplete="given-name"
                style={styles.input}
                disabled={loading}
              />

              {/* Last Name Input */}
              <TextInput
                label="Last Name"
                value={formData.lastName}
                onChangeText={(value) => handleInputChange('lastName', value)}
                mode="outlined"
                autoCapitalize="words"
                autoComplete="family-name"
                style={styles.input}
                disabled={loading}
              />

              {/* Email Input */}
              <TextInput
                label="Email Address"
                value={formData.email}
                onChangeText={(value) => {
                  handleInputChange('email', value);
                  // Debounce the validation
                  setTimeout(() => validateEmailDebounced(value), 500);
                }}
                mode="outlined"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                style={styles.input}
                disabled={loading}
                error={!!emailError}
                right={checkingEmail ? <TextInput.Icon icon="loading" /> : undefined}
              />
              {emailError ? (
                <Paragraph style={styles.errorText}>{emailError}</Paragraph>
              ) : null}

              {/* Password Input */}
              <TextInput
                label="Password"
                value={formData.password}
                onChangeText={(value) => handleInputChange('password', value)}
                mode="outlined"
                secureTextEntry={!showPassword}
                autoComplete="password-new"
                style={styles.input}
                disabled={loading}
                right={
                  <TextInput.Icon
                    icon={showPassword ? 'eye-off' : 'eye'}
                    onPress={() => setShowPassword(!showPassword)}
                  />
                }
              />

              {/* Confirm Password Input */}
              <TextInput
                label="Confirm Password"
                value={formData.confirmPassword}
                onChangeText={(value) => handleInputChange('confirmPassword', value)}
                mode="outlined"
                secureTextEntry={!showConfirmPassword}
                autoComplete="password-new"
                style={styles.input}
                disabled={loading}
                right={
                  <TextInput.Icon
                    icon={showConfirmPassword ? 'eye-off' : 'eye'}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  />
                }
              />

              {/* Signup Button */}
              <Button
                mode="contained"
                onPress={handleSignup}
                style={styles.signupButton}
                disabled={loading}
                loading={loading}
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </Button>

              {/* Divider */}
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Paragraph style={styles.dividerText}>or</Paragraph>
                <View style={styles.dividerLine} />
              </View>

              {/* Login Link */}
              <Button
                mode="outlined"
                onPress={navigateToLogin}
                style={styles.loginButton}
                disabled={loading}
              >
                Already have an account? Sign In
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
  input: {
    marginBottom: 16,
  },
  signupButton: {
    marginTop: 8,
    marginBottom: 24,
    paddingVertical: 8,
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
  loginButton: {
    paddingVertical: 8,
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 12,
    marginTop: -8,
    marginBottom: 8,
    marginLeft: 12,
  },
});
