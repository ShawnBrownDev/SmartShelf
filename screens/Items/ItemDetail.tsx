import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import {
  Button,
  Card,
  Chip,
  Divider,
  Paragraph,
  Text,
  Title,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';

interface ItemDetailParams {
  itemId: string;
  itemName: string;
  itemCategory: string;
  itemQuantity: string;
  itemExpiryDate: string;
  itemQrCodeId: string;
  itemCreatedAt: string;
}

export default function ItemDetail() {
  const params = useLocalSearchParams() as unknown as ItemDetailParams;
  const router = useRouter();
  const { user } = useAuth();

  const {
    itemId,
    itemName,
    itemCategory,
    itemQuantity,
    itemExpiryDate,
    itemQrCodeId,
    itemCreatedAt,
  } = params;

  // Calculate days until expiry
  const getDaysUntilExpiry = (expiryDate: string): number => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getExpiryStatus = (expiryDate: string) => {
    const daysUntilExpiry = getDaysUntilExpiry(expiryDate);
    
    if (daysUntilExpiry < 0) {
      return { status: 'expired', color: '#f44336', text: 'Expired' };
    } else if (daysUntilExpiry <= 3) {
      return { status: 'near-expiry', color: '#ff9800', text: 'Near Expiry' };
    } else {
      return { status: 'safe', color: '#4caf50', text: 'Safe' };
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCreatedDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const daysUntilExpiry = getDaysUntilExpiry(itemExpiryDate);
  const expiryStatus = getExpiryStatus(itemExpiryDate);

  const getExpiryMessage = () => {
    if (daysUntilExpiry < 0) {
      return `This item expired ${Math.abs(daysUntilExpiry)} day${Math.abs(daysUntilExpiry) !== 1 ? 's' : ''} ago.`;
    } else if (daysUntilExpiry === 0) {
      return 'This item expires today!';
    } else if (daysUntilExpiry <= 3) {
      return `This item expires in ${daysUntilExpiry} day${daysUntilExpiry !== 1 ? 's' : ''}.`;
    } else {
      return `This item is good for ${daysUntilExpiry} more day${daysUntilExpiry !== 1 ? 's' : ''}.`;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header Card */}
        <Card style={styles.headerCard}>
          <Card.Content style={styles.headerContent}>
            <Title style={styles.itemName}>{itemName}</Title>
            <Chip
              icon="tag"
              style={[styles.categoryChip, { backgroundColor: '#e3f2fd' }]}
              textStyle={styles.categoryText}
            >
              {itemCategory}
            </Chip>
          </Card.Content>
        </Card>

        {/* Expiry Status Card */}
        <Card style={styles.statusCard}>
          <Card.Content style={styles.statusContent}>
            <View style={styles.statusHeader}>
              <Text style={styles.statusTitle}>Expiry Status</Text>
              <Chip
                style={[styles.statusChip, { backgroundColor: expiryStatus.color }]}
                textStyle={styles.statusChipText}
              >
                {expiryStatus.text}
              </Chip>
            </View>
            <Paragraph style={styles.expiryMessage}>
              {getExpiryMessage()}
            </Paragraph>
          </Card.Content>
        </Card>

        {/* Item Details Card */}
        <Card style={styles.detailsCard}>
          <Card.Content>
            <Title style={styles.detailsTitle}>Item Details</Title>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Quantity:</Text>
              <Text style={styles.detailValue}>{itemQuantity}</Text>
            </View>
            
            <Divider style={styles.divider} />
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Expiry Date:</Text>
              <Text style={styles.detailValue}>{formatDate(itemExpiryDate)}</Text>
            </View>
            
            <Divider style={styles.divider} />
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Added:</Text>
              <Text style={styles.detailValue}>{formatCreatedDate(itemCreatedAt)}</Text>
            </View>
            
            <Divider style={styles.divider} />
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>QR Code ID:</Text>
              <Text style={styles.qrCodeId}>{itemQrCodeId}</Text>
            </View>
          </Card.Content>
        </Card>

        {/* Actions Card */}
        <Card style={styles.actionsCard}>
          <Card.Content style={styles.actionsContent}>
            <Button
              mode="contained"
              onPress={() => router.back()}
              style={styles.backButton}
              icon="arrow-left"
            >
              Back to Scanner
            </Button>
            <Button
              mode="outlined"
              onPress={() => router.push('/(tabs)')}
              style={styles.homeButton}
              icon="home"
            >
              Go to Dashboard
            </Button>
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
  itemName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  categoryChip: {
    marginBottom: 8,
  },
  categoryText: {
    color: '#1976d2',
    fontWeight: '500',
  },
  statusCard: {
    marginBottom: 16,
  },
  statusContent: {
    alignItems: 'center',
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 12,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  statusChip: {
    borderRadius: 16,
  },
  statusChipText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  expiryMessage: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
  },
  detailsCard: {
    marginBottom: 16,
  },
  detailsTitle: {
    marginBottom: 16,
    fontSize: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  detailLabel: {
    fontSize: 16,
    color: '#666',
    flex: 1,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  qrCodeId: {
    fontSize: 14,
    fontFamily: 'monospace',
    color: '#666',
    flex: 1,
    textAlign: 'right',
  },
  divider: {
    marginVertical: 8,
  },
  actionsCard: {
    marginBottom: 16,
  },
  actionsContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  backButton: {
    flex: 1,
    borderRadius: 25,
  },
  homeButton: {
    flex: 1,
    borderRadius: 25,
  },
});
