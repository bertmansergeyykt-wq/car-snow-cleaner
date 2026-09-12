// ============================================================
// ЗАКАЗЫ КЛИЕНТА
// ============================================================

import {
  currentOrders,
  selectedLocation,
  selectedService,
  isCreatingOrder,
  currentActiveOrderId,
  currentActivePerformerId,
  isCompletingOrder,
  setCurrentOrders,
  setIsCreatingOrder,
  setCurrentActiveOrderId,
  setCurrentActivePerformerId,
  setIsCompletingOrder
} from "./state.js";

import {
  getTelegramUserId
} from "./telegram.js";

import {
  supabaseClient
} from "./supabase.js";

import {
  showScreen
} from "./screens.js";

import {
  formatDate,
  escapeHtml
} from "./utils.js";


// ============================================================
// ПРОДОЛЖЕНИЕ ПОСЛЕ ВЫБОРА АДРЕСА
// ============================================================

export function continueFromLocation() {

  const addressInput =
    document.getElementById(
      "address-input"
    );


  const manuallyEditedAddress =
    addressInput.value.trim();


  if (
    !selectedLocation.latitude ||
    !selectedLocation.longitude
  ) {

    alert(
      "Сначала выберите место на карте."
    );

    return;

  }


  if (
    manuallyEditedAddress
  ) {

    selectedLocation.address =
      manuallyEditedAddress;

  }


  if (
    !selectedLocation.address
  ) {

    alert(
      "Не удалось определить адрес. Укажите адрес вручную."
    );

    return;

  }


  document.getElementById(
    "selected-address-text"
  ).textContent =
    selectedLocation.address;


  showScreen("services");

}


// ============================================================
// ВЫБОР УСЛУГИ
// ============================================================

export function selectService(button) {

  const buttons =
    document.querySelectorAll(
      ".service-card"
    );


  buttons.forEach(
    (item) => {

      item.classList.remove(
        "selected"
      );

    }
  );


  button.classList.add(
    "selected"
  );


  // Важно:
  // selectedService — объект из state.js.
  // Поэтому изменяем его через window,
  // пока полностью не перевели состояние
  // на единый store.

  window.selectedService =
    {

      name:
        button.dataset.service,

      price:
        Number(
          button.dataset.price
        )

    };


  const orderButton =
    document.getElementById(
      "create-order-button"
    );


  orderButton.disabled =
    false;


  orderButton.classList.remove(
    "bg-gray-300"
  );


  orderButton.classList.add(
    "bg-[#ff4f87]"
  );

}


// ============================================================
// ПОКАЗАТЬ ПОИСК ИСПОЛНИТЕЛЯ
// ============================================================

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


  icon.innerHTML = `
    <div class="spinner"></div>
  `;


  label.textContent =
    "Заказ создан";


  title.textContent =
    "Ищем исполнителя";


  description.textContent =
    "Ищем ближайшего свободного исполнителя.";


  performerCard.classList.add(
    "hidden"
  );


  completeButton.classList.add(
    "hidden"
  );


  completedMessage.classList.add(
    "hidden"
  );


  document.getElementById(
    "success-order-number"
  ).textContent =
    "#" + orderId;


  showScreen("searching");

}


// ============================================================
// ПОКАЗАТЬ НАЙДЕННОГО ИСПОЛНИТЕЛЯ
// ============================================================

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


  icon.innerHTML = `
    <div class="text-5xl">
      🚗
    </div>
  `;


  label.textContent =
    "Исполнитель найден";


  title.textContent =
    "Помощь уже в пути";


  description.textContent =
    "Мы нашли свободного исполнителя для вашего заказа.";


  document.getElementById(
    "performer-name"
  ).textContent =
    performer?.name ||
    "Исполнитель";


  performerCard.classList.remove(
    "hidden"
  );


  completeButton.classList.remove(
    "hidden"
  );


  completedMessage.classList.add(
    "hidden"
  );


  document.getElementById(
    "success-order-number"
  ).textContent =
    "#" + orderId;


  showScreen("searching");

}


// ============================================================
// ПРИНЯТИЕ ЗАКАЗА
// ============================================================

export async function acceptOrder(
  orderId,
  performerId
) {

  const {
    data,
    error
  } =
    await supabaseClient.functions.invoke(
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

    throw new Error(
      error.message
    );

  }


  if (
    data?.error
  ) {

    throw new Error(
      data.error
    );

  }


  return data?.order || null;

}


// ============================================================
// ЗАВЕРШЕНИЕ ЗАКАЗА
// ============================================================

export async function completeOrder(
  orderId,
  performerId
) {

  const {
    data,
    error
  } =
    await supabaseClient.functions.invoke(
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

    throw new Error(
      error.message
    );

  }


  if (
    data?.error
  ) {

    throw new Error(
      data.error
    );

  }


  return data;

}


// ============================================================
// ЗАВЕРШИТЬ ТЕКУЩИЙ ЗАКАЗ КЛИЕНТА
// ============================================================

