import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "openid email profile",
        },
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, account }) {
      if (account?.provider === "google" && account?.access_token) {
        try {
          const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
            headers: {
              Authorization: `Bearer ${account.access_token}`,
            },
          });
          const data = await res.json() as { picture?: string };
          token.image = data.picture ?? null;
          token.provider = account.provider;
        } catch (err) {
          console.log("Error fetching Google profile image:", err);
          token.image = null;
        }
      }
      return token;
    },
    async session({ session, token }) {
      session.user = {
        sub: token.sub,
        name: token.name,
        email: token.email,
        image: token.image,
        provider: token.provider,
      };
     
      return session;
    },
  },
});

export { handler as GET, handler as POST };
