import {
  performerData,
  performerLatitude,
  performerLongitude,
  performerActiveOrder,
  isAcceptingPerformerOrder,
  isCompletingPerformerOrder,
  TEST_PERFORMER_ID,

  setPerformerData,
  setPerformerLatitude,
  setPerformerLongitude,
  setPerformerActiveOrder,
  setIsAcceptingPerformerOrder,
  setIsCompletingPerformerOrder
} from "./state.js";

import {
  supabaseClient,
  QUICK_PROCESSOR_URL
} from "./supabase.js";

import {
  formatDate,
  escapeHtml
} from "./utils.js";

import { showScreen } from "./screens.js";


/* =========================================================
   ОТКРЫТИЕ ЭКРАНА ИСПОЛНИТЕЛЯ
========================================================= */

export async function openPerformerScreen() {

  showScreen("performer");

  const statusElement =
    document.getElementById("performer-status");

  if (statusElement) {
    statusElement.textContent =
      "Проверяем статус...";
  }

  await loadAvailableOrders();
}


/* =========================================================
   ЗАГРУЗКА ЗАКАЗОВ И ДАННЫХ ИСПОЛНИТЕЛЯ
========================================================= */

export async function loadAvailableOrders() {

  const ordersContainer =
    document.getElementById(
      "performer-orders"
    );

  if (!ordersContainer) return;

  ordersContainer.innerHTML =
    `<div class="loading">
      Загрузка заказов...
    </div>`;

  try {

    const { data, error } =
      await supabaseClient.functions.invoke(
        "quick-processor",
        {
          body: {
            action: "get_available_orders",

            performer_id:
              TEST_PERFORMER_ID,

            latitude:
              performerLatitude,

            longitude:
              performerLongitude
          }
        }
      );

    if (error) {
      throw error;
    }

    const result = data || {};

    /* -----------------------------------------
       Получаем исполнителя из Edge Function
    ----------------------------------------- */

    if (result.performer) {

      setPerformerData(
        result.performer
      );

      if (
        typeof result.performer.latitude ===
        "number"
      ) {
        setPerformerLatitude(
          result.performer.latitude
        );
      }

      if (
        typeof result.performer.longitude ===
        "number"
      ) {
        setPerformerLongitude(
          result.performer.longitude
        );
      }
    }

    /* -----------------------------------------
       Исполнитель занят
    ----------------------------------------- */

    if (
      performerData &&
      performerData.status === "busy"
    ) {

      renderPerformerBusy();

      return;
    }

    /* -----------------------------------------
       Исполнитель свободен
    ----------------------------------------- */

    renderAvailableOrders(
      result.orders || []
    );

  } catch (error) {

    console.error(
      "Ошибка загрузки заказов исполнителя:",
      error
    );

    ordersContainer.innerHTML = `
      <div class="empty-state">

        <div class="empty-state-icon">
          ⚠️
        </div>

        <div class="empty-state-title">
          Не удалось загрузить заказы
        </div>

        <div class="empty-state-text">
          Попробуйте обновить страницу
        </div>

        <button
          class="secondary-button"
          onclick="loadAvailableOrders()"
        >
          Обновить
        </button>

      </div>
    `;
  }
}


/* =========================================================
   ОТОБРАЖЕНИЕ ЗАНЯТОГО ИСПОЛНИТЕЛЯ
========================================================= */

export function renderPerformerBusy() {

  const container =
    document.getElementById(
      "performer-orders"
    );

  if (!container) return;

  container.innerHTML = `
    <div class="empty-state">

      <div class="empty-state-icon">
        🚗
      </div>

      <div class="empty-state-title">
        Вы выполняете заказ
      </div>

      <div class="empty-state-text">
        После завершения заказа
        здесь появятся новые заявки.
      </div>

    </div>
  `;

  renderPerformerActiveOrder();
}


/* =========================================================
   СПИСОК ДОСТУПНЫХ ЗАКАЗОВ
========================================================= */

export function renderAvailableOrders(
  orders
) {

  const container =
    document.getElementById(
      "performer-orders"
    );

  if (!container) return;

  if (!orders || orders.length === 0) {

    container.innerHTML = `
      <div class="empty-state">

        <div class="empty-state-icon">
          🔍
        </div>

        <div class="empty-state-title">
          Свободных заказов пока нет
        </div>

        <div class="empty-state-text">
          Новые заказы появятся здесь
          автоматически.
        </div>

        <button
          class="secondary-button"
          onclick="loadAvailableOrders()"
        >
          🔄 Обновить
        </button>

      </div>
    `;

    return;
  }

  container.innerHTML = orders
    .map(order =>
      createPerformerOrderCard(order)
    )
    .join("");
}


/* =========================================================
   КАРТОЧКА ЗАКАЗА
========================================================= */

