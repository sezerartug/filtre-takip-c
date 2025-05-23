import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Button } from 'react-native-paper';
import { addCustomerToDb } from '../constants/customerService';

export default function AddCustomerScreen({ navigation }: any) {
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [address, setAddress] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
    setLoading(true);
    try {
      await addCustomerToDb({ name, surname, address, purchaseDate });
      navigation.goBack();
    } catch (e) {
      // Hata yönetimi eklenebilir
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput label="Ad" value={name} onChangeText={setName} style={styles.input} />
      <TextInput label="Soyad" value={surname} onChangeText={setSurname} style={styles.input} />
      <TextInput label="Adres" value={address} onChangeText={setAddress} style={styles.input} />
      <TextInput label="Satın Alma Tarihi (YYYY-MM-DD)" value={purchaseDate} onChangeText={setPurchaseDate} style={styles.input} />
      <Button mode="contained" onPress={handleAdd} loading={loading} disabled={loading} style={styles.button}>Ekle</Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
    justifyContent: 'center',
  },
  input: {
    marginBottom: 12,
  },
  button: {
    marginTop: 8,
  },
}); 