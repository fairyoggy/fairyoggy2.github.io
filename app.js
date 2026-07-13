const input = document.getElementById('secret');
const codeEl = document.getElementById('code');
const timerEl = document.getElementById('timer');
const errorEl = document.getElementById('error');
const generateBtn = document.getElementById('generate');
const copyBtn = document.getElementById('copy');

let activeSecret = '';
let lastStep = -1;

function normalizeSecret(value) {
  return value
    .trim()
    .replace(/^otpauth:\/\/totp\/.*secret=([^&]+).*$/i, '$1')
    .replace(/\s+/g, '')
    .toUpperCase();
}

function generateCode(secret) {
  const totp = new OTPAuth.TOTP({
    issuer: 'Local 2FA',
    label: 'Secret',
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secret),
  });
  return totp.generate();
}

function refresh() {
  const secondsLeft = 30 - (Math.floor(Date.now() / 1000) % 30);
  timerEl.textContent = `Осталось: ${secondsLeft} сек`;

  if (!activeSecret) return;

  const step = Math.floor(Date.now() / 30000);
  if (step !== lastStep) {
    lastStep = step;
    try {
      codeEl.textContent = generateCode(activeSecret);
      errorEl.textContent = '';
    } catch {
      codeEl.textContent = '000000';
      errorEl.textContent = 'Неверный secret key. Нужен корректный Base32 ключ.';
      activeSecret = '';
    }
  }
}

function start() {
  const secret = normalizeSecret(input.value);

  if (!secret) {
    activeSecret = '';
    codeEl.textContent = '000000';
    errorEl.textContent = '';
    return;
  }

  activeSecret = secret;
  lastStep = -1;
  refresh();
}

generateBtn.addEventListener('click', start);

input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') start();
});

input.addEventListener('input', () => {
  if (!input.value.trim()) {
    activeSecret = '';
    codeEl.textContent = '000000';
    errorEl.textContent = '';
  }
});

copyBtn.addEventListener('click', async () => {
  if (!/^\d{6}$/.test(codeEl.textContent)) return;

  try {
    await navigator.clipboard.writeText(codeEl.textContent);
    copyBtn.textContent = 'Скопировано';
    setTimeout(() => {
      copyBtn.textContent = 'Скопировать код';
    }, 1200);
  } catch {
    errorEl.textContent = 'Не удалось скопировать код.';
  }
});

refresh();
setInterval(refresh, 250);