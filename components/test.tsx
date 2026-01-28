"use client";

import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import { useEffect } from "react";

export default function Profile() {
  const { data: session, status } = useSession();
 

  if (status === "loading") return <p>Loading...</p>;
  if (!session) return <p>لم يتم تسجيل الدخول</p>;

  return (
    <div className="flex flex-col items-center gap-2 mt-4 shadow-2xl w-1/2 mx-auto bg-red-100">
      <h1 className="text-xl font-bold">{session.user.name}</h1>

      {session.user.image ? (
        <Image
          src={session.user.image}
          alt={session.user.name ?? "Profile"}
          width={128}
          height={128}
          className="rounded-full"
        />
      ) : (
        <p>No profile image</p>
      )}

      <p className="text-sm text-gray-600">{session.user.email}</p>
      <p className="text-sm text-gray-600">Provider: {session.user.provider}</p>

      <button
      aria-label="log out"
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
      >
        تسجيل الخروج
      </button>
    </div>
  );
}
