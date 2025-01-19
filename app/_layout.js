import '../polyfills';
import { Stack } from 'expo-router';
import '../global.css';
import { AuthProvider } from '../context/AuthContext';
import { UserProvider } from '../context/UserContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <UserProvider>
        <Stack />
      </UserProvider>
    </AuthProvider>
  );
}
