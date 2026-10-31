
// ======================================================
// PETAL - ATTENDANCE TRACKER
// Made with love by Aleena ♡
// ======================================================

// -------------------- DATE HELPERS --------------------

function dateString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function parseDate(value) {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day);
}

function addMonths(date, amount) {
    return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function startOfMonth(date) {
    return new Date(date.getFullYear(), date.getMonth(), 1);
}

function formatMonth(date) {
    return date.toLocaleDateString("en-IN", {
        month: "long",
        year: "numeric"
    });
}

function formatDate(value) {
    return parseDate(value).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });
}

// -------------------- INITIAL DATA --------------------

const today = new Date();
today.setHours(0, 0, 0, 0);

const defaultStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    1
);

const defaultEnd = new Date(
    defaultStart.getFullYear(),
    defaultStart.getMonth() + 6,
    0
);

let data = {
    profile: {
        name: "",
        semesterStart: dateString(defaultStart),
        semesterEnd: dateString(defaultEnd),
        requiredPercent: 75
    },

    attendance: {},

    bunks: []
};

let currentMonth = startOfMonth(today);

const subjects = [
    "BEEE",
    "AP",
    "LA AND C",
    "PPS",
    "AP LAB",
    "BEEE LAB",
    "PPS LAB",
    "ENG WORKSHOP",
    "DT LAB"
];

function getSemesterStart() {
    return parseDate(data.profile.semesterStart);
}

function getSemesterEnd() {
    return parseDate(data.profile.semesterEnd);
}

// -------------------- STORAGE --------------------

function saveData() {
    localStorage.setItem(
        "petalAttendance",
        JSON.stringify(data)
    );
}

function loadData() {
    const saved = localStorage.getItem("petalAttendance");

    if (!saved) return;

    try {
        const parsed = JSON.parse(saved);

        data = {
            profile: {
                ...data.profile,
                ...(parsed.profile || {})
            },

            attendance: parsed.attendance || {},

            bunks: parsed.bunks || []
        };

    } catch (error) {
        console.error("Error loading Petal data:", error);
    }
}

// -------------------- NAVIGATION --------------------

function showPage(pageName) {

    // Hide all pages
    document.querySelectorAll(".page").forEach(page => {
        page.classList.remove("active");
    });

    // Show selected page
    const selectedPage = document.getElementById(pageName);

    if (selectedPage) {
        selectedPage.classList.add("active");
    } else {
        return;
    }

    // Update sidebar buttons
    document.querySelectorAll(".nav-btn").forEach(button => {
        button.classList.toggle(
            "active",
            button.dataset.page === pageName
        );
    });

    renderEverything();
}

// Sidebar navigation
document.querySelectorAll(".nav-btn").forEach(button => {

    button.addEventListener("click", () => {

        const pageName = button.dataset.page;

        if (pageName) {
            showPage(pageName);
        }

    });

});

// Dashboard shortcut buttons
document.querySelectorAll("[data-go]").forEach(button => {

    button.addEventListener("click", () => {

        const pageName = button.dataset.go;

        if (pageName) {
            showPage(pageName);
        }

    });

});

// -------------------- SUBJECT DROPDOWN --------------------

function populateSubjects() {

    const dropdown = document.getElementById("bunkSubject");

    if (!dropdown) return;

    dropdown.innerHTML = '<option value="">Select subject</option>';

    subjects.forEach(subject => {

        const option = document.createElement("option");

        option.value = subject;
        option.textContent = subject;

        dropdown.appendChild(option);

    });

}

// -------------------- GREETING --------------------

function updateGreeting() {

    const name = data.profile.name.trim();

    const welcome = document.getElementById("welcomeName");
    const greeting = document.getElementById("greeting");
    const todayElement = document.getElementById("todayDate");

    if (welcome) {

        welcome.textContent = name
            ? `Welcome back, ${name} ♡`
            : "Welcome back, ♡";

    }

    if (greeting) {

        greeting.textContent = name
            ? `Have a lovely day, ${name}! ✿`
            : "Have a lovely day! ✿";

    }

    if (todayElement) {

        todayElement.textContent = today.toLocaleDateString("en-IN", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric"
        });

    }

}

// -------------------- ATTENDANCE --------------------

