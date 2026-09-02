import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase';

function formatLastLogin(value: string | null | undefined) {
  if (!value) return '—';

  return new Date(value).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export default function ProfileScreen() {
  const theme = useTheme();
  const { session } = useAuth();
  const [loading, setLoading] = useState(false);

  const email = session?.user.email ?? '—';
  const lastLogin = formatLastLogin(session?.user.last_sign_in_at);

  async function handleLogout() {
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    setLoading(false);

    if (error) {
      console.error(error.message);
    }
    // Root layout auth guard redirects to login when the session clears.
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <ThemedText type="subtitle">Profile</ThemedText>

        <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
          <View style={styles.row}>
            <ThemedText themeColor="textSecondary">Email</ThemedText>
            <ThemedText style={styles.value}>{email}</ThemedText>
          </View>
          <View style={[styles.divider, { backgroundColor: theme.backgroundSelected }]} />
          <View style={styles.row}>
            <ThemedText themeColor="textSecondary">Last login</ThemedText>
            <ThemedText style={styles.value}>{lastLogin}</ThemedText>
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          disabled={loading}
          onPress={handleLogout}
          style={({ pressed }) => [
            styles.logoutButton,
            {
              backgroundColor: theme.text,
              opacity: loading || pressed ? 0.7 : 1,
            },
          ]}>
          {loading ? (
            <ActivityIndicator color={theme.background} />
          ) : (
            <ThemedText style={[styles.logoutLabel, { color: theme.background }]}>
              Log out
            </ThemedText>
          )}
        </Pressable>
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
    paddingHorizontal: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.three,
    gap: Spacing.four,
  },
  card: {
    borderRadius: Spacing.three,
    overflow: 'hidden',
  },
  row: {
    gap: Spacing.one,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: Spacing.three,
  },
  logoutButton: {
    alignItems: 'center',
    borderRadius: Spacing.two,
    justifyContent: 'center',
    minHeight: 48,
    marginTop: 'auto',
    paddingVertical: Spacing.three,
  },
  logoutLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
});
