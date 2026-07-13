# glazePass 🔐

> A premium, offline-first Chrome Extension for generating cryptographically secure passwords.

**glazePass** is a local-only, secure, and beautiful password generator designed as a Google Chrome Extension. It combines high-end glassmorphism aesthetics with cryptographic reliability to ensure your credentials are safe, unique, and easy to create.

---

## ✨ Features

- **Cryptographically Secure:** Uses the browser's built-in Web Crypto API (`crypto.getRandomValues`) and a modulo-bias-free Rejection Sampling engine.
- **Fisher-Yates Shuffle:** Shuffles the generated password array securely to guarantee equal distribution probability.
- **Modern Glassmorphic Design:** Sleek dark-mode aesthetic featuring radial background gradients, animated floating blur blobs, and high-fidelity glass panels.
- **Instant Auto-Copy Feedback:** Clicking "Generate & Copy" runs a 180ms cipher scramble animation, generates a password, and copies it directly to your clipboard.
- **Symmetrical Layout:** Dynamic CSS Flexbox spacing with perfect symmetry between text boundaries and copy buttons.
- **Intelligent Truncation:** Large passwords (above 18 characters) display first 9 and last 7 characters separated by uniform bullets (`••••••`) to prevent clipping, while keeping the full string available for clipboard copy.
- **Advanced Copy Interceptor:** Intercepts standard selection copy (`Ctrl+C` / `Cmd+C`) inside the display field so you always copy the unmasked password, even if bullets are shown.
- **Zero Dependencies:** Formed using vanilla HTML, CSS, and JS. 100% offline and secure against network tracking.

---

## 🛠️ Tech Stack

- **Structure:** HTML5 (Semantic and accessible)
- **Styling:** CSS3 (Variables, flexbox/grid layout, media queries, and transition animations)
- **Logic:** Vanilla JavaScript (ES6+)
- **Security:** Web Crypto API

---

## 📦 How to Install (Chrome Extension)

1. Open Google Chrome and type `chrome://extensions/` in the address bar.
2. In the top-right corner, toggle the **Developer mode** switch to **ON**.
3. In the top-left corner, click the **Load unpacked** button.
4. Select the root **glazePass** directory (containing `manifest.json`, `index.html`, etc.).
5. Pin **glazePass** to your browser toolbar for quick one-click access!

---

## 📐 Extension Viewport Constraints

- **Chrome Popup Viewport:** Handled by a custom `html` media query constraint of `380px` width by `540px` height with hidden scrollbars for compact visual styling.
- **Tab/Desktop Viewport:** Rescaled automatically to `100%` viewport width and height, centering the glass container card on larger monitor formats.

---

## 🔒 Security Principles

glazePass generates your passwords entirely client-side. The extension requests zero permissions, makes zero network requests, and never stores or logs your passwords.
