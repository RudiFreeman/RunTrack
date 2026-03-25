import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../config/supabase';

/** Данные авторизованного пользователя */
export interface AuthUser {
  id: string;
  email: string;
}

export const authService = {
  /**
   * Шаг 1: Отправить OTP-код на email.
   *
   * В Supabase Dashboard нужно включить Email OTP:
   * Authentication → Providers → Email → выключи "Confirm email",
   * включи "Email OTP" (или оставь magic link — тогда пользователь
   * нажимает ссылку в письме вместо ввода кода).
   */
  async sendOTP(email: string): Promise<void> {
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) throw new Error(error.message);
  },

  /**
   * Шаг 2: Подтвердить OTP-код из письма.
   */
  async verifyOTP(email: string, token: string): Promise<AuthUser> {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    });
    if (error) throw new Error(error.message);
    if (!data.user) throw new Error('Пользователь не найден');
    return {
      id: data.user.id,
      email: data.user.email ?? email,
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