function setAttendance(date, status) {

    const selectedDate = parseDate(date);

    if (
        selectedDate < getSemesterStart() ||
        selectedDate > getSemesterEnd() ||
        selectedDate > today ||
        selectedDate.getDay() === 0
    ) {

        showToast("This date cannot be edited.");

        return;
    }

    if (status === null) {

        delete data.attendance[date];

    } else {

        data.attendance[date] = status;

    }

    saveData();

    renderEverything();

}

// Get attendance statistics
function getStats() {

    let present = 0;
    let absent = 0;
    let holidays = 0;

    Object.entries(data.attendance).forEach(([date, status]) => {

        const day = parseDate(date);

        if (
            day < getSemesterStart() ||
            day > getSemesterEnd() ||
            day > today ||
            day.getDay() === 0
        ) {
            return;
        }

        if (status === "present") present++;

        if (status === "absent") absent++;

        if (status === "holiday") holidays++;

    });

    const total = present + absent;

    const percentage = total > 0
        ? (present / total) * 100
        : 0;

    return {
        present,
        absent,
        holidays,
        total,
        percentage
    };

}

// -------------------- ATTENDANCE CALENDAR --------------------

function renderCalendar() {

    const grid = document.getElementById("calendarGrid");
    const title = document.getElementById("calendarTitle");

    if (!grid || !title) return;

    title.textContent = formatMonth(currentMonth);

    grid.innerHTML = "";

    const firstDay = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
        1
    );

    const lastDay = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth() + 1,
        0
    );

    // Empty spaces before the first day
    for (let i = 0; i < firstDay.getDay(); i++) {

        const empty = document.createElement("div");

        empty.className = "calendar-day empty";

        grid.appendChild(empty);

    }

    // Create calendar dates
    for (let day = 1; day <= lastDay.getDate(); day++) {

        const date = new Date(
            currentMonth.getFullYear(),
            currentMonth.getMonth(),
            day
        );

        const key = dateString(date);

        const status = data.attendance[key];

        const isSunday = date.getDay() === 0;

        const isFuture = date > today;

        const outsideSemester =
            date < getSemesterStart() ||
            date > getSemesterEnd();

        const button = document.createElement("button");

        button.type = "button";

        button.className = "calendar-day";

        button.textContent = day;

        // Apply attendance colours
        if (status) {
            button.classList.add(status);
        }

        if (isSunday) {

            button.classList.add("sunday");

            button.title = "Sunday";

        }

        if (key === dateString(today)) {

            button.classList.add("today");

        }

        // Previous months are editable.
        // Sundays, future dates and outside-semester dates are locked.
        button.disabled =
            isSunday ||
            isFuture ||
            outsideSemester;

        // Cycle through attendance statuses
        if (!button.disabled) {

            button.addEventListener("click", () => {

                const statuses = [
                    null,
                    "present",
                    "absent",
                    "holiday"
                ];

                const currentStatus =
                    data.attendance[key] || null;

                const currentIndex = statuses.indexOf(currentStatus);

                const nextStatus =
                    statuses[(currentIndex + 1) % statuses.length];

                setAttendance(key, nextStatus);

            });

        }

        grid.appendChild(button);

    }

    updateCalendarNavigation();

}

// -------------------- MONTH NAVIGATION --------------------

function updateCalendarNavigation() {

    const previousButton = document.getElementById("prevMonth");

    const nextButton = document.getElementById("nextMonth");

    const firstMonth = startOfMonth(getSemesterStart());

    const lastMonth = startOfMonth(getSemesterEnd());

    if (previousButton) {

        previousButton.disabled =
            currentMonth <= firstMonth;

    }

    if (nextButton) {

        const next = addMonths(currentMonth, 1);

        nextButton.disabled =
            next > lastMonth ||
            next > startOfMonth(today);

    }

}

// Previous month
document.getElementById("prevMonth")?.addEventListener("click", () => {

    const previousMonth = addMonths(currentMonth, -1);

    if (previousMonth >= startOfMonth(getSemesterStart())) {

        currentMonth = previousMonth;

        renderCalendar();

    }

});

