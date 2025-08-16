import React, { useState } from 'react';
import { Alert, StyleSheet, View, Text } from 'react-native';
import { supabase } from '@/lib/supabase';
import { Button, Input } from '@rneui/themed';
import { useRouter } from 'expo-router';
import { Link } from 'expo-router';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSignIn() {
    console.log('[SignIn] Attempting sign in');
    if (!email || !password) return;
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log('[SignIn] signInWithPassword response', {
        user: data?.user?.id,
        error,
      });

      if (error) {
        Alert.alert(error.message);
        setLoading(false);
        return;
      }

      // Successful login, stop loading and navigate away
      setLoading(false);
      router.replace('/guest');
      console.log('[SignIn] Navigation to /guest triggered');
    } catch (err: any) {
      console.error('[SignIn] signInWithPassword threw', err);
      Alert.alert('Login error', err.message ?? 'Unknown error');
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>sign in to maxim hotels</Text>
      <View style={[styles.verticallySpaced, styles.mt20]}>
        <Input
          label="Email"
          leftIcon={{ type: 'font-awesome', name: 'envelope', color: '#ffd33d' }}
          onChangeText={setEmail}
          value={email}
          placeholder="email@address.com"
          autoCapitalize="none"
          keyboardType="email-address"
          inputStyle={{ color: '#fff' }}
          labelStyle={{ color: '#ffd33d' }}
          placeholderTextColor="#aaa"
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
      <View style={[styles.verticallySpaced, styles.mt20]}>
        <Button 
          title="Sign In" 
          disabled={loading || !email || !password} 
          onPress={handleSignIn} 
          loading={loading}
          buttonStyle={{ backgroundColor: '#ffd33d' }}
          titleStyle={{ color: '#000' }}
        />
      </View>
      {/* Demo credentials */}
      <View style={styles.demoContainer}>
        <Text style={styles.demoText}>Demo login: guest@gmail.com{`\n`}password: password</Text>
      </View>
      <View style={styles.linkContainer}>
        <Link href="/auth/sign-up" style={styles.link}>
          Don't have an account? <Text style={{ color: '#ffd33d', fontWeight: 'bold' }}>Sign up</Text>
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
  demoContainer: {
    marginTop: 15,
    alignItems: 'center',
  },
  demoText: {
    color: '#aaa',
    fontSize: 14,
    textAlign: 'center',
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
