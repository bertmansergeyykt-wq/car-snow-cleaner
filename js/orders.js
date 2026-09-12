import {
  selectedLocation,
  selectedService,
  currentOrders,
  isCreatingOrder,
  currentActiveOrderId,
  currentActivePerformerId,
  isCompletingOrder,

  setSelectedService,
  setCurrentOrders,
  setIsCreatingOrder,
  setCurrentActiveOrderId,
  setCurrentActivePerformerId,
  setIsCompletingOrder
} from "./state.js";

import {
  supabaseClient,
  QUICK_PROCESSOR_URL
} from "./supabase.js";

import {
  getTelegramUserId
} from "./telegram.js";

import {
  formatDate,
  escapeHtml
} from "./utils.js";

import {
  showScreen
} from "./screens.js";


/* =========================================================
   ПРОДОЛЖЕНИЕ ПОСЛЕ ВЫБОРА АДРЕСА
========================================================= */

export function continueFromLocation() {

  if (
    selectedLocation.latitude === null ||
    selectedLocation.longitude === null
  ) {
    alert(
      "Сначала выберите место на карте."
    );
    return;
  }

  const addressInput =
    document.getElementById(
      "address-input"
    );

  const address =
    addressInput
      ? addressInput.value.trim()
      : selectedLocation.address;

  if (!address) {
    alert(
      "Укажите адрес."
    );
    return;
  }

  selectedLocation.address =
    address;

  const addressText =
    document.getElementById(
      "selected-address-text"
    );

  if (addressText) {
    addressText.textContent =
      address;
  }

  showScreen(
    "services"
  );
}


/* =========================================================
   ВЫБОР УСЛУГИ
========================================================= */

export function selectService(
  button
) {

  if (!button) return;

  document
    .querySelectorAll(
      ".service-card"
    )
    .forEach((card) => {

      card.classList.remove(
        "selected"
      );

    });

  button.classList.add(
    "selected"
  );

  const service =
    button.dataset.service;

  const price =
    Number(
      button.dataset.price
    );

  setSelectedService({
    name: service,
    price: price
  });

  const createButton =
    document.getElementById(
      "create-order-button"
    );

  if (!createButton) return;

  createButton.disabled = false;

  createButton.classList.add(
    "pink"
  );
}


/* =========================================================
   СОЗДАНИЕ ЗАКАЗА
========================================================= */

export async function createOrder() {

  if (isCreatingOrder) {
    return;
  }

  if (!selectedService) {

    alert(
      "Выберите услугу."
    );

    return;
  }

  if (
    selectedLocation.latitude === null ||
    selectedLocation.longitude === null
  ) {

    alert(
      "Выберите место."
    );

    return;
  }

  setIsCreatingOrder(
    true
  );

  const button =
    document.getElementById(
      "create-order-button"
    );

  if (button) {
    button.disabled = true;
    button.textContent =
      "Создаём заказ...";
  }

  try {

    const telegramUserId =
      getTelegramUserId();

    /* -----------------------------------------
       Создаём заказ
    ----------------------------------------- */

    const {
      data: order,
      error: orderError
    } = await supabaseClient
      .from("orders")
      .insert({
        telegram_user_id:
          telegramUserId,

        latitude:
          selectedLocation.latitude,

        longitude:
          selectedLocation.longitude,

        address:
          selectedLocation.address,

        service:
          selectedService.name,

        price:
          selectedService.price,

        status:
          "searching"
      })
      .select()
      .single();

    if (orderError) {
      throw orderError;
    }

    if (!order) {
      throw new Error(
        "Не удалось создать заказ."
      );
    }

    setCurrentActiveOrderId(
      order.id
    );

    /* -----------------------------------------
       Добавляем в локальную историю
    ----------------------------------------- */

    setCurrentOrders([
      order,
      ...currentOrders
    ]);

    /* -----------------------------------------
       Показываем поиск
    ----------------------------------------- */

    showSearching(
      order.id
    );

    /* -----------------------------------------
       Ищем исполнителя
    ----------------------------------------- */

    const {
      data: performerResult,
      error: performerError
    } = await supabaseClient.functions.invoke(
      "quick-processor",
      {
        body: {

          action:
            "find_performer",

          latitude:
            selectedLocation.latitude,

          longitude:
            selectedLocation.longitude

        }
      }
    );

    if (performerError) {

      console.error(
        "Ошибка поиска исполнителя:",
        performerError
      );

      return;
    }

    const foundPerformer =
      performerResult?.performer;

    if (
      foundPerformer &&
      foundPerformer.id
    ) {

      await acceptOrder(
        order.id,
        foundPerformer.id
      );

    } else {

      console.log(
        "Свободных исполнителей нет."
      );
    }

  } catch (error) {

    console.error(
      "Ошибка создания заказа:",
      error
    );

    alert(
      error.message ||
      "Не удалось создать заказ."
    );

    showScreen(
      "services"
    );

  } finally {

    setIsCreatingOrder(
      false
    );

    if (button) {

      button.disabled =
        false;

      button.textContent =
        "Заказать исполнителя";
    }
  }
}


