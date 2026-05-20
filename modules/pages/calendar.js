(() => {
  const state = {
    events: [],
    loaded: false,
    message: ""
  };

  function formatDate(iso) {
    if (!iso) return "Unknown";
    const date = new Date(iso);
    return isNaN(date.getTime()) ? "Unknown" : date.toLocaleString();
  }

  function renderStatusMessage() {
    return state.message ? `<div class="cms-alert">${Diagnostics.escapeText(state.message)}</div>` : "";
  }

  function renderEventList() {
    if (!state.loaded) {
      return `<div class="cms-card"><p>Loading events…</p></div>`;
    }

    if (!state.events.length) {
      return `
        <div class="cms-card">
          <h3>No upcoming events</h3>
          <p class="muted">There are no published calendar events yet.</p>
        </div>
      `;
    }

    return state.events
      .map((event) => {
        const eventDate = event.metadata?.eventDate ? formatDate(event.metadata.eventDate) : "No date";
        return `
          <article class="cms-card calendar-event">
            <h3>${Diagnostics.escapeText(event.title)}</h3>
            <div class="event-meta">
              <span>Date: ${Diagnostics.escapeText(eventDate)}</span>
              <span>Author: ${Diagnostics.escapeText(event.authorId || "unknown")}</span>
            </div>
            <div class="event-body">${Diagnostics.escapeText(event.body || "No description.")}</div>
          </article>
        `;
      })
      .join("");
  }

  async function refreshEvents() {
    const contentSystem = window.ContentCoreSystem;
    const userSystem = window.UserCoreSystem;

    if (!contentSystem || !userSystem) {
      state.message = "Calendar system is unavailable.";
      state.loaded = true;
      updateCalendarPage();
      return;
    }

    try {
      const events = await contentSystem.listContent("calendarEvent", { status: "published" });
      state.events = Array.isArray(events)
        ? events
            .filter((event) => event.metadata?.eventDate)
            .sort((a, b) => new Date(a.metadata.eventDate).getTime() - new Date(b.metadata.eventDate).getTime())
        : [];
      state.loaded = true;
      state.message = "";
    } catch (error) {
      state.loaded = true;
      state.message = "Unable to load calendar events.";
    }

    updateCalendarPage();
  }

  function updateCalendarPage() {
    const listContainer = document.getElementById("calendarEventContainer");
    if (listContainer) {
      listContainer.innerHTML = renderEventList();
    }

    const statusEl = document.getElementById("calendarStatusMessage");
    if (statusEl) {
      statusEl.innerHTML = renderStatusMessage();
    }
  }

  window.CalendarModuleUI = {
    async createEvent(event) {
      if (event && typeof event.preventDefault === "function") {
        event.preventDefault();
      }

      const userSystem = window.UserCoreSystem;
      const contentSystem = window.ContentCoreSystem;
      if (!userSystem?.can("calendar.event.create") || !contentSystem) {
        state.message = "You do not have permission to create calendar events.";
        updateCalendarPage();
        return false;
      }

      const title = document.getElementById("calendarEventTitle")?.value || "Untitled event";
      const body = document.getElementById("calendarEventBody")?.value || "";
      const status = document.getElementById("calendarEventStatus")?.value || "draft";
      const eventDate = document.getElementById("calendarEventDate")?.value || "";
      const currentUser = userSystem.getCurrentUser?.();

      if (!eventDate) {
        state.message = "Event date is required.";
        updateCalendarPage();
        return false;
      }

      try {
        await contentSystem.createContent("calendarEvent", {
          title,
          body,
          status,
          authorId: currentUser?.id || "guest",
          metadata: {
            eventDate
          }
        });
        state.message = "Calendar event saved successfully.";
        document.getElementById("calendarEventForm")?.reset();
        await refreshEvents();
      } catch (error) {
        state.message = "Unable to save the calendar event.";
        updateCalendarPage();
      }

      return false;
    }
  };

  ModuleSDK.registerPage("calendar", {
    title: "Calendar",
    render: () => {
      const userSystem = window.UserCoreSystem;
      const contentSystem = window.ContentCoreSystem;
      const canCreate = userSystem?.can("calendar.event.create");

      if (!contentSystem || !userSystem) {
        return `
          <section class="cms-page">
            <h1>Calendar</h1>
            <p class="muted">Calendar system is unavailable.</p>
          </section>
        `;
      }

      if (!state.loaded) {
        refreshEvents().catch(() => {
          state.loaded = true;
          state.message = "Unable to load calendar content.";
          updateCalendarPage();
        });
      }

      return `
        <section class="cms-page">
          <h1>Calendar</h1>
          <p class="muted">View and publish calendar events through the content system.</p>

          <div id="calendarStatusMessage">${renderStatusMessage()}</div>

          ${canCreate ? `
            <div class="cms-card">
              <h3>Create Event</h3>
              <form id="calendarEventForm" onsubmit="window.CalendarModuleUI.createEvent(event)">
                <label>
                  Title
                  <input id="calendarEventTitle" type="text" placeholder="Event title" required />
                </label>
                <label>
                  Date
                  <input id="calendarEventDate" type="date" required />
                </label>
                <label>
                  Description
                  <textarea id="calendarEventBody" placeholder="Event description"></textarea>
                </label>
                <label>
                  Status
                  <select id="calendarEventStatus">
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </label>
                <button type="submit">Save Event</button>
              </form>
            </div>
          ` : `
            <div class="cms-card">
              <h3>Event publishing</h3>
              <p class="muted">Sign in with permissions to create calendar events.</p>
            </div>
          `}

          <div id="calendarEventContainer">
            ${renderEventList()}
          </div>
        </section>
      `;
    }
  });
})();
