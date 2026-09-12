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
  supabaseClient
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


// ======================================================
// ПРОДОЛЖЕНИЕ ПОСЛЕ ВЫБОРА МЕСТА
// ======================================================

export function continueFromLocation() {

  if (
    selectedLocation.latitude === null ||
    selectedLocation.longitude === null
  ) {
    alert("Сначала выберите место на карте.");
    return;
  }

  const addressInput =
    document.getElementById("address-input");

  const address =
    addressInput
      ? addressInput.value.trim()
      : selectedLocation.address;

  if (!address) {
    alert("Укажите адрес.");
    return;
  }

  selectedLocation.address = address;

  const addressText =
    document.getElementById(
      "selected-address-text"
    );

  if (addressText) {
    addressText.textContent = address;
  }

  showScreen("services");
}


// ======================================================
// ВЫБОР УСЛУГИ
// ======================================================

export function selectService(button) {

  if (!button) return;

  document
    .querySelectorAll(".service-card")
    .forEach((card) => {
      card.classList.remove("selected");
    });

  button.classList.add("selected");

  const service =
    button.dataset.service;

  const price =
    Number(button.dataset.price);

  setSelectedService({
    name: service,
    price: price
  });

  const orderButton =
    document.getElementById(
      "create-order-button"
    );

  if (!orderButton) return;

  orderButton.disabled = false;

  // Используем реальные классы из текущего HTML
  orderButton.classList.remove(
    "bg-gray-300"
  );

  orderButton.classList.add(
    "bg-[#ff4f87]"
  );
}


// ======================================================
// СОЗДАНИЕ ЗАКАЗА
// ======================================================

export async function createOrder() {

  if (isCreatingOrder) return;

  if (!selectedService) {
    alert("Выберите услугу.");
    return;
  }

  if (
    selectedLocation.latitude === null ||
    selectedLocation.longitude === null
  ) {
    alert("Выберите место.");
    return;
  }

  setIsCreatingOrder(true);

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


    // ----------------------------------------------
    // СОЗДАЁМ ЗАКАЗ
    // ----------------------------------------------

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


    // ----------------------------------------------
    // СОХРАНЯЕМ АКТИВНЫЙ ЗАКАЗ
    // ----------------------------------------------

    setCurrentActiveOrderId(
      order.id
    );

    setCurrentActivePerformerId(
      null
    );


    // ----------------------------------------------
    // ПОКАЗЫВАЕМ ПОИСК
    // ----------------------------------------------

    showSearching(order.id);


    // ----------------------------------------------
    // ИЩЕМ БЛИЖАЙШЕГО ИСПОЛНИТЕЛЯ
    // ----------------------------------------------

    const {
      data: performerResult,
      error: performerError
    } =
      await supabaseClient
        .functions
        .invoke(
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

      setCurrentOrders([
        order,
        ...currentOrders
      ]);

      showSearching(order.id);

      return;
    }


    const foundPerformer =
      performerResult?.performer;


    // ----------------------------------------------
    // ЕСЛИ ИСПОЛНИТЕЛЬ НАЙДЕН
    // ----------------------------------------------

    if (
      foundPerformer &&
      foundPerformer.id
    ) {

      const acceptedOrder =
        await acceptOrder(
          order.id,
          foundPerformer.id
        );

      if (acceptedOrder) {

        order.status =
          acceptedOrder.status;

        setCurrentActivePerformerId(
          foundPerformer.id
        );

        setCurrentOrders([
          acceptedOrder,
          ...currentOrders
        ]);

        showPerformerFound(
          acceptedOrder.id,
          foundPerformer
        );

      } else {

        setCurrentOrders([
          order,
          ...currentOrders
        ]);

        showSearching(order.id);
      }

    } else {

      // --------------------------------------------
      // ИСПОЛНИТЕЛЕЙ НЕТ
      // --------------------------------------------

      console.log(
        "Свободных исполнителей нет."
      );

      setCurrentOrders([
        order,
        ...currentOrders
      ]);

      showSearching(order.id);
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

    showScreen("services");

  } finally {

    setIsCreatingOrder(false);

    if (button) {

      button.disabled = false;

      button.textContent =
        "Заказать исполнителя";

      // Сохраняем розовый цвет
      // после завершения создания заказа
      if (selectedService) {

        button.classList.remove(
          "bg-gray-300"
        );

        button.classList.add(
          "bg-[#ff4f87]"
        );
      }
    }
  }
}


