import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import { useAuth } from '../hooks/useAuth';

export default function IndexScreen() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      console.log('Auth check complete:', { user: user?.email, loading });
      if (user) {
        // User is authenticated, go to main app
        console.log('User authenticated, going to main app');
        router.replace('/(tabs)');
      } else {
        // User is not authenticated, go to welcome screen
        console.log('User not authenticated, going to welcome screen');
        router.replace('/welcome' as any);
      }
    }
  }, [user, loading, router]);

  // Show loading screen while checking authentication
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
});
