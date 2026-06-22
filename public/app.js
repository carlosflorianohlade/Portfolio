"use strict";

const API_BASE = "/api";

const state = {
  projects: [],
  skills: []
};

function escapeHtml(value = "") {
  const element = document.createElement("div");
  element.textContent = String(value);
  return element.innerHTML;
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    credentials: "same-origin",
    headers: {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers
    },
    ...options
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const error = new Error(payload?.message || `Errore HTTP ${response.status}`);
    error.status = response.status;
    throw error;
  }

  return payload;
}

async function getProjects() {
  const data = await fetchJson(`${API_BASE}/projects`);
  const projects = Array.isArray(data) ? data : data.projects;
  state.projects = normalizeProjects(projects || []);
  return state.projects;
}

async function getSkills() {
  const data = await fetchJson(`${API_BASE}/skills`);
  const skills = Array.isArray(data) ? data : data.skills;
  state.skills = skills || [];
  return state.skills;
}

function normalizeProjects(projects) {
  return projects.map((project) => ({
    ...project,
    image_url: project.image_url || "assets/images/project-portfolio.svg",
    technologies: Array.isArray(project.technologies)
      ? project.technologies
      : String(project.technologies || "")
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
    featured: project.featured === true || project.featured === 1 || project.featured === "1" || project.featured === "true"
  }));
}

function setCurrentNavigation() {
  const page = document.body.dataset.page;
  const currentPage = page === "project"
    ? "projects"
    : page?.startsWith("admin")
      ? "admin"
      : page;
  document.querySelectorAll("[data-nav]").forEach((link) => {
    if (link.dataset.nav === currentPage) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });
}

function initializeNavigation() {
  const toggle = document.querySelector("[data-nav-toggle]");
  const list = document.querySelector("[data-nav-list]");

  if (!toggle || !list) return;

  const closeMenu = () => {
    toggle.setAttribute("aria-expanded", "false");
    list.dataset.open = "false";
    document.body.classList.remove("menu-open");
  };

  toggle.addEventListener("click", () => {
    const isOpen = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", String(!isOpen));
    list.dataset.open = String(!isOpen);
    document.body.classList.toggle("menu-open", !isOpen);
  });

  list.addEventListener("click", (event) => {
    if (event.target.closest("a")) closeMenu();
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 720) closeMenu();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });
}

function initializeTheme() {
  const button = document.querySelector("[data-theme-toggle]");
  if (!button) return;

  const storedTheme = localStorage.getItem("portfolio-theme");
  const initialTheme = storedTheme || "light";
  document.documentElement.dataset.theme = initialTheme;
  updateThemeButton(button, initialTheme);

  button.addEventListener("click", () => {
    const current = document.documentElement.dataset.theme || "light";
    const next = current === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    localStorage.setItem("portfolio-theme", next);
    updateThemeButton(button, next);
  });
}

function updateThemeButton(button, theme) {
  const isDark = theme === "dark";
  button.setAttribute("aria-label", isDark ? "Attiva il tema chiaro" : "Attiva il tema scuro");
  button.setAttribute("title", isDark ? "Tema chiaro" : "Tema scuro");
  button.innerHTML = isDark
    ? '<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>'
    : '<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 15.1A8.5 8.5 0 0 1 8.9 4 8.5 8.5 0 1 0 20 15.1Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>';
}

function projectCardTemplate(project, index) {
  const tags = project.technologies
    .slice(0, 4)
    .map((technology) => `<span class="tag">${escapeHtml(technology)}</span>`)
    .join("");

  return `
    <article class="project-card">
      <div class="project-visual">
        <img src="${escapeHtml(project.image_url)}" alt="Anteprima grafica del progetto ${escapeHtml(project.title)}" loading="lazy">
      </div>
      <div class="project-card-body">
        <div class="project-card-topline">
          <span class="project-index">${String(index + 1).padStart(2, "0")}</span>
          <span class="project-category">${escapeHtml(project.category)}</span>
        </div>
        <div>
          <h3><a href="project.html?id=${encodeURIComponent(project.id)}">${escapeHtml(project.title)}</a></h3>
          <p>${escapeHtml(project.short_description)}</p>
        </div>
        <div class="tags" aria-label="Tecnologie utilizzate">${tags}</div>
      </div>
    </article>
  `;
}

function renderProjectCards(container, projects) {
  if (!container) return;

  if (!projects.length) {
    container.innerHTML = `
      <div class="status-panel">
        <h3>Nessun progetto trovato</h3>
        <p>Prova a modificare i criteri di ricerca o il filtro selezionato.</p>
      </div>`;
    return;
  }

  container.innerHTML = projects
    .map((project, index) => projectCardTemplate(project, index))
    .join("");
}

