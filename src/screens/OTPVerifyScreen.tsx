/**
 * OTPVerifyScreen — ввод 6-значного кода из письма.
 * После успешной верификации синхронизирует данные и открывает главный экран.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { authService } from '../services/authService';
import { syncService } from '../services/syncService';
import { getAllRuns } from '../services/storageService';
import { RootStackParamList } from '../navigation/types';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'OTPVerify'>;
  route: RouteProp<RootStackParamList, 'OTPVerify'>;
};

const RESEND_TIMEOUT = 60;

export default function OTPVerifyScreen({ navigation, route }: Props) {
  const { contact } = route.params;
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(RESEND_TIMEOUT);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const id = setTimeout(() => setResendTimer(t => t - 1), 1000);
    return () => clearTimeout(id);
  }, [resendTimer]);

  // Автоверификация при вводе 6-й цифры
  useEffect(() => {
    if (otp.length === 6) void handleVerify();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp]);

  async function handleVerify(): Promise<void> {
    if (otp.length !== 6) {
      Alert.alert('Ошибка', 'Код состоит из 6 цифр');
      return;
    }

    setLoading(true);
    try {
      await authService.verifyOTP(contact, otp);

      // Синхронизируем локальные данные в облако (тихо)
      try {
        const [localRuns, cloudRuns] = await Promise.all([
          getAllRuns(),
          syncService.downloadRuns(),
        ]);
        const user = await authService.getUser();
        if (user) {
          await syncService.pushLocalToCloud(localRuns, user.id);
          syncService.mergeRuns(localRuns, cloudRuns);
        }
      } catch {
        // Не критично — пользователь уже вошёл
      }

      navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Неверный код';
      Alert.alert('Неверный код', message);
      setOtp('');
      inputRef.current?.focus();
    } finally {
      setLoading(false);
    }
  }

  async function handleResend(): Promise<void> {
    setLoading(true);
    try {
      await authService.sendOTP(contact);
      setResendTimer(RESEND_TIMEOUT);
      setOtp('');
      Alert.alert('Отправлено', 'Новый код отправлен на ' + contact);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка отправки';
      Alert.alert('Ошибка', message);
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
        <View style={styles.header}>
          <Text style={styles.title}>Введи код</Text>
          <Text style={styles.subtitle}>Код из письма отправлен на</Text>
          <Text style={styles.contact}>{contact}</Text>
        </View>

        <View style={styles.form}>
          <TextInput
            ref={inputRef}
            style={styles.otpInput}
            value={otp}
            onChangeText={text => setOtp(text.replace(/\D/g, '').slice(0, 6))}
            keyboardType="number-pad"
            maxLength={6}
            placeholder="------"
            placeholderTextColor="#444444"
            autoFocus
            textAlign="center"
            editable={!loading}
          />

          {loading && (
            <ActivityIndicator color="#00E5A0" size="large" style={styles.spinner} />
          )}
        </View>

        {resendTimer > 0 ? (
          <Text style={styles.resendTimer}>
            Повторная отправка через {resendTimer} сек
          </Text>
        ) : (
          <TouchableOpacity onPress={handleResend} disabled={loading}>
            <Text style={styles.resendLink}>Отправить код повторно</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Изменить email</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D0D' },
  inner: { flex: 1, paddingHorizontal: 24, justifyContent: 'center', alignItems: 'center' },
  header: { marginBottom: 40, alignItems: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 12 },
  subtitle: { fontSize: 15, color: '#888888', textAlign: 'center' },
  contact: { fontSize: 17, color: '#00E5A0', fontWeight: '600', marginTop: 6, letterSpacing: 0.5 },
  form: { width: '100%', alignItems: 'center', marginBottom: 24 },
  otpInput: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    width: '100%',
    paddingVertical: 20,
    fontSize: 36,
    fontWeight: 'bold',
    color: '#00E5A0',
    letterSpacing: 16,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    marginBottom: 8,
  },
  spinner: { marginTop: 16 },
  resendTimer: { fontSize: 14, color: '#555555', marginBottom: 24 },
  resendLink: { fontSize: 15, color: '#00E5A0', textDecorationLine: 'underline', marginBottom: 24 },
  backButton: { paddingVertical: 12 },
  backText: { fontSize: 15, color: '#888888' },
});
