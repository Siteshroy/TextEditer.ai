// Element References
const rewriteBtn = document.getElementById("rewrite-btn");
const inputText = document.getElementById("input-text");
const outputText = document.getElementById("output-text");
const outputWordCount = document.getElementById("output-word-count");
const wordCount = document.getElementById("word-count");
const featureButtons = document.querySelectorAll(".feature-btn");
const copyOutputBtn = document.getElementById("copy-output");
const downloadOutputBtn = document.getElementById("download-output");
const toneSelector = document.getElementById("tone-selector");
const rewriteLevel = document.getElementById("rewrite-level");

// Theme Elements
const themeToggle = document.getElementById("theme-toggle");
const themeIcon = themeToggle.querySelector("i");
const savedTheme = localStorage.getItem("theme") || "light";

// History Elements
const historyToggle = document.querySelector(".history-toggle");
const historyDrawer = document.querySelector(".history-drawer");
const historyClose = document.getElementById("history-close");
const historyItems = document.getElementById("history-items");
let historyData = [];

// Create an empty placeholder element for history
const empty = document.createElement("div");
empty.classList.add("empty-item");
empty.innerHTML = "<p>Nothing to display here</p>";

// ----- Particle.js Configuration -----
particlesJS("particles-js", {
  particles: {
    number: { value: 80, density: { enable: true, value_area: 800 } },
    color: { value: "#ffffff" },
    shape: { type: "circle", stroke: { width: 0, color: "#000000" } },
    opacity: { value: 0.5, random: false, anim: { enable: false } },
    size: { value: 3, random: true, anim: { enable: false } },
    line_linked: {
      enable: true,
      distance: 150,
      color: "#ffffff",
      opacity: 0.4,
      width: 1,
    },
    move: {
      enable: true,
      speed: 2,
      direction: "none",
      random: false,
      straight: false,
      out_mode: "out",
      bounce: false,
      attract: { enable: false },
    },
  },
  interactivity: {
    detect_on: "canvas",
    events: {
      onhover: { enable: true, mode: "grab" },
      onclick: { enable: true, mode: "push" },
      resize: true,
    },
    modes: {
      grab: { distance: 140, line_linked: { opacity: 1 } },
      push: { particles_nb: 4 },
    },
  },
  retina_detect: true,
});

// ----- Utility Functions -----

// Count words in a string
const countWords = (text) =>
  text.trim() === "" ? 0 : text.trim().split(/\s+/).length;

// Notification function
const showNotification = (message, type) => {
  const notification = document.getElementById("notification");
  notification.textContent = message;
  notification.className = "";
  notification.classList.add(type, "show");
  setTimeout(() => notification.classList.remove("show"), 3000);
};

// ----- Word Count Updates -----
inputText.addEventListener("input", function () {
  wordCount.textContent = countWords(this.value);
});
outputText.addEventListener("input", function () {
  outputWordCount.textContent = countWords(this.textContent);
});
const updateOutputWordCount = () => {
  outputWordCount.textContent = countWords(outputText.textContent);
};

// ----- Feature Buttons (Mutually Exclusive) -----
const shortenFeature = document.getElementById("shortenFeature");
const expandFeature = document.getElementById("expandFeature");

featureButtons.forEach((button) => {
  button.addEventListener("click", function () {
    this.classList.toggle("active");
    if (
      shortenFeature.classList.contains("active") &&
      expandFeature.classList.contains("active")
    ) {
      (this === shortenFeature
        ? expandFeature
        : shortenFeature
      ).classList.remove("active");
    }
  });
});

// ----- Download Output -----
downloadOutputBtn.addEventListener("click", () => {
  const content = outputText.textContent.trim();
  if (content === "Your rewritten text will appear here...") {
    showNotification("No content to download.", "error");
    return;
  }
  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "rewritten-text.txt";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showNotification("Text downloaded!", "success");
});

// ----- Copy Output -----
copyOutputBtn.addEventListener("click", () => {
  const content = outputText.textContent.trim();
  if (!content || content === "Your rewritten text will appear here...") {
    showNotification("No content to copy.", "error");
    return;
  }
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard
      .writeText(content)
      .then(() => showNotification("Copied to clipboard!", "success"))
      .catch((err) => {
        console.error("Clipboard API error:", err);
        showNotification("Failed to copy text.", "error");
      });
  } else {
    const textArea = document.createElement("textarea");
    textArea.value = content;
    textArea.style.position = "fixed";
    textArea.style.left = "-9999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      const successful = document.execCommand("copy");
      showNotification(
        successful ? "Copied to clipboard!" : "Failed to copy text.",
        successful ? "success" : "error"
      );
    } catch (err) {
      console.error("Fallback copy error:", err);
      showNotification("Failed to copy text.", "error");
    }
    document.body.removeChild(textArea);
  }
});

// ----- Rewrite Functionality -----
rewriteBtn.addEventListener("click", async function () {
  const text = inputText.value.trim();
  if (!text) {
    showNotification("Please enter some text to rewrite.", "error");
    return;
  }
  this.disabled = true;
  this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';

  const tone = toneSelector.value;
  const level = rewriteLevel.value;
  const activeFeatures = Array.from(
    document.querySelectorAll(".feature-btn.active")
  ).map((btn) => btn.dataset.feature);

  try {
    const response = await fetch("/api/rewrite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, tone, level, features: activeFeatures }),
    });
    const data = await response.json();
    if (data.success) {
      outputText.textContent = data.rewrittenText;
      addToHistory(text, data.rewrittenText);
      updateOutputWordCount();
      showNotification("Text has been rewritten!", "success");
    } else {
      showNotification("Failed to rewrite text.", "error");
    }
  } catch (error) {
    console.error("Error during rewriting:", error);
    showNotification("An error occurred while rewriting text.", "error");
  }
  this.disabled = false;
  this.innerHTML = '<i class="fas fa-magic"></i> Rewrite Text';
});

