import React, { useState } from 'react';
import { Alert, StyleSheet, View, Text } from 'react-native';
import { supabase } from '@/lib/supabase';
import { Button, Input } from '@rneui/themed';
import { Link } from 'expo-router';

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSignUp() {
    if (!email || !password || !confirmPassword) return;
    if (password !== confirmPassword) {
      Alert.alert("Passwords don't match");
      return;
    }
    
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    
    if (error) {
      Alert.alert(error.message);
    } else {
      Alert.alert('Check your email for verification!');
    }
    setLoading(false);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>sign up to maxim hotels</Text>
      <View style={[styles.verticallySpaced, styles.mt20]}>
        <Input
          label="Email"
          leftIcon={{ type: 'font-awesome', name: 'envelope', color: '#ffd33d' }}
          onChangeText={setEmail}
          value={email}
          placeholder="email@address.com"
          autoCapitalize="none"
          inputStyle={{ color: '#fff' }}
          labelStyle={{ color: '#ffd33d' }}
          placeholderTextColor="#aaa"
          keyboardType="email-address"
        />
      </View>
      <View style={styles.verticallySpaced}>
        <Input
          label="Password"
          leftIcon={{ type: 'font-awesome', name: 'lock', color: '#ffd33d' }}
          onChangeText={setPassword}
          value={password}
          secureTextEntry
          placeholder="Password"
          autoCapitalize="none"
          inputStyle={{ color: '#fff' }}
          labelStyle={{ color: '#ffd33d' }}
          placeholderTextColor="#aaa"
        />
      </View>
      <View style={styles.verticallySpaced}>
        <Input
          label="Confirm Password"
          leftIcon={{ type: 'font-awesome', name: 'lock', color: '#ffd33d' }}
          onChangeText={setConfirmPassword}
          value={confirmPassword}
          secureTextEntry
          placeholder="Confirm Password"
          autoCapitalize="none"
          inputStyle={{ color: '#fff' }}
          labelStyle={{ color: '#ffd33d' }}
          placeholderTextColor="#aaa"
        />
      </View>
      <View style={[styles.verticallySpaced, styles.mt20]}>
        <Button 
          title="Create Account" 
          disabled={loading || !email || !password || !confirmPassword} 
          onPress={handleSignUp} 
          buttonStyle={{ backgroundColor: '#ffd33d' }}
          titleStyle={{ color: '#000' }}
          loading={loading}
        />
      </View>
      <View style={styles.linkContainer}>
        <Link href="/auth/sign-in" style={styles.link}>
          Already have an account? <Text style={{ color: '#ffd33d', fontWeight: 'bold' }}>Sign in</Text>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#25292e',
    padding: 20,
    justifyContent: 'center'
  },
  verticallySpaced: {
    paddingTop: 4,
    paddingBottom: 4,
    alignSelf: 'stretch',
  },
  mt20: {
    marginTop: 20,
  },
  linkContainer: {
    marginTop: 15,
    alignItems: 'center',
  },
  link: {
    color: '#ffd33d',
    fontSize: 16,
    marginTop: 15,
    textAlign: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffd33d',
    textAlign: 'center',
    marginBottom: 20,
    textShadowColor: 'rgba(46, 125, 50, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    letterSpacing: 1.2,
  },
});
