import { useRouter } from 'expo-router';
import React from 'react';
import {
  Dimensions,
  StyleSheet,
  View,
} from 'react-native';
import {
  Button,
  Card,
  Paragraph,
  Text,
  Title,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function Welcome() {
  const router = useRouter();

  const navigateToLogin = () => {
    router.push('/auth/login' as any);
  };

  const navigateToSignup = () => {
    router.push('/auth/signup' as any);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
          {/* App Logo/Icon */}
          <View style={styles.logoContainer}>
            <View style={styles.logoPlaceholder}>
              <Text style={styles.logoText}>📱</Text>
            </View>
            <Title style={styles.appTitle}>SmartShelf</Title>
            <Paragraph style={styles.appSubtitle}>
              Smart food management for your kitchen
            </Paragraph>
          </View>

          {/* Features Card */}
          <Card style={styles.featuresCard}>
            <Card.Content style={styles.featuresContent}>
              <Title style={styles.featuresTitle}>Why Choose SmartShelf?</Title>
              
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>📅</Text>
                <View style={styles.featureText}>
                  <Text style={styles.featureTitle}>Expiry Tracking</Text>
                  <Text style={styles.featureDescription}>
                    Never waste food again with smart expiry alerts
                  </Text>
                </View>
              </View>

              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>📱</Text>
                <View style={styles.featureText}>
                  <Text style={styles.featureTitle}>QR Code System</Text>
                  <Text style={styles.featureDescription}>
                    Quick scanning and item management
                  </Text>
                </View>
              </View>

              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>🔔</Text>
                <View style={styles.featureText}>
                  <Text style={styles.featureTitle}>Smart Notifications</Text>
                  <Text style={styles.featureDescription}>
                    Get reminded before your food expires
                  </Text>
                </View>
              </View>
            </Card.Content>
          </Card>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <Button
              mode="contained"
              onPress={navigateToSignup}
              style={styles.signupButton}
              labelStyle={styles.buttonLabel}
            >
              Create Account
            </Button>

            <Button
              mode="outlined"
              onPress={navigateToLogin}
              style={styles.loginButton}
              labelStyle={styles.outlinedButtonLabel}
            >
              Sign In
            </Button>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              By continuing, you agree to our Terms of Service and Privacy Policy
            </Text>
          </View>
        </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#4CAF50',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
    justifyContent: 'space-between',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  logoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoText: {
    fontSize: 40,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
    textAlign: 'center',
  },
  appSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 32,
  },
  featuresCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  featuresContent: {
    padding: 24,
  },
  featuresTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureIcon: {
    fontSize: 24,
    marginRight: 16,
    width: 32,
    textAlign: 'center',
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  buttonContainer: {
    marginTop: 32,
  },
  signupButton: {
    backgroundColor: 'white',
    borderRadius: 12,
    paddingVertical: 12,
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  loginButton: {
    borderColor: 'white',
    borderWidth: 2,
    borderRadius: 12,
    paddingVertical: 12,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
  },
  outlinedButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  footer: {
    alignItems: 'center',
    marginTop: 24,
    paddingHorizontal: 16,
  },
  footerText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 16,
  },
});