// ----- Clear Functions -----
const clearInputBtn = document.getElementById("clear-input");
clearInputBtn.addEventListener("click", () => {
  inputText.value = "";
  wordCount.textContent = "0";
  showNotification("Input cleared!", "success");
});

const clearAllBtn = document.getElementById("clear-all");
clearAllBtn.addEventListener("click", () => {
  inputText.value = "";
  outputText.textContent = "Your rewritten text will appear here...";
  wordCount.textContent = "0";
  outputWordCount.textContent = "0";
  featureButtons.forEach((btn) => btn.classList.remove("active"));
  toneSelector.selectedIndex = 0;
  rewriteLevel.selectedIndex = 1;
  showNotification("All cleared!", "success");
});

// ----- Theme Toggle -----
function setTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("theme", theme);
  if (theme === "dark") {
    themeIcon.classList.replace("fa-moon", "fa-sun");
  } else {
    themeIcon.classList.replace("fa-sun", "fa-moon");
  }
}
setTheme(savedTheme);
themeToggle.addEventListener("click", () => {
  const currentTheme =
    document.documentElement.getAttribute("data-theme") || "light";
  const newTheme = currentTheme === "light" ? "dark" : "light";
  setTheme(newTheme);
  showNotification(
    `${newTheme.charAt(0).toUpperCase() + newTheme.slice(1)} Theme Enabled`,
    "success"
  );
});

// ----- History Drawer -----
const toggleHistory = () => historyDrawer.classList.toggle("open");
historyToggle.addEventListener("click", toggleHistory);
historyClose.addEventListener("click", toggleHistory);

// ----- History Management -----
function addToHistory(textPreview, textResponse) {
  const timestamp = new Date();
  historyData.push({
    textPreview,
    textResponse,
    timestamp: timestamp.toISOString(),
  });
  createHistoryElem(textPreview, textResponse, timestamp);
  saveHistoryToLocalStorage();
}

// Creates a history element
function createHistoryElem(textPreview, textResponse, timestamp = new Date()) {
  const textDisplay =
    textPreview.length <= 60
      ? textPreview
      : textPreview.slice(0, 60).trim() + "...";
  const historyItem = document.createElement("div");
  historyItem.classList.add("history-item");
  historyItem.innerHTML = `<div><small>${timestamp.toLocaleTimeString()}</small><p>${textDisplay}</p></div><button class="history-delete d-none"><i class="bi bi-trash"></i></button>`;

  // click functionality
  const clickHistory = () => {
    inputText.value = textPreview;
    outputText.textContent = textResponse;
    showNotification("History item clicked!", "success");
  };
  historyItem.addEventListener("click", clickHistory);

  // Delete functionality
  const historyDelete = historyItem.querySelector(".history-delete");
  historyDelete.addEventListener("click", (event) => {
    event.stopPropagation();

    historyItem.classList.toggle("d-none");
    showUndoNotification();
  });

  function showUndoNotification() {
    notification.innerHTML = `History item deleted! <button class="undo-btn"><i class="bi bi-arrow-counterclockwise"></i></button>`;
    notification.className = "undo-notifs";
    notification.classList.add("success", "show");

    const timer = setTimeout(() => {
      notification.classList.remove("show");
      historyItem.classList.toggle("d-none");
      historyItem.remove();
      deleteHistoryItem(timestamp.toISOString());

      if (!historyItems.children.length) {
        historyItems.appendChild(empty);
      }
    }, 10000);

    const undoBtn = notification.querySelector(".undo-btn");
    undoBtn.addEventListener("click", () => {
      clearTimeout(timer);
      historyItem.classList.toggle("d-none");

      notification.classList.remove("show");
      showNotification("History item restored!", "success");
    });
  }

  historyItem.addEventListener("mouseenter", () =>
    historyDelete.classList.remove("d-none")
  );
  historyItem.addEventListener("mouseleave", () =>
    historyDelete.classList.add("d-none")
  );

  historyItems.prepend(historyItem);
  if (historyItems.contains(empty)) {
    historyItems.removeChild(empty);
  }
}

function deleteHistoryItem(timestampISO) {
  historyData = historyData.filter((item) => item.timestamp !== timestampISO);
  saveHistoryToLocalStorage();
}

// Saves history data to localStorage.
function saveHistoryToLocalStorage() {
  localStorage.setItem("rewriteHistory", JSON.stringify(historyData));
}

// Initializes history from localStorage.
function initHistory() {
  const storedHistory = localStorage.getItem("rewriteHistory");
  if (storedHistory) {
    try {
      historyData = JSON.parse(storedHistory);
      historyData.forEach((item) => {
        createHistoryElem(
          item.textPreview,
          item.textResponse,
          new Date(item.timestamp)
        );
      });
    } catch (e) {
      console.error("Error parsing stored history:", e);
    }
  }
  if (!historyItems.children.length) {
    historyItems.appendChild(empty);
  }
}

initHistory();