// ======================================================
// ЭКРАН ПОИСКА ИСПОЛНИТЕЛЯ
// ======================================================

export function showSearching(orderId) {

  const icon =
    document.getElementById(
      "searching-icon"
    );

  const label =
    document.getElementById(
      "searching-label"
    );

  const title =
    document.getElementById(
      "searching-title"
    );

  const description =
    document.getElementById(
      "searching-description"
    );

  const performerCard =
    document.getElementById(
      "performer-card"
    );

  const completeButton =
    document.getElementById(
      "complete-order-button"
    );

  const completedMessage =
    document.getElementById(
      "completed-message"
    );

  const orderNumber =
    document.getElementById(
      "success-order-number"
    );


  if (icon) {

    icon.innerHTML = `
      <div class="spinner"></div>
    `;
  }

  if (label) {
    label.textContent =
      "Заказ создан";
  }

  if (title) {
    title.textContent =
      "Ищем исполнителя";
  }

  if (description) {
    description.textContent =
      "Подбираем ближайшего свободного исполнителя";
  }

  if (performerCard) {
    performerCard.classList.add("hidden");
  }

  if (completeButton) {
    completeButton.classList.add("hidden");
  }

  if (completedMessage) {
    completedMessage.classList.add("hidden");
  }

  if (orderNumber) {
    orderNumber.textContent =
      `#${orderId}`;
  }

  showScreen("searching");
}


// ======================================================
// ПРИНЯТИЕ ЗАКАЗА ИСПОЛНИТЕЛЕМ
// ======================================================

