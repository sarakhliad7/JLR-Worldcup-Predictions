import CredentialsProvider from 'next-auth/providers/credentials';
import { verifyPassword } from './password';
import { prisma } from './prisma';

export const authOptions = {
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        employeeCode: { label: 'Employee ID', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.employeeCode || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.trim().toLowerCase() },
          include: { department: true },
        });

        if (!user) return null;

        // Both the email AND the employee ID must match the same account.
        if (user.employeeCode !== credentials.employeeCode.trim()) return null;

        const valid = verifyPassword(credentials.password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          employeeCode: user.employeeCode,
          role: user.role,
          departmentId: user.departmentId,
          departmentName: user.department?.name || null,
          avatarLabel: user.avatarLabel,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.employeeCode = user.employeeCode;
        token.role = user.role;
        token.departmentId = user.departmentId;
        token.departmentName = user.departmentName;
        token.avatarLabel = user.avatarLabel;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.email = token.email;
      session.user.employeeCode = token.employeeCode;
      session.user.role = token.role;
      session.user.departmentId = token.departmentId;
      session.user.departmentName = token.departmentName;
      session.user.avatarLabel = token.avatarLabel;
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
