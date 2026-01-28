export const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function fetchApi(endpoint: string) {
  try {
    const res = await fetch(`${API_URL}/${endpoint}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      mode: "cors",
      cache: "no-store",
    });

    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

    const data = await res.json();

    if (!data.status) throw new Error(data.message || "فشل جلب البيانات");

    return data.data;
  } catch (err) {
    console.error(`Error fetching ${endpoint}:`, err);
    throw err;
  }
}
export async function fetchApi2(endpoint: string) {
  try {
    const res = await fetch(`${endpoint}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      mode: "cors",
      cache: "no-store",
    });

    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

    const data = await res.json();

    if (!data.status) throw new Error(data.message || "فشل جلب البيانات");

    return data.data;
  } catch (err) {
    console.error(`Error fetching ${endpoint}:`, err);
    throw err;
  }
}

export async function fetchHomeData() {
  try {
    const data = await fetchApi("home");
    return data;
  } catch (err) {
    console.error("Error fetching home data:", err);
    throw err;
  }
}
