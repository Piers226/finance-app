import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      await connectToDatabase();
      let existing = await User.findOne({ email: user.email });
      //const verified = user.email === "par226@lehigh.edu" || user.email === "piersr52@gmail.com";
      //if (!verified) {
      //  return false;
      //}

      // if user does not exist in db, create a new one
      //set newAccount to true, once they setup their budget (and go through tutorial), set to false
      if (!existing) {
        existing = await User.create({
          name: user.name,
          email: user.email,
          newAccount: true,
          disabled: false,
        });
      }
      // prevent disabled users (bannded) from signing in
      if (existing.disabled) return false;

      return true;
    },
    // Put newAccount into the JWT so middleware can read it
    async jwt({ token, user }) {
      // Keep token fields (newAccount, disabled, userId) in sync with DB.
      // `user` exists on initial sign-in; afterwards attempt to use token.email
      // so we can refresh the flags whenever the jwt callback runs.
      const email = user?.email || token?.email;
      if (email) {
        await connectToDatabase();
        const dbUser = await User.findOne({ email }).lean();

        token.userId = dbUser?._id?.toString();
        token.newAccount = dbUser?.newAccount ?? false;
        token.disabled = dbUser?.disabled ?? false;
        token.email = email;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId;
        session.user.newAccount = token.newAccount;
        session.user.disabled = token.disabled;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
