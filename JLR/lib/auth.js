import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from './prisma';

function cleanValue(value) {
  return String(value || '')
    .trim()
    .replace(/\s+/g, '');
}

export const authOptions = {
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        idNumber: { label: 'ID Number', type: 'text' },
        employeeCode: { label: 'Employee ID', type: 'text' },
      },
      async authorize(credentials) {
        const idNumber = cleanValue(credentials?.idNumber);
        const employeeCode = cleanValue(credentials?.employeeCode);

        if (!idNumber || !employeeCode) return null;

        const user = await prisma.user.findFirst({
          where: { idNumber },
          include: { department: true },
        });

        if (!user) return null;
        if (cleanValue(user.employeeCode) !== employeeCode) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          employeeCode: user.employeeCode,
          idNumber: user.idNumber,
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
        token.idNumber = user.idNumber;
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
      session.user.idNumber = token.idNumber;
      session.user.role = token.role;
      session.user.departmentId = token.departmentId;
      session.user.departmentName = token.departmentName;
      session.user.avatarLabel = token.avatarLabel;
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
