declare global {
  interface Window {
    kakao: any;
  }
}

const KAKAO_KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;

let sdkLoadPromise: Promise<void> | null = null;

/** Loads the Kakao Maps JS SDK once, with every library any part of the
 *  app needs (map clustering + the services library used for address
 *  geocoding). Shared so we never inject the script more than once. */
export function loadKakaoSdk(): Promise<void> {
  if (!KAKAO_KEY) return Promise.reject(new Error("no key"));
  if (window.kakao?.maps) return Promise.resolve();
  if (sdkLoadPromise) return sdkLoadPromise;

  sdkLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_KEY}&autoload=false&libraries=clusterer,services`;
    script.async = true;
    script.onload = () => window.kakao.maps.load(() => resolve());
    script.onerror = () => reject(new Error("Kakao SDK load failed"));
    document.head.appendChild(script);
  });
  return sdkLoadPromise;
}

export function hasKakaoKey(): boolean {
  return Boolean(KAKAO_KEY);
}
