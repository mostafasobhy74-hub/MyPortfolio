const menuButton = document.querySelector(".nav-toggle");
const navigation = document.querySelector(".primary-nav");

function toggleMenu(force) {
  if (!menuButton || !navigation) return;

  const isOpen = force ?? menuButton.getAttribute("aria-expanded") !== "true";
  menuButton.setAttribute("aria-expanded", String(isOpen));
  navigation.classList.toggle("is-open", isOpen);
}

menuButton?.addEventListener("click", () => toggleMenu());

document.addEventListener("click", (event) => {
  const link = event.target.closest('a[href^="#"]');
  if (!link) return;

  const target = document.querySelector(link.getAttribute("href"));
  if (!target) return;

  event.preventDefault();
  target.scrollIntoView({
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "instant"
      : "smooth",
    block: "start",
  });

  if (navigation?.contains(link)) toggleMenu(false);
});

// Build project filters from the categories assigned to project cards.
const projectsSection = document.querySelector("#projects");
const projectCards = [...(projectsSection?.querySelectorAll("article") ?? [])];
const categories = [...new Set(
  projectCards.map((card) => card.dataset.category).filter(Boolean)
)];

function filterProjects(category) {
  projectCards.forEach((card) => {
    card.hidden = category !== "all" && card.dataset.category !== category;
  });
}

if (projectsSection && categories.length > 0) {
  const filters = document.createElement("div");
  filters.className = "project-filters";
  filters.setAttribute("aria-label", "Filter projects");

  ["all", ...categories].forEach((category) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = category === "all" ? "All projects" : category;
    button.setAttribute("aria-pressed", String(category === "all"));
    button.addEventListener("click", () => {
      filterProjects(category);
      filters.querySelectorAll("button").forEach((filterButton) => {
        filterButton.setAttribute(
          "aria-pressed",
          String(filterButton === button)
        );
      });
    });
    filters.append(button);
  });

  projectsSection.querySelector("h2")?.after(filters);
}

// Open project images in an accessible native dialog.
const lightbox = document.createElement("dialog");
lightbox.className = "image-lightbox";
lightbox.setAttribute("aria-label", "Project image");
lightbox.innerHTML = `
  <button class="lightbox-close" type="button" aria-label="Close image">×</button>
  <img alt="">
  <p class="lightbox-caption"></p>
`;
document.body.append(lightbox);

function openLightbox(image) {
  const lightboxImage = lightbox.querySelector("img");
  lightboxImage.src = image.currentSrc || image.src;
  lightboxImage.alt = image.alt;
  lightbox.querySelector(".lightbox-caption").textContent =
    image.closest("figure")?.querySelector("figcaption")?.textContent ?? "";

  lightbox.showModal();
}

function closeLightbox() {
  if (lightbox.open) lightbox.close();
}

document.querySelector("#projects")?.addEventListener("click", (event) => {
  const image = event.target.closest("img");
  if (image) openLightbox(image);
});

lightbox.querySelector(".lightbox-close").addEventListener("click", closeLightbox);
lightbox.addEventListener("click", (event) => {
  if (event.target === lightbox) closeLightbox();
});

// Show field errors as the user types or leaves a field.
const contactForm = document.querySelector("#contact form");
const fields = contactForm
  ? [...contactForm.querySelectorAll("input, textarea")]
  : [];
let submissionAttempted = false;

function validateField(field, showError = false) {
  const errorId = `${field.id}-error`;
  let error = document.getElementById(errorId);

  if (!error) {
    error = document.createElement("p");
    error.id = errorId;
    error.setAttribute("aria-live", "polite");
    field.insertAdjacentElement("afterend", error);
  }

  const invalid = !field.validity.valid;
  field.setAttribute("aria-invalid", String(invalid));

  if (invalid && showError) {
    error.textContent = field.validationMessage;
    field.setAttribute("aria-describedby", errorId);
  } else {
    error.textContent = "";
    field.removeAttribute("aria-describedby");
  }

  return !invalid;
}

fields.forEach((field) => {
  field.addEventListener("input", () => {
    validateField(field, submissionAttempted || field.dataset.touched === "true");
  });

  field.addEventListener("blur", () => {
    field.dataset.touched = "true";
    validateField(field, true);
  });
});

contactForm?.addEventListener("invalid", (event) => {
  submissionAttempted = true;
  validateField(event.target, true);
}, true);

contactForm?.addEventListener("submit", (event) => {
  submissionAttempted = true;
  const isValid = fields.every((field) => validateField(field, true));

  if (!isValid) {
    event.preventDefault();
    contactForm.reportValidity();
  }
});