// Next month
document.getElementById("nextMonth")?.addEventListener("click", () => {

    const nextMonth = addMonths(currentMonth, 1);

    if (
        nextMonth <= startOfMonth(getSemesterEnd()) &&
        nextMonth <= startOfMonth(today)
    ) {

        currentMonth = nextMonth;

        renderCalendar();

    }

});

// -------------------- QUICK ATTENDANCE --------------------

document.getElementById("markPresent")?.addEventListener("click", () => {

    setAttendance(dateString(today), "present");

});

document.getElementById("markAbsent")?.addEventListener("click", () => {

    setAttendance(dateString(today), "absent");

});

document.getElementById("markHoliday")?.addEventListener("click", () => {

    setAttendance(dateString(today), "holiday");

});

// -------------------- DASHBOARD --------------------

function renderDashboard() {

    const stats = getStats();

    const overallPercent = document.getElementById("overallPercent");

    const overallPresent = document.getElementById("overallPresent");

    const overallBunks = document.getElementById("overallBunks");

    if (overallPercent) {

        overallPercent.textContent =
            `${stats.percentage.toFixed(1)}%`;

    }

    if (overallPresent) {

        overallPresent.textContent = stats.present;

    }

    if (overallBunks) {

        overallBunks.textContent = stats.absent;

    }

    // Current month's statistics
    const monthPrefix = dateString(today).slice(0, 7);

    let monthlyPresent = 0;

    let monthlyAbsent = 0;

    Object.entries(data.attendance).forEach(([date, status]) => {

        if (!date.startsWith(monthPrefix)) return;

        if (status === "present") monthlyPresent++;

        if (status === "absent") monthlyAbsent++;

    });

    const monthlyTotal = monthlyPresent + monthlyAbsent;

    const monthlyPercent = monthlyTotal > 0
        ? (monthlyPresent / monthlyTotal) * 100
        : 0;

    const percentElement =
        document.getElementById("monthlyPercent");

    const progressElement =
        document.getElementById("monthlyProgress");

    const presentElement =
        document.getElementById("monthlyPresent");

    const totalElement =
        document.getElementById("monthlyTotal");

    if (percentElement) {

        percentElement.textContent =
            `${monthlyPercent.toFixed(1)}%`;

    }

    if (progressElement) {

        progressElement.style.width =
            `${monthlyPercent}%`;

    }

    if (presentElement) {

        presentElement.textContent =
            `${monthlyPresent} present`;

    }

    if (totalElement) {

        totalElement.textContent =
            `${monthlyTotal} working days`;

    }

    // Attendance goal
    const goalMessage = document.getElementById("goalMessage");

    if (goalMessage) {

        const target =
            Number(data.profile.requiredPercent) || 75;

        goalMessage.textContent =
            stats.percentage >= target
                ? "You're meeting your attendance goal. Keep blooming! ✿"
                : "Keep attending classes to reach your attendance goal ♡";

    }

}

// -------------------- BUNK TRACKER --------------------

document.getElementById("bunkForm")?.addEventListener("submit", event => {

    event.preventDefault();

    const subject =
        document.getElementById("bunkSubject").value;

    const date =
        document.getElementById("bunkDate").value;

    const count =
        Number(document.getElementById("bunkCount").value || 1);

    const reason =
        document.getElementById("bunkReason").value || "";

    if (!subject || !date || count < 1) {

        showToast("Please fill in the required details.");

        return;

    }

    const selectedDate = parseDate(date);

    if (
        selectedDate < getSemesterStart() ||
        selectedDate > getSemesterEnd() ||
        selectedDate > today ||
        selectedDate.getDay() === 0
    ) {

        showToast("Choose a valid date within your semester.");

        return;

    }

    data.bunks.push({

        id: Date.now(),

        subject,

        date,

        count,

        reason

    });

    saveData();

    event.target.reset();

    renderEverything();

    showToast("Bunk record added ✿");

});

// -------------------- RENDER BUNKS --------------------

