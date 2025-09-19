import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import {
  Card,
  Divider,
  List,
  Paragraph,
  Switch,
  Title
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../hooks/useAuth';
import { NotificationHelper } from '../utils/notificationHelper';

const NOTIFICATION_SETTINGS_KEY = 'notification_settings';

interface NotificationSettings {
  expiryReminders: boolean;
  expiredAlerts: boolean;
}

export default function Settings() {
  const [settings, setSettings] = useState<NotificationSettings>({
    expiryReminders: true,
    expiredAlerts: true,
  });
  const [loading, setLoading] = useState(true);
  
  const router = useRouter();
  const { user, signOut } = useAuth();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY);
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (newSettings: NotificationSettings) => {
    try {
      await AsyncStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const handleExpiryRemindersToggle = async (value: boolean) => {
    const newSettings = { ...settings, expiryReminders: value };
    await saveSettings(newSettings);
    
    if (!value) {
      // If disabling, cancel all expiry reminder notifications
      const scheduledNotifications = await NotificationHelper.getScheduledNotifications();
      for (const notification of scheduledNotifications) {
        const data = notification.content.data as any;
        if (data && data.type === 'expiry-reminder') {
          await NotificationHelper.cancelNotification(notification.identifier);
        }
      }
    }
  };

  const handleExpiredAlertsToggle = async (value: boolean) => {
    const newSettings = { ...settings, expiredAlerts: value };
    await saveSettings(newSettings);
    
    if (!value) {
      // If disabling, cancel all expired alert notifications
      const scheduledNotifications = await NotificationHelper.getScheduledNotifications();
      for (const notification of scheduledNotifications) {
        const data = notification.content.data as any;
        if (data && data.type === 'expired-alert') {
          await NotificationHelper.cancelNotification(notification.identifier);
        }
      }
    }
  };

  const handleSignOut = async () => {
    try {
      // Clear all notifications when signing out
      await NotificationHelper.clearAllNotifications();
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleTestNotification = async () => {
    try {
      await NotificationHelper.requestPermissions();
      // Schedule a test notification for 5 seconds from now
      await NotificationHelper.scheduleExpiryReminder({
        itemId: 'test',
        itemName: 'Test Item',
        expiryDate: new Date(Date.now() + 5 * 1000).toISOString(),
        type: 'expiry-reminder',
      });
    } catch (error) {
      console.error('Error testing notification:', error);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Title>Loading settings...</Title>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <Card style={styles.headerCard}>
          <Card.Content style={styles.headerContent}>
            <Title style={styles.headerTitle}>Settings</Title>
            <Paragraph style={styles.headerSubtitle}>
              Manage your SmartShelf preferences
            </Paragraph>
          </Card.Content>
        </Card>

        {/* Notification Settings */}
        <Card style={styles.settingsCard}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Notifications</Title>
            
            <List.Item
              title="Expiry Reminders"
              description="Get notified 3 days before items expire"
              left={(props) => <List.Icon {...props} icon="bell-outline" />}
              right={() => (
                <Switch
                  value={settings.expiryReminders}
                  onValueChange={handleExpiryRemindersToggle}
                />
              )}
            />
            
            <Divider />
            
            <List.Item
              title="Expired Alerts"
              description="Get daily alerts for expired items"
              left={(props) => <List.Icon {...props} icon="alert-circle-outline" />}
              right={() => (
                <Switch
                  value={settings.expiredAlerts}
                  onValueChange={handleExpiredAlertsToggle}
                />
              )}
            />
            
            <Divider />
            
            <List.Item
              title="Test Notification"
              description="Send a test notification to verify settings"
              left={(props) => <List.Icon {...props} icon="test-tube" />}
              onPress={handleTestNotification}
            />
          </Card.Content>
        </Card>

        {/* Account Settings */}
        <Card style={styles.settingsCard}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Account</Title>
            
            <List.Item
              title="Sign Out"
              description="Sign out of your account"
              left={(props) => <List.Icon {...props} icon="logout" />}
              onPress={handleSignOut}
            />
          </Card.Content>
        </Card>

        {/* App Info */}
        <Card style={styles.infoCard}>
          <Card.Content>
            <Title style={styles.sectionTitle}>About SmartShelf</Title>
            <Paragraph style={styles.appInfo}>
              SmartShelf helps you track your fridge items and reduce food waste by 
              sending timely notifications about expiry dates.
            </Paragraph>
            <Paragraph style={styles.versionInfo}>
              Version 1.0.0
            </Paragraph>
          </Card.Content>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  headerCard: {
    marginBottom: 16,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  headerSubtitle: {
    textAlign: 'center',
    color: '#666',
  },
  settingsCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  infoCard: {
    marginBottom: 16,
  },
  appInfo: {
    lineHeight: 22,
    color: '#666',
    marginBottom: 16,
  },
  versionInfo: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
});



