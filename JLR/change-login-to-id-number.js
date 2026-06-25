const fs = require('fs');

// 1) Auth: login by ID Number + Employee ID
const auth = `import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from './prisma';

function cleanValue(value) {
  return String(value || '')
    .trim()
    .replace(/\\s+/g, '');
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
`;

fs.writeFileSync('lib/auth.js', auth, 'utf8');

// 2) Login page: ID Number instead of Email
let login = fs.readFileSync('app/login/page.js', 'utf8');

login = login.replace('const [email, setEmail] = useState', 'const [idNumber, setIdNumber] = useState');
login = login.replace("email: email.trim().toLowerCase(),", "idNumber: idNumber.trim(),");
login = login.replace('type="email"', 'type="text"');
login = login.replaceAll('value={email}', 'value={idNumber}');
login = login.replaceAll('setEmail(e.target.value)', 'setIdNumber(e.target.value)');
login = login.replaceAll("{t('login_email')}", "'ID Number'");
login = login.replaceAll("{t('login_emailPlaceholder')}", "'Enter your ID number'");

fs.writeFileSync('app/login/page.js', login, 'utf8');

// 3) Admin employees API: include idNumber
let api = fs.readFileSync('app/api/admin/employees/route.js', 'utf8');

api = api.replace('      employeeCode: e.employeeCode,\n', '      employeeCode: e.employeeCode,\n      idNumber: e.idNumber,\n');

api = api.replace(
  "  const employeeCode = (body.employeeCode || '').trim();\n",
  "  const employeeCode = (body.employeeCode || '').trim();\n  const idNumber = (body.idNumber || '').trim() || null;\n"
);

api = api.replace(
  "    where: { OR: [{ email }, { employeeCode }] },",
  "    where: { OR: [{ email }, { employeeCode }, ...(idNumber ? [{ idNumber }] : [])] },"
);

api = api.replace(
  "      employeeCode,\n      passwordHash:",
  "      employeeCode,\n      idNumber,\n      passwordHash:"
);

api = api.replace(
  "employee: { id: user.id, name: user.name, email: user.email, employeeCode: user.employeeCode }",
  "employee: { id: user.id, name: user.name, email: user.email, employeeCode: user.employeeCode, idNumber: user.idNumber }"
);

fs.writeFileSync('app/api/admin/employees/route.js', api, 'utf8');

// 4) Admin employees page: add idNumber field to form
let page = fs.readFileSync('app/admin/employees/page.js', 'utf8');

page = page.replaceAll("email: '',\n    employeeCode:", "email: '',\n    idNumber: '',\n    employeeCode:");
page = page.replaceAll("email: emp.email,\n      employeeCode:", "email: emp.email,\n      idNumber: emp.idNumber || '',\n      employeeCode:");

page = page.replace(
  "e.email?.toLowerCase().includes(term) ||\n        e.employeeCode?.toLowerCase().includes(term)",
  "e.email?.toLowerCase().includes(term) ||\n        e.idNumber?.toLowerCase().includes(term) ||\n        e.employeeCode?.toLowerCase().includes(term)"
);

page = page.replace(
  'placeholder="Search by name, email, employee ID, or department..."',
  'placeholder="Search by name, ID number, employee ID, email, or department..."'
);

page = page.replace(
  `<Field label={t('admin_employees_employeeId')}>`,
  `<Field label="ID Number">
              <input
                value={form.idNumber}
                onChange={(e) => setForm({ ...form, idNumber: e.target.value })}
                className="w-full rounded-lg border border-card-border/60 bg-white/60 px-3 py-2 text-sm focus-ring"
              />
            </Field>

            <Field label={t('admin_employees_employeeId')}>`
);

page = page.replace(
  `<th className="px-4 py-3 text-start font-semibold">
                {t('admin_employees_employeeId')}
              </th>`,
  `<th className="px-4 py-3 text-start font-semibold">
                ID Number
              </th>
              <th className="px-4 py-3 text-start font-semibold">
                {t('admin_employees_employeeId')}
              </th>`
);

page = page.replace(
  `<td className="px-4 py-3 text-ink-body font-tabular">
                  {e.employeeCode}
                </td>`,
  `<td className="px-4 py-3 text-ink-body font-tabular">
                  {e.idNumber || '-'}
                </td>
                <td className="px-4 py-3 text-ink-body font-tabular">
                  {e.employeeCode}
                </td>`
);

fs.writeFileSync('app/admin/employees/page.js', page, 'utf8');

console.log('Login changed to ID Number + Employee ID, and Employees page supports ID Number.');
