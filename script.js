/* ===========================================================
   VAULTGEN PRO
   SCRIPT.JS (PART 1)

   - DOM References
   - Character Sets
   - Secure Random Generator
   - Rejection Sampling
   - Password Generation
=========================================================== */

/* ===========================================================
   DOM REFERENCES
=========================================================== */

const passwordField = document.getElementById("password");

let currentGeneratedPassword = "";
let isGenerating = false;
let clipboardClearTimeout = null;

const copyButton = document.getElementById("copyBtn");

const generateButton = document.getElementById("generateBtn");

const slider = document.getElementById("lengthSlider");

const lengthValue = document.getElementById("lengthValue");

const strengthFill = document.getElementById("strengthFill");

const strengthLabel = document.getElementById("strengthLabel");

const strengthDot = document.getElementById("strengthDot");

const entropyLabel = document.getElementById("entropyLabel");

const toast = document.getElementById("toast");

const uppercaseCheckbox = document.getElementById("uppercase");

const lowercaseCheckbox = document.getElementById("lowercase");

const numbersCheckbox = document.getElementById("numbers");

const symbolsCheckbox = document.getElementById("symbols");

const excludeCheckbox = document.getElementById("exclude");

/* ===========================================================
   CHARACTER SETS
=========================================================== */

const CHARACTER_SETS = {
    uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",

    lowercase: "abcdefghijklmnopqrstuvwxyz",

    numbers: "0123456789",

    symbols: "!@#$%^&*()_+-={}[]<>?/|~",
};

/*
Characters that are easy to confuse
O 0
I l 1
*/
const AMBIGUOUS_CHARACTERS = "O0Il1";

/* ===========================================================
   SLIDER
=========================================================== */

slider.addEventListener("input", () => {
    lengthValue.textContent = slider.value;
});

/* ===========================================================
   BUILD CHARACTER POOL
=========================================================== */

function buildCharacterPools() {
    const pools = [];

    function prepare(set) {
        if (!excludeCheckbox.checked) {
            return set;
        }

        return [...set]
            .filter((character) => !AMBIGUOUS_CHARACTERS.includes(character))
            .join("");
    }

    if (uppercaseCheckbox.checked) {
        pools.push(prepare(CHARACTER_SETS.uppercase));
    }

    if (lowercaseCheckbox.checked) {
        pools.push(prepare(CHARACTER_SETS.lowercase));
    }

    if (numbersCheckbox.checked) {
        pools.push(prepare(CHARACTER_SETS.numbers));
    }

    if (symbolsCheckbox.checked) {
        pools.push(prepare(CHARACTER_SETS.symbols));
    }

    return pools;
}

/* ===========================================================
   CRYPTO RANDOM NUMBER

   Rejection Sampling

   Using '%' directly introduces modulo bias.

   This method guarantees every value has exactly the same
   probability.
=========================================================== */

const randomBuffer = new Uint8Array(256);
let randomBufferIndex = randomBuffer.length;

function getSecureRandomByte() {
    if (randomBufferIndex >= randomBuffer.length) {
        crypto.getRandomValues(randomBuffer);
        randomBufferIndex = 0;
    }
    return randomBuffer[randomBufferIndex++];
}

function secureRandom(max) {
    if (max <= 0) {
        throw new Error("Invalid max value.");
    }

    const limit = 256 - (256 % max);

    while (true) {
        const byte = getSecureRandomByte();

        if (byte < limit) {
            return byte % max;
        }
    }
}

/* ===========================================================
   FISHER-YATES SHUFFLE

   Uses crypto randomness.

=========================================================== */

function shuffle(array) {
    for (let current = array.length - 1; current > 0; current--) {
        const random = secureRandom(current + 1);

        [array[current], array[random]] = [array[random], array[current]];
    }

    return array;
}

function formatPasswordForDisplay(password) {
    if (password.length <= 18) {
        return password;
    }
    const start = password.slice(0, 9);
    const end = password.slice(-7);
    const dots = "••••••";
    return start + dots + end;
}

passwordField.addEventListener("copy", (event) => {
    event.preventDefault();
    if (event.clipboardData && currentGeneratedPassword) {
        event.clipboardData.setData("text/plain", currentGeneratedPassword);
    }
});