export async function completeCurrentOrder() {

  if (isCompletingOrder) {

    return;

  }


  if (!currentActiveOrderId) {

    alert(
      "Активный заказ не найден."
    );

    return;

  }


  if (!currentActivePerformerId) {

    alert(
      "Исполнитель заказа не найден."
    );

    return;

  }


  const button =
    document.getElementById(
      "complete-order-button"
    );


  setIsCompletingOrder(true);


  button.disabled =
    true;


  button.textContent =
    "Завершаем заказ...";


  try {

    const result =
      await completeOrder(
        currentActiveOrderId,
        currentActivePerformerId
      );


    if (
      !result?.success
    ) {

      throw new Error(
        "Не удалось завершить заказ."
      );

    }


    const localOrder =
      currentOrders.find(
        (order) =>
          String(order.id) ===
          String(currentActiveOrderId)
      );


    if (localOrder) {

      localOrder.status =
        "completed";

    }


    button.classList.add(
      "hidden"
    );


    document.getElementById(
      "completed-message"
    ).classList.remove(
      "hidden"
    );


    document.getElementById(
      "searching-icon"
    ).innerHTML = `
      <div class="text-5xl">
        ✅
      </div>
    `;


    document.getElementById(
      "searching-label"
    ).textContent =
      "Заказ завершён";


    document.getElementById(
      "searching-title"
    ).textContent =
      "Готово!";


    document.getElementById(
      "searching-description"
    ).textContent =
      "Исполнитель освобождён и снова доступен для новых заказов.";


    setCurrentActiveOrderId(null);

    setCurrentActivePerformerId(null);


  } catch (error) {

    console.error(
      "Ошибка завершения заказа:",
      error
    );


    alert(
      "Не удалось завершить заказ.\n\n" +
      error.message
    );


    button.disabled =
      false;


    button.textContent =
      "✅ Завершить заказ";


  } finally {

    setIsCompletingOrder(false);

  }

}


// ============================================================
// СОЗДАНИЕ ЗАКАЗА
// ============================================================

export async function createOrder() {

  if (isCreatingOrder) {

    return;

  }


  if (
    !selectedLocation.latitude ||
    !selectedLocation.longitude
  ) {

    alert(
      "Не выбрано место автомобиля."
    );

    return;

  }


  const service =
    window.selectedService || selectedService;


  if (!service) {

    alert(
      "Выберите услугу."
    );

    return;

  }


  setIsCreatingOrder(true);


  const button =
    document.getElementById(
      "create-order-button"
    );


  button.disabled =
    true;


  button.textContent =
    "Создаём заказ...";


  const telegramId =
    getTelegramUserId();


  try {

    const {
      data,
      error
    } =
      await supabaseClient
        .from("orders")
        .insert({

          telegram_user_id:
            telegramId,

          latitude:
            selectedLocation.latitude,

          longitude:
            selectedLocation.longitude,

          address:
            selectedLocation.address,

          service:
            service.name,

          price:
            service.price,

          status:
            "searching"

        })
        .select()
        .single();


    if (error) {

      throw new Error(
        error.message
      );

    }


    if (!data) {

      throw new Error(
        "Supabase не вернул созданный заказ."
      );

    }


    setCurrentActiveOrderId(
      data.id
    );


    setCurrentActivePerformerId(
      null
    );


    let foundPerformer =
      null;


    try {

      const {
        data: executorResult,
        error: executorError
      } =
        await supabaseClient.functions.invoke(
          "quick-processor",
          {

            body: {

              action:
                "find_performer",

              latitude:
                Number(
                  data.latitude
                ),

              longitude:
                Number(
                  data.longitude
                )

            }

          }
        );


      if (executorError) {

        console.error(
          "Ошибка поиска исполнителя:",
          executorError
        );

      } else if (
        executorResult?.performer
      ) {

        foundPerformer =
          executorResult.performer;

      }

    } catch (executorError) {

      console.error(
        "Ошибка вызова quick-processor:",
        executorError
      );

    }


    if (foundPerformer) {

      try {

        const acceptedOrder =
          await acceptOrder(
            data.id,
            foundPerformer.id
          );


        if (acceptedOrder) {

          data.status =
            acceptedOrder.status;

        } else {

          data.status =
            "accepted";

        }


        setCurrentActivePerformerId(
          foundPerformer.id
        );


      } catch (acceptError) {

        console.error(
          "Не удалось принять заказ:",
          acceptError
        );


        setCurrentActivePerformerId(
          null
        );

      }

    }


    setCurrentOrders([
      data,
      ...currentOrders
    ]);


    if (
      foundPerformer &&
      foundPerformer.id
    ) {

      showPerformerFound(
        data.id,
        foundPerformer
      );

    } else {

      showSearching(
        data.id
      );

    }


  } catch (error) {

    console.error(
      "Ошибка:",
      error
    );


    setCurrentActiveOrderId(null);

    setCurrentActivePerformerId(null);


    alert(
      "Не удалось создать заказ.\n\n" +
      error.message
    );


  } finally {

    setIsCreatingOrder(false);


    button.disabled =
      false;


    button.textContent =
      "Заказать исполнителя";


    if (service) {

      button.classList.remove(
        "bg-gray-300"
      );


      button.classList.add(
        "bg-[#ff4f87]"
      );

    }

  }

}


