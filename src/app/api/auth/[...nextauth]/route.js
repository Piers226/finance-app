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
      const existing = await User.findOne({ email: user.email });
      //const verified = user.email === "par226@lehigh.edu" || user.email === "piersr52@gmail.com";
      //if (!verified) {
      //  return false;
      //}
      if (!existing) {
        await User.create({
          name: user.name,
          email: user.email,
          hasSetupBudget: false,
          disabled: false,
        });
      }
      if (existing.disabled) {
        return false;
      }
      return true;
    },

    async session({ session }) {
      await connectToDatabase();
      const user = await User.findOne({ email: session.user.email });
      if (user) {
        session.user.id = user._id.toString();
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };