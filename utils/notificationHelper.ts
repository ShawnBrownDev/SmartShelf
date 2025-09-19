import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface NotificationData {
  itemId: string;
  itemName: string;
  expiryDate: string;
  type: 'expiry-reminder' | 'expired-alert';
}

export class NotificationHelper {
  /**
   * Request notification permissions
   */
  static async requestPermissions(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Notification permission denied');
        return false;
      }

      // Configure notification channel for Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      return true;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  /**
   * Schedule a notification for 3 days before expiry
   */
  static async scheduleExpiryReminder(data: NotificationData): Promise<string | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.log('Cannot schedule notification: permission denied');
        return null;
      }

      const expiryDate = new Date(data.expiryDate);
      const reminderDate = new Date(expiryDate);
      reminderDate.setDate(expiryDate.getDate() - 3);

      // Don't schedule if the reminder date is in the past
      if (reminderDate <= new Date()) {
        console.log('Cannot schedule reminder: date is in the past');
        return null;
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '🕒 Expiry Reminder',
          body: `${data.itemName} expires in 3 days!`,
          data: {
            itemId: data.itemId,
            itemName: data.itemName,
            expiryDate: data.expiryDate,
            type: 'expiry-reminder',
          },
          sound: true,
        },
        trigger: reminderDate as any,
      });

      console.log(`Scheduled expiry reminder for ${data.itemName}: ${notificationId}`);
      return notificationId;
    } catch (error) {
      console.error('Error scheduling expiry reminder:', error);
      return null;
    }
  }

  /**
   * Schedule daily alerts for expired items
   */
  static async scheduleExpiredAlert(data: NotificationData): Promise<string | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.log('Cannot schedule notification: permission denied');
        return null;
      }

      const expiryDate = new Date(data.expiryDate);
      const now = new Date();

      // Only schedule if the item is already expired
      if (expiryDate > now) {
        console.log('Cannot schedule expired alert: item not yet expired');
        return null;
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '⚠️ Item Expired',
          body: `${data.itemName} has expired! Please check and remove it.`,
          data: {
            itemId: data.itemId,
            itemName: data.itemName,
            expiryDate: data.expiryDate,
            type: 'expired-alert',
          },
          sound: true,
        },
        trigger: {
          seconds: 60, // Schedule for 1 minute from now (for testing)
          repeats: true, // Repeat daily
        } as any,
      });

      console.log(`Scheduled expired alert for ${data.itemName}: ${notificationId}`);
      return notificationId;
    } catch (error) {
      console.error('Error scheduling expired alert:', error);
      return null;
    }
  }

  /**
   * Cancel a specific notification
   */
  static async cancelNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      console.log(`Cancelled notification: ${notificationId}`);
    } catch (error) {
      console.error('Error cancelling notification:', error);
    }
  }

  /**
   * Cancel all notifications for a specific item
   */
  static async cancelItemNotifications(itemId: string): Promise<void> {
    try {
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
      
      for (const notification of scheduledNotifications) {
        const data = notification.content.data as unknown;
        if (data && typeof data === 'object' && 'itemId' in data && data.itemId === itemId) {
          await Notifications.cancelScheduledNotificationAsync(notification.identifier);
          console.log(`Cancelled notification for item ${itemId}: ${notification.identifier}`);
        }
      }
    } catch (error) {
      console.error('Error cancelling item notifications:', error);
    }
  }

  /**
   * Get all scheduled notifications
   */
  static async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      return [];
    }
  }

  /**
   * Clear all notifications
   */
  static async clearAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('Cleared all notifications');
    } catch (error) {
      console.error('Error clearing all notifications:', error);
    }
  }

  /**
   * Handle notification response (when user taps notification)
   */
  static handleNotificationResponse = (response: Notifications.NotificationResponse) => {
    const data = response.notification.request.content.data as unknown;
    
    if (data && typeof data === 'object' && 'itemId' in data) {
      console.log('Notification tapped:', data);
      // You can add navigation logic here based on the notification type
      // For example, navigate to item detail screen
    }
  };

  /**
   * Initialize notification listener
   */
  static initializeNotificationListener(): () => void {
    // Listen for notification responses
    const subscription = Notifications.addNotificationResponseReceivedListener(
      this.handleNotificationResponse
    );

    // Return cleanup function
    return () => {
      subscription.remove();
    };
  }
}
