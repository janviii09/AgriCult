import { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, TextInput, ScrollView } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import PhoneInput from 'react-native-phone-number-input';
import { auth, db } from '../config/firebase';
import { PhoneAuthProvider, signInWithCredential } from 'firebase/auth';
import { doc, setDoc, collection } from 'firebase/firestore';
import { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import * as Location from 'expo-location';
import { useUser } from '../context/UserContext';
import { firebaseConfig, GOOGLE_MAPS_API_KEY } from '../config/keys';

export default function Signup() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [address, setAddress] = useState('');
  const [coordinates, setCoordinates] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [userType, setUserType] = useState(''); // 'farmer' or 'supplier'
  const [verificationId, setVerificationId] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [step, setStep] = useState(1); // 1: user details, 2: OTP verification
  const router = useRouter();
  const recaptchaVerifier = useRef(null);
  const { updateUserData } = useUser();

  const getCurrentLocation = async () => {
    try {
      setLocationLoading(true);
      setLocationError('');
      
      // Request permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Location permission denied');
        return;
      }

      // Get current position
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 5000,
        distanceInterval: 0
      });

      if (!location) {
        throw new Error('Could not get location');
      }

      // Save coordinates
      setCoordinates({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      });

      // Use Google Geocoding API
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${location.coords.latitude},${location.coords.longitude}&key=${GOOGLE_MAPS_API_KEY}`
      );

      const data = await response.json();

      if (data.status !== 'OK' || !data.results || data.results.length === 0) {
        throw new Error('Could not get address from location');
      }

      // Get the most accurate address
      const formattedAddress = data.results[0].formatted_address;
      setAddress(formattedAddress);

      // Clear any previous errors
      setLocationError('');
    } catch (error) {
      console.error('Location error:', error);
      setLocationError(error.message);
      alert('Error getting location: ' + error.message);
    } finally {
      setLocationLoading(false);
    }
  };

  const validateUserDetails = () => {
    if (!firstName.trim()) {
      alert('Please enter your first name');
      return false;
    }
    if (!lastName.trim()) {
      alert('Please enter your last name');
      return false;
    }
    if (!address.trim()) {
      alert('Please enter your address');
      return false;
    }
    if (!phoneNumber) {
      alert('Please enter your phone number');
      return false;
    }
    if (!userType) {
      alert('Please select whether you are a farmer or supplier');
      return false;
    }
    return true;
  };

  const sendVerificationCode = async () => {
    if (!validateUserDetails()) return;

    try {
      setLoading(true);
      const formattedNumber = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
      const phoneProvider = new PhoneAuthProvider(auth);
      const verificationId = await phoneProvider.verifyPhoneNumber(
        formattedNumber,
        recaptchaVerifier.current
      );
      setVerificationId(verificationId);
      setStep(2);
      alert('Verification code has been sent to your phone.');
    } catch (error) {
      console.error('Error:', error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const saveUserToFirestore = async (uid) => {
    try {
      const userData = {
        uid,
        firstName,
        lastName,
        phoneNumber,
        address,
        coordinates,
        userType,
        createdAt: new Date().toISOString()
      };

      // Save to appropriate collection based on user type
      const collectionName = userType === 'farmer' ? 'farmers' : 'suppliers';
      
      // Add a timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout saving user data')), 10000);
      });

      await Promise.race([
        setDoc(doc(db, collectionName, uid), userData),
        timeoutPromise
      ]);

      return userData;
    } catch (error) {
      console.error('Error saving user data:', error);
      throw new Error('Failed to save user data. Please try again.');
    }
  };

  const confirmCode = async () => {
    try {
      setLoading(true);
      
      // Add a timeout for the credential verification
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Verification timeout')), 10000);
      });

      const credential = PhoneAuthProvider.credential(verificationId, code);
      
      // Race between the auth operation and timeout
      const userCredential = await Promise.race([
        signInWithCredential(auth, credential),
        timeoutPromise
      ]);
      
      if (!userCredential || !userCredential.user) {
        throw new Error('Authentication failed');
      }

      // Save user data to Firestore
      const userData = await saveUserToFirestore(userCredential.user.uid);
      
      // Update local user context
      await updateUserData(userData);
      
      // Navigate to home
      router.replace('home');
    } catch (error) {
      console.error('Confirmation error:', error);
      setLoading(false);
      
      // Show specific error message
      if (error.message.includes('timeout')) {
        alert('Operation timed out. Please check your internet connection and try again.');
      } else if (error.code === 'auth/invalid-verification-code') {
        alert('Invalid verification code. Please try again.');
      } else {
        alert(error.message);
      }
    }
  };

  return (
    <ScrollView className="flex-1 bg-white">
      <Stack.Screen 
        options={{
          headerShown: false,
        }}
      />

      <FirebaseRecaptchaVerifierModal
        ref={recaptchaVerifier}
        firebaseConfig={firebaseConfig}
        attemptInvisible={false}
      />
      
      <View className="flex-1 p-4">
        <Text className="text-4xl font-bold mb-8 text-green-500 text-center mt-12">Sign Up</Text>
        
        {step === 1 ? (
          <View className="space-y-4">
            <Text className="text-lg mb-4 text-center">
              Create your account
            </Text>
            
            <TextInput
              value={firstName}
              onChangeText={setFirstName}
              placeholder="First Name"
              className="w-full p-4 border border-gray-300 rounded-lg text-lg"
            />

            <TextInput
              value={lastName}
              onChangeText={setLastName}
              placeholder="Last Name"
              className="w-full p-4 border border-gray-300 rounded-lg text-lg"
            />

            <View className="flex-row space-x-2">
              <TouchableOpacity
                onPress={() => setUserType('farmer')}
                className={`flex-1 p-4 rounded-lg ${
                  userType === 'farmer' ? 'bg-green-500' : 'bg-gray-100'
                }`}
              >
                <Text
                  className={`text-center ${
                    userType === 'farmer' ? 'text-white' : 'text-gray-600'
                  }`}
                >
                  Farmer
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setUserType('supplier')}
                className={`flex-1 p-4 rounded-lg ${
                  userType === 'supplier' ? 'bg-green-500' : 'bg-gray-100'
                }`}
              >
                <Text
                  className={`text-center ${
                    userType === 'supplier' ? 'text-white' : 'text-gray-600'
                  }`}
                >
                  Supplier
                </Text>
              </TouchableOpacity>
            </View>

            <View className="space-y-4">
              <GooglePlacesAutocomplete
                placeholder="Search for your address"
                onPress={(data, details = null) => {
                  setAddress(data.description);
                  if (details && details.geometry) {
                    setCoordinates({
                      latitude: details.geometry.location.lat,
                      longitude: details.geometry.location.lng
                    });
                  }
                }}
                query={{
                  key: GOOGLE_MAPS_API_KEY,
                  language: 'en',
                  components: 'country:in'
                }}
                styles={{
                  textInput: {
                    height: 56,
                    borderWidth: 1,
                    borderColor: '#d1d5db',
                    borderRadius: 8,
                    paddingHorizontal: 16,
                    fontSize: 18,
                  },
                  container: {
                    flex: 0,
                  },
                  listView: {
                    backgroundColor: 'white',
                    borderRadius: 8,
                    marginTop: 8,
                  },
                  row: {
                    padding: 13,
                    height: 44,
                    flexDirection: 'row',
                  },
                  separator: {
                    height: 0.5,
                    backgroundColor: '#c8c7cc',
                  },
                }}
                enablePoweredByContainer={false}
                fetchDetails={true}
                nearbyPlacesAPI="GooglePlacesSearch"
                debounce={400}
              />

              {address && (
                <View className="bg-gray-50 p-4 rounded-lg">
                  <Text className="text-gray-600">Selected Address:</Text>
                  <Text className="text-black mt-1">{address}</Text>
                </View>
              )}
              
              <TouchableOpacity
                onPress={getCurrentLocation}
                disabled={locationLoading}
                className={`flex-row justify-center items-center p-4 rounded-lg ${
                  locationLoading ? 'bg-gray-200' : 'bg-gray-100'
                }`}
              >
                {locationLoading ? (
                  <ActivityIndicator color="#22c55e" />
                ) : (
                  <Text className="text-gray-600">Use Current Location</Text>
                )}
              </TouchableOpacity>

              {locationError ? (
                <Text className="text-red-500 text-center">{locationError}</Text>
              ) : null}
            </View>

            <PhoneInput
              defaultValue={phoneNumber}
              defaultCode="IN"
              onChangeFormattedText={(text) => setPhoneNumber(text)}
              containerStyle={{ width: '100%', marginTop: 16 }}
              textContainerStyle={{ paddingVertical: 0 }}
            />

            <TouchableOpacity
              className="bg-green-500 px-8 py-4 rounded-full w-full mt-6"
              onPress={sendVerificationCode}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-semibold text-xl text-center">
                  Continue
                </Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View className="space-y-4">
            <Text className="text-lg mb-4 text-center">
              Enter the verification code sent to {phoneNumber}
            </Text>
            <TextInput
              value={code}
              onChangeText={setCode}
              placeholder="Enter OTP"
              keyboardType="number-pad"
              maxLength={6}
              className="w-full p-4 border border-gray-300 rounded-lg text-lg"
            />
            <TouchableOpacity
              className="bg-green-500 px-8 py-4 rounded-full w-full"
              onPress={confirmCode}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-semibold text-xl text-center">
                  Verify OTP
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity
          className="mt-4"
          onPress={() => router.push('login')}
        >
          <Text className="text-green-500 text-center">
            Already have an account? Login
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
