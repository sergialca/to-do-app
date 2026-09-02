import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase';

export default function LoginScreen() {
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    const trimmedEmail = email.trim();

    if (!trimmedEmail || !password) {
      setError('Enter an email and password.');
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    const { data, error: authError } = isSignUp
      ? await supabase.auth.signUp({ email: trimmedEmail, password })
      : await supabase.auth.signInWithPassword({ email: trimmedEmail, password });

    setLoading(false);

    if (authError) {
      setError(authError.message);
      return;
    }

    if (isSignUp && !data.session) {
      setMessage('Check your email to confirm your account, then sign in.');
      setIsSignUp(false);
    }
    // Successful sign-in updates auth state; root layout redirects to home.
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.content}>
          <View style={styles.header}>
            <ThemedText type="subtitle">{isSignUp ? 'Create account' : 'Welcome back'}</ThemedText>
            <ThemedText themeColor="textSecondary">
              {isSignUp
                ? 'Sign up with your email and a password.'
                : 'Sign in with your email and password.'}
            </ThemedText>
          </View>

          <View style={styles.form}>
            <TextInput
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect={false}
              keyboardType="email-address"
              onChangeText={setEmail}
              placeholder="Email"
              placeholderTextColor={theme.textSecondary}
              style={[
                styles.input,
                {
                  backgroundColor: theme.backgroundElement,
                  color: theme.text,
                },
              ]}
              textContentType="emailAddress"
              value={email}
            />
            <TextInput
              autoCapitalize="none"
              autoComplete={isSignUp ? 'new-password' : 'password'}
              onChangeText={setPassword}
              placeholder="Password"
              placeholderTextColor={theme.textSecondary}
              secureTextEntry
              style={[
                styles.input,
                {
                  backgroundColor: theme.backgroundElement,
                  color: theme.text,
                },
              ]}
              textContentType={isSignUp ? 'newPassword' : 'password'}
              value={password}
            />

            {error ? (
              <ThemedText style={styles.feedback} themeColor="textSecondary">
                {error}
              </ThemedText>
            ) : null}
            {message ? (
              <ThemedText style={styles.feedback} themeColor="textSecondary">
                {message}
              </ThemedText>
            ) : null}

            <Pressable
              accessibilityRole="button"
              disabled={loading}
              onPress={handleSubmit}
              style={({ pressed }) => [
                styles.button,
                {
                  backgroundColor: theme.text,
                  opacity: loading || pressed ? 0.7 : 1,
                },
              ]}>
              {loading ? (
                <ActivityIndicator color={theme.background} />
              ) : (
                <ThemedText style={[styles.buttonLabel, { color: theme.background }]}>
                  {isSignUp ? 'Sign up' : 'Sign in'}
                </ThemedText>
              )}
            </Pressable>
          </View>

          <Pressable
            accessibilityRole="button"
            disabled={loading}
            onPress={() => {
              setIsSignUp((value) => !value);
              setError(null);
              setMessage(null);
            }}
            style={styles.switchMode}>
            <ThemedText themeColor="textSecondary">
              {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
              <ThemedText type="linkPrimary">{isSignUp ? 'Sign in' : 'Sign up'}</ThemedText>
            </ThemedText>
          </Pressable>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  safeArea: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    gap: Spacing.four,
  },
  header: {
    gap: Spacing.two,
  },
  form: {
    gap: Spacing.three,
  },
  input: {
    borderRadius: Spacing.two,
    fontSize: 16,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
  button: {
    alignItems: 'center',
    borderRadius: Spacing.two,
    justifyContent: 'center',
    minHeight: 48,
    paddingVertical: Spacing.three,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  feedback: {
    fontSize: 14,
  },
  switchMode: {
    alignItems: 'center',
    paddingVertical: Spacing.two,
  },
});
