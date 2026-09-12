// ============================================================
// TELEGRAM WEB APP
// ============================================================

export const telegramWebApp =
  window.Telegram?.WebApp || null;


// ============================================================
// ИНИЦИАЛИЗАЦИЯ
// ============================================================

export function initTelegram() {

  if (!telegramWebApp) {
    console.warn(
      "Telegram WebApp API не найден. Приложение открыто вне Telegram."
    );
    return;
  }

  telegramWebApp.ready();

  telegramWebApp.expand();
}


// ============================================================
// TELEGRAM USER ID
// ============================================================

export function getTelegramUserId() {

  const telegramId =
    telegramWebApp?.initDataUnsafe?.user?.id;

  if (telegramId) {
    return telegramId;
  }

  // Запасной ID для тестирования
  return 123456789;
}


// ============================================================
// ДАННЫЕ ПОЛЬЗОВАТЕЛЯ
// ============================================================

export function getTelegramUser() {

  return (
    telegramWebApp?.initDataUnsafe?.user ||
    null
  );
}
