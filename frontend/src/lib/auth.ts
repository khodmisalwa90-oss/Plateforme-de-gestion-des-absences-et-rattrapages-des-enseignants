import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import axios from "axios";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        mot_de_passe: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.mot_de_passe) {
          throw new Error("Email et mot de passe requis");
        }

        try {
          // 1. Authenticate with backend
          const loginRes = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
            email: credentials.email,
            mot_de_passe: credentials.mot_de_passe,
          });

          const { access_token } = loginRes.data;

          if (!access_token) {
            throw new Error("Erreur lors de l'authentification");
          }

          // 2. Fetch user details using the token
          const userRes = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
            headers: {
              Authorization: `Bearer ${access_token}`,
            },
          });

          const user = userRes.data;

          // 3. Return user object with token for the session
          return {
            ...user,
            accessToken: access_token,
          };
        } catch (error: any) {
          console.error("Auth error:", error.response?.data || error.message);
          throw new Error(error.response?.data?.detail || "Email ou mot de passe incorrect");
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.accessToken = (user as any).accessToken;
        token.role = (user as any).role;
        token.nom = (user as any).nom;
        token.prenom = (user as any).prenom;
        token.id = (user as any).id;
      }

      if (trigger === "update" && session?.user) {
        token.nom = session.user.nom;
        token.prenom = session.user.prenom;
        token.email = session.user.email;
      }

      return token;
    },
    async session({ session, token }) {
      if (token) {
        (session as any).accessToken = token.accessToken;
        (session as any).user.role = token.role;
        (session as any).user.nom = token.nom;
        (session as any).user.prenom = token.prenom;
        (session as any).user.id = token.id;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
