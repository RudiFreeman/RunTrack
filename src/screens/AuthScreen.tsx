/**
 * AuthScreen — вход через Magic Link.
 *
 * Флоу:
 * 1. Пользователь вводит email, нажимает «Получить ссылку»
 * 2. Supabase отправляет письмо с кнопкой «Войти в RunTrack»
 * 3. Показываем экран «Проверьте почту»
 * 4. Пользователь нажимает ссылку в письме → приложение открывается
 * 5. App.tsx ловит deep link → сессия создаётся автоматически
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { authService } from '../services/authService';
import { RootStackParamList } from '../navigation/types';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Auth'>;
};

export default function AuthScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSend(): Promise<void> {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed.includes('@') || !trimmed.includes('.')) {
      Alert.alert('Ошибка', 'Введи корректный email');
      return;
    }
    setLoading(true);
    try {
      await authService.sendMagicLink(trimmed);
      setSent(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Неизвестная ошибка';
      Alert.alert('Ошибка', message);
    } finally {
      setLoading(false);
    }
  }

  // ─── Экран «Письмо отправлено» ───────────────────────────────────────────────
  if (sent) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.sentContainer}>
          <Text style={styles.sentIcon}>📬</Text>
          <Text style={styles.sentTitle}>Проверьте почту</Text>
          <Text style={styles.sentBody}>
            Мы отправили ссылку для входа на
          </Text>
          <Text style={styles.sentEmail}>{email.trim().toLowerCase()}</Text>
          <Text style={styles.sentHint}>
            Нажмите на кнопку в письме — приложение откроется автоматически.
          </Text>

          {/* Повторная отправка */}
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => setSent(false)}
          >
            <Text style={styles.retryText}>Изменить email или отправить снова</Text>
          </TouchableOpacity>

          {/* Пропустить */}
          <TouchableOpacity
            style={styles.skipButton}
            onPress={() => navigation.navigate('MainTabs')}
          >
            <Text style={styles.skipText}>Продолжить без входа</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Экран ввода email ───────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.inner}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <Text style={styles.logo}>🏃</Text>
          <Text style={styles.appName}>RunTrack</Text>
          <Text style={styles.title}>Вход в аккаунт</Text>
          <Text style={styles.subtitle}>
            Введи email — пришлём ссылку для входа.{'\n'}
            Пароль не нужен.
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="you@example.com"
            placeholderTextColor="#555555"
            autoFocus
            onSubmitEditing={handleSend}
            returnKeyType="send"
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSend}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#0D0D0D" />
              : <Text style={styles.buttonText}>Получить ссылку</Text>
            }
          </TouchableOpacity>
        </View>

        <Text style={styles.note}>
          Вход синхронизирует пробежки между устройствами.{'\n'}
          Приложение работает и без входа — данные хранятся локально.
        </Text>

        <TouchableOpacity
          style={styles.skipButton}
          onPress={() => navigation.navigate('MainTabs')}
        >
          <Text style={styles.skipText}>Продолжить без входа</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },

  // ── Экран ввода ──────────────────────────────────────────────────────────────
  inner: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 48,
    alignItems: 'center',
  },
  logo: {
    fontSize: 48,
    marginBottom: 8,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#00E5A0',
    letterSpacing: 2,
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    color: '#888888',
    textAlign: 'center',
    lineHeight: 22,
  },
  form: {
    marginBottom: 32,
  },
  label: {
    fontSize: 12,
    color: '#888888',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  input: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  button: {
    backgroundColor: '#00E5A0',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#0D0D0D',
    fontSize: 17,
    fontWeight: 'bold',
  },
  note: {
    fontSize: 12,
    color: '#555555',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24,
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  skipText: {
    fontSize: 15,
    color: '#888888',
    textDecorationLine: 'underline',
  },

  // ── Экран «Письмо отправлено» ────────────────────────────────────────────────
  sentContainer: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sentIcon: {
    fontSize: 64,
    marginBottom: 24,
  },
  sentTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  sentBody: {
    fontSize: 16,
    color: '#888888',
    textAlign: 'center',
  },
  sentEmail: {
    fontSize: 17,
    color: '#00E5A0',
    fontWeight: '600',
    marginTop: 6,
    marginBottom: 20,
    letterSpacing: 0.3,
  },
  sentHint: {
    fontSize: 14,
    color: '#555555',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 40,
    paddingHorizontal: 8,
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  retryText: {
    fontSize: 15,
    color: '#888888',
    textDecorationLine: 'underline',
    textAlign: 'center',
  },
});
