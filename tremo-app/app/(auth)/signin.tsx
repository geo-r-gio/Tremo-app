import { Alert, Pressable, StyleSheet, Text, View } from 'react-native'
import React, { useRef, useState } from 'react'
import ScreenWrapper from '@/components/ScreenWrapper'
import { colors, spacingX, spacingY } from '@/constants/theme'
import { verticalScale } from '@/utils/styling'
import BackButton from '@/components/BackButton'
import Input from '@/components/Input'
import * as Icons from 'phosphor-react-native'
import Button from '@/components/Button'
import { useRouter } from 'expo-router'
import { useAuth } from '@/context/authContext'
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/firebaseConfig"; 

const Signin = () => {

    const emailRef = useRef("");
    const passwordRef = useRef("");
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const {signin} = useAuth();

    const handleForgotPassword = async () => {
        if (!emailRef.current || emailRef.current.trim() === "") {
            Alert.alert("Reset Password", "Please enter your email first.");
            return;
        }

        try {
         await sendPasswordResetEmail(auth, emailRef.current.trim());
        Alert.alert("Email Sent", "Check your inbox for a password reset link.");
        } catch (error: any) {
            console.log("Forgot password error:", error);
            Alert.alert("Reset Failed", error?.message || "Something went wrong.");
        }
    }; 

    const handleSubmit = async () => {
        if(!emailRef.current || !passwordRef.current){
            Alert.alert('Sign In', "Please fill in all the fields");
            return;
        }

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(emailRef.current)) {
            Alert.alert('Sign In', 'Please enter a valid email');
            return;
        }

        setIsLoading(true);

        let response = await signin(emailRef.current, passwordRef.current);
        setIsLoading(false);

        console.log('got result: ', response);

        if(!response.success){
            Alert.alert('Sign In', response.msg);
            return;
        }

        router.replace('../home');

        console.log('email: ', emailRef.current);
        console.log('password: ', passwordRef.current);
    }

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <BackButton />
        <View style={{gap: 5, marginTop: spacingY._20}}>
            <Text style={{color: "black", fontSize: 30, fontWeight: 800}}>Hey,</Text>
            <Text style={{color: "black", fontSize: 30, fontWeight: 800}}>Welcome Back</Text>
        </View>
        <View style={styles.form}>
            <Text style={{fontSize: 16, color: colors.textLight}}>
                Sign In to stay connected with your wristband and track your progress
            </Text>
            <Input 
                placeholder='Enter your email'
                onChangeText={(value) => (emailRef.current = value)}
                icon={<Icons.AtIcon size={verticalScale(26)}/>}
            />
            <Input 
                placeholder='Enter your password'
                secureTextEntry
                onChangeText={(value) => (passwordRef.current = value)}
                icon={<Icons.LockIcon size={verticalScale(26)}/>}
            />
            <Pressable onPress={handleForgotPassword}>
                <Text style={{fontSize: 14, color: colors.primaryDark, alignSelf: 'flex-end'}}>
                  Forgot Password?
                 </Text>
            </Pressable>
            <Button loading={isLoading} onPress={handleSubmit}>
                <Text style={{fontSize: 21, color: colors.white, fontWeight: 700}}>
                    Sign In
                </Text>
            </Button>
        </View>
        <View style={styles.footer}>
            <Text style={{fontSize: 15, color: colors.text}}>Don't have an account?</Text>
            <Pressable onPress={() => router.navigate("/signup")}>
                <Text style={{fontSize: 15, color: colors.primaryDark, fontWeight: 700}}>Sign Up</Text>
            </Pressable>
        </View>
      </View>
    </ScreenWrapper>
  )
}

export default Signin

const styles = StyleSheet.create({
    container: {
        flex: 1,
        gap: spacingY._30,
        paddingHorizontal: spacingX._20
    },
    welcomeText: {
        fontSize: verticalScale(20),
        fontWeight: 'bold',
        color: colors.text
    },
    form: {
        gap: spacingY._20
    },
    forgotPassword: {
        textAlign: 'right',
        fontWeight: '500',
        color: colors.text
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 5
    },
    footerText: {
        textAlign: 'center',
        color: colors.text,
        fontSize: verticalScale(15)
    }
})