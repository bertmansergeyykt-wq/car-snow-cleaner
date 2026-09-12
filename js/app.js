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
// SUPABASE
// ============================================================

const SUPABASE_FUNCTION_URL =
  "https://dghcnwzqqmrsysewnvkn.supabase.co/functions/v1/quick-processor";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_OObcKHZ0AGc5AI5c_3KY-Q_GpzEKI8C";


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


  console.log(
    "Регистрация Telegram пользователя:",
    {
      telegramUserId,
      name,
      username
    }
  );


  try {

    const response =
      await fetch(
        SUPABASE_FUNCTION_URL,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            "Authorization":
              `Bearer ${SUPABASE_PUBLISHABLE_KEY}`
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


    console.log(
      "Ответ quick-processor:",
      data
    );


    // --------------------------------------------------------
    // Ошибка HTTP
    // --------------------------------------------------------

    if (!response.ok) {

      console.error(
        "Ошибка регистрации пользователя:",
        JSON.stringify(
          data,
          null,
          2
        )
      );

      return null;

    }


    // --------------------------------------------------------
    // Пользователь получен
    // --------------------------------------------------------

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
    // Сохраняем пользователя глобально
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