export function createPerformerOrderCard(
  order
) {

  const distance =
    order.distance_km !== undefined
      ? `${order.distance_km} км`
      : "";

  return `
    <div class="order-card">

      <div class="order-card-header">

        <div class="order-card-title">
          ${escapeHtml(
            order.service || "Помощь"
          )}
        </div>

        <div class="order-card-price">
          ${Number(order.price || 0)} ₽
        </div>

      </div>

      <div class="order-card-address">
        📍 ${escapeHtml(
          order.address || "Адрес не указан"
        )}
      </div>

      <div class="order-card-info">

        <span>
          📏 ${distance}
        </span>

        <span>
          🕐 ${formatDate(
            order.created_at
          )}
        </span>

      </div>

      <button
        class="primary-button"
        onclick="acceptPerformerOrder(${order.id})"
      >
        Взять заказ
      </button>

    </div>
  `;
}


/* =========================================================
   ПРИНЯТИЕ ЗАКАЗА ИСПОЛНИТЕЛЕМ
========================================================= */

export async function acceptPerformerOrder(
  orderId
) {

  if (isAcceptingPerformerOrder) {
    return;
  }

  setIsAcceptingPerformerOrder(true);

  try {

    const { data, error } =
      await supabaseClient.functions.invoke(
        "quick-processor",
        {
          body: {
            action: "accept_order",

            order_id: orderId,

            performer_id:
              TEST_PERFORMER_ID
          }
        }
      );

    if (error) {
      throw error;
    }

    if (
      data?.error
    ) {
      throw new Error(
        data.error
      );
    }

    /* -----------------------------------------
       Заказ успешно принят
    ----------------------------------------- */

    if (data?.order) {

      setPerformerActiveOrder(
        data.order
      );
    }

    if (data?.performer) {

      setPerformerData(
        data.performer
      );
    }

    alert(
      "Заказ принят!"
    );

    renderPerformerActiveOrder();

  } catch (error) {

    console.error(
      "Ошибка принятия заказа:",
      error
    );

    alert(
      error.message ||
      "Не удалось принять заказ."
    );

    await loadAvailableOrders();

  } finally {

    setIsAcceptingPerformerOrder(
      false
    );
  }
}


/* =========================================================
   АКТИВНЫЙ ЗАКАЗ ИСПОЛНИТЕЛЯ
========================================================= */

export function renderPerformerActiveOrder() {

  const container =
    document.getElementById(
      "performer-active-order"
    );

  if (!container) return;

  if (!performerActiveOrder) {

    container.innerHTML = "";

    return;
  }

  container.innerHTML = `

    <div class="order-card active-order">

      <div class="order-card-header">

        <div class="order-card-title">
          Активный заказ
        </div>

        <div class="order-card-price">
          ${Number(
            performerActiveOrder.price || 0
          )} ₽
        </div>

      </div>

      <div class="order-card-service">

        🧹 ${escapeHtml(
          performerActiveOrder.service ||
          "Помощь"
        )}

      </div>

      <div class="order-card-address">

        📍 ${escapeHtml(
          performerActiveOrder.address ||
          "Адрес не указан"
        )}

      </div>

      <div class="order-card-info">

        <span>
          Заказ №
          ${performerActiveOrder.id}
        </span>

      </div>

      <button
        class="primary-button"
        onclick="completePerformerOrder()"
      >
        Завершить заказ
      </button>

    </div>
  `;
}


/* =========================================================
   ЗАВЕРШЕНИЕ ЗАКАЗА
========================================================= */

export async function completePerformerOrder() {

  if (
    isCompletingPerformerOrder
  ) {
    return;
  }

  if (!performerActiveOrder) {

    alert(
      "Активный заказ не найден."
    );

    return;
  }

  setIsCompletingPerformerOrder(
    true
  );

  try {

    const { data, error } =
      await supabaseClient.functions.invoke(
        "quick-processor",
        {
          body: {

            action:
              "complete_order",

            order_id:
              performerActiveOrder.id,

            performer_id:
              TEST_PERFORMER_ID

          }
        }
      );

    if (error) {
      throw error;
    }

    if (
      data?.error
    ) {
      throw new Error(
        data.error
      );
    }

    /* -----------------------------------------
       Заказ завершён
    ----------------------------------------- */

    setPerformerActiveOrder(
      null
    );

    if (data?.performer) {

      setPerformerData(
        data.performer
      );
    }

    alert(
      "Заказ завершён!"
    );

    await loadAvailableOrders();

  } catch (error) {

    console.error(
      "Ошибка завершения заказа:",
      error
    );

    alert(
      error.message ||
      "Не удалось завершить заказ."
    );

  } finally {

    setIsCompletingPerformerOrder(
      false
    );
  }
}


/* =========================================================
   ВОЗВРАТ В ПРОФИЛЬ
========================================================= */

export function backToProfile() {

  showScreen(
    "profile"
  );
}
