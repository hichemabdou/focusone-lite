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
      authorization: {
        params: {
          scope: "openid email profile https://www.googleapis.com/auth/calendar",
          access_type: "offline",
          prompt: "consent",
        },
      },
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
      // Check if Supabase is configured
      const isSupabaseConfigured = process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co';

      if (account?.provider === "google" && isSupabaseConfigured) {
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
              google_refresh_token: account.refresh_token, // Save refresh token
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
        } else {
          // Update refresh token if provided
          if (account.refresh_token) {
            await supabase
              .from('users')
              .update({ google_refresh_token: account.refresh_token })
              .eq('id', existingUser.id);
          }
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        // Use email as ID if no database ID available
        token.id = user.id || user.email;
      }
      if (account) {
        token.accessToken = account.access_token;
        if (account.refresh_token) {
          token.refreshToken = account.refresh_token;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        // Check if Supabase is configured
        const isSupabaseConfigured = process.env.NEXT_PUBLIC_SUPABASE_URL &&
          process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co';

        if (isSupabaseConfigured) {
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
        } else {
          // Use email as ID when Supabase is not configured
          (session.user as any).id = token.id || session.user.email;
        }
        // Pass access token to client if needed
        (session as any).accessToken = token.accessToken;
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
    { id: "strategy", name: "STRATEGY", color: "#8b5cf6" },
    { id: "vision", name: "VISION", color: "#3b82f6" },
    { id: "tactical", name: "TACTICAL", color: "#10b981" },
    { id: "project", name: "PROJECT", color: "#f59e0b" },
    { id: "daily", name: "DAILY", color: "#ef4444" }
  ];

  const defaultPriorities = [
    { id: "low", name: "low", color: "#6b7280" },
    { id: "medium", name: "medium", color: "#f59e0b" },
    { id: "high", name: "high", color: "#ef4444" },
    { id: "critical", name: "critical", color: "#dc2626" }
  ];

  const defaultStatuses = [
    { id: "open", name: "open", color: "#6b7280" },
    { id: "in-progress", name: "in-progress", color: "#3b82f6" },
    { id: "blocked", name: "blocked", color: "#ef4444" },
    { id: "done", name: "done", color: "#10b981" }
  ];

  await supabase.from('customizations').insert([
    { user_id: userId, type: 'categories', data: defaultCategories },
    { user_id: userId, type: 'priorities', data: defaultPriorities },
    { user_id: userId, type: 'statuses', data: defaultStatuses }
  ]);
}