/* ===========================================================
   PASSWORD GENERATOR
=========================================================== */

function generatePassword() {
    const pools = buildCharacterPools();

    if (pools.length === 0) {
        showToast("Select at least one character type");

        return;
    }

    const passwordLength = Number(slider.value);

    const password = [];

    /*
       Guarantee one character from
       every enabled category.
    */

    for (const pool of pools) {
        password.push(pool[secureRandom(pool.length)]);
    }

    /*
       Combined pool
    */

    const combinedPool = pools.join("");

    while (password.length < passwordLength) {
        password.push(combinedPool[secureRandom(combinedPool.length)]);
    }

    shuffle(password);

    const finalPassword = password

        .slice(0, passwordLength)

        .join("");

    currentGeneratedPassword = finalPassword;
    passwordField.value = formatPasswordForDisplay(finalPassword);
    passwordField.select();

    passwordField.classList.remove("generated");

    void passwordField.offsetWidth;

    passwordField.classList.add("generated");
}
/* ===========================================================
   VAULTGEN PRO
   SCRIPT.JS (PART 2)

   - Entropy
   - Strength Meter
   - Copy
   - Toast
   - Events
=========================================================== */

/* ===========================================================
   ENTROPY CALCULATION
=========================================================== */

function calculateEntropy(passwordLength, poolSize) {
    return passwordLength * Math.log2(poolSize);
}

/* ===========================================================
   STRENGTH METER
=========================================================== */

function updateStrengthMeter() {
    const pools = buildCharacterPools();

    if (pools.length === 0 || !currentGeneratedPassword) {
        strengthFill.style.width = "0%";

        strengthLabel.textContent = !currentGeneratedPassword ? "Ready" : "No Selection";

        entropyLabel.textContent = "0 bits";

        strengthDot.style.background = "transparent";
        strengthDot.style.boxShadow = "none";

        return;
    }

    const combinedPool = pools.join("");

    const entropy = calculateEntropy(
        Number(slider.value),

        combinedPool.length,
    );

    entropyLabel.textContent = `${Math.round(entropy)} bits`;

    let percentage = Math.min((entropy / 128) * 100, 100);

    strengthFill.style.width = `${percentage}%`;

    if (entropy < 40) {
        strengthLabel.textContent = "Weak";

        strengthFill.style.background = "#ef4444";

        strengthDot.style.background = "#ef4444";
        strengthDot.style.boxShadow = "0 0 10px rgba(239, 68, 68, 0.6)";
    } else if (entropy < 64) {
        strengthLabel.textContent = "Fair";

        strengthFill.style.background = "#f59e0b";

        strengthDot.style.background = "#f59e0b";
        strengthDot.style.boxShadow = "0 0 10px rgba(245, 158, 11, 0.6)";
    } else if (entropy < 96) {
        strengthLabel.textContent = "Strong";

        strengthFill.style.background = "#3b82f6";

        strengthDot.style.background = "#3b82f6";
        strengthDot.style.boxShadow = "0 0 10px rgba(59, 130, 246, 0.6)";
    } else {
        strengthLabel.textContent = "Excellent";

        strengthFill.style.background =
            "linear-gradient(90deg,#8b5cf6,#d946ef)";

        strengthDot.style.background = "#22c55e";
        strengthDot.style.boxShadow = "0 0 10px rgba(34, 197, 94, 0.6)";
    }
}

/* ===========================================================
   COPY TOAST
=========================================================== */

function showToast(message) {
    toast.innerHTML = message;

    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 1800);
}

/* ===========================================================
   COPY PASSWORD
=========================================================== */

const COPY_SVG = `
<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2"></rect>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
</svg>
`;

const SUCCESS_SVG = `
<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="20 6 9 17 4 12"></polyline>
</svg>
`;

function startClipboardClearTimer(passwordToClear) {
    if (clipboardClearTimeout) {
        clearTimeout(clipboardClearTimeout);
    }
    clipboardClearTimeout = setTimeout(async () => {
        try {
            const currentText = await navigator.clipboard.readText();
            if (currentText === passwordToClear) {
                await navigator.clipboard.writeText("");
                showToast("Clipboard cleared for security");
            }
        } catch (error) {
            // Ignore access errors or permission denials
        }
    }, 30000);
}