function renderLoading(container, message = "Caricamento in corso") {
  if (!container) return;
  container.innerHTML = `
    <div class="status-panel" role="status">
      <div class="loader" aria-hidden="true"></div>
      <p>${escapeHtml(message)}</p>
    </div>`;
}

function renderError(container, title = "Dati non disponibili", message = "Non è stato possibile recuperare i dati dal server.") {
  if (!container) return;
  container.innerHTML = `
    <div class="status-panel" role="alert">
      <h3>${escapeHtml(title)}</h3>
      <p>${escapeHtml(message)}</p>
    </div>`;
}

async function initializeHomePage() {
  const container = document.querySelector("[data-featured-projects]");
  if (!container) return;

  renderLoading(container, "Sto preparando i progetti selezionati...");
  try {
    const projects = await getProjects();
    const featured = projects.filter((project) => project.featured).slice(0, 3);
    renderProjectCards(container, featured.length ? featured : projects.slice(0, 3));
  } catch (error) {
    console.error(error);
    renderError(
      container,
      "Progetti non disponibili",
      "I progetti vengono caricati dal database MySQL. Verifica che il server Node.js e MySQL siano avviati correttamente."
    );
  }
}

async function initializeAboutPage() {
  const container = document.querySelector("[data-skills]");
  if (!container) return;

  renderLoading(container, "Caricamento competenze...");
  let skills = [];
  try {
    skills = await getSkills();
  } catch (error) {
    console.error(error);
    renderError(
      container,
      "Competenze non disponibili",
      "Le competenze vengono lette dalla tabella skills del database MySQL."
    );
    return;
  }

  container.innerHTML = skills
    .map((skill) => {
      const level = Math.max(0, Math.min(100, Number(skill.level ?? skill.level_value) || 0));
      return `
        <article class="skill-card">
          <span class="small-copy muted">${escapeHtml(skill.group_name || "Competenza")}</span>
          <strong>${escapeHtml(skill.name)}</strong>
          <div>
            <div class="skill-level" aria-label="Livello indicativo: ${level} su 100">
              <span style="width: ${level}%"></span>
            </div>
          </div>
        </article>`;
    })
    .join("");
}

