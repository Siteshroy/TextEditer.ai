// Set up pdf.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.14.305/pdf.worker.min.js";

// DOM Elements
const notification = document.getElementById("notification");

const themeToggle = document.querySelector(".theme-toggle");
const themeIcon = themeToggle.querySelector("i");
const savedTheme = localStorage.getItem("theme") || "light";

const copyOutputBtn = document.getElementById("copyBtn");
const downloadOutputBtn = document.getElementById("downloadBtn");

const summaryText = document.getElementById("summaryText");
const summaryContainer = document.getElementById("summaryContainer");
const summarizeBtn = document.getElementById("summarizeBtn");
const summaryLengthContainer = document.querySelector(".summary-length");
const summaryLength = document.getElementById("summaryLength");

const uploadArea = document.getElementById("uploadArea");
const steps = document.querySelectorAll(".step");
const progressBar = document.querySelector(".progress-bar");
const progressText = document.getElementById("progressText");

const fileIcon = document.getElementById("fileIcon");
const fileInput = document.getElementById("fileInput");
const fileList = document.getElementById("fileList");

const historyToggle = document.querySelector(".history-toggle");
const historyPanel = document.querySelector(".history-panel");
const historyClose = document.getElementById("history-close");
const historyItems = document.getElementById("history-items");

// Global state variables
let files = [];
let uploadedFiles = 0;
let historyData = [];

// Create a placeholder for history
const empty = document.createElement("div");
empty.classList.add("empty-item");
empty.innerHTML = "<p>Nothing to display here</p>";

// ----- Particle.js Configuration -----
particlesJS("particles-js", {
  particles: {
    number: {
      value: 80,
      density: {
        enable: true,
        value_area: 800,
      },
    },
    color: { value: "#ffffff" },
    shape: {
      type: "circle",
      stroke: { width: 0, color: "#000000" },
    },
    opacity: {
      value: 0.5,
      random: false,
      anim: { enable: false },
    },
    size: {
      value: 3,
      random: true,
      anim: { enable: false },
    },
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

// Notification function
function showNotification(message, type) {
  notification.textContent = message;
  notification.className = "";
  notification.classList.add(type, "show");
  setTimeout(() => {
    notification.classList.remove("show");
  }, 3000);
}

// ----- Theme Toggle -----
function setTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("theme", theme);
  if (theme === "dark") {
    themeIcon.classList.remove("fa-moon");
    themeIcon.classList.add("fa-sun");
  } else {
    themeIcon.classList.remove("fa-sun");
    themeIcon.classList.add("fa-moon");
  }
}
setTheme(savedTheme);
themeToggle.addEventListener("click", () => {
  const currentTheme =
    document.documentElement.getAttribute("data-theme") || "light";
  const newTheme = currentTheme === "light" ? "dark" : "light";
  setTheme(newTheme);
  showNotification(
    `${newTheme[0].toUpperCase() + newTheme.substring(1)} Theme Enabled`,
    "success"
  );
});

// ----- History Toggle -----
const toggleHistory = () => {
  historyPanel.classList.toggle("open");
};
historyToggle.addEventListener("click", toggleHistory);
historyClose.addEventListener("click", toggleHistory);

// ----- Copy Output -----
copyOutputBtn.addEventListener("click", () => {
  const content = summaryText.value.trim();
  if (content === "") {
    showNotification("No content to copy.", "error");
    return;
  }

  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard
      .writeText(content)
      .then(() => {
        showNotification("Copied to clipboard!", "success");
        steps[steps.length - 1].classList.replace("active", "completed");
      })
      .catch((err) => {
        showNotification("Failed to copy text.", "error");
        console.error("Clipboard API error:", err);
      });
  }
});

// ----- Download Output -----
downloadOutputBtn.addEventListener("click", () => {
  const content = summaryText.value.trim();
  if (content) {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "summarize-text.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showNotification("Text downloaded!", "success");
    steps[steps.length - 1].classList.replace("active", "completed");
  } else {
    showNotification("No content to download.", "error");
  }
});

// ----- File Handling -----
const formatFileSize = (bytes) => {
  const kb = bytes / 1024;
  return kb < 1024 ? Math.round(kb) + " KB" : (kb / 1024).toFixed(2) + " MB";
};

const handleFileSelection = (e) => {
  const selectedFiles = Array.from(e.target.files);
  addFiles(selectedFiles);
};

const addFiles = (newFiles) => {
  const supportedFiles = newFiles.filter((file) => {
    const type = file.type;
    return (
      type === "application/pdf" ||
      type ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      type === "application/msword" ||
      type === "text/plain" ||
      type === "application/rtf"
    );
  });

  if (!supportedFiles.length) {
    showNotification(
      "Please upload supported file formats only (PDF, DOC/DOCX, TXT, RTF).",
      "error"
    );
    return;
  }

  files = files.concat(supportedFiles);
  summaryLengthContainer.classList.remove("d-none");
  updateFileList();
  summarizeBtn.disabled = files.length === 0;
};

const updateFileList = () => {
  fileList.innerHTML = "";
  files.forEach((file, index) => {
    const iconClass =
      file.type === "application/pdf"
        ? "bi-file-earmark-pdf"
        : file.type ===
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
          file.type === "application/msword"
        ? "bi-file-earmark-word"
        : file.type === "text/plain"
        ? "bi-file-earmark-text"
        : "bi-file-earmark";

    const fileItem = document.createElement("div");
    fileItem.className = "file-item";
    fileItem.innerHTML = `
      <div class="file-name"><i class="bi ${iconClass}"></i> ${file.name}</div>
      <div class="file-actions">
        <button class="file-action-btn delete" data-index="${index}">
          <i class="bi bi-trash"></i>
        </button>
      </div>
    `;
    fileList.appendChild(fileItem);
  });

  document.querySelectorAll(".file-action-btn.delete").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = parseInt(btn.getAttribute("data-index"), 10);
      removeFile(idx);
    });
  });
};

