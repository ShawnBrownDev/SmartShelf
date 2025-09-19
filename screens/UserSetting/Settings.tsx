import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    View,
} from 'react-native';
import {
    Avatar,
    Button,
    Card,
    Chip,
    Divider,
    List,
    Paragraph,
    Switch,
    Text,
    Title,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';
import { NotificationHelper } from '../../utils/notificationHelper';

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
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              // Clear all notifications when signing out
              await NotificationHelper.clearAllNotifications();
              await signOut();
            } catch (error) {
              console.error('Error signing out:', error);
            }
          },
        },
      ]
    );
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
        {/* User Profile Section */}
        <Card style={styles.profileCard}>
          <Card.Content style={styles.profileContent}>
            <View style={styles.profileHeader}>
              <Avatar.Text 
                size={60} 
                label={user?.email?.charAt(0).toUpperCase() || 'U'} 
                style={styles.avatar}
              />
              <View style={styles.profileInfo}>
                <Title style={styles.profileName}>
                  {user?.email?.split('@')[0] || 'User'}
                </Title>
                <Text style={styles.profileEmail}>{user?.email}</Text>
                <Chip 
                  icon="check-circle" 
                  style={styles.statusChip}
                  textStyle={styles.statusText}
                >
                  Active
                </Chip>
              </View>
            </View>
          </Card.Content>
        </Card>

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
              title="Profile Information"
              description="View and edit your profile details"
              left={(props) => <List.Icon {...props} icon="account-outline" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => {
                Alert.alert('Profile', 'Profile editing will be available in a future update.');
              }}
            />
            
            <Divider />
            
            <List.Item
              title="Privacy & Security"
              description="Manage your privacy settings"
              left={(props) => <List.Icon {...props} icon="shield-outline" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => {
                Alert.alert('Privacy', 'Privacy settings will be available in a future update.');
              }}
            />
            
            <Divider />
            
            <List.Item
              title="Data & Storage"
              description="Manage your data and storage"
              left={(props) => <List.Icon {...props} icon="database-outline" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => {
                Alert.alert('Data', 'Data management options will be available in a future update.');
              }}
            />
            
            <Divider />
            
            <List.Item
              title="Sign Out"
              description="Sign out of your account"
              left={(props) => <List.Icon {...props} icon="logout" />}
              onPress={handleSignOut}
            />
          </Card.Content>
        </Card>

        {/* App Settings */}
        <Card style={styles.settingsCard}>
          <Card.Content>
            <Title style={styles.sectionTitle}>App Settings</Title>
            
            <List.Item
              title="Theme"
              description="Choose your preferred theme"
              left={(props) => <List.Icon {...props} icon="palette-outline" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => {
                Alert.alert('Theme', 'Theme selection will be available in a future update.');
              }}
            />
            
            <Divider />
            
            <List.Item
              title="Language"
              description="Select your preferred language"
              left={(props) => <List.Icon {...props} icon="translate" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => {
                Alert.alert('Language', 'Language selection will be available in a future update.');
              }}
            />
            
            <Divider />
            
            <List.Item
              title="Backup & Sync"
              description="Manage your data backup and sync"
              left={(props) => <List.Icon {...props} icon="cloud-sync-outline" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => {
                Alert.alert('Backup', 'Backup and sync options will be available in a future update.');
              }}
            />
          </Card.Content>
        </Card>

        {/* App Info */}
        <Card style={styles.infoCard}>
          <Card.Content>
            <Title style={styles.sectionTitle}>About SmartShelf</Title>
            <Paragraph style={styles.appInfo}>
              SmartShelf helps you track your fridge items and reduce food waste by 
              sending timely notifications about expiry dates. Keep your food fresh 
              and organized with our intelligent tracking system.
            </Paragraph>
            
            <View style={styles.versionContainer}>
              <Text style={styles.versionLabel}>Version</Text>
              <Text style={styles.versionNumber}>1.0.0</Text>
            </View>
            
            <View style={styles.versionContainer}>
              <Text style={styles.versionLabel}>Build</Text>
              <Text style={styles.versionNumber}>2024.01.01</Text>
            </View>
            
            <Divider style={styles.divider} />
            
            <View style={styles.linksContainer}>
              <Button 
                mode="text" 
                onPress={() => Alert.alert('Support', 'Support information will be available soon.')}
                style={styles.linkButton}
              >
                Support
              </Button>
              <Button 
                mode="text" 
                onPress={() => Alert.alert('Privacy Policy', 'Privacy policy will be available soon.')}
                style={styles.linkButton}
              >
                Privacy Policy
              </Button>
              <Button 
                mode="text" 
                onPress={() => Alert.alert('Terms of Service', 'Terms of service will be available soon.')}
                style={styles.linkButton}
              >
                Terms of Service
              </Button>
            </View>
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
  profileCard: {
    marginBottom: 16,
    backgroundColor: '#fff',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  profileContent: {
    padding: 20,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    backgroundColor: '#4caf50',
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  statusChip: {
    backgroundColor: '#e8f5e8',
    alignSelf: 'flex-start',
  },
  statusText: {
    color: '#4caf50',
    fontSize: 12,
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
    marginBottom: 20,
  },
  versionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  versionLabel: {
    fontSize: 14,
    color: '#666',
  },
  versionNumber: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  divider: {
    marginVertical: 16,
  },
  linksContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
  },
  linkButton: {
    marginHorizontal: 4,
    marginVertical: 4,
  },
});
