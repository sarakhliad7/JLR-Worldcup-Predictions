const fs = require('fs');

let s = fs.readFileSync('app/login/page.js', 'utf8');

// state: employee ID stays visible, ID number gets show/hide
s = s.replace(
  "const [showEmployeeCode, setShowEmployeeCode] = useState(false);",
  "const [showIdNumber, setShowIdNumber] = useState(false);"
);

// replace the full login fields card
const oldBlock = `                  <div className="rounded-2xl bg-card-soft border border-card-border/70 shadow-sm overflow-hidden">
                    <div className="px-4 pt-4 pb-3 border-b border-card-border/60 flex items-start gap-3">
                      <MailIcon />
                      <div className="flex-1">
                        <label className="block text-sm font-bold text-ink-label mb-1">
                          'ID Number'
                        </label>
                        <input
                          type="text"
                          required
                          value={idNumber}
                          onChange={(e) => setIdNumber(e.target.value)}
                          placeholder='Enter your ID number'
                          className="w-full bg-transparent outline-none text-ink placeholder:text-ink-placeholder"
                        />
                      </div>
                    </div>

                    <div className="px-4 pt-4 pb-4 flex items-start gap-3">
                      <IdIcon />
                      <div className="flex-1">
                        <label className="block text-sm font-bold text-ink-label mb-1">
                          {t('login_employeeId')}
                        </label>
                        <input
                          type={showEmployeeCode ? 'text' : 'password'}
                          required
                          value={employeeCode}
                          onChange={(e) => setEmployeeCode(e.target.value)}
                          placeholder={t('login_employeeIdPlaceholder')}
                          className="w-full bg-transparent outline-none text-ink placeholder:text-ink-placeholder"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => setShowEmployeeCode((s) => !s)}
                        className="text-ink-faint focus-ring shrink-0 mt-0.5"
                        aria-label={showEmployeeCode ? 'Hide employee ID' : 'Show employee ID'}
                      >
                        {showEmployeeCode ? <EyeIcon /> : <EyeOffIcon />}
                      </button>
                    </div>
                  </div>`;

const newBlock = `                  <div className="rounded-2xl bg-card-soft border border-card-border/70 shadow-sm overflow-hidden">
                    <div className="px-4 pt-4 pb-3 border-b border-card-border/60 flex items-start gap-3">
                      <IdIcon />
                      <div className="flex-1">
                        <label className="block text-sm font-bold text-ink-label mb-1">
                          {t('login_employeeId')}
                        </label>
                        <input
                          type="text"
                          required
                          value={employeeCode}
                          onChange={(e) => setEmployeeCode(e.target.value)}
                          placeholder={t('login_employeeIdPlaceholder')}
                          className="w-full bg-transparent outline-none text-ink placeholder:text-ink-placeholder"
                          dir="ltr"
                        />
                      </div>
                    </div>

                    <div className="px-4 pt-4 pb-4 flex items-start gap-3">
                      <IdIcon />
                      <div className="flex-1">
                        <label className="block text-sm font-bold text-ink-label mb-1">
                          {t('login_email')}
                        </label>
                        <input
                          type={showIdNumber ? 'text' : 'password'}
                          required
                          value={idNumber}
                          onChange={(e) => setIdNumber(e.target.value)}
                          placeholder={t('login_emailPlaceholder')}
                          className="w-full bg-transparent outline-none text-ink placeholder:text-ink-placeholder"
                          dir="ltr"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => setShowIdNumber((s) => !s)}
                        className="text-ink-faint focus-ring shrink-0 mt-0.5"
                        aria-label={showIdNumber ? 'Hide ID number' : 'Show ID number'}
                      >
                        {showIdNumber ? <EyeIcon /> : <EyeOffIcon />}
                      </button>
                    </div>
                  </div>`;

if (!s.includes(oldBlock)) {
  console.error('Could not find the old login fields block.');
  process.exit(1);
}

s = s.replace(oldBlock, newBlock);

fs.writeFileSync('app/login/page.js', s, 'utf8');
console.log('Login fields fixed.');
