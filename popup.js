document.addEventListener("DOMContentLoaded", () => {
    const tabButtons = document.querySelectorAll(".tab-button");
    const tabContents = document.querySelectorAll(".tab-content");
    const searchBtn = document.getElementById("searchBtn");
    const searchInput = document.getElementById("searchInput");
    const themeSelect = document.getElementById("themeSelect");

    const exportButton = document.getElementById("exportButton");
    const importButton = document.getElementById("importButton");
    const importFile = document.getElementById("importFile");

    const hamburgerBtn = document.getElementById("hamburgerBtn");
    const closeHamburgerBtn = document.getElementById("closeHamburgerBtn");
    const hamburgerMenu = document.getElementById("hamburgerMenu");
    const hamburgerOverlay = document.querySelector(".hamburger-overlay");

    exportButton.addEventListener("click", exportSettings);
    importButton.addEventListener("click", () => importFile.click());
    importFile.addEventListener("change", importSettings);


    // Todo functionality
    const todoInput = document.getElementById("todoInput");
    const addTodoBtn = document.getElementById("addTodoBtn");
    const todoList = document.getElementById("todoList");

    function loadTodos() {
        chrome.storage.local.get("todos", (data) => {
            const todos = data.todos || [];
            todoList.innerHTML = "";
            todos.forEach((todo, index) => {
                const todoItem = createTodoElement(todo, index);
                todoList.appendChild(todoItem);
            });
        });
    }

    function createTodoElement(todo, index) {
        const div = document.createElement("div");
        div.className = `todo-item ${todo.completed ? "completed" : ""}`;

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = todo.completed;
        checkbox.addEventListener("change", () => toggleTodo(index));

        const text = document.createElement("span");
        text.textContent = todo.text;

        const deleteBtn = document.createElement("button");
        deleteBtn.className = "delete-btn";
        deleteBtn.innerHTML = '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 18L18 6M6 6l12 12"/></svg>';
        deleteBtn.addEventListener("click", () => deleteTodo(index));

        div.appendChild(checkbox);
        div.appendChild(text);
        div.appendChild(deleteBtn);
        return div;
    }

    function addTodo() {
        const text = todoInput.value.trim();
        if (!text) return;

        chrome.storage.local.get("todos", (data) => {
            const todos = data.todos || [];
            todos.push({ text, completed: false });
            chrome.storage.local.set({ todos }, () => {
                todoInput.value = "";
                loadTodos();
            });
        });
    }

    function toggleTodo(index) {
        chrome.storage.local.get("todos", (data) => {
            const todos = data.todos || [];
            todos[index].completed = !todos[index].completed;
            chrome.storage.local.set({ todos }, loadTodos);
        });
    }

    function deleteTodo(index) {
        chrome.storage.local.get("todos", (data) => {
            const todos = data.todos || [];
            todos.splice(index, 1);
            chrome.storage.local.set({ todos }, loadTodos);
        });
    }

    addTodoBtn.addEventListener("click", addTodo);
    todoInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") addTodo();
    });

    // Reminder functionality
    const reminderForm = document.getElementById("reminderForm");
    const remindersList = document.getElementById("remindersList");

    function loadReminders() {
        chrome.storage.local.get("reminders", (data) => {
            const reminders = data.reminders || [];
            remindersList.innerHTML = "";
            reminders
                .sort((a, b) => new Date(a.datetime) - new Date(b.datetime))
                .forEach((reminder, index) => {
                    const reminderElement = createReminderElement(reminder, index);
                    remindersList.appendChild(reminderElement);
                });
        });
    }

    function createReminderElement(reminder, index) {
        const div = document.createElement("div");
        div.className = "reminder-item";

        const datetime = new Date(reminder.datetime);
        const isPast = datetime < new Date();
        if (isPast) div.classList.add("past");

        const title = document.createElement("div");
        title.className = "reminder-title";
        title.textContent = reminder.title;

        const time = document.createElement("div");
        time.className = "reminder-time";
        time.textContent = datetime.toLocaleString();

        const deleteBtn = document.createElement("button");
        deleteBtn.className = "delete-btn";
        deleteBtn.innerHTML = '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 18L18 6M6 6l12 12"/></svg>';
        deleteBtn.addEventListener("click", () => deleteReminder(index));

        div.appendChild(title);
        div.appendChild(time);
        div.appendChild(deleteBtn);
        return div;
    }

    function addReminder(e) {
        e.preventDefault();
        const title = document.getElementById("reminderTitle").value.trim();
        const datetime = document.getElementById("reminderDateTime").value;

        if (!title || !datetime) return;

        chrome.storage.local.get("reminders", (data) => {
            const reminders = data.reminders || [];
            reminders.push({ title, datetime });
            chrome.storage.local.set({ reminders }, () => {
                reminderForm.reset();
                loadReminders();
                scheduleReminder({ title, datetime });
            });
        });
    }

    function deleteReminder(index) {
        chrome.storage.local.get("reminders", (data) => {
            const reminders = data.reminders || [];
            reminders.splice(index, 1);
            chrome.storage.local.set({ reminders }, loadReminders);
        });
    }

    function scheduleReminder(reminder) {
        const now = new Date();
        const reminderTime = new Date(reminder.datetime);

        if (reminderTime > now) {
            chrome.alarms.create(`reminder-${Date.now()}`, {
                when: reminderTime.getTime()
            });
        }
    }

    reminderForm.addEventListener("submit", addReminder);

    // Load todos and reminders when switching tabs
    tabButtons.forEach(button => {
        button.addEventListener("click", () => {
            if (button.dataset.tab === "todo") {
                loadTodos();
            } else if (button.dataset.tab === "reminder") {
                loadReminders();
            }
        });
    });

    // Initial load
    loadTodos();
    loadReminders();




    // Hamburger menu toggle
    hamburgerBtn.addEventListener("click", () => {
        hamburgerMenu.classList.add("open");
        document.body.style.overflow = "hidden";
    });

    closeHamburgerBtn.addEventListener("click", closeHamburgerMenu);
    hamburgerOverlay.addEventListener("click", closeHamburgerMenu);

    function closeHamburgerMenu() {
        hamburgerMenu.classList.remove("open");
        document.body.style.overflow = "";
    }


    // Theme Management
    function applyTheme(theme) {
        document.body.classList.remove('light-theme', 'dark-theme', 'blue-theme');
        document.body.classList.add(`${theme}-theme`);
        if (themeSelect) {
            themeSelect.value = theme;
        }
        chrome.storage.local.set({ theme });
    }

    // Load saved theme
    chrome.storage.local.get("theme", (data) => {
        const savedTheme = data.theme || "light";
        applyTheme(savedTheme);
    });

    // Theme change handler
    themeSelect.addEventListener("change", (event) => {
        applyTheme(event.target.value);
    });

    // Tab Switching Logic
    tabButtons.forEach((button) => {
        button.addEventListener("click", () => {
            tabButtons.forEach((btn) => btn.classList.remove("active"));
            tabContents.forEach((content) => content.classList.remove("active"));

            button.classList.add("active");
            document.getElementById(button.dataset.tab + "Tab").classList.add("active");

            if (button.dataset.tab === "search") {
                searchInput.focus();
            }
        });
    });

    // Enhanced Chat Message Handler
    function addMessageToChat(sender, content) {
        const chatResults = document.getElementById("chatResults");
        const messageElement = document.createElement("div");
        messageElement.classList.add("chat-message", `${sender}-message`);

        // Create message content
        if (typeof content === 'object') {
            const entryDiv = document.createElement("div");
            entryDiv.classList.add("site-entry");

            const urlDiv = document.createElement("div");
            urlDiv.classList.add("site-url");
            urlDiv.textContent = content.site_url;

            const detailsDiv = document.createElement("div");
            detailsDiv.classList.add("site-details");
            detailsDiv.textContent = `${content.settings}\n${content.notes}`;

            entryDiv.appendChild(urlDiv);
            entryDiv.appendChild(detailsDiv);
            messageElement.appendChild(entryDiv);
        } else {
            if (content.startsWith("✓")) {
                messageElement.classList.add("success-message");
            }
            messageElement.textContent = content;
        }

        // Add timestamp
        const timeDiv = document.createElement("div");
        timeDiv.classList.add("message-time");
        const now = new Date();
        timeDiv.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        messageElement.appendChild(timeDiv);

        chatResults.appendChild(messageElement);
        setTimeout(() => {
            messageElement.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }, 100);
    }

    // Search Functionality
    async function performSearch() {
        const searchValue = searchInput.value.trim().toLowerCase();

        if (!searchValue) {
            addMessageToChat("bot", "Please enter a search query.");
            return;
        }

        addMessageToChat("user", searchValue);
        searchBtn.disabled = true;

        try {
            const [storageData, databaseJson] = await Promise.all([
                new Promise((resolve) => chrome.storage.local.get(["database", "siteData"], resolve)),
                fetch(chrome.runtime.getURL("data/database.json")).then(response => response.json())
            ]);

            const database = storageData.database || [];
            const siteData = storageData.siteData || [];
            const combinedData = [...siteData, ...database, ...databaseJson];

            if (searchValue === 'all') {
                if (combinedData.length) {
                    addMessageToChat("bot", "All saved sites:");
                    combinedData.forEach(entry => {
                        addMessageToChat("bot", entry);
                    });
                } else {
                    addMessageToChat("bot", "No sites found in the database.");
                }
            } else {
                const filtered = combinedData.filter((entry) =>
                    entry.site_url.toLowerCase().includes(searchValue)
                );

                if (filtered.length) {
                    filtered.forEach(entry => {
                        addMessageToChat("bot", entry);
                    });
                } else {
                    addMessageToChat("bot", "No results found. Type 'all' to see all entries.");
                }
            }
        } catch (error) {
            addMessageToChat("bot", "An error occurred while searching.");
        } finally {
            searchBtn.disabled = false;
            searchInput.value = "";
            searchInput.focus();
        }
    }

    searchBtn.addEventListener("click", performSearch);
    searchInput.addEventListener("keypress", (event) => {
        if (event.key === "Enter") {
            performSearch();
        }
    });

    // Form Handlers
    document.getElementById("saveSiteForm").addEventListener("submit", (event) => {
        event.preventDefault();
        const submitBtn = event.target.querySelector("button");
        submitBtn.disabled = true;

        const newSite = {
            site_url: document.getElementById("siteUrl").value,
            settings: document.getElementById("siteSettings").value,
            notes: document.getElementById("siteNotes").value
        };

        chrome.storage.local.get("siteData", (data) => {
            const siteData = data.siteData || [];
            siteData.push(newSite);
            chrome.storage.local.set({ siteData }, () => {
                event.target.reset();
                submitBtn.disabled = false;
                addMessageToChat("bot", "✓ Site saved successfully");
            });
        });
    });

    document.getElementById("settingsForm").addEventListener("submit", (event) => {
        event.preventDefault();
        const submitBtn = event.target.querySelector("button");
        submitBtn.disabled = true;

        const username = document.getElementById("username").value;

        chrome.storage.local.set({ username }, () => {
            submitBtn.disabled = false;
            addMessageToChat("bot", "✓ Settings saved");
        });
    });

    // Initial greeting
    chrome.storage.local.get("username", (data) => {
        const greeting = data.username ?
            `Welcome back, ${data.username}! Aaj konsi site ki setting karni hai? ;)` :
            "Welcome! Type 'all' to see saved sites.";
        addMessageToChat("bot", greeting);
    });
});

function exportSettings() {
    chrome.storage.local.get("siteData", (data) => {
        const siteData = data.siteData || [];

        // Create a worksheet
        const ws = XLSX.utils.json_to_sheet(siteData);

        // Create a workbook and add the worksheet
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Sites");

        // Generate Excel file
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });

        // Save file
        const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = URL.createObjectURL(blob);

        chrome.downloads.download({
            url: url,
            filename: 'capricorn_buddy_settings.xlsx',
            saveAs: true
        }, () => {
            if (chrome.runtime.lastError) {
                console.error(chrome.runtime.lastError);
                addMessageToChat("bot", "Error exporting settings. Please try again.");
            } else {
                addMessageToChat("bot", "✓ Settings exported successfully");
            }
        });
    });
}

function importSettings(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });

        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        chrome.storage.local.set({ siteData: jsonData }, () => {
            if (chrome.runtime.lastError) {
                console.error(chrome.runtime.lastError);
                addMessageToChat("bot", "Error importing settings. Please try again.");
            } else {
                addMessageToChat("bot", "✓ Settings imported successfully");
            }
        });
    };
    reader.readAsArrayBuffer(file);
}

