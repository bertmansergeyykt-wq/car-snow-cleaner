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
  supabaseClient
} from "./supabase.js";

import {
  formatDate,
  escapeHtml
} from "./utils.js";

import {
  showScreen
} from "./screens.js";


// ========================================
// ОТКРЫТИЕ ЭКРАНА ИСПОЛНИТЕЛЯ
// ========================================

export async function openPerformerScreen() {

  showScreen("performer");

  const statusText =
    document.getElementById(
      "performer-status-text"
    );

  if (statusText) {
    statusText.textContent =
      "Проверяем статус...";
  }

  await loadAvailableOrders();
}


// ========================================
// СТАТУС ИСПОЛНИТЕЛЯ
// ========================================

export function updatePerformerStatus(
  status
) {

  const statusText =
    document.getElementById(
      "performer-status-text"
    );

  const statusIcon =
    document.getElementById(
      "performer-status-icon"
    );

  if (!statusText || !statusIcon) {
    return;
  }


  if (status === "busy") {

    statusText.textContent =
      "Вы выполняете заказ";

    statusIcon.textContent = "🚗";

    statusIcon.classList.remove(
      "bg-green-100",
      "text-green-600"
    );

    statusIcon.classList.add(
      "bg-orange-100",
      "text-orange-600"
    );

    return;
  }


  statusText.textContent =
    "Вы свободны";

  statusIcon.textContent = "🟢";

  statusIcon.classList.remove(
    "bg-orange-100",
    "text-orange-600"
  );

  statusIcon.classList.add(
    "bg-green-100",
    "text-green-600"
  );
}


// ========================================
// ЗАГРУЗКА ДОСТУПНЫХ ЗАКАЗОВ
// ========================================

export async function loadAvailableOrders() {

  const container =
    document.getElementById(
      "performer-orders-container"
    );

  if (!container) {
    return;
  }


  container.innerHTML = `
    <div class="text-center py-8 text-gray-500">
      Загрузка заказов...
    </div>
  `;


  try {

    const {
      data,
      error
    } =
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


    if (data?.error) {
      throw new Error(data.error);
    }


    const result =
      data || {};


    // ====================================
    // Данные исполнителя
    // ====================================

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


    // ====================================
    // Исполнитель занят
    // ====================================

    if (
      performerData &&
      performerData.status === "busy"
    ) {

      updatePerformerStatus("busy");

      renderPerformerBusy();

      return;
    }


    // ====================================
    // Исполнитель свободен
    // ====================================

    updatePerformerStatus(
      "available"
    );

    renderAvailableOrders(
      result.orders || []
    );

  } catch (error) {

    console.error(
      "Ошибка загрузки заказов исполнителя:",
      error
    );


    updatePerformerStatus(
      "available"
    );


    container.innerHTML = `
      <div class="bg-white rounded-2xl p-6 text-center">

        <div class="text-4xl mb-3">
          ⚠️
        </div>

        <div class="font-semibold text-gray-800 mb-2">
          Не удалось загрузить заказы
        </div>

        <div class="text-sm text-gray-500 mb-4">
          Попробуйте обновить страницу
        </div>

        <button
          class="w-full py-3 rounded-xl bg-gray-100 text-gray-700 font-medium"
          onclick="loadAvailableOrders()"
        >
          🔄 Обновить
        </button>

      </div>
    `;
  }
}


// ========================================
// ИСПОЛНИТЕЛЬ ЗАНЯТ
// ========================================

export function renderPerformerBusy() {

  const container =
    document.getElementById(
      "performer-orders-container"
    );

  if (!container) {
    return;
  }


  container.innerHTML = `
    <div class="bg-white rounded-2xl p-6 text-center">

      <div class="text-4xl mb-3">
        🚗
      </div>

      <div class="font-semibold text-gray-800 mb-2">
        Вы выполняете заказ
      </div>

      <div class="text-sm text-gray-500">
        После завершения заказа
        здесь появятся новые заявки.
      </div>

    </div>
  `;


  renderPerformerActiveOrder();
}


// ========================================
// СПИСОК ДОСТУПНЫХ ЗАКАЗОВ
// ========================================

export function renderAvailableOrders(
  orders
) {

  const container =
    document.getElementById(
      "performer-orders-container"
    );

  if (!container) {
    return;
  }


  if (
    !orders ||
    orders.length === 0
  ) {

    container.innerHTML = `
      <div class="bg-white rounded-2xl p-6 text-center">

        <div class="text-4xl mb-3">
          🔍
        </div>

        <div class="font-semibold text-gray-800 mb-2">
          Свободных заказов пока нет
        </div>

        <div class="text-sm text-gray-500 mb-4">
          Новые заказы появятся здесь
          автоматически.
        </div>

        <button
          class="w-full py-3 rounded-xl bg-gray-100 text-gray-700 font-medium"
          onclick="loadAvailableOrders()"
        >
          🔄 Обновить
        </button>

      </div>
    `;

    return;
  }


  container.innerHTML =
    orders
      .map(
        (order) =>
          createPerformerOrderCard(order)
      )
      .join("");
}


// ========================================
// КАРТОЧКА ЗАКАЗА
// ========================================

