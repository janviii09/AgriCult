import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { auth, db } from '../config/firebase';
import { signOut } from 'firebase/auth';
import { collection, getDocs } from 'firebase/firestore';
import { useUser } from '../context/UserContext';
import MapView, { Marker, Callout } from 'react-native-maps';

export default function Home() {
  const [farmers, setFarmers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { userData } = useUser();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Fetch farmers
      const farmersSnapshot = await getDocs(collection(db, 'farmers'));
      const farmersData = farmersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setFarmers(farmersData);

      // Fetch suppliers
      const suppliersSnapshot = await getDocs(collection(db, 'suppliers'));
      const suppliersData = suppliersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSuppliers(suppliersData);
    } catch (error) {
      console.error('Error fetching users:', error);
      alert('Error loading users');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace('login');
    } catch (error) {
      console.error('Error signing out:', error);
      alert(error.message);
    }
  };

  if (!userData || loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#22c55e" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      <ScrollView className="flex-1">
        {/* User Profile Section */}
        <View className="bg-green-500 p-6">
          <Text className="text-white text-2xl font-bold mb-2">
            Welcome, {userData.firstName} {userData.lastName}
          </Text>
          <Text className="text-white mb-1">Phone: {userData.phoneNumber}</Text>
          <Text className="text-white mb-1">Type: {userData.userType}</Text>
          <Text className="text-white">Address: {userData.address}</Text>
        </View>

        {/* Map Section */}
        <View className="h-96 w-full">
          <MapView
            className="flex-1"
            initialRegion={{
              latitude: userData.coordinates?.latitude || 20.5937,
              longitude: userData.coordinates?.longitude || 78.9629,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            }}
          >
            {/* Current User Marker */}
            {userData.coordinates && (
              <Marker
                coordinate={{
                  latitude: userData.coordinates.latitude,
                  longitude: userData.coordinates.longitude,
                }}
                pinColor="green"
              >
                <Callout>
                  <View className="p-2">
                    <Text className="font-bold">You are here</Text>
                    <Text>{userData.firstName} {userData.lastName}</Text>
                    <Text>{userData.userType}</Text>
                  </View>
                </Callout>
              </Marker>
            )}

            {/* Farmers Markers */}
            {farmers.map((farmer) => (
              farmer.coordinates && (
                <Marker
                  key={farmer.id}
                  coordinate={{
                    latitude: farmer.coordinates.latitude,
                    longitude: farmer.coordinates.longitude,
                  }}
                  pinColor="blue"
                >
                  <Callout>
                    <View className="p-2">
                      <Text className="font-bold">Farmer</Text>
                      <Text>{farmer.firstName} {farmer.lastName}</Text>
                      <Text>{farmer.phoneNumber}</Text>
                    </View>
                  </Callout>
                </Marker>
              )
            ))}

            {/* Suppliers Markers */}
            {suppliers.map((supplier) => (
              supplier.coordinates && (
                <Marker
                  key={supplier.id}
                  coordinate={{
                    latitude: supplier.coordinates.latitude,
                    longitude: supplier.coordinates.longitude,
                  }}
                  pinColor="red"
                >
                  <Callout>
                    <View className="p-2">
                      <Text className="font-bold">Supplier</Text>
                      <Text>{supplier.firstName} {supplier.lastName}</Text>
                      <Text>{supplier.phoneNumber}</Text>
                    </View>
                  </Callout>
                </Marker>
              )
            ))}
          </MapView>
        </View>

        {/* Legend */}
        <View className="p-4 bg-white">
          <Text className="font-bold mb-2">Map Legend:</Text>
          <View className="flex-row items-center mb-1">
            <View className="w-4 h-4 bg-green-500 rounded-full mr-2" />
            <Text>Your Location</Text>
          </View>
          <View className="flex-row items-center mb-1">
            <View className="w-4 h-4 bg-blue-500 rounded-full mr-2" />
            <Text>Farmers</Text>
          </View>
          <View className="flex-row items-center">
            <View className="w-4 h-4 bg-red-500 rounded-full mr-2" />
            <Text>Suppliers</Text>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          className="bg-red-500 m-4 p-4 rounded-full"
          onPress={handleLogout}
        >
          <Text className="text-white text-center font-semibold text-lg">
            Logout
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
