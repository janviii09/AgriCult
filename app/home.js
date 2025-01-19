import { View, Text, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/');
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <View className="flex-1 bg-white p-4">
      <Stack.Screen 
        options={{
          headerShown: false,
        }}
      />
      
      <View className="flex-1 justify-center items-center">
        <Text className="text-4xl font-bold mb-8">Welcome!</Text>
        <Text className="text-lg mb-4">
          Phone: {user?.phoneNumber}
        </Text>
        
        <TouchableOpacity
          className="bg-red-500 px-8 py-4 rounded-full"
          onPress={handleLogout}
        >
          <Text className="text-white font-semibold text-xl">
            Logout
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
