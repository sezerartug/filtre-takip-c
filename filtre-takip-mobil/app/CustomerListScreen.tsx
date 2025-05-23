import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { Text, Button, Card } from 'react-native-paper';
import { fetchCustomers } from '../constants/customerService';
import { Customer } from '../constants/types';

export default function CustomerListScreen({ navigation }: any) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const data = await fetchCustomers();
      setCustomers(data);
    } catch (e) {
      // Hata yönetimi eklenebilir
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  return (
    <View style={styles.container}>
      <Button mode="contained" onPress={() => navigation.navigate('AddCustomer')}>Yeni Müşteri Ekle</Button>
      <FlatList
        data={customers}
        keyExtractor={item => item.id}
        refreshing={loading}
        onRefresh={loadCustomers}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <Card.Title title={`${item.name} ${item.surname}`} />
            <Card.Content>
              <Text>Adres: {item.address}</Text>
              <Text>Satın alma: {item.purchaseDate}</Text>
            </Card.Content>
          </Card>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  card: {
    marginVertical: 8,
  },
}); 