export async function acceptOrder(
  orderId,
  performerId
) {

  try {

    const {
      data,
      error
    } =
      await supabaseClient
        .functions
        .invoke(
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


    return data?.order || null;

  } catch (error) {

    console.error(
      "Ошибка принятия заказа:",
      error
    );

    return null;
  }
}


// ======================================================
// ИСПОЛНИТЕЛЬ НАЙДЕН
// ======================================================

export function showPerformerFound(
  orderId,
  performer
) {

  const icon =
    document.getElementById(
      "searching-icon"
    );

  const label =
    document.getElementById(
      "searching-label"
    );

  const title =
    document.getElementById(
      "searching-title"
    );

  const description =
    document.getElementById(
      "searching-description"
    );

  const performerCard =
    document.getElementById(
      "performer-card"
    );

  const completeButton =
    document.getElementById(
      "complete-order-button"
    );

  const completedMessage =
    document.getElementById(
      "completed-message"
    );

  const performerName =
    document.getElementById(
      "performer-name"
    );

  const orderNumber =
    document.getElementById(
      "success-order-number"
    );


  if (icon) {
    icon.textContent = "🚗";
  }

  if (label) {
    label.textContent =
      "Исполнитель найден";
  }

  if (title) {
    title.textContent =
      "Помощь уже в пути";
  }

  if (description) {
    description.textContent =
      "Исполнитель направляется к вашему автомобилю";
  }

  if (performerName) {

    performerName.textContent =
      performer?.name ||
      "Исполнитель найден";
  }

  if (performerCard) {
    performerCard.classList.remove(
      "hidden"
    );
  }

  if (completeButton) {
    completeButton.classList.remove(
      "hidden"
    );
  }

  if (completedMessage) {
    completedMessage.classList.add(
      "hidden"
    );
  }

  if (orderNumber) {
    orderNumber.textContent =
      `#${orderId}`;
  }

  showScreen("searching");
}


// ======================================================
// ЗАВЕРШЕНИЕ ЗАКАЗА
// ======================================================

export async function completeOrder(
  orderId,
  performerId
) {

  const {
    data,
    error
  } =
    await supabaseClient
      .functions
      .invoke(
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


// ======================================================
// ЗАВЕРШИТЬ ТЕКУЩИЙ ЗАКАЗ КЛИЕНТА
// ======================================================

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

  setIsCompletingOrder(true);


  const button =
    document.getElementById(
      "complete-order-button"
    );

  if (button) {

    button.disabled = true;

    button.textContent =
      "Завершаем...";
  }


  try {

    const data =
      await completeOrder(
        currentActiveOrderId,
        currentActivePerformerId
      );


    // ----------------------------------------------
    // ОБНОВЛЯЕМ ЗАКАЗ В ЛОКАЛЬНОМ СОСТОЯНИИ
    // ----------------------------------------------

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


    // ----------------------------------------------
    // ОБНОВЛЯЕМ ЭКРАН
    // ----------------------------------------------

    const performerCard =
      document.getElementById(
        "performer-card"
      );

    const completedMessage =
      document.getElementById(
        "completed-message"
      );

    if (performerCard) {
      performerCard.classList.add(
        "hidden"
      );
    }

    if (button) {
      button.classList.add(
        "hidden"
      );
    }

    if (completedMessage) {
      completedMessage.classList.remove(
        "hidden"
      );
    }


    const icon =
      document.getElementById(
        "searching-icon"
      );

    const label =
      document.getElementById(
        "searching-label"
      );

    const title =
      document.getElementById(
        "searching-title"
      );

    const description =
      document.getElementById(
        "searching-description"
      );


    if (icon) {
      icon.textContent = "✅";
    }

    if (label) {
      label.textContent =
        "Заказ завершён";
    }

    if (title) {
      title.textContent =
        "Готово!";
    }

    if (description) {
      description.textContent =
        "Спасибо, что воспользовались сервисом";
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

    setIsCompletingOrder(false);

    if (button) {

      button.disabled = false;

      button.textContent =
        "Завершить заказ";
    }
  }
}


// ======================================================
// ЗАГРУЗКА ИСТОРИИ ЗАКАЗОВ
// ======================================================

export async function loadOrdersScreen() {

  showScreen("orders");


  const container =
    document.getElementById(
      "orders-container"
    );

  if (!container) {
    return;
  }


  container.innerHTML = `
    <div class="text-center py-10">
      <div class="text-gray-500">
        Загружаем заказы...
      </div>
    </div>
  `;


  try {

    const {
      data,
      error
    } =
      await supabaseClient
        .functions
        .invoke(
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
      <div class="bg-white rounded-2xl p-6 text-center shadow-sm">

        <div class="text-4xl mb-3">
          ⚠️
        </div>

        <div class="font-semibold text-lg mb-2">
          Не удалось загрузить заказы
        </div>

        <button
          class="mt-4 px-5 py-3 rounded-xl bg-[#ff4f87] text-white"
          onclick="loadOrdersScreen()"
        >
          Повторить
        </button>

      </div>
    `;
  }
}


// ======================================================
// ОТОБРАЖЕНИЕ ИСТОРИИ
// ======================================================

export function renderOrders(
  orders
) {

  const container =
    document.getElementById(
      "orders-container"
    );

  if (!container) {
    return;
  }


  if (
    !orders ||
    orders.length === 0
  ) {

    container.innerHTML = `
      <div class="text-center py-12">

        <div class="text-5xl mb-4">
          📦
        </div>

        <div class="font-semibold text-lg mb-2">
          Заказов пока нет
        </div>

        <div class="text-gray-500">
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


// ======================================================
// КАРТОЧКА ЗАКАЗА
// ======================================================

export function createOrderCard(
  order
) {

  const status =
    getStatusInfo(
      order.status
    );


  return `
    <div class="bg-white rounded-2xl p-4 shadow-sm mb-3">

      <div class="flex justify-between items-start mb-3">

        <div class="font-semibold text-base">
          ${escapeHtml(
            order.service ||
            "Заказ"
          )}
        </div>

        <div class="font-bold">
          ${Number(
            order.price || 0
          )} ₽
        </div>

      </div>


      <div class="text-sm text-gray-600 mb-3">

        📍 ${escapeHtml(
          order.address ||
          "Адрес не указан"
        )}

      </div>


      <div class="flex justify-between items-center text-sm">

        <span class="${status.className}">

          ${status.icon}
          ${status.label}

        </span>

        <span class="text-gray-400">

          ${formatDate(
            order.created_at
          )}

        </span>

      </div>

    </div>
  `;
}


// ======================================================
// СТАТУС ЗАКАЗА
// ======================================================

export function getStatusInfo(
  status
) {

  switch (status) {

    case "searching":

      return {
        icon: "🔍",
        label: "Ищем исполнителя",
        className:
          "text-yellow-600"
      };


    case "accepted":

      return {
        icon: "🚗",
        label: "Исполнитель найден",
        className:
          "text-blue-600"
      };


    case "completed":

      return {
        icon: "✅",
        label: "Завершён",
        className:
          "text-green-600"
      };


    case "cancelled":

      return {
        icon: "❌",
        label: "Отменён",
        className:
          "text-red-600"
      };


    default:

      return {
        icon: "📋",
        label:
          status ||
          "Неизвестно",
        className:
          "text-gray-500"
      };
  }
}
