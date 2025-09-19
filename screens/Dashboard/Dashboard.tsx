import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/supabase/supabase';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    FlatList,
    RefreshControl,
    StyleSheet,
    View,
} from 'react-native';
import {
    ActivityIndicator,
    Card,
    Chip,
    FAB,
    Paragraph,
    Snackbar,
    Text,
    Title,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

interface FridgeItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  expiry_date: string;
  qr_code_id: string;
  created_at: string;
}

interface ExpiryStatus {
  status: 'safe' | 'near-expiry' | 'expired';
  color: string;
  text: string;
  daysUntilExpiry: number;
}

export default function Dashboard() {
  const [items, setItems] = useState<FridgeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchItems();
    }
  }, [user]);

  const fetchItems = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('fridge_items')
        .select('*')
        .eq('user_id', user.id)
        .order('expiry_date', { ascending: true }); // Sort by expiry date

      if (error) {
        console.error('Error fetching items:', error);
        setSnackbarMessage('Failed to load items. Please try again.');
        setShowSnackbar(true);
        return;
      }

      setItems(data || []);
    } catch (error) {
      console.error('Unexpected error:', error);
      setSnackbarMessage('An unexpected error occurred. Please try again.');
      setShowSnackbar(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchItems();
  };

  const getExpiryStatus = (expiryDate: string): ExpiryStatus => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { 
        status: 'expired', 
        color: '#f44336', 
        text: 'Expired',
        daysUntilExpiry: diffDays
      };
    } else if (diffDays <= 3) {
      return { 
        status: 'near-expiry', 
        color: '#ff9800', 
        text: 'Near Expiry',
        daysUntilExpiry: diffDays
      };
    } else {
      return { 
        status: 'safe', 
        color: '#4caf50', 
        text: 'Safe',
        daysUntilExpiry: diffDays
      };
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getExpiryMessage = (expiryDate: string): string => {
    const status = getExpiryStatus(expiryDate);
    const days = status.daysUntilExpiry;
    
    if (days < 0) {
      return `Expired ${Math.abs(days)} day${Math.abs(days) !== 1 ? 's' : ''} ago`;
    } else if (days === 0) {
      return 'Expires today!';
    } else if (days === 1) {
      return 'Expires tomorrow';
    } else if (days <= 3) {
      return `Expires in ${days} days`;
    } else {
      return `Expires in ${days} days`;
    }
  };

  const renderItem = ({ item }: { item: FridgeItem }) => {
    const expiryStatus = getExpiryStatus(item.expiry_date);
    
    return (
      <Card 
        style={[
          styles.itemCard,
          { borderLeftColor: expiryStatus.color, borderLeftWidth: 4 }
        ]}
        onPress={() => {
          // Navigate to item detail
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
        }}
      >
        <Card.Content style={styles.itemContent}>
          <View style={styles.itemHeader}>
            <Title style={styles.itemName}>{item.name}</Title>
            <Chip
              style={[styles.statusChip, { backgroundColor: expiryStatus.color }]}
              textStyle={styles.statusChipText}
            >
              {expiryStatus.text}
            </Chip>
          </View>
          
          <View style={styles.itemDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Category:</Text>
              <Text style={styles.detailValue}>{item.category}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Quantity:</Text>
              <Text style={styles.detailValue}>{item.quantity}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Expiry:</Text>
              <Text style={[styles.detailValue, { color: expiryStatus.color }]}>
                {formatDate(item.expiry_date)}
              </Text>
            </View>
          </View>
          
          <Paragraph style={[styles.expiryMessage, { color: expiryStatus.color }]}>
            {getExpiryMessage(item.expiry_date)}
          </Paragraph>
        </Card.Content>
      </Card>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>No Items Yet</Text>
      <Paragraph style={styles.emptyText}>
        Start by adding your first item to track its expiry date!
      </Paragraph>
    </View>
  );

  const getStatsSummary = () => {
    const total = items.length;
    const expired = items.filter(item => getExpiryStatus(item.expiry_date).status === 'expired').length;
    const nearExpiry = items.filter(item => getExpiryStatus(item.expiry_date).status === 'near-expiry').length;
    const safe = items.filter(item => getExpiryStatus(item.expiry_date).status === 'safe').length;
    
    return { total, expired, nearExpiry, safe };
  };

  const stats = getStatsSummary();

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Loading your items...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with Stats */}
      <View style={styles.headerContainer}>
        <Title style={styles.headerTitle}>SmartShelf Dashboard</Title>
        {items.length > 0 && (
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.total}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: '#4caf50' }]}>{stats.safe}</Text>
              <Text style={styles.statLabel}>Safe</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: '#ff9800' }]}>{stats.nearExpiry}</Text>
              <Text style={styles.statLabel}>Near Expiry</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: '#f44336' }]}>{stats.expired}</Text>
              <Text style={styles.statLabel}>Expired</Text>
            </View>
          </View>
        )}
      </View>

      {/* Items List */}
      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />

      {/* Floating Action Button */}
      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => router.push('/(tabs)/add-item')}
        label="Add Item"
      />

      {/* Snackbar for messages */}
      <Snackbar
        visible={showSnackbar}
        onDismiss={() => setShowSnackbar(false)}
        duration={3000}
      >
        {snackbarMessage}
      </Snackbar>
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
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  headerContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  itemCard: {
    marginBottom: 12,
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  itemContent: {
    padding: 16,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemName: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 8,
  },
  statusChip: {
    borderRadius: 12,
  },
  statusChipText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  itemDetails: {
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  expiryMessage: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    lineHeight: 22,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#4caf50',
  },
});