async function copyPassword() {
    const password = currentGeneratedPassword;

    if (!password) {
        return;
    }

    try {
        await navigator.clipboard.writeText(password);

        copyButton.classList.add("success");

        copyButton.innerHTML = SUCCESS_SVG;

        showToast("Password copied");

        startClipboardClearTimer(password);

        setTimeout(() => {
            copyButton.classList.remove("success");

            copyButton.innerHTML = COPY_SVG;
        }, 1800);
    } catch (error) {
        console.error(error);

        showToast("Copy failed");
    }
}

/* ===========================================================
   GENERATE + UI
=========================================================== */

function generate() {
    generatePassword();

    updateStrengthMeter();
}

const GREEN_TICK_SVG = `
<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0;">
    <polyline points="20 6 9 17 4 12"></polyline>
</svg>
`;

const GENERATE_BTN_HTML = `🔐 Generate & Copy`;
const GENERATE_BTN_SUCCESS_HTML = `${GREEN_TICK_SVG}<span>Generated &amp; Copied</span>`;

async function copyGeneratedPassword() {
    const password = currentGeneratedPassword;

    if (!password) {
        generateButton.disabled = false;
        isGenerating = false;
        return;
    }

    try {
        await navigator.clipboard.writeText(password);

        generateButton.innerHTML = GENERATE_BTN_SUCCESS_HTML;
        generateButton.disabled = true;

        copyButton.classList.add("success");
        copyButton.innerHTML = SUCCESS_SVG;

        startClipboardClearTimer(password);

        setTimeout(() => {
            generateButton.innerHTML = GENERATE_BTN_HTML;
            generateButton.disabled = false;
            copyButton.classList.remove("success");
            copyButton.innerHTML = COPY_SVG;
            isGenerating = false;
        }, 1500);
    } catch (error) {
        console.error(error);
        showToast("Copy failed");
        generateButton.disabled = false;
        isGenerating = false;
    }
}

function generateAndCopy() {
    if (isGenerating) {
        return;
    }

    const pools = buildCharacterPools();

    if (pools.length === 0) {
        showToast("Select at least one character type");
        return;
    }

    isGenerating = true;
    generateButton.disabled = true;

    const combinedPool = pools.join("");
    const passwordLength = Number(slider.value);
    
    let elapsed = 0;
    const intervalTime = 30;
    const animationDuration = 180;

    const animation = setInterval(() => {
        let dummy = "";
        for (let i = 0; i < passwordLength; i++) {
            dummy += combinedPool[secureRandom(combinedPool.length)];
        }
        passwordField.value = formatPasswordForDisplay(dummy);
        elapsed += intervalTime;

        if (elapsed >= animationDuration) {
            clearInterval(animation);
            generate();
            copyGeneratedPassword();
        }
    }, intervalTime);
}

/* ===========================================================
   EVENTS
=========================================================== */

generateButton.addEventListener(
    "click",

    generateAndCopy,
);

copyButton.addEventListener(
    "click",

    copyPassword,
);

passwordField.addEventListener(
    "dblclick",

    copyPassword,
);

/* ===========================================================
   LIVE UPDATES
=========================================================== */

slider.addEventListener("input", () => {

    generate();

});

[
    uppercaseCheckbox,
    lowercaseCheckbox,
    numbersCheckbox,
    symbolsCheckbox,
    excludeCheckbox,
].forEach((element) => {
    element.addEventListener(
        "change",

        updateStrengthMeter,
    );
});

/* ===========================================================
   KEYBOARD SHORTCUTS
=========================================================== */

document.addEventListener(
    "keydown",

    (event) => {
        if (event.key === "Enter") {
            generateAndCopy();
        }

        if (event.key === "Escape") {
            passwordField.blur();
        }
    },
);
/* ===========================================================
   INITIALIZATION
=========================================================== */

function initialize() {
    // Update slider value
    lengthValue.textContent = slider.value;

    // Update strength meter
    updateStrengthMeter();
}

// Start VaultGen
initialize();
