/**
 * Конфигурация i18next для RunTrack.
 *
 * Единственный язык — русский. Файл ru.json содержит все строки.
 * Инициализация синхронная (ресурсы загружаются сразу из JSON).
 *
 * Использование в компонентах:
 *   const { t } = useTranslation();
 *   <Text>{t('home.btn_start')}</Text>
 *
 * Интерполяция:
 *   <Text>{t('stats.need_more_runs', { count: 3 })}</Text>
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ru from './ru.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      ru: { translation: ru },
    },
    lng: 'ru',
    fallbackLng: 'ru',
    // React Native обеспечивает защиту от XSS — экранирование не нужно
    interpolation: {
      escapeValue: false,
    },
    // Не ждём асинхронной загрузки — ресурсы уже в памяти
    initImmediate: false,
  });

export default i18n;
