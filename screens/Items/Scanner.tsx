import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Dimensions,
    StyleSheet,
    View
} from 'react-native';
import {
    ActivityIndicator,
    Button,
    Card,
    Snackbar,
    Text,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../supabase/supabase';

const { width, height } = Dimensions.get('window');

interface FridgeItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  expiry_date: string;
  qr_code_id: string;
  created_at: string;
}

export default function Scanner() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [scannerVisible, setScannerVisible] = useState(true);
  
  const router = useRouter();
  const { user } = useAuth();

  const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
    if (scanned || !user) return;
    
    setScanned(true);
    setLoading(true);
    setScannerVisible(false);

    try {
      // Look up the item in Supabase using the QR code ID
      const { data: item, error } = await supabase
        .from('fridge_items')
        .select('*')
        .eq('qr_code_id', data)
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error looking up item:', error);
        if (error.code === 'PGRST116') {
          setSnackbarMessage('Item not found. Please check your QR code.');
        } else {
          setSnackbarMessage('Error looking up item. Please try again.');
        }
        setShowSnackbar(true);
        resetScanner();
        return;
      }

      if (!item) {
        setSnackbarMessage('Item not found. Please check your QR code.');
        setShowSnackbar(true);
        resetScanner();
        return;
      }

      // Navigate to item detail screen with the scanned item
      router.push({
        pathname: '/item-detail' as any,
        params: {
          itemId: item.id,
          itemName: item.name,
          itemCategory: item.category,
          itemQuantity: item.quantity.toString(),
          itemExpiryDate: item.expiry_date,
          itemQrCodeId: item.qr_code_id,
          itemCreatedAt: item.created_at,
        },
      });

    } catch (error) {
      console.error('Unexpected error:', error);
      setSnackbarMessage('An unexpected error occurred. Please try again.');
      setShowSnackbar(true);
      resetScanner();
    } finally {
      setLoading(false);
    }
  };

  const resetScanner = () => {
    setScanned(false);
    setScannerVisible(true);
  };

  if (!permission) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Requesting camera permission...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Card style={styles.permissionCard}>
            <Card.Content style={styles.permissionContent}>
              <Text style={styles.permissionTitle}>Camera Permission Required</Text>
              <Text style={styles.permissionText}>
                SmartShelf needs access to your camera to scan QR codes on your items.
              </Text>
              <Button
                mode="contained"
                onPress={requestPermission}
                style={styles.permissionButton}
              >
                Grant Permission
              </Button>
            </Card.Content>
          </Card>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {scannerVisible && (
        <CameraView
          style={styles.scanner}
          facing={CameraType.back}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ["qr", "pdf417"],
          }}
        />
      )}

      {/* Overlay */}
      <View style={styles.overlay}>
        <View style={styles.overlayTop} />
        <View style={styles.overlayMiddle}>
          <View style={styles.overlaySide} />
          <View style={styles.scanArea} />
          <View style={styles.overlaySide} />
        </View>
        <View style={styles.overlayBottom} />
      </View>

      {/* Instructions */}
      <View style={styles.instructionsContainer}>
        <Card style={styles.instructionsCard}>
          <Card.Content style={styles.instructionsContent}>
            <Text style={styles.instructionsTitle}>Scan QR Code</Text>
            <Text style={styles.instructionsText}>
              Point your camera at the QR code on your item to view details and expiry information.
            </Text>
          </Card.Content>
        </Card>
      </View>

      {/* Reset Button */}
      {scanned && (
        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            onPress={resetScanner}
            style={styles.resetButton}
            disabled={loading}
          >
            Scan Again
          </Button>
        </View>
      )}

      {/* Loading Indicator */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Looking up item...</Text>
        </View>
      )}

      {/* Snackbar for messages */}
      <Snackbar
        visible={showSnackbar}
        onDismiss={() => setShowSnackbar(false)}
        duration={3000}
        style={styles.snackbar}
      >
        {snackbarMessage}
      </Snackbar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  scanner: {
    flex: 1,
    width: width,
    height: height,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayTop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    width: '100%',
  },
  overlayMiddle: {
    flexDirection: 'row',
    height: 250,
    width: '100%',
  },
  overlaySide: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  scanArea: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#4CAF50',
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  overlayBottom: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    width: '100%',
  },
  instructionsContainer: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
  },
  instructionsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  instructionsContent: {
    alignItems: 'center',
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  instructionsText: {
    textAlign: 'center',
    color: '#666',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
  },
  resetButton: {
    borderRadius: 25,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 16,
    fontSize: 16,
  },
  permissionCard: {
    width: '100%',
    maxWidth: 400,
  },
  permissionContent: {
    alignItems: 'center',
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  permissionText: {
    textAlign: 'center',
    marginBottom: 24,
    color: '#666',
    lineHeight: 22,
  },
  permissionButton: {
    borderRadius: 25,
  },
  snackbar: {
    marginBottom: 100,
  },
});