function renderBunks() {

    const summary =
        document.getElementById("subjectBunkSummary");

    const records =
        document.getElementById("bunkRecords");

    if (!summary || !records) return;

    summary.innerHTML = "";

    records.innerHTML = "";

    const totals = {};

    data.bunks.forEach(bunk => {

        totals[bunk.subject] =
            (totals[bunk.subject] || 0) + Number(bunk.count);

    });

    // Subject-wise totals
    subjects.forEach(subject => {

        const card = document.createElement("div");

        card.className = "bunk-summary-card";

        const subjectName = document.createElement("span");

        subjectName.textContent = subject;

        const count = document.createElement("strong");

        count.textContent = totals[subject] || 0;

        card.append(subjectName, count);

        summary.appendChild(card);

    });

    // Empty records message
    if (data.bunks.length === 0) {

        records.textContent = "No bunk records yet ♡";

        return;

    }

    // Display newest records first
    [...data.bunks].reverse().forEach(bunk => {

        const item = document.createElement("div");

        item.className = "bunk-record";

        const details = document.createElement("div");

        details.innerHTML = `
            <strong>${escapeHTML(bunk.subject)}</strong>
            <p>${formatDate(bunk.date)} · ${bunk.count} class(es)</p>
            <small>${escapeHTML(bunk.reason || "No reason added")}</small>
        `;

        const removeButton = document.createElement("button");

        removeButton.type = "button";

        removeButton.textContent = "Delete";

        removeButton.addEventListener("click", () => {

            data.bunks = data.bunks.filter(
                record => record.id !== bunk.id
            );

            saveData();

            renderEverything();

            showToast("Record deleted.");

        });

        item.append(details, removeButton);

        records.appendChild(item);

    });

}

// -------------------- MONTHLY REPORTS --------------------

function renderReports() {

    const container =
        document.getElementById("monthlyReports");

    if (!container) return;

    container.innerHTML = "";

    let month = startOfMonth(getSemesterStart());

    const lastMonth = startOfMonth(getSemesterEnd());

    while (month <= lastMonth) {

        const prefix = dateString(month).slice(0, 7);

        let present = 0;

        let absent = 0;

        Object.entries(data.attendance).forEach(([date, status]) => {

            const recordDate = parseDate(date);

            if (
                !date.startsWith(prefix) ||
                recordDate.getDay() === 0 ||
                recordDate < getSemesterStart() ||
                recordDate > getSemesterEnd() ||
                recordDate > today
            ) {
                return;
            }

            if (status === "present") present++;

            if (status === "absent") absent++;

        });

        const total = present + absent;

        const percentage = total > 0
            ? (present / total) * 100
            : 0;

        const row = document.createElement("div");

        row.className = "report-row";

        row.innerHTML = `
            <strong>${formatMonth(month)}</strong>
            <span>${present} Present</span>
            <span>${absent} Absent</span>
            <span>${percentage.toFixed(1)}%</span>
        `;

        container.appendChild(row);

        month = addMonths(month, 1);

    }

}

// -------------------- 75% CALCULATOR --------------------

document.getElementById("calculateButton")?.addEventListener("click", () => {

    const held =
        Number(document.getElementById("calcHeld").value);

    const attended =
        Number(document.getElementById("calcAttended").value);

    const result =
        document.getElementById("calculatorResult");

    if (!result) return;

    const target =
        Number(data.profile.requiredPercent) || 75;

    if (
        !Number.isFinite(held) ||
        !Number.isFinite(attended) ||
        held < 0 ||
        attended < 0 ||
        attended > held ||
        target >= 100
    ) {

        result.textContent =
            "Please enter valid numbers and an attendance target below 100%.";

        return;

    }

    const current = held > 0
        ? (attended / held) * 100
        : 0;

    if (current >= target) {

        const canMiss = Math.floor(
            attended / (target / 100) - held
        );

        result.textContent =
            `You're at ${current.toFixed(1)}%. You can miss approximately ${Math.max(0, canMiss)} more classes while staying at ${target}%.`;

    } else {

        const needed = Math.ceil(
            (target * held - 100 * attended) /
            (100 - target)
        );

        result.textContent =
            `You're at ${current.toFixed(1)}%. Attend the next ${Math.max(0, needed)} consecutive classes to reach ${target}%.`;

    }

});

// -------------------- PROFILE SETTINGS --------------------

