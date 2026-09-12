export const telegramWebApp =
  window.Telegram?.WebApp || null;


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


export function getTelegramUserId() {
  const telegramId =
    telegramWebApp?.initDataUnsafe?.user?.id;

  if (telegramId) {
    return telegramId;
  }

  // Тестовый ID при открытии приложения
  // вне Telegram
  return 123456789;
}


export function getTelegramUser() {
  return (
    telegramWebApp?.initDataUnsafe?.user ||
    null
  );
}
