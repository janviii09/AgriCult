import { View, Text, StatusBar, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';

export default function Index() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-white justify-center items-center space-y-6">
      <Stack.Screen 
        options={{
          headerShown: false,
        }} 
      />
      <StatusBar barStyle="dark-content" />
      <Text className='text-6xl font-bold'>
        <Text className="text-green-400">Agri</Text>
        <Text className="text-black">Cult</Text>
      </Text>
      <Text className='text-2xl my-5'>Ab market apni mutthi mein</Text>
      <View className='flex-row space-x-4 gap-8 mt-5'>
        <TouchableOpacity 
          className="bg-green-500 px-8 py-4 rounded-full"
          onPress={() => router.push('signup')}
        >
          <Text className="text-white font-semibold text-xl">Sign Up</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          className="bg-black px-8 py-4 rounded-full"
          onPress={() => router.push('login')}
        >
          <Text className="text-white font-semibold text-xl">Login</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
