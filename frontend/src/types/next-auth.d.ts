import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      nom: string;
      prenom: string;
    } & DefaultSession["user"];
    accessToken: string;
  }

  interface User {
    id: string;
    role: string;
    nom: string;
    prenom: string;
    accessToken: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken: string;
    role: string;
    nom: string;
    prenom: string;
  }
}
