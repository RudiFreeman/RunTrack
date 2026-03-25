/**
 * AuthScreen — экран ввода номера телефона.
 * Пользователь вводит номер в формате +7XXXXXXXXXX,
 * нажимает «Получить код» — отправляется SMS с OTP.
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
  const [phone, setPhone] = useState('+7');
  const [loading, setLoading] = useState(false);

  /** Форматировать телефон: оставить только + и цифры */
  function handlePhoneChange(text: string): void {
    // Всегда начинается с +7
    let cleaned = text.replace(/[^+\d]/g, '');
    if (!cleaned.startsWith('+')) cleaned = '+' + cleaned;
    setPhone(cleaned);
  }

  async function handleSendOTP(): Promise<void> {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 11) {
      Alert.alert('Ошибка', 'Введи корректный номер телефона: +7XXXXXXXXXX');
      return;
    }

    setLoading(true);
    try {
      await authService.sendOTP(phone);
      navigation.navigate('OTPVerify', { phone });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Неизвестная ошибка';
      Alert.alert('Ошибка отправки', message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.inner}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Заголовок */}
        <View style={styles.header}>
          <Text style={styles.logo}>🏃 RunTrack</Text>
          <Text style={styles.title}>Вход в аккаунт</Text>
          <Text style={styles.subtitle}>
            Введи номер телефона — пришлём SMS с кодом подтверждения
          </Text>
        </View>

        {/* Поле ввода */}
        <View style={styles.form}>
          <Text style={styles.label}>Номер телефона</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={handlePhoneChange}
            keyboardType="phone-pad"
            placeholder="+79991234567"
            placeholderTextColor="#555555"
            maxLength={12}
            autoFocus
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSendOTP}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#0D0D0D" />
            ) : (
              <Text style={styles.buttonText}>Получить код</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Примечание */}
        <Text style={styles.note}>
          Авторизуясь, ты соглашаешься с хранением данных в защищённом облаке.
          Приложение работает и без входа — данные хранятся локально.
        </Text>

        {/* Пропустить — войти офлайн */}
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
    fontSize: 40,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
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
    fontSize: 13,
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
    fontSize: 22,
    color: '#FFFFFF',
    letterSpacing: 2,
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
});