document.getElementById("profileForm")?.addEventListener("submit", event => {

    event.preventDefault();

    const name =
        document.getElementById("studentName").value.trim();

    const start =
        document.getElementById("semesterStart").value;

    const end =
        document.getElementById("semesterEnd").value;

    const required =
        Number(document.getElementById("requiredPercent").value || 75);

    if (!start || !end || parseDate(start) > parseDate(end)) {

        showToast("Please enter valid semester dates.");

        return;

    }

    if (required < 1 || required > 100) {

        showToast("Enter an attendance target between 1 and 100.");

        return;

    }

    data.profile = {

        name: name,

        semesterStart: start,

        semesterEnd: end,

        requiredPercent: required

    };

    const firstMonth = startOfMonth(parseDate(start));

    const lastMonth = startOfMonth(parseDate(end));

    if (currentMonth < firstMonth || currentMonth > lastMonth) {

        currentMonth = firstMonth;

    }

    saveData();

    updateGreeting();

    renderEverything();

    showToast("Your profile has been saved ♡");

});

// -------------------- PROFILE FORM --------------------

function fillProfileForm() {

    const name =
        document.getElementById("studentName");

    const start =
        document.getElementById("semesterStart");

    const end =
        document.getElementById("semesterEnd");

    const required =
        document.getElementById("requiredPercent");

    if (name) name.value = data.profile.name || "";

    if (start) start.value = data.profile.semesterStart;

    if (end) end.value = data.profile.semesterEnd;

    if (required) {
        required.value = data.profile.requiredPercent || 75;
    }

}

// -------------------- EXPORT DATA --------------------

document.getElementById("exportData")?.addEventListener("click", () => {

    const file = new Blob(
        [JSON.stringify(data, null, 2)],
        { type: "application/json" }
    );

    const url = URL.createObjectURL(file);

    const link = document.createElement("a");

    link.href = url;

    link.download = "petal-attendance-backup.json";

    link.click();

    URL.revokeObjectURL(url);

    showToast("Backup downloaded ✿");

});

// -------------------- IMPORT DATA --------------------

document.getElementById("importData")?.addEventListener("change", event => {

    const file = event.target.files?.[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {

        try {

            const imported = JSON.parse(reader.result);

            if (
                !imported.profile ||
                !imported.attendance ||
                typeof imported.attendance !== "object" ||
                !Array.isArray(imported.bunks)
            ) {

                throw new Error("Invalid backup file");

            }

            data = {

                profile: {
                    ...data.profile,
                    ...imported.profile
                },

                attendance: imported.attendance,

                bunks: imported.bunks

            };

            currentMonth = startOfMonth(today);

            if (currentMonth < startOfMonth(getSemesterStart())) {

                currentMonth = startOfMonth(getSemesterStart());

            }

            if (currentMonth > startOfMonth(getSemesterEnd())) {

                currentMonth = startOfMonth(getSemesterEnd());

            }

            saveData();

            fillProfileForm();

            updateGreeting();

            renderEverything();

            showToast("Your backup has been restored ♡");

        } catch (error) {

            showToast("This backup file could not be imported.");

            console.error(error);

        }

    };

    reader.readAsText(file);

    event.target.value = "";

});

// -------------------- TOAST NOTIFICATION --------------------

function showToast(message) {

    const toast = document.getElementById("toast");

    if (!toast) return;

    toast.textContent = message;

    toast.classList.add("show");

    setTimeout(() => {

        toast.classList.remove("show");

    }, 2500);

}

// -------------------- SECURITY HELPER --------------------

function escapeHTML(value) {

    return String(value).replace(/[&<>"']/g, character => {

        const entities = {

            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"

        };

        return entities[character];

    });

}

// -------------------- RENDER EVERYTHING --------------------

function renderEverything() {

    renderDashboard();

    renderCalendar();

    renderBunks();

    renderReports();

}

// -------------------- INITIALIZE PETAL --------------------

function initializePetal() {

    loadData();

    currentMonth = startOfMonth(today);

    if (currentMonth < startOfMonth(getSemesterStart())) {

        currentMonth = startOfMonth(getSemesterStart());

    }

    if (currentMonth > startOfMonth(getSemesterEnd())) {

        currentMonth = startOfMonth(getSemesterEnd());

    }

    populateSubjects();

    fillProfileForm();

    updateGreeting();

    renderEverything();

    saveData();

}

// Start application
initializePetal();
