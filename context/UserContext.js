import { createContext, useContext, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const UserContext = createContext();

export function UserProvider({ children }) {
  const [userData, setUserData] = useState(null);

  const updateUserData = async (data) => {
    try {
      await AsyncStorage.setItem('userData', JSON.stringify(data));
      setUserData(data);
    } catch (error) {
      console.error('Error saving user data:', error);
    }
  };

  const loadUserData = async () => {
    try {
      const savedData = await AsyncStorage.getItem('userData');
      if (savedData) {
        setUserData(JSON.parse(savedData));
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  return (
    <UserContext.Provider value={{ userData, updateUserData, loadUserData }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
