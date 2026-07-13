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

const CHARACTER_SETS = {
    uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    lowercase: "abcdefghijklmnopqrstuvwxyz",
    numbers: "0123456789",
    symbols: "!@#$%^&*()_+-={}[]<>?/|~",
};

const AMBIGUOUS_CHARACTERS = "O0Il1";

slider.addEventListener("input", () => {
    lengthValue.textContent = slider.value;
});

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

function generatePassword() {
    const pools = buildCharacterPools();

    if (pools.length === 0) {
        showToast("Select at least one character type");
        return;
    }

    const passwordLength = Number(slider.value);
    const password = [];

    for (const pool of pools) {
        password.push(pool[secureRandom(pool.length)]);
    }

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
    passwordField.classList.remove("generated");
    void passwordField.offsetWidth;
    passwordField.classList.add("generated");
}

function calculateEntropy(passwordLength, poolSize) {
    return passwordLength * Math.log2(poolSize);
}

function updateStrengthMeter() {
    const pools = buildCharacterPools();

    if (pools.length === 0) {
        strengthFill.style.width = "0%";
        strengthLabel.textContent = "No Selection";
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
    let percentage = Math.min((entropy / 200) * 100, 100);
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
        strengthFill.style.background = "linear-gradient(90deg,#8b5cf6,#d946ef)";
        strengthDot.style.background = "#22c55e";
        strengthDot.style.boxShadow = "0 0 10px rgba(34, 197, 94, 0.6)";
    }
}

function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");
    setTimeout(() => {
        toast.classList.remove("show");
    }, 1800);
}

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
        showToast("Password copied");
        startClipboardClearTimer(password);
        setTimeout(() => {
            copyButton.classList.remove("success");
        }, 1800);
    } catch (error) {
        console.error(error);
        showToast("Copy failed");
    }
}

function generate() {
    generatePassword();
    updateStrengthMeter();
}

async function copyGeneratedPassword() {
    const password = currentGeneratedPassword;

    if (!password) {
        generateButton.disabled = false;
        isGenerating = false;
        return;
    }

    try {
        await navigator.clipboard.writeText(password);

        generateButton.classList.add("success");
        generateButton.disabled = true;

        copyButton.classList.add("success");

        startClipboardClearTimer(password);

        setTimeout(() => {
            generateButton.classList.remove("success");
            generateButton.disabled = false;
            copyButton.classList.remove("success");
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

generateButton.addEventListener("click", generateAndCopy);
copyButton.addEventListener("click", copyPassword);
passwordField.addEventListener("dblclick", copyPassword);

slider.addEventListener("input", () => {
    lengthValue.textContent = slider.value;
    updateStrengthMeter();
});

[
    uppercaseCheckbox,
    lowercaseCheckbox,
    numbersCheckbox,
    symbolsCheckbox,
    excludeCheckbox,
].forEach((element) => {
    element.addEventListener("change", updateStrengthMeter);
});

document.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        generateAndCopy();
    }

    if (event.key === "Escape") {
        passwordField.blur();
    }
});

function initialize() {
    lengthValue.textContent = slider.value;
    updateStrengthMeter();
}

initialize();
