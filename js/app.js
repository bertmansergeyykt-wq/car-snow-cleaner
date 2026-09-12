import {
  initTelegram,
  telegramWebApp,
  getTelegramUserId,
  getTelegramUserName,
  getTelegramUsername
} from "./telegram.js";

import {
  showScreen,
  renderProfile
} from "./screens.js";

import {
  openMapScreen,
  initializeMap,
  useCurrentLocation
} from "./map.js";

import {
  continueFromLocation,
  selectService,
  createOrder,
  completeCurrentOrder,
  loadOrdersScreen
} from "./orders.js";

import {
  openPerformerScreen,
  loadAvailableOrders,
  acceptPerformerOrder,
  completePerformerOrder,
  backToProfile
} from "./performer.js";

import {
  selectedLocation
} from "./state.js";


// ============================================================
// TELEGRAM
// ============================================================

initTelegram();


// ============================================================
// TELEGRAM BACK BUTTON
// ============================================================

if (telegramWebApp) {

  telegramWebApp.BackButton.onClick(() => {

    showScreen("home");

  });

}


// ============================================================
// РЕГИСТРАЦИЯ TELEGRAM-ПОЛЬЗОВАТЕЛЯ
// ============================================================

async function registerTelegramUser() {

  const telegramUserId =
    getTelegramUserId();


  // ----------------------------------------------------------
  // Если приложение открыто не внутри Telegram
  // ----------------------------------------------------------

  if (!telegramUserId) {

    console.warn(
      "Регистрация пропущена: Telegram пользователь не найден."
    );

    return null;

  }


  const name =
    getTelegramUserName();

  const username =
    getTelegramUsername();


  try {

    const response =
      await fetch(
        "https://dghcnwzqqmrsysewnvkn.supabase.co/functions/v1/quick-processor",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({

            action:
              "register_user",

            telegram_user_id:
              telegramUserId,

            name:
              name,

            username:
              username

          })

        }
      );


    const data =
      await response.json();


    if (!response.ok) {

      console.error(
        "Ошибка регистрации пользователя:",
        data
      );

      return null;

    }


    console.log(
      "Telegram пользователь:",
      data.user
    );


    if (data.created) {

      console.log(
        "Новый пользователь зарегистрирован."
      );

    } else {

      console.log(
        "Пользователь уже существует."
      );

    }


    // --------------------------------------------------------
    // Сохраняем роль глобально
    // --------------------------------------------------------

    window.currentUser =
      data.user;


    return data.user;

  } catch (error) {

    console.error(
      "Ошибка подключения к регистрации:",
      error
    );

    return null;

  }

}


// ============================================================
// HTML FUNCTIONS
// ============================================================

window.showScreen =
  showScreen;

window.openMapScreen =
  openMapScreen;

window.initializeMap =
  initializeMap;

window.useCurrentLocation =
  useCurrentLocation;

window.continueFromLocation =
  continueFromLocation;

window.selectService =
  selectService;

window.createOrder =
  createOrder;

window.completeCurrentOrder =
  completeCurrentOrder;

window.loadOrdersScreen =
  loadOrdersScreen;

window.openPerformerScreen =
  openPerformerScreen;

window.loadAvailableOrders =
  loadAvailableOrders;

window.acceptPerformerOrder =
  acceptPerformerOrder;

window.completePerformerOrder =
  completePerformerOrder;

window.backToProfile =
  backToProfile;


// ============================================================
// ADDRESS INPUT
// ============================================================

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    const addressInput =
      document.getElementById(
        "address-input"
      );


    if (addressInput) {

      addressInput.addEventListener(
        "input",
        () => {

          selectedLocation.address =
            addressInput.value.trim();

        }
      );

    }


    // --------------------------------------------------------
    // Регистрируем Telegram пользователя
    // --------------------------------------------------------

    await registerTelegramUser();


    // --------------------------------------------------------
    // Загружаем профиль
    // --------------------------------------------------------

    renderProfile();


    // --------------------------------------------------------
    // Открываем главный экран
    // --------------------------------------------------------

    showScreen("home");

  }
);