export function createPerformerOrderCard(
  order
) {

  const distance =
    order.distance_km !== undefined
      ? `${order.distance_km} км`
      : "Расстояние неизвестно";


  return `
    <div class="bg-white rounded-2xl p-5 mb-3 shadow-sm">

      <div class="flex items-center justify-between mb-3">

        <div class="font-semibold text-gray-900">
          ${escapeHtml(
            order.service ||
            "Помощь"
          )}
        </div>

        <div class="font-bold text-[#ff4f87]">
          ${Number(
            order.price || 0
          )} ₽
        </div>

      </div>


      <div class="text-sm text-gray-600 mb-3">
        📍
        ${escapeHtml(
          order.address ||
          "Адрес не указан"
        )}
      </div>


      <div class="flex justify-between text-xs text-gray-400 mb-4">

        <span>
          📏 ${distance}
        </span>

        <span>
          🕐
          ${formatDate(
            order.created_at
          )}
        </span>

      </div>


      <button
        class="w-full py-3 rounded-xl bg-[#ff4f87] text-white font-semibold"
        onclick="acceptPerformerOrder(${order.id})"
      >
        Взять заказ
      </button>

    </div>
  `;
}


// ========================================
// ПРИНЯТИЕ ЗАКАЗА
// ========================================

export async function acceptPerformerOrder(
  orderId
) {

  if (isAcceptingPerformerOrder) {
    return;
  }


  setIsAcceptingPerformerOrder(
    true
  );


  try {

    const {
      data,
      error
    } =
      await supabaseClient.functions.invoke(
        "quick-processor",
        {
          body: {
            action: "accept_order",

            order_id:
              orderId,

            performer_id:
              TEST_PERFORMER_ID
          }
        }
      );


    if (error) {
      throw error;
    }


    if (data?.error) {
      throw new Error(
        data.error
      );
    }


    // ==================================
    // Заказ принят
    // ==================================

    if (data?.order) {

      setPerformerActiveOrder(
        data.order
      );
    }


    // ==================================
    // Обновляем исполнителя
    // ==================================

    if (data?.performer) {

      setPerformerData(
        data.performer
      );
    } else if (performerData) {

      setPerformerData({
        ...performerData,
        status: "busy"
      });
    }


    updatePerformerStatus(
      "busy"
    );


    renderPerformerActiveOrder();


    alert("Заказ принят!");


    // Обновляем список заказов
    await loadAvailableOrders();

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


// ========================================
// АКТИВНЫЙ ЗАКАЗ
// ========================================

export function renderPerformerActiveOrder() {

  const order =
    performerActiveOrder;


  const orderNumber =
    document.getElementById(
      "performer-active-order-number"
    );

  const service =
    document.getElementById(
      "performer-active-service"
    );

  const address =
    document.getElementById(
      "performer-active-address"
    );

  const price =
    document.getElementById(
      "performer-active-price"
    );

  const distance =
    document.getElementById(
      "performer-active-distance"
    );

  const activeOrder =
    document.getElementById(
      "performer-active-order"
    );

  const completeButton =
    document.getElementById(
      "performer-complete-button"
    );


  if (!activeOrder) {
    return;
  }


  if (!order) {

    activeOrder.classList.add(
      "hidden"
    );

    if (completeButton) {
      completeButton.classList.add(
        "hidden"
      );
    }

    return;
  }


  // ==================================
  // Заполняем данные
  // ==================================

  if (orderNumber) {

    orderNumber.textContent =
      `№${order.id}`;
  }


  if (service) {

    service.textContent =
      order.service ||
      "Помощь";
  }


  if (address) {

    address.textContent =
      order.address ||
      "Адрес не указан";
  }


  if (price) {

    price.textContent =
      `${Number(
        order.price || 0
      )} ₽`;
  }


  if (distance) {

    distance.textContent =
      order.distance_km !== undefined
        ? `${order.distance_km} км`
        : "—";
  }


  activeOrder.classList.remove(
    "hidden"
  );


  if (completeButton) {

    completeButton.classList.remove(
      "hidden"
    );
  }
}


// ========================================
// ЗАВЕРШЕНИЕ ЗАКАЗА
// ========================================

export async function completePerformerOrder() {

  if (isCompletingPerformerOrder) {
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


  const button =
    document.getElementById(
      "performer-complete-button"
    );


  if (button) {

    button.disabled = true;

    button.textContent =
      "Завершаем...";
  }


  try {

    const {
      data,
      error
    } =
      await supabaseClient.functions.invoke(
        "quick-processor",
        {
          body: {
            action: "complete_order",

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


    if (data?.error) {
      throw new Error(
        data.error
      );
    }


    // ==================================
    // Очищаем активный заказ
    // ==================================

    setPerformerActiveOrder(
      null
    );


    // ==================================
    // Обновляем исполнителя
    // ==================================

    if (data?.performer) {

      setPerformerData(
        data.performer
      );

    } else if (performerData) {

      setPerformerData({
        ...performerData,
        status: "available"
      });
    }


    updatePerformerStatus(
      "available"
    );


    renderPerformerActiveOrder();


    alert("Заказ завершён!");


    // ==================================
    // Обновляем список
    // ==================================

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


    if (button) {

      button.disabled = false;

      button.textContent =
        "Завершить заказ";
    }
  }
}


// ========================================
// НАЗАД В ПРОФИЛЬ
// ========================================

export function backToProfile() {

  showScreen("profile");
}