async function initializeProjectsPage() {
  const container = document.querySelector("[data-project-list]");
  const searchInput = document.querySelector("[data-project-search]");
  const categorySelect = document.querySelector("[data-project-category]");
  const sortSelect = document.querySelector("[data-project-sort]");
  const resultCount = document.querySelector("[data-result-count]");
  const resetButton = document.querySelector("[data-reset-filters]");

  if (!container || !searchInput || !categorySelect || !sortSelect) return;

  renderLoading(container, "Caricamento portfolio...");
  let projects = [];
  try {
    projects = await getProjects();
  } catch (error) {
    console.error(error);
    renderError(
      container,
      "Portfolio non disponibile",
      "Non è stato possibile leggere i progetti dal database MySQL."
    );
    if (resultCount) resultCount.textContent = "0 progetti";
    return;
  }

  const categories = [...new Set(projects.map((project) => project.category))].sort();
  categorySelect.insertAdjacentHTML(
    "beforeend",
    categories.map((category) => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`).join("")
  );

  const applyFilters = () => {
    const query = searchInput.value.trim().toLowerCase();
    const category = categorySelect.value;
    const sort = sortSelect.value;

    const filtered = projects.filter((project) => {
      const searchable = [
        project.title,
        project.short_description,
        project.category,
        ...project.technologies
      ]
        .join(" ")
        .toLowerCase();

      const matchesQuery = !query || searchable.includes(query);
      const matchesCategory = !category || project.category === category;
      return matchesQuery && matchesCategory;
    });

    filtered.sort((first, second) => {
      switch (sort) {
        case "title-asc":
          return first.title.localeCompare(second.title, "it");
        case "title-desc":
          return second.title.localeCompare(first.title, "it");
        case "oldest":
          return new Date(first.created_at) - new Date(second.created_at);
        default:
          return new Date(second.created_at) - new Date(first.created_at);
      }
    });

    renderProjectCards(container, filtered);
    if (resultCount) {
      resultCount.textContent = `${filtered.length} ${filtered.length === 1 ? "progetto" : "progetti"}`;
    }
  };

  searchInput.addEventListener("input", applyFilters);
  categorySelect.addEventListener("change", applyFilters);
  sortSelect.addEventListener("change", applyFilters);

  resetButton?.addEventListener("click", () => {
    searchInput.value = "";
    categorySelect.value = "";
    sortSelect.value = "newest";
    applyFilters();
    searchInput.focus();
  });

  applyFilters();
}

async function initializeProjectDetailPage() {
  const container = document.querySelector("[data-project-detail]");
  if (!container) return;

  renderLoading(container, "Caricamento del progetto...");

  const parameters = new URLSearchParams(window.location.search);
  const projectId = parameters.get("id");

  if (!projectId) {
    renderProjectNotFound(container);
    return;
  }

  let project;
  try {
    const data = await fetchJson(`${API_BASE}/projects/${encodeURIComponent(projectId)}`);
    project = normalizeProjects([data.project || data])[0];
  } catch (error) {
    if (error.status === 404) {
      renderProjectNotFound(container);
    } else {
      console.error(error);
      renderError(
        container,
        "Dettaglio non disponibile",
        "Non è stato possibile caricare il progetto dal database MySQL."
      );
    }
    return;
  }

  if (!project) {
    renderProjectNotFound(container);
    return;
  }

  document.title = `${project.title} | Portfolio personale`;

  const technologies = project.technologies
    .map((technology) => `<span class="tag">${escapeHtml(technology)}</span>`)
    .join("");

  container.innerHTML = `
    <div class="container">
      <header class="project-detail-header">
        <div>
          <span class="eyebrow">Progetto selezionato</span>
          <h1>${escapeHtml(project.title)}</h1>
          <p class="lead">${escapeHtml(project.short_description)}</p>
        </div>
        <dl class="project-detail-meta">
          <div><dt>Categoria</dt><dd>${escapeHtml(project.category)}</dd></div>
          <div><dt>Anno</dt><dd>${escapeHtml(project.year)}</dd></div>
          <div><dt>Ruolo</dt><dd>Design e sviluppo</dd></div>
        </dl>
      </header>

      <figure class="project-detail-visual">
        <img src="${escapeHtml(project.image_url)}" alt="Presentazione grafica del progetto ${escapeHtml(project.title)}">
      </figure>

      <div class="project-detail-content">
        <aside>
          <span class="eyebrow">Tecnologie</span>
          <div class="tags">${technologies}</div>
          <div class="hero-actions">
            <a class="button button-secondary" href="${escapeHtml(project.repository_url || "#")}">Codice sorgente</a>
            <a class="button button-primary" href="${escapeHtml(project.project_url || "#")}">Apri progetto</a>
          </div>
        </aside>
        <article>
          <h2>Il progetto</h2>
          <p>${escapeHtml(project.description)}</p>
          <h3>La sfida</h3>
          <p>${escapeHtml(project.challenge || "Definire un'esperienza chiara, coerente e semplice da usare.")}</p>
          <h3>La soluzione</h3>
          <p>${escapeHtml(project.solution || "Un sistema visivo modulare e un'interazione progettata intorno alle necessità dell'utente.")}</p>
        </article>
      </div>
    </div>`;
}

function renderProjectNotFound(container) {
  container.innerHTML = `
    <div class="container not-found">
      <div>
        <span class="eyebrow">Progetto non disponibile</span>
        <h1>Non ho trovato questa pagina.</h1>
        <p class="lead">L'identificativo potrebbe non essere valido oppure il progetto potrebbe essere stato rimosso.</p>
        <a class="button button-primary" href="projects.html">Torna ai progetti</a>
      </div>
    </div>`;
}

function validateContactForm(values) {
  const errors = {};
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (values.name.length < 2) errors.name = "Inserisci almeno 2 caratteri.";
  if (!emailPattern.test(values.email)) errors.email = "Inserisci un indirizzo email valido.";
  if (values.subject.length < 3) errors.subject = "Inserisci un oggetto più descrittivo.";
  if (values.message.length < 20) errors.message = "Il messaggio deve contenere almeno 20 caratteri.";

  return errors;
}

function showFieldErrors(form, errors) {
  form.querySelectorAll("[data-error-for]").forEach((element) => {
    const fieldName = element.dataset.errorFor;
    element.textContent = errors[fieldName] || "";
  });

  Object.keys(errors).forEach((fieldName) => {
    form.elements[fieldName]?.setAttribute("aria-invalid", "true");
  });

  [...form.elements].forEach((field) => {
    if (field.name && !errors[field.name]) field.removeAttribute("aria-invalid");
  });
}

function initializeContactPage() {
  const form = document.querySelector("[data-contact-form]");
  const status = document.querySelector("[data-form-status]");
  const submitButton = form?.querySelector('button[type="submit"]');

  if (!form || !status || !submitButton) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const values = {
      name: form.elements.name.value.trim(),
      email: form.elements.email.value.trim(),
      subject: form.elements.subject.value.trim(),
      message: form.elements.message.value.trim()
    };

    const errors = validateContactForm(values);
    showFieldErrors(form, errors);

    if (Object.keys(errors).length) {
      status.className = "form-status error";
      status.textContent = "Controlla i campi evidenziati prima di inviare.";
      form.querySelector('[aria-invalid="true"]')?.focus();
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = "Invio in corso...";
    status.className = "form-status info";
    status.textContent = "Sto inviando il messaggio.";

    try {
      await fetchJson(`${API_BASE}/messages`, {
        method: "POST",
        body: JSON.stringify(values)
      });

      form.reset();
      showFieldErrors(form, {});
      status.className = "form-status success";
      status.textContent = "Messaggio inviato correttamente. Grazie per avermi contattato.";
      showToast("Messaggio inviato con successo.");
    } catch (error) {
      status.className = "form-status error";
      status.textContent = error.message || "Non sono riuscito a inviare il messaggio. Riprova più tardi.";
      console.error("Errore invio messaggio:", error.message);
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "Invia messaggio";
    }
  });
}

function showToast(message) {
  const region = document.querySelector("[data-toast-region]");
  if (!region) return;

  const toast = document.createElement("div");
  toast.className = "toast";
  toast.setAttribute("role", "status");
  toast.textContent = message;
  region.appendChild(toast);

  window.setTimeout(() => toast.remove(), 3600);
}

function setFooterYear() {
  document.querySelectorAll("[data-current-year]").forEach((element) => {
    element.textContent = String(new Date().getFullYear());
  });
}

function initializeMarquee() {
  const track = document.querySelector("[data-marquee-track]");
  if (!track) return;
  track.innerHTML += track.innerHTML;
}


async function checkAdminSession({ redirectOnFail = false } = {}) {
  try {
    const data = await fetchJson(`${API_BASE}/admin/me`);
    return data.admin || data.user || data;
  } catch (error) {
    if (redirectOnFail) {
      const next = encodeURIComponent(`${window.location.pathname.split("/").pop()}${window.location.search}`);
      window.location.href = `admin-login.html?next=${next}`;
    }
    return null;
  }
}

function validateAdminLogin(values) {
  const errors = {};
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(values.email)) errors.email = "Inserisci l'email dell'amministratore.";
  if (values.password.length < 8) errors.password = "La password deve contenere almeno 8 caratteri.";
  return errors;
}

function validateProjectForm(values) {
  const errors = {};
  if (values.title.length < 2) errors.title = "Inserisci un titolo valido.";
  if (values.category.length < 2) errors.category = "Inserisci una categoria.";
  if (values.short_description.length < 10) errors.short_description = "La descrizione breve deve contenere almeno 10 caratteri.";
  if (values.description.length < 20) errors.description = "La descrizione completa deve contenere almeno 20 caratteri.";
  if (!values.technologies.length) errors.technologies = "Inserisci almeno una tecnologia.";
  const year = Number(values.year);
  if (!year || year < 2000 || year > 2100) errors.year = "Inserisci un anno valido.";
  return errors;
}

function setFormStatus(element, message, type = "info") {
  if (!element) return;
  element.className = `form-status ${type}`;
  element.textContent = message;
}

function showAdminFieldErrors(form, errors) {
  form.querySelectorAll("[data-error-for]").forEach((element) => {
    const fieldName = element.dataset.errorFor;
    element.textContent = errors[fieldName] || "";
  });

  [...form.elements].forEach((field) => {
    if (!field.name) return;
    if (errors[field.name]) {
      field.setAttribute("aria-invalid", "true");
    } else {
      field.removeAttribute("aria-invalid");
    }
  });
}

async function initializeAdminLoginPage() {
  const form = document.querySelector("[data-admin-login-form]");
  const status = document.querySelector("[data-admin-login-status]");
  const submitButton = form?.querySelector('button[type="submit"]');

  if (!form || !status || !submitButton) return;

  const admin = await checkAdminSession();
  if (admin) {
    const params = new URLSearchParams(window.location.search);
    window.location.href = params.get("next") || "admin-dashboard.html";
    return;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const values = {
      email: form.elements.email.value.trim(),
      password: form.elements.password.value
    };

    const errors = validateAdminLogin(values);
    showAdminFieldErrors(form, errors);
    if (Object.keys(errors).length) {
      setFormStatus(status, "Controlla i campi evidenziati.", "error");
      form.querySelector('[aria-invalid="true"]')?.focus();
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = "Accesso in corso...";
    setFormStatus(status, "Verifico le credenziali amministratore.", "info");

    try {
      await fetchJson(`${API_BASE}/admin/login`, {
        method: "POST",
        body: JSON.stringify(values)
      });

      const params = new URLSearchParams(window.location.search);
      window.location.href = params.get("next") || "admin-dashboard.html";
    } catch (error) {
      setFormStatus(status, error.message || "Credenziali non valide.", "error");
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "Entra nella dashboard";
    }
  });
}

function adminProjectRowTemplate(project) {
  const technologies = project.technologies?.join(", ") || "";
  return `
    <tr>
      <td>
        <strong>${escapeHtml(project.title)}</strong>
        <span class="table-description">${escapeHtml(technologies)}</span>
      </td>
      <td>${escapeHtml(project.category)}</td>
      <td>${escapeHtml(project.year)}</td>
      <td>${project.featured ? "Sì" : "No"}</td>
      <td>
        <div class="table-actions">
          <a class="button button-small button-secondary" href="admin-project-form.html?id=${encodeURIComponent(project.id)}">Modifica</a>
          <button class="button button-small button-danger" type="button" data-delete-project="${escapeHtml(project.id)}">Elimina</button>
        </div>
      </td>
    </tr>`;
}

function renderAdminProjectsTable(projects) {
  const tbody = document.querySelector("[data-admin-projects-table]");
  const count = document.querySelector("[data-admin-project-count]");
  if (!tbody) return;

  if (count) {
    count.textContent = `${projects.length} ${projects.length === 1 ? "progetto" : "progetti"}`;
  }

  if (!projects.length) {
    tbody.innerHTML = '<tr><td colspan="5">Nessun progetto disponibile.</td></tr>';
    return;
  }

  tbody.innerHTML = projects.map(adminProjectRowTemplate).join("");
}

async function initializeAdminDashboardPage() {
  const status = document.querySelector("[data-admin-dashboard-status]");
  const search = document.querySelector("[data-admin-project-search]");
  const admin = await checkAdminSession({ redirectOnFail: true });
  if (!admin) return;
  setupAdminLogout();

  let projects = [];
  try {
    setFormStatus(status, "Caricamento dei progetti in corso...", "info");
    const data = await fetchJson(`${API_BASE}/admin/projects`);
    projects = normalizeProjects(data.projects || data || []);
    setFormStatus(status, "", "info");
  } catch (error) {
    setFormStatus(status, error.message || "Non sono riuscito a caricare i progetti amministrativi.", "error");
    projects = [];
  }

  const applySearch = () => {
    const query = search?.value.trim().toLowerCase() || "";
    const filtered = projects.filter((project) => {
      const text = [project.title, project.category, project.year, ...(project.technologies || [])]
        .join(" ")
        .toLowerCase();
      return !query || text.includes(query);
    });
    renderAdminProjectsTable(filtered);
  };

  search?.addEventListener("input", applySearch);
  applySearch();

  document.addEventListener("click", async (event) => {
    const deleteButton = event.target.closest("[data-delete-project]");
    if (!deleteButton) return;

    const projectId = deleteButton.dataset.deleteProject;
    const project = projects.find((item) => String(item.id) === String(projectId));
    const confirmed = window.confirm(`Eliminare il progetto "${project?.title || projectId}"?`);
    if (!confirmed) return;

    deleteButton.disabled = true;
    try {
      await fetchJson(`${API_BASE}/admin/projects/${encodeURIComponent(projectId)}`, {
        method: "DELETE"
      });
      projects = projects.filter((item) => String(item.id) !== String(projectId));
      applySearch();
      showToast("Progetto eliminato.");
    } catch (error) {
      setFormStatus(status, error.message || "Eliminazione non riuscita.", "error");
      deleteButton.disabled = false;
    }
  });

}

function collectProjectFormValues(form) {
  return {
    title: form.elements.title.value.trim(),
    category: form.elements.category.value.trim(),
    short_description: form.elements.short_description.value.trim(),
    description: form.elements.description.value.trim(),
    technologies: form.elements.technologies.value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
    year: form.elements.year.value.trim(),
    image_url: form.elements.image_url.value.trim(),
    repository_url: form.elements.repository_url.value.trim(),
    project_url: form.elements.project_url.value.trim(),
    challenge: form.elements.challenge.value.trim(),
    solution: form.elements.solution.value.trim(),
    featured: form.elements.featured.checked
  };
}

function fillProjectForm(form, project) {
  form.elements.title.value = project.title || "";
  form.elements.category.value = project.category || "";
  form.elements.short_description.value = project.short_description || "";
  form.elements.description.value = project.description || "";
  form.elements.technologies.value = (project.technologies || []).join(", ");
  form.elements.year.value = project.year || "";
  form.elements.image_url.value = project.image_url || "";
  form.elements.repository_url.value = project.repository_url || "";
  form.elements.project_url.value = project.project_url || "";
  form.elements.challenge.value = project.challenge || "";
  form.elements.solution.value = project.solution || "";
  form.elements.featured.checked = Boolean(project.featured);
}

async function initializeAdminProjectFormPage() {
  const form = document.querySelector("[data-admin-project-form]");
  const status = document.querySelector("[data-admin-project-status]");
  const title = document.querySelector("[data-project-form-title]");
  const submitButton = document.querySelector("[data-project-submit]");

  if (!form || !status || !submitButton) return;

  const admin = await checkAdminSession({ redirectOnFail: true });
  if (!admin) return;
  setupAdminLogout();

  const params = new URLSearchParams(window.location.search);
  const projectId = params.get("id");
  const isEdit = Boolean(projectId);

  if (title) title.textContent = isEdit ? "Modifica progetto" : "Nuovo progetto";
  submitButton.textContent = isEdit ? "Aggiorna progetto" : "Crea progetto";

  if (isEdit) {
    try {
      setFormStatus(status, "Caricamento progetto...", "info");
      const data = await fetchJson(`${API_BASE}/admin/projects/${encodeURIComponent(projectId)}`);
      const project = normalizeProjects([data.project || data])[0];
      fillProjectForm(form, project);
      setFormStatus(status, "", "info");
    } catch (error) {
      setFormStatus(status, error.message || "Impossibile caricare il progetto.", "error");
    }
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const values = collectProjectFormValues(form);
    const errors = validateProjectForm(values);
    showAdminFieldErrors(form, errors);

    if (Object.keys(errors).length) {
      setFormStatus(status, "Correggi i campi evidenziati prima di salvare.", "error");
      form.querySelector('[aria-invalid="true"]')?.focus();
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = isEdit ? "Aggiornamento..." : "Creazione...";
    setFormStatus(status, "Salvataggio in corso...", "info");

    try {
      await fetchJson(
        isEdit
          ? `${API_BASE}/admin/projects/${encodeURIComponent(projectId)}`
          : `${API_BASE}/admin/projects`,
        {
          method: isEdit ? "PUT" : "POST",
          body: JSON.stringify(values)
        }
      );

      showToast(isEdit ? "Progetto aggiornato." : "Progetto creato.");
      window.location.href = "admin-dashboard.html";
    } catch (error) {
      setFormStatus(status, error.message || "Salvataggio non riuscito.", "error");
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = isEdit ? "Aggiorna progetto" : "Crea progetto";
    }
  });
}


function normalizeSkills(skills) {
  return (skills || []).map((skill) => ({
    ...skill,
    level_value: Math.max(0, Math.min(100, Number(skill.level_value ?? skill.level) || 0))
  }));
}

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("it-IT", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(date);
}

function setupAdminLogout() {
  document.querySelectorAll("[data-admin-logout]").forEach((button) => {
    if (button.dataset.bound === "true") return;
    button.dataset.bound = "true";
    button.addEventListener("click", async () => {
      try {
        await fetchJson(`${API_BASE}/admin/logout`, { method: "POST" });
      } catch {
        // Anche se il server non risponde, l'utente viene riportato alla pagina di accesso.
      } finally {
        window.location.href = "admin-login.html";
      }
    });
  });
}

function adminSkillRowTemplate(skill) {
  return `
    <tr>
      <td><strong>${escapeHtml(skill.name)}</strong></td>
      <td>${escapeHtml(skill.group_name)}</td>
      <td>
        <span class="skill-pill">${escapeHtml(skill.level_value)} / 100</span>
      </td>
      <td>
        <div class="table-actions">
          <button class="button button-small button-secondary" type="button" data-edit-skill="${escapeHtml(skill.id)}">Modifica</button>
          <button class="button button-small button-danger" type="button" data-delete-skill="${escapeHtml(skill.id)}">Elimina</button>
        </div>
      </td>
    </tr>`;
}

function renderAdminSkillsTable(skills) {
  const tbody = document.querySelector("[data-admin-skills-table]");
  const count = document.querySelector("[data-admin-skill-count]");
  if (!tbody) return;

  if (count) {
    count.textContent = `${skills.length} ${skills.length === 1 ? "competenza" : "competenze"}`;
  }

  if (!skills.length) {
    tbody.innerHTML = '<tr><td colspan="4">Nessuna competenza disponibile.</td></tr>';
    return;
  }

  tbody.innerHTML = skills.map(adminSkillRowTemplate).join("");
}

function collectSkillFormValues(form) {
  return {
    name: form.elements.name.value.trim(),
    group_name: form.elements.group_name.value.trim(),
    level_value: form.elements.level_value.value.trim()
  };
}

function validateSkillForm(values) {
  const errors = {};
  const level = Number(values.level_value);

  if (values.name.length < 2) errors.name = "Inserisci almeno 2 caratteri.";
  if (values.group_name.length < 2) errors.group_name = "Inserisci un gruppo valido.";
  if (!Number.isInteger(level) || level < 0 || level > 100) {
    errors.level_value = "Inserisci un valore intero tra 0 e 100.";
  }

  return errors;
}

function resetSkillForm(form) {
  form.reset();
  form.elements.id.value = "";
  const title = document.querySelector("[data-skill-form-title]");
  const submit = document.querySelector("[data-skill-submit]");
  if (title) title.textContent = "Nuova competenza";
  if (submit) submit.textContent = "Salva competenza";
  showAdminFieldErrors(form, {});
}

function fillSkillForm(form, skill) {
  form.elements.id.value = skill.id || "";
  form.elements.name.value = skill.name || "";
  form.elements.group_name.value = skill.group_name || "";
  form.elements.level_value.value = skill.level_value ?? skill.level ?? "";
  const title = document.querySelector("[data-skill-form-title]");
  const submit = document.querySelector("[data-skill-submit]");
  if (title) title.textContent = "Modifica competenza";
  if (submit) submit.textContent = "Aggiorna competenza";
  form.elements.name.focus();
}

async function initializeAdminSkillsPage() {
  const form = document.querySelector("[data-admin-skill-form]");
  const status = document.querySelector("[data-admin-skills-status]");
  const search = document.querySelector("[data-admin-skill-search]");
  const resetButton = document.querySelector("[data-skill-reset]");
  const submitButton = document.querySelector("[data-skill-submit]");

  const admin = await checkAdminSession({ redirectOnFail: true });
  if (!admin) return;
  setupAdminLogout();

  let skills = [];

  const applySearch = () => {
    const query = search?.value.trim().toLowerCase() || "";
    const filtered = skills.filter((skill) => {
      const text = [skill.name, skill.group_name, skill.level_value].join(" ").toLowerCase();
      return !query || text.includes(query);
    });
    renderAdminSkillsTable(filtered);
  };

  const loadSkills = async () => {
    try {
      setFormStatus(status, "Caricamento competenze...", "info");
      const data = await fetchJson(`${API_BASE}/admin/skills`);
      skills = normalizeSkills(data.skills || data || []);
      setFormStatus(status, "", "info");
      applySearch();
    } catch (error) {
      skills = [];
      renderAdminSkillsTable(skills);
      setFormStatus(status, error.message || "Non sono riuscito a caricare le competenze.", "error");
    }
  };

  if (!form || !submitButton) {
    await loadSkills();
    return;
  }

  search?.addEventListener("input", applySearch);
  resetButton?.addEventListener("click", () => resetSkillForm(form));

  document.addEventListener("click", async (event) => {
    const editButton = event.target.closest("[data-edit-skill]");
    const deleteButton = event.target.closest("[data-delete-skill]");

    if (editButton) {
      const skill = skills.find((item) => String(item.id) === String(editButton.dataset.editSkill));
      if (skill) fillSkillForm(form, skill);
      return;
    }

    if (!deleteButton) return;

    const skillId = deleteButton.dataset.deleteSkill;
    const skill = skills.find((item) => String(item.id) === String(skillId));
    const confirmed = window.confirm(`Eliminare la competenza "${skill?.name || skillId}"?`);
    if (!confirmed) return;

    deleteButton.disabled = true;
    try {
      await fetchJson(`${API_BASE}/admin/skills/${encodeURIComponent(skillId)}`, {
        method: "DELETE"
      });
      skills = skills.filter((item) => String(item.id) !== String(skillId));
      applySearch();
      if (String(form.elements.id.value) === String(skillId)) resetSkillForm(form);
      showToast("Competenza eliminata.");
    } catch (error) {
      setFormStatus(status, error.message || "Eliminazione non riuscita.", "error");
      deleteButton.disabled = false;
    }
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const values = collectSkillFormValues(form);
    const errors = validateSkillForm(values);
    showAdminFieldErrors(form, errors);

    if (Object.keys(errors).length) {
      setFormStatus(status, "Correggi i campi evidenziati prima di salvare.", "error");
      form.querySelector('[aria-invalid="true"]')?.focus();
      return;
    }

    const skillId = form.elements.id.value;
    const isEdit = Boolean(skillId);

    submitButton.disabled = true;
    submitButton.textContent = isEdit ? "Aggiornamento..." : "Creazione...";
    setFormStatus(status, "Salvataggio competenza...", "info");

    try {
      await fetchJson(
        isEdit
          ? `${API_BASE}/admin/skills/${encodeURIComponent(skillId)}`
          : `${API_BASE}/admin/skills`,
        {
          method: isEdit ? "PUT" : "POST",
          body: JSON.stringify(values)
        }
      );
      resetSkillForm(form);
      await loadSkills();
      showToast(isEdit ? "Competenza aggiornata." : "Competenza creata.");
    } catch (error) {
      setFormStatus(status, error.message || "Salvataggio non riuscito.", "error");
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = form.elements.id.value ? "Aggiorna competenza" : "Salva competenza";
    }
  });

  await loadSkills();
}

function adminMessageRowTemplate(message) {
  return `
    <tr>
      <td>
        <strong>${escapeHtml(message.name)}</strong>
        <span class="table-description"><a href="mailto:${escapeHtml(message.email)}">${escapeHtml(message.email)}</a></span>
      </td>
      <td>
        <strong>${escapeHtml(message.subject)}</strong>
        <p class="message-preview">${escapeHtml(message.message)}</p>
      </td>
      <td>${escapeHtml(formatDateTime(message.created_at))}</td>
      <td>
        <div class="table-actions">
          <button class="button button-small button-danger" type="button" data-delete-message="${escapeHtml(message.id)}">Elimina</button>
        </div>
      </td>
    </tr>`;
}

function renderAdminMessagesTable(messages) {
  const tbody = document.querySelector("[data-admin-messages-table]");
  const count = document.querySelector("[data-admin-message-count]");
  if (!tbody) return;

  if (count) {
    count.textContent = `${messages.length} ${messages.length === 1 ? "messaggio" : "messaggi"}`;
  }

  if (!messages.length) {
    tbody.innerHTML = '<tr><td colspan="4">Nessun messaggio disponibile.</td></tr>';
    return;
  }

  tbody.innerHTML = messages.map(adminMessageRowTemplate).join("");
}

async function initializeAdminMessagesPage() {
  const status = document.querySelector("[data-admin-messages-status]");
  const search = document.querySelector("[data-admin-message-search]");

  const admin = await checkAdminSession({ redirectOnFail: true });
  if (!admin) return;
  setupAdminLogout();

  let messages = [];

  const applySearch = () => {
    const query = search?.value.trim().toLowerCase() || "";
    const filtered = messages.filter((message) => {
      const text = [message.name, message.email, message.subject, message.message, message.created_at]
        .join(" ")
        .toLowerCase();
      return !query || text.includes(query);
    });
    renderAdminMessagesTable(filtered);
  };

  try {
    setFormStatus(status, "Caricamento messaggi...", "info");
    const data = await fetchJson(`${API_BASE}/admin/messages`);
    messages = data.messages || data || [];
    setFormStatus(status, "", "info");
  } catch (error) {
    messages = [];
    setFormStatus(status, error.message || "Non sono riuscito a caricare i messaggi.", "error");
  }

  search?.addEventListener("input", applySearch);
  applySearch();

  document.addEventListener("click", async (event) => {
    const deleteButton = event.target.closest("[data-delete-message]");
    if (!deleteButton) return;

    const messageId = deleteButton.dataset.deleteMessage;
    const message = messages.find((item) => String(item.id) === String(messageId));
    const confirmed = window.confirm(`Eliminare il messaggio di ${message?.name || "questo contatto"}?`);
    if (!confirmed) return;

    deleteButton.disabled = true;
    try {
      await fetchJson(`${API_BASE}/admin/messages/${encodeURIComponent(messageId)}`, {
        method: "DELETE"
      });
      messages = messages.filter((item) => String(item.id) !== String(messageId));
      applySearch();
      showToast("Messaggio eliminato.");
    } catch (error) {
      setFormStatus(status, error.message || "Eliminazione non riuscita.", "error");
      deleteButton.disabled = false;
    }
  });
}

function initializePage() {
  setCurrentNavigation();
  initializeNavigation();
  initializeTheme();
  setFooterYear();
  initializeMarquee();

  const page = document.body.dataset.page;
  switch (page) {
    case "home":
      initializeHomePage();
      break;
    case "about":
      initializeAboutPage();
      break;
    case "projects":
      initializeProjectsPage();
      break;
    case "project":
      initializeProjectDetailPage();
      break;
    case "contact":
      initializeContactPage();
      break;
    case "admin-login":
      initializeAdminLoginPage();
      break;
    case "admin-dashboard":
      initializeAdminDashboardPage();
      break;
    case "admin-project-form":
      initializeAdminProjectFormPage();
      break;
    case "admin-skills":
      initializeAdminSkillsPage();
      break;
    case "admin-messages":
      initializeAdminMessagesPage();
      break;
    default:
      break;
  }
}

document.addEventListener("DOMContentLoaded", initializePage);
