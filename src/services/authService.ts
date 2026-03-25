import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../config/supabase';

/** Данные авторизованного пользователя */
export interface AuthUser {
  id: string;
  phone: string;
}

export const authService = {
  /**
   * Шаг 1: Отправить OTP-код на номер телефона.
   * Формат телефона: +79991234567 (международный, с +)
   */
  async sendOTP(phone: string): Promise<void> {
    const { error } = await supabase.auth.signInWithOtp({ phone });
    if (error) throw new Error(error.message);
  },

  /**
   * Шаг 2: Подтвердить OTP-код, полученный по SMS.
   * Возвращает данные пользователя при успехе.
   */
  async verifyOTP(phone: string, token: string): Promise<AuthUser> {
    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: 'sms',
    });
    if (error) throw new Error(error.message);
    if (!data.user) throw new Error('Пользователь не найден');
    return {
      id: data.user.id,
      phone: data.user.phone ?? phone,
    };
  },

  /** Выйти из аккаунта и очистить локальную сессию */
  async signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);
  },

  /** Получить текущую сессию (null если не авторизован) */
  async getSession(): Promise<Session | null> {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  },

  /** Получить текущего пользователя (null если не авторизован) */
  async getUser(): Promise<User | null> {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },
};
