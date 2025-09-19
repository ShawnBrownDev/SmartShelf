import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  TextInput,
  Button,
  Card,
  Title,
  Paragraph,
  RadioButton,
  ActivityIndicator,
  Snackbar,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import { supabase } from '../../supabase/supabase';
import { useAuth } from '../../hooks/useAuth';
import { NotificationHelper } from '../../utils/notificationHelper';

interface AddItemFormData {
  name: string;
  category: string;
  quantity: string;
  expiryDate: string;
}

const CATEGORIES = [
  'Dairy',
  'Meat',
  'Vegetables',
  'Fruits',
  'Grains',
  'Beverages',
  'Snacks',
  'Frozen',
  'Other',
];

export default function AddItem() {
  const [formData, setFormData] = useState<AddItemFormData>({
    name: '',
    category: '',
    quantity: '',
    expiryDate: '',
  });
  const [loading, setLoading] = useState(false);
  const [qrCodeId, setQrCodeId] = useState<string | null>(null);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Get current user
  const { user } = useAuth();

  const generateQRCodeId = (): string => {
    // Generate a unique QR code ID using timestamp and random string
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 8);
    return `${timestamp}_${randomStr}`;
  };

  const handleInputChange = (field: keyof AddItemFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      setSnackbarMessage('Please enter an item name');
      setShowSnackbar(true);
      return false;
    }
    if (!formData.category) {
      setSnackbarMessage('Please select a category');
      setShowSnackbar(true);
      return false;
    }
    if (!formData.quantity || parseInt(formData.quantity) <= 0) {
      setSnackbarMessage('Please enter a valid quantity');
      setShowSnackbar(true);
      return false;
    }
    if (!formData.expiryDate) {
      setSnackbarMessage('Please select an expiry date');
      setShowSnackbar(true);
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm() || !user) return;

    setLoading(true);
    try {
      // Generate unique QR code ID
      const newQrCodeId = generateQRCodeId();
      
      // Insert item into Supabase
      const { data, error } = await supabase
        .from('fridge_items')
        .insert([
          {
            user_id: user.id,
            name: formData.name.trim(),
            category: formData.category,
            quantity: parseInt(formData.quantity),
            expiry_date: formData.expiryDate,
            qr_code_id: newQrCodeId,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('Error inserting item:', error);
        setSnackbarMessage('Failed to save item. Please try again.');
        setShowSnackbar(true);
        return;
      }

      // Set QR code ID for display
      setQrCodeId(newQrCodeId);
      
      // Schedule notifications for the new item
      try {
        const notificationData = {
          itemId: data.id,
          itemName: formData.name.trim(),
          expiryDate: formData.expiryDate,
          type: 'expiry-reminder' as const,
        };

        // Schedule expiry reminder (3 days before)
        await NotificationHelper.scheduleExpiryReminder(notificationData);

        // Schedule expired alert if item is already expired
        const expiryDate = new Date(formData.expiryDate);
        const now = new Date();
        if (expiryDate <= now) {
          await NotificationHelper.scheduleExpiredAlert({
            ...notificationData,
            type: 'expired-alert',
          });
        }
      } catch (notificationError) {
        console.error('Error scheduling notifications:', notificationError);
        // Don't fail the entire operation if notifications fail
      }
      
      // Show success message
      setSnackbarMessage('Item added successfully!');
      setShowSnackbar(true);

      // Reset form after successful submission
      setTimeout(() => {
        setFormData({
          name: '',
          category: '',
          quantity: '',
          expiryDate: '',
        });
        setQrCodeId(null);
      }, 2000);

    } catch (error) {
      console.error('Unexpected error:', error);
      setSnackbarMessage('An unexpected error occurred. Please try again.');
      setShowSnackbar(true);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      quantity: '',
      expiryDate: '',
    });
    setQrCodeId(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <Card style={styles.card}>
            <Card.Content>
              <Title style={styles.title}>Add New Item</Title>
              
              {/* Item Name */}
              <TextInput
                label="Item Name *"
                value={formData.name}
                onChangeText={(value) => handleInputChange('name', value)}
                mode="outlined"
                style={styles.input}
                disabled={loading}
              />

              {/* Category Selection */}
              <View style={styles.categoryContainer}>
                <Paragraph style={styles.categoryLabel}>Category *</Paragraph>
                <RadioButton.Group
                  onValueChange={(value) => handleInputChange('category', value)}
                  value={formData.category}
                >
                  {CATEGORIES.map((category) => (
                    <View key={category} style={styles.radioRow}>
                      <RadioButton
                        value={category}
                        disabled={loading}
                      />
                      <Paragraph style={styles.radioLabel}>{category}</Paragraph>
                    </View>
                  ))}
                </RadioButton.Group>
              </View>

              {/* Quantity */}
              <TextInput
                label="Quantity *"
                value={formData.quantity}
                onChangeText={(value) => handleInputChange('quantity', value)}
                mode="outlined"
                keyboardType="numeric"
                style={styles.input}
                disabled={loading}
              />

              {/* Expiry Date */}
              <TextInput
                label="Expiry Date *"
                value={formData.expiryDate}
                onChangeText={(value) => handleInputChange('expiryDate', value)}
                mode="outlined"
                placeholder="YYYY-MM-DD"
                style={styles.input}
                disabled={loading}
              />

              {/* Submit Button */}
              <Button
                mode="contained"
                onPress={handleSubmit}
                style={styles.submitButton}
                disabled={loading}
                loading={loading}
              >
                {loading ? 'Adding Item...' : 'Add Item'}
              </Button>

              {/* Reset Button */}
              <Button
                mode="outlined"
                onPress={resetForm}
                style={styles.resetButton}
                disabled={loading}
              >
                Reset Form
              </Button>
            </Card.Content>
          </Card>

          {/* QR Code Display */}
          {qrCodeId && (
            <Card style={styles.qrCard}>
              <Card.Content style={styles.qrContent}>
                <Title style={styles.qrTitle}>QR Code Generated!</Title>
                <Paragraph style={styles.qrDescription}>
                  Print this QR code and stick it to your item for easy scanning.
                </Paragraph>
                <View style={styles.qrCodeContainer}>
                  <QRCode
                    value={qrCodeId}
                    size={200}
                    backgroundColor="white"
                    color="black"
                  />
                </View>
                <Paragraph style={styles.qrCodeId}>
                  ID: {qrCodeId}
                </Paragraph>
              </Card.Content>
            </Card>
          )}
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
    padding: 16,
    paddingBottom: 100,
  },
  card: {
    marginBottom: 16,
  },
  title: {
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    marginBottom: 16,
  },
  categoryContainer: {
    marginBottom: 16,
  },
  categoryLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  radioLabel: {
    marginLeft: 8,
  },
  submitButton: {
    marginTop: 16,
    marginBottom: 8,
  },
  resetButton: {
    marginBottom: 16,
  },
  qrCard: {
    marginTop: 16,
  },
  qrContent: {
    alignItems: 'center',
  },
  qrTitle: {
    marginBottom: 8,
    color: '#4CAF50',
  },
  qrDescription: {
    textAlign: 'center',
    marginBottom: 20,
  },
  qrCodeContainer: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  qrCodeId: {
    fontSize: 12,
    fontFamily: 'monospace',
    textAlign: 'center',
    color: '#666',
  },
});
