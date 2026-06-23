import './globals.css';
import Providers from './providers';
import Shell from './shell';
import { LocaleProvider } from '../lib/i18n/LocaleContext';

export const metadata = {
  title: 'JLR Predictions | World Cup 2026',
  description: "JLR's internal World Cup 2026 staff prediction league",
  icons: {
    icon: '/icon.png',
  },
};

// Runs before paint so the saved language preference applies immediately,
// avoiding a flash of the wrong direction while React hydrates.
const setInitialDirScript = `
  try {
    var saved = localStorage.getItem('locale');
    var locale = saved === 'ar' ? 'ar' : 'en';
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
  } catch (e) {}
`;

export default function RootLayout({ children }) {
  return (
    <html lang="en" dir="ltr">
      <head>
        <script dangerouslySetInnerHTML={{ __html: setInitialDirScript }} />
      </head>
      <body>
        <Providers>
          <LocaleProvider>
            <Shell>{children}</Shell>
          </LocaleProvider>
        </Providers>
      </body>
    </html>
  );
}