// ============================================================
// ЗАГРУЗКА ИСТОРИИ ЗАКАЗОВ
// ============================================================

export async function loadOrdersScreen() {

  showScreen("orders");


  const container =
    document.getElementById(
      "orders-container"
    );


  container.innerHTML = `
    <div class="bg-white rounded-3xl p-6 text-center shadow-sm">

      <div class="spinner mx-auto"></div>

      <div class="font-bold text-gray-900 mt-4">
        Загружаем заказы
      </div>

    </div>
  `;


  const telegramId =
    getTelegramUserId();


  try {

    const {
      data,
      error
    } =
      await supabaseClient.functions.invoke(
        "quick-processor",
        {

          body: {

            action:
              "get_orders",

            telegram_user_id:
              telegramId

          }

        }
      );


    if (error) {

      throw new Error(
        error.message
      );

    }


    if (
      data?.error
    ) {

      throw new Error(
        data.error
      );

    }


    setCurrentOrders(
      data?.orders || []
    );


    renderOrders();


  } catch (error) {

    console.error(
      "Ошибка загрузки заказов:",
      error
    );


    container.innerHTML = `

      <div class="bg-white rounded-3xl p-6 text-center shadow-sm">

        <div class="text-4xl">
          ⚠️
        </div>

        <div class="font-bold text-gray-900 mt-3">
          Не удалось загрузить заказы
        </div>

        <div class="text-sm text-gray-500 mt-2">
          ${escapeHtml(error.message)}
        </div>

        <button
          type="button"
          onclick="loadOrdersScreen()"
          class="mt-5 px-5 h-11 rounded-xl bg-[#ff4f87] text-white font-bold"
        >
          Повторить
        </button>

      </div>

    `;

  }

}


// ============================================================
// ОТОБРАЖЕНИЕ ЗАКАЗОВ
// ============================================================

export function renderOrders() {

  const container =
    document.getElementById(
      "orders-container"
    );


  if (
    !currentOrders ||
    currentOrders.length === 0
  ) {

    container.innerHTML = `

      <div class="bg-white rounded-3xl p-7 text-center shadow-sm">

        <div class="text-5xl">
          🚗
        </div>

        <div class="font-black text-gray-900 text-lg mt-4">
          Заказов пока нет
        </div>

        <div class="text-sm text-gray-500 mt-2">
          Если автомобиль застрял в снегу,
          мы поможем.
        </div>

        <button
          type="button"
          onclick="openMapScreen()"
          class="mt-5 w-full h-12 rounded-2xl bg-[#ff4f87] text-white font-bold"
        >
          🚗 Заказать помощь
        </button>

      </div>

    `;


    return;

  }


  container.innerHTML =
    currentOrders
      .map(
        (order) =>
          createOrderCard(order)
      )
      .join("");

}


// ============================================================
// КАРТОЧКА ЗАКАЗА
// ============================================================

function createOrderCard(order) {

  const status =
    getStatusInfo(
      order.status
    );


  const date =
    formatDate(
      order.created_at
    );


  return `

    <div class="bg-white rounded-3xl p-5 shadow-sm mb-3">

      <div class="flex items-start justify-between gap-3">

        <div>

          <div class="text-xs text-gray-400 font-semibold">
            ЗАКАЗ
          </div>

          <div class="font-black text-gray-900 text-xl mt-1">
            #${escapeHtml(String(order.id))}
          </div>

        </div>


        <span class="order-status ${status.className}">

          ${status.icon}

          <span class="ml-1">
            ${status.label}
          </span>

        </span>

      </div>


      <div class="mt-5 space-y-3">

        <div>

          <div class="text-xs text-gray-400">
            Услуга
          </div>

          <div class="font-semibold text-gray-900 mt-1">
            ${escapeHtml(order.service || "—")}
          </div>

        </div>


        <div>

          <div class="text-xs text-gray-400">
            Адрес
          </div>

          <div class="font-semibold text-gray-900 mt-1">
            ${escapeHtml(order.address || "—")}
          </div>

        </div>


        <div class="flex items-end justify-between">

          <div>

            <div class="text-xs text-gray-400">
              Создан
            </div>

            <div class="font-semibold text-gray-900 mt-1">
              ${escapeHtml(date)}
            </div>

          </div>


          <div class="text-xl font-black text-gray-900">
            ${Number(order.price || 0).toLocaleString("ru-RU")} ₽
          </div>

        </div>

      </div>

    </div>

  `;

}


// ============================================================
// СТАТУС ЗАКАЗА
// ============================================================

function getStatusInfo(status) {

  switch (status) {

    case "accepted":

      return {

        label:
          "Исполнитель найден",

        icon:
          "🚗",

        className:
          "status-accepted"

      };


    case "completed":

      return {

        label:
          "Выполнен",

        icon:
          "✅",

        className:
          "status-completed"

      };


    case "cancelled":

      return {

        label:
          "Отменён",

        icon:
          "❌",

        className:
          "status-cancelled"

      };


    case "searching":

    default:

      return {

        label:
          "Поиск исполнителя",

        icon:
          "🔎",

        className:
          "status-searching"

      };

  }

}
