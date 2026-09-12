// ============================================================
// ЯНДЕКС КАРТЫ
// ============================================================

import {
  map,
  mapInitialized,
  selectedLocation,
  setMap,
  setMapInitialized
} from "./state.js";

import {
  showScreen
} from "./screens.js";


// ============================================================
// ОТКРЫТЬ ЭКРАН КАРТЫ
// ============================================================

export function openMapScreen() {

  showScreen("map");

  setTimeout(
    () => {

      initializeMap();

    },
    100
  );

}


// ============================================================
// ИНИЦИАЛИЗАЦИЯ КАРТЫ
// ============================================================

export function initializeMap() {

  if (
    mapInitialized &&
    map
  ) {

    if (
      typeof map.requestReposition ===
      "function"
    ) {

      map.requestReposition();

    } else if (
      map.container &&
      typeof map.container.fitToViewport ===
      "function"
    ) {

      map.container.fitToViewport();

    }

    return;

  }


  if (
    typeof ymaps === "undefined"
  ) {

    alert(
      "Яндекс Карты ещё загружаются. Попробуйте ещё раз."
    );

    return;

  }


  ymaps.ready(
    () => {

      if (mapInitialized) {

        return;

      }


      const defaultCenter = [
        56.8389,
        60.6057
      ];


      const newMap =
        new ymaps.Map(
          "map",
          {

            center:
              defaultCenter,

            zoom: 13,

            controls: [
              "zoomControl"
            ]

          }
        );


      setMap(newMap);
      setMapInitialized(true);


      newMap.events.add(
        "actionend",
        () => {

          const center =
            newMap.getCenter();


          if (!center) {

            return;

          }


          selectedLocation.latitude =
            center[0];

          selectedLocation.longitude =
            center[1];


          reverseGeocode(
            center[0],
            center[1]
          );

        }
      );


      newMap.events.add(
        "click",
        (event) => {

          const coordinates =
            event.get("coords");


          if (!coordinates) {

            return;

          }


          setMapLocation(
            coordinates[0],
            coordinates[1]
          );

        }
      );


      setMapLocation(
        defaultCenter[0],
        defaultCenter[1]
      );

    }
  );

}


// ============================================================
// УСТАНОВИТЬ ТОЧКУ НА КАРТЕ
// ============================================================

export function setMapLocation(
  latitude,
  longitude
) {

  selectedLocation.latitude =
    latitude;


  selectedLocation.longitude =
    longitude;


  const currentMap = map;


  if (currentMap) {

    currentMap.setCenter(
      [
        latitude,
        longitude
      ],
      16,
      {
        duration: 250
      }
    );

  }


  reverseGeocode(
    latitude,
    longitude
  );

}


// ============================================================
// ОБРАТНОЕ ГЕОКОДИРОВАНИЕ
// ============================================================

export async function reverseGeocode(
  latitude,
  longitude
) {

  const input =
    document.getElementById(
      "address-input"
    );


  if (!input) {

    return;

  }


  input.value =
    "Определяем адрес...";


  try {

    const result =
      await ymaps.geocode(
        [
          latitude,
          longitude
        ],
        {
          results: 1
        }
      );


    const firstGeoObject =
      result.geoObjects.get(0);


    if (!firstGeoObject) {

      input.value =
        "Адрес не найден";


      selectedLocation.address =
        "";


      return;

    }


    const address =
      firstGeoObject.getAddressLine();


    selectedLocation.address =
      address || "";


    input.value =
      address ||
      "Адрес не найден";


  } catch (error) {

    console.error(
      "Ошибка геокодирования:",
      error
    );


    input.value =
      "Не удалось определить адрес";

  }

}


// ============================================================
// ТЕКУЩЕЕ МЕСТОПОЛОЖЕНИЕ
// ============================================================

export function useCurrentLocation() {

  if (
    !navigator.geolocation
  ) {

    alert(
      "Геолокация недоступна в этом браузере."
    );

    return;

  }


  navigator.geolocation.getCurrentPosition(

    (position) => {

      const latitude =
        position.coords.latitude;


      const longitude =
        position.coords.longitude;


      setMapLocation(
        latitude,
        longitude
      );

    },


    (error) => {

      console.error(
        "Ошибка геолокации:",
        error
      );


      alert(
        "Не удалось получить ваше местоположение."
      );

    },


    {

      enableHighAccuracy: true,

      timeout: 10000,

      maximumAge: 30000

    }

  );

}
