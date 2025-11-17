import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { getServiceSupabase } from "./supabase";
import bcrypt from "bcryptjs";

// Helper to check if auth is properly configured
const isAuthConfigured = () => {
  return (
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET &&
    process.env.GOOGLE_CLIENT_ID !== 'placeholder-client-id' &&
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co'
  );
};

const providers = [];

// Only add Google provider if configured
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET &&
    process.env.GOOGLE_CLIENT_ID !== 'placeholder-client-id') {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  );
}

// Only add credentials provider if Supabase is configured
if (process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co') {
  providers.push(
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password required");
        }

        const supabase = getServiceSupabase();

        // Find user by email
        const { data: user, error } = await supabase
          .from('users')
          .select('*')
          .eq('email', credentials.email)
          .single();

        if (error || !user) {
          throw new Error("Invalid credentials");
        }

        // Check if user has a password (might be OAuth only)
        if (!user.password_hash) {
          throw new Error("Please sign in with Google");
        }

        // Verify password
        const isValid = await bcrypt.compare(credentials.password, user.password_hash);

        if (!isValid) {
          throw new Error("Invalid credentials");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      }
    })
  );
}

export const authOptions: NextAuthOptions = {
  providers,
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        const supabase = getServiceSupabase();

        // Check if user exists
        const { data: existingUser } = await supabase
          .from('users')
          .select('*')
          .eq('email', user.email!)
          .single();

        if (!existingUser) {
          // Create new user
          const { error } = await supabase
            .from('users')
            .insert({
              email: user.email!,
              name: user.name,
              image: user.image,
              password_hash: null, // OAuth user, no password
            });

          if (error) {
            console.error("Error creating user:", error);
            return false;
          }

          // Create default customizations for new user
          const { data: newUser } = await supabase
            .from('users')
            .select('id')
            .eq('email', user.email!)
            .single();

          if (newUser) {
            await createDefaultCustomizations(newUser.id);
          }
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        // Get user ID from database
        const supabase = getServiceSupabase();
        const { data: user } = await supabase
          .from('users')
          .select('id')
          .eq('email', session.user.email!)
          .single();

        if (user) {
          (session.user as any).id = user.id;
        }
      }
      return session;
    }
  },
  pages: {
    signIn: '/auth/login',
    signOut: '/auth/login',
    error: '/auth/error',
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

// Helper function to create default customizations for new users
async function createDefaultCustomizations(userId: string) {
  const supabase = getServiceSupabase();

  const defaultCategories = [
    { name: "STRATEGY", color: "#8b5cf6" },
    { name: "VISION", color: "#3b82f6" },
    { name: "TACTICAL", color: "#10b981" },
    { name: "PROJECT", color: "#f59e0b" },
    { name: "DAILY", color: "#ef4444" }
  ];

  const defaultPriorities = [
    { name: "low", color: "#6b7280" },
    { name: "medium", color: "#f59e0b" },
    { name: "high", color: "#ef4444" },
    { name: "critical", color: "#dc2626" }
  ];

  const defaultStatuses = [
    { name: "open", color: "#6b7280" },
    { name: "in-progress", color: "#3b82f6" },
    { name: "blocked", color: "#ef4444" },
    { name: "done", color: "#10b981" }
  ];

  await supabase.from('customizations').insert([
    { user_id: userId, type: 'categories', data: defaultCategories },
    { user_id: userId, type: 'priorities', data: defaultPriorities },
    { user_id: userId, type: 'statuses', data: defaultStatuses }
  ]);
}