const removeFile = (index) => {
  files.splice(index, 1);
  updateFileList();
  summarizeBtn.disabled = files.length === 0;
};

// ----- File Input and Drag-Drop Listeners -----
fileInput.addEventListener("change", handleFileSelection);
uploadArea.addEventListener("dragover", (e) => {
  e.preventDefault();
  uploadArea.classList.add("dragging");
  fileIcon.classList.remove("bi-cloud-arrow-up");
  fileIcon.classList.add("bi-dropbox");
});
uploadArea.addEventListener("dragleave", (e) => {
  e.preventDefault();
  uploadArea.classList.remove("dragging");
});
uploadArea.addEventListener("drop", (e) => {
  e.preventDefault();
  uploadArea.classList.remove("dragging");
  fileIcon.classList.remove("bi-dropbox");
  fileIcon.classList.add("bi-cloud-arrow-up");
  handleFileSelection({ target: { files: e.dataTransfer.files } });
});

// ----- Summary Generator -----
const generateSummary = async () => {
  try {
    const texts = await Promise.all(
      files.map(async (file) => {
        const ext = file.name.split(".").pop().toLowerCase();
        if (ext === "pdf") {
          return await parsePDF(file);
        } else if (ext === "docx" || ext === "doc") {
          return await parseDOCX(file);
        } else if (ext === "txt" || ext === "rtf") {
          return await parseText(file);
        } else {
          throw new Error("Unsupported file format: " + ext);
        }
      })
    );
    const combinedText = texts.join(" ");
    return getSummary(combinedText);
  } catch (error) {
    showNotification("Error while parsing files: " + error.message, "error");
  }
};

// ----- File Parsing Functions -----
async function parsePDF(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    let text = "";
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const content = await page.getTextContent();
      const pageText = content.items.map((item) => item.str).join(" ");
      text += pageText + "\n";
    }
    return text;
  } catch (error) {
    console.error("Error parsing PDF:", error);
    throw new Error("Failed to parse PDF file.");
  }
}

async function parseDOCX(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  } catch (error) {
    console.error("Error parsing DOCX:", error);
    throw new Error("Failed to parse DOCX file.");
  }
}

async function parseText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => {
      console.error("Error reading text file.");
      reject(new Error("Failed to read text file."));
    };
    reader.readAsText(file);
  });
}

// ----- Summary API call -----
const getSummary = async (text) => {
  try {
    let summaryLengthValue = summaryLength.value;
    const response = await fetch("/api/summarize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        length: summaryLengthValue,
      }),
    });
    const data = await response.json();
    if (data.success) {
      return data.summarizeText;
    } else {
      showNotification("Failed to summarize document(s).", "error");
    }
  } catch (error) {
    console.error("Error during summarizing:", error);
    showNotification("An error occurred while summarizing text.", "error");
  }
};

// ----- Summarization Button -----
summarizeBtn.addEventListener("click", () => {
  if (!files.length) return;

  steps.forEach((step) => step.classList.remove("completed", "active"));
  steps[0].classList.add("active");
  summarizeBtn.disabled = true;
  progressBar.style.width = "0%";
  progressText.textContent = "Processing...";

  steps[0].classList.replace("active", "completed");
  steps[1].classList.add("active");
  let progress = 0;
  const totalFiles = files.length;
  uploadedFiles = 0;
  const interval = setInterval(() => {
    if (progress >= 100) {
      clearInterval(interval);
      steps[1].classList.replace("active", "completed");
      steps[2].classList.add("active");
      showResults();
      return;
    }
    progress = Math.min(progress + Math.random() * 5, 100);
    progressBar.style.width = `${progress}%`;
    progressText.textContent = `Processing ${Math.round(progress)}%`;
    if (progress > (uploadedFiles + 1) * (100 / totalFiles)) {
      uploadedFiles++;
      showNotification(
        `File ${uploadedFiles} of ${totalFiles} processed`,
        "success"
      );
    }
  }, 300);
});

const showResults = async () => {
  const text = await generateSummary();
  steps[2].classList.replace("active", "completed");
  steps[3].classList.add("active");
  summaryText.value = text;
  summaryContainer.classList.remove("d-none");
  showNotification("Document summarization complete!", "success");

  // Add to history and update storage
  addToHistory(
    files
      .map((file) =>
        file.name.length <= 30 ? file.name : file.name.slice(0, 30) + "..."
      )
      .join(", "),
    text
  );
  summarizeBtn.disabled = false;
};

// History Functions
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

function createHistoryElem(textPreview, textResponse, timestamp = new Date()) {
  const historyItem = document.createElement("div");
  historyItem.classList.add("history-item");

  historyItem.innerHTML = `<div><small>${timestamp.toLocaleTimeString()}</small><p>${textPreview}</p></div><button class="history-delete d-none"><i class="bi bi-trash"></i></button>`;

  // Click functionality
  historyItem.addEventListener("click", function () {
    summaryText.value = textResponse;
    showNotification("History item clicked!", "success");
  });

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

function saveHistoryToLocalStorage() {
  localStorage.setItem("summaryHistory", JSON.stringify(historyData));
}

function initHistory() {
  const storedHistory = localStorage.getItem("summaryHistory");
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
      console.error("Error parsing stored history", e);
    }
  }

  if (historyItems.children.length === 0) {
    historyItems.appendChild(empty);
  }
}

initHistory();
