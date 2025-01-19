import { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import PhoneInput from 'react-native-phone-number-input';
import { auth } from '../config/firebase';
import { PhoneAuthProvider, signInWithCredential } from 'firebase/auth';
import { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha';

export default function Signup() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationId, setVerificationId] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: phone input, 2: OTP input
  const router = useRouter();
  const recaptchaVerifier = useRef(null);

  const firebaseConfig = {
    apiKey: "AIzaSyDxk_wGMSxJnaP-1cGJJVY-eQe0gxKIryo",
    authDomain: "agricult-ce0e3.firebaseapp.com",
    projectId: "agricult-ce0e3",
    storageBucket: "agricult-ce0e3.firebasestorage.app",
    messagingSenderId: "214344392349",
    appId: "1:214344392349:web:6967413117a8aca6a83e74"
  };

  const sendVerificationCode = async () => {
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

  const confirmCode = async () => {
    try {
      setLoading(true);
      const credential = PhoneAuthProvider.credential(verificationId, code);
      await signInWithCredential(auth, credential);
      router.replace('home');
    } catch (error) {
      console.error(error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-white p-4">
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
      
      <View className="flex-1 justify-center items-center">
        <Text className="text-4xl font-bold mb-8 text-green-500">Sign Up</Text>
        
        {step === 1 ? (
          <>
            <Text className="text-lg mb-4 text-center">
              Enter your phone number to create an account
            </Text>
            <PhoneInput
              defaultValue={phoneNumber}
              defaultCode="IN"
              onChangeFormattedText={(text) => setPhoneNumber(text)}
              containerStyle={{ width: '100%', marginBottom: 20 }}
              textContainerStyle={{ paddingVertical: 0 }}
            />
            <TouchableOpacity
              className="bg-green-500 px-8 py-4 rounded-full w-full"
              onPress={sendVerificationCode}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-semibold text-xl text-center">
                  Send OTP
                </Text>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text className="text-lg mb-4 text-center">
              Enter the verification code sent to {phoneNumber}
            </Text>
            <TextInput
              value={code}
              onChangeText={setCode}
              placeholder="Enter OTP"
              keyboardType="number-pad"
              maxLength={6}
              className="w-full p-4 border border-gray-300 rounded-lg mb-4 text-lg"
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
          </>
        )}

        <TouchableOpacity
          className="mt-4"
          onPress={() => router.push('login')}
        >
          <Text className="text-green-500">
            Already have an account? Login
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
