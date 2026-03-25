import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../config/supabase';

/**
 * Magic Link авторизация — самый простой способ входа:
 * 1. sendMagicLink(email) → Supabase отправляет письмо со ссылкой
 * 2. Пользователь нажимает ссылку → приложение открывается
 * 3. App.tsx перехватывает deep link → сессия создаётся автоматически
 *
 * В Supabase Dashboard → Auth → URL Configuration:
 * добавь "runtrack://" в список Redirect URLs
 */
export const authService = {
  /**
   * Отправить magic link на email.
   * Пользователь нажмёт ссылку из письма → приложение откроется и войдёт.
   */
  async sendMagicLink(email: string): Promise<void> {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        // Куда редиректить после перехода по ссылке
        emailRedirectTo: 'runtrack://',
      },
    });
    if (error) throw new Error(error.message);
  },

  /** Выйти из аккаунта */
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