/* =========================================================
   ЭКРАН ПОИСКА
========================================================= */

export function showSearching(
  orderId
) {

  const orderNumber =
    document.getElementById(
      "searching-order-number"
    );

  if (orderNumber) {

    orderNumber.textContent =
      `Заказ №${orderId}`;

  }

  const searchingBlock =
    document.getElementById(
      "searching-state"
    );

  const performerBlock =
    document.getElementById(
      "performer-found"
    );

  const completedBlock =
    document.getElementById(
      "order-completed"
    );

  if (searchingBlock) {
    searchingBlock.style.display =
      "block";
  }

  if (performerBlock) {
    performerBlock.style.display =
      "none";
  }

  if (completedBlock) {
    completedBlock.style.display =
      "none";
  }

  const completeButton =
    document.getElementById(
      "complete-order-button"
    );

  if (completeButton) {
    completeButton.style.display =
      "none";
  }

  showScreen(
    "searching"
  );
}


/* =========================================================
   ПРИНЯТИЕ ЗАКАЗА
========================================================= */

export async function acceptOrder(
  orderId,
  performerId
) {

  try {

    const {
      data,
      error
    } = await supabaseClient.functions.invoke(
      "quick-processor",
      {
        body: {

          action:
            "accept_order",

          order_id:
            orderId,

          performer_id:
            performerId

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

    if (
      data?.success &&
      data?.order
    ) {

      setCurrentActiveOrderId(
        data.order.id
      );

      setCurrentActivePerformerId(
        performerId
      );

      /* -----------------------------------------
         Обновляем заказ в локальной истории
      ----------------------------------------- */

      setCurrentOrders(
        currentOrders.map(
          (item) =>
            item.id === data.order.id
              ? data.order
              : item
        )
      );

      showPerformerFound(
        data.order.id,
        data.performer || {
          id: performerId
        }
      );
    }

  } catch (error) {

    console.error(
      "Ошибка принятия заказа:",
      error
    );

  }
}


/* =========================================================
   ИСПОЛНИТЕЛЬ НАЙДЕН
========================================================= */

export function showPerformerFound(
  orderId,
  performer
) {

  /*
    Важно:
    показываем исполнителя только если
    accept_order действительно установил
    currentActivePerformerId.
  */

  if (
    !performer ||
    !currentActivePerformerId
  ) {
    return;
  }

  const searchingBlock =
    document.getElementById(
      "searching-state"
    );

  const performerBlock =
    document.getElementById(
      "performer-found"
    );

  const orderNumber =
    document.getElementById(
      "found-order-number"
    );

  if (searchingBlock) {
    searchingBlock.style.display =
      "none";
  }

  if (performerBlock) {
    performerBlock.style.display =
      "block";
  }

  if (orderNumber) {
    orderNumber.textContent =
      `Заказ №${orderId}`;
  }

  const completeButton =
    document.getElementById(
      "complete-order-button"
    );

  if (completeButton) {
    completeButton.style.display =
      "block";
  }

  const performerName =
    document.getElementById(
      "performer-name"
    );

  if (performerName) {

    performerName.textContent =
      performer.name ||
      "Исполнитель найден";
  }

  showScreen(
    "searching"
  );
}


/* =========================================================
   ЗАВЕРШЕНИЕ ЗАКАЗА
========================================================= */

export async function completeOrder(
  orderId,
  performerId
) {

  const {
    data,
    error
  } = await supabaseClient.functions.invoke(
    "quick-processor",
    {
      body: {

        action:
          "complete_order",

        order_id:
          orderId,

        performer_id:
          performerId

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

  return data;
}


/* =========================================================
   ЗАВЕРШЕНИЕ ТЕКУЩЕГО ЗАКАЗА
========================================================= */

export async function completeCurrentOrder() {

  if (isCompletingOrder) {
    return;
  }

  if (
    !currentActiveOrderId ||
    !currentActivePerformerId
  ) {

    alert(
      "Активный заказ не найден."
    );

    return;
  }

  setIsCompletingOrder(
    true
  );

  const button =
    document.getElementById(
      "complete-order-button"
    );

  if (button) {

    button.disabled =
      true;

    button.textContent =
      "Завершаем...";
  }

  try {

    const data =
      await completeOrder(
        currentActiveOrderId,
        currentActivePerformerId
      );

    if (data?.order) {

      setCurrentOrders(
        currentOrders.map(
          (item) =>
            item.id === data.order.id
              ? data.order
              : item
        )
      );
    }

    const performerBlock =
      document.getElementById(
        "performer-found"
      );

    const completedBlock =
      document.getElementById(
        "order-completed"
      );

    const completeButton =
      document.getElementById(
        "complete-order-button"
      );

    if (performerBlock) {
      performerBlock.style.display =
        "none";
    }

    if (completeButton) {
      completeButton.style.display =
        "none";
    }

    if (completedBlock) {
      completedBlock.style.display =
        "block";
    }

    setCurrentActiveOrderId(
      null
    );

    setCurrentActivePerformerId(
      null
    );

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

    setIsCompletingOrder(
      false
    );

    if (button) {

      button.disabled =
        false;

      button.textContent =
        "Завершить заказ";
    }
  }
}


/* =========================================================
   ЭКРАН ЗАКАЗОВ
========================================================= */

export async function loadOrdersScreen() {

  showScreen(
    "orders"
  );

  const container =
    document.getElementById(
      "orders-list"
    );

  if (!container) return;

  container.innerHTML = `
    <div class="loading">
      Загружаем заказы...
    </div>
  `;

  try {

    const {
      data,
      error
    } = await supabaseClient.functions.invoke(
      "quick-processor",
      {
        body: {

          action:
            "get_orders",

          telegram_user_id:
            getTelegramUserId()

        }
      }
    );

    if (error) {
      throw error;
    }

    const orders =
      data?.orders || [];

    setCurrentOrders(
      orders
    );

    renderOrders(
      orders
    );

  } catch (error) {

    console.error(
      "Ошибка загрузки заказов:",
      error
    );

    container.innerHTML = `
      <div class="empty-state">

        <div class="empty-state-icon">
          ⚠️
        </div>

        <div class="empty-state-title">
          Не удалось загрузить заказы
        </div>

        <button
          class="secondary-button"
          onclick="loadOrdersScreen()"
        >
          Повторить
        </button>

      </div>
    `;
  }
}


/* =========================================================
   ОТОБРАЖЕНИЕ ЗАКАЗОВ
========================================================= */

export function renderOrders(
  orders
) {

  const container =
    document.getElementById(
      "orders-list"
    );

  if (!container) return;

  if (
    !orders ||
    orders.length === 0
  ) {

    container.innerHTML = `
      <div class="empty-state">

        <div class="empty-state-icon">
          📦
        </div>

        <div class="empty-state-title">
          Заказов пока нет
        </div>

        <div class="empty-state-text">
          Здесь появится история ваших заказов.
        </div>

      </div>
    `;

    return;
  }

  container.innerHTML =
    orders
      .map(
        (order) =>
          createOrderCard(order)
      )
      .join("");
}


/* =========================================================
   КАРТОЧКА ЗАКАЗА
========================================================= */

export function createOrderCard(
  order
) {

  const status =
    getStatusInfo(
      order.status
    );

  return `
    <div class="order-card">

      <div class="order-card-header">

        <div class="order-card-title">
          ${escapeHtml(
            order.service ||
            "Заказ"
          )}
        </div>

        <div class="order-card-price">
          ${Number(
            order.price || 0
          )} ₽
        </div>

      </div>

      <div class="order-card-address">

        📍 ${escapeHtml(
          order.address ||
          "Адрес не указан"
        )}

      </div>

      <div class="order-card-info">

        <span>
          ${status.icon}
          ${status.text}
        </span>

        <span>
          ${formatDate(
            order.created_at
          )}
        </span>

      </div>

    </div>
  `;
}


/* =========================================================
   СТАТУС ЗАКАЗА
========================================================= */

export function getStatusInfo(
  status
) {

  switch (status) {

    case "searching":
      return {
        icon: "🔍",
        text: "Ищем исполнителя"
      };

    case "accepted":
      return {
        icon: "🚗",
        text: "Исполнитель найден"
      };

    case "completed":
      return {
        icon: "✅",
        text: "Завершён"
      };

    default:
      return {
        icon: "📋",
        text: status || "Неизвестно"
      };
  }
}
