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
import { useAuth } from '../../context/authContext'

const Signup = () => {

    const nameRef = useRef("");
    const emailRef = useRef("");
    const passwordRef = useRef("");
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const {signup} = useAuth();

    const handleSubmit = async () => {
        if(!emailRef.current || !passwordRef.current || !nameRef.current){
            Alert.alert('Sign Up', "Please fill in all the fields");
            return;
        }

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(emailRef.current)) {
            Alert.alert('Sign Up', 'Please enter a valid email');
            return;
        }

        setIsLoading(true);

        let response = await signup(emailRef.current, passwordRef.current, nameRef.current);
        setIsLoading(false);

        console.log('got result: ', response);

        if(!response.success){
            Alert.alert('Sign Up', response.msg)
        }

        console.log('name: ', nameRef.current);
        console.log('email: ', emailRef.current);
        console.log('password: ', passwordRef.current);
    }

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <BackButton />
        <View style={{gap: 5, marginTop: spacingY._20}}>
            <Text style={{color: "black", fontSize: 30, fontWeight: 800}}>Let's</Text>
            <Text style={{color: "black", fontSize: 30, fontWeight: 800}}>Get Started</Text>
        </View>
        <View style={styles.form}>
            <Text style={{fontSize: 16, color: colors.textLight}}>
                Create an account to get started with your wristband and track your progress
            </Text>
            <Input 
                placeholder='Enter your name'
                onChangeText={(value) => (nameRef.current = value)}
                icon={<Icons.UserIcon size={verticalScale(26)}/>}
            />
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
            <Button loading={isLoading} onPress={handleSubmit}>
                <Text style={{fontSize: 21, color: colors.white, fontWeight: 700}}>
                    Sign Up
                </Text>
            </Button>
        </View>
        <View style={styles.footer}>
            <Text style={{fontSize: 15, color: colors.text}}>Already have an account?</Text>
            <Pressable onPress={() => router.navigate("/signin")}>
                <Text style={{fontSize: 15, color: colors.primaryDark, fontWeight: 700}}>Sign In</Text>
            </Pressable>
        </View>
      </View>
    </ScreenWrapper>
  )
}

export default Signup

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