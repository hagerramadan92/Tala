"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useSession, signOut as nextAuthSignOut } from "next-auth/react";
import { ProductI } from "../../Types/ProductsI";

const AuthContext = createContext<any | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userImage, setUserImage] = useState<string | null>(null);
  const [fullName, setFullName] = useState<string | null>(null);

  const [favoriteProducts, setFavoriteProducts] = useState<ProductI[]>([]);
  const [favoriteProductsLoading, setFavoriteProductsLoading] =
    useState<boolean>(false);

  const { data: session, status } = useSession();

  /* ---------------------- LOAD LOCAL STORAGE + NEXTAUTH USER ---------------------- */
  useEffect(() => {
    if (typeof window === "undefined") return;

    const storedToken = localStorage.getItem("auth_token");
    const storedName = localStorage.getItem("userName");
    const storedEmail = localStorage.getItem("userEmail");
    const storedImage = localStorage.getItem("userImage");
    const storedFullName = localStorage.getItem("fullName");

    // Set from localStorage (only if different to avoid waterfall renders)
    if (storedToken && storedToken !== authToken) setAuthToken(storedToken);
    if (storedName && storedName !== userName) setUserName(storedName);
    if (storedEmail && storedEmail !== userEmail) setUserEmail(storedEmail);
    if (storedImage && storedImage !== userImage) setUserImage(storedImage);
    if (storedFullName && storedFullName !== fullName) setFullName(storedFullName);

    // Update from NextAuth session
    if (status === "authenticated" && session?.user) {
      const name = session.user.name || storedName || "مستخدم";
      const email = session.user.email || storedEmail || null;
      const image = session.user.image || storedImage || "";
      const full = storedFullName || session.user.name || "مستخدم";

      if (name !== userName) setUserName(name);
      if (email !== userEmail) setUserEmail(email);
      if (image !== userImage) setUserImage(image);
      if (full !== fullName) setFullName(full);

      localStorage.setItem("userName", name);
      if (email) localStorage.setItem("userEmail", email);
      if (image) localStorage.setItem("userImage", image);
      localStorage.setItem("fullName", full);
    }
  }, [session, status]); // intentionally not depending on userName/authToken to avoid cascades

  /* ---------------------- FETCH FAVORITES (MERGED: PRODUCTS + IDS) ---------------------- */
  useEffect(() => {
    let cancelled = false;

    const fetchFavorites = async () => {
      setFavoriteProductsLoading(true);

      if (!authToken) {
        setFavoriteProducts([]);
        localStorage.removeItem("favorites");
        setFavoriteProductsLoading(false);
        return;
      }

      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/favorites`, {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          cache: "no-store",
        });

        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

        const dataJson = await res.json();
        const list = Array.isArray(dataJson?.data) ? dataJson.data : [];

        // Products with is_favorite flag
        const favoritesWithFlag: ProductI[] = list.map((fav: any) => ({
          ...fav.product,
          is_favorite: true,
        }));

        // IDs to localStorage (same request)
        const ids = list
          .map((fav: any) => fav?.product?.id)
          .filter(Boolean);

        if (!cancelled) {
          setFavoriteProducts(favoritesWithFlag);
          localStorage.setItem("favorites", JSON.stringify(ids));
        }
      } catch (err) {
        console.error("Error fetching favorites:", err);
        if (!cancelled) {
          setFavoriteProducts([]);
          localStorage.removeItem("favorites");
        }
      } finally {
        if (!cancelled) setFavoriteProductsLoading(false);
      }
    };

    fetchFavorites();

    return () => {
      cancelled = true;
    };
  }, [authToken]);

  /* ------------------------------ LOGIN ------------------------------ */
  const login = (
    token: string,
    name: string,
    email?: string,
    image?: string,
    fullNameParam?: string
  ) => {
    setAuthToken(token);
    setUserName(name);
    setUserEmail(email || null);
    setUserImage(image || "");
    setFullName(fullNameParam || name);

    localStorage.setItem("auth_token", token);
    localStorage.setItem("userName", name);
    if (email) localStorage.setItem("userEmail", email);
    if (image) localStorage.setItem("userImage", image);
    localStorage.setItem("fullName", fullNameParam || name);
  };

  /* ------------------------------ API LOGIN ------------------------------ */
  const setAuthFromApi = (data: {
    token: string;
    name: string;
    email?: string;
    image?: string;
    fullName?: string;
  }) => {
    login(data.token, data.name, data.email, data.image, data.fullName);
  };

  /* ------------------------------ LOGOUT ------------------------------ */
  const logout = () => {
    setAuthToken(null);
    setUserName(null);
    setUserEmail(null);
    setUserImage(null);
    setFullName(null);

    localStorage.clear();
    nextAuthSignOut({ callbackUrl: "/login" });
  };

  const favoriteIdsSet = useMemo(() => {
    return new Set((favoriteProducts ?? []).map((p) => p.id));
  }, [favoriteProducts]);

  return (
    <AuthContext.Provider
      value={{
        authToken,
        userName,
        userEmail,
        userImage,
        fullName,
        login,
        logout,
        setAuthFromApi,
        favoriteProducts,
        favoriteProductsLoading,
        setFavoriteProducts,
        favoriteIdsSet,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = (): any => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
