import { continents, getCountriesFor } from "./data/countries.js";
import { SETUP_KEY } from "./core/constants.js";

function populateContinents(select) {
  select.innerHTML = continents.map(({ name }) => `<option value="${name}">${name}</option>`).join("");
}

function populateCountries(select, continentName) {
  const options = getCountriesFor(continentName);
  select.innerHTML = options.map((country) => `<option value="${country}">${country}</option>`).join("");
}

function readFormData(form) {
  const data = new FormData(form);
  return {
    name: data.get("name")?.toString().trim(),
    age: Number(data.get("age")),
    continent: data.get("continent")?.toString(),
    country: data.get("country")?.toString(),
    pos: data.get("pos")?.toString(),
    alwaysPlay: data.get("alwaysPlay") === "on"
  };
}

function validate(setup) {
  if (!setup.name) return "Please provide a player name.";
  if (!Number.isFinite(setup.age) || setup.age < 16 || setup.age > 40) return "Age must be between 16 and 40.";
  if (!setup.continent) return "Select a continent.";
  if (!setup.country) return "Select a country.";
  if (!setup.pos) return "Choose a position.";
  return null;
}

function storeSetup(setup) {
  sessionStorage.setItem(SETUP_KEY, JSON.stringify(setup));
}

function handleSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const status = form.querySelector(".form-status");
  const setup = readFormData(form);
  const error = validate(setup);
  if (error) {
    status.textContent = error;
    status.dataset.state = "error";
    return;
  }
  status.textContent = "Loading career...";
  status.dataset.state = "success";
  storeSetup(setup);
  window.location.href = "game.html";
}

function init() {
  const form = document.querySelector("#setup-form");
  const continentSelect = document.querySelector("#continent");
  const countrySelect = document.querySelector("#country");
  if (!form || !continentSelect || !countrySelect) return;

  populateContinents(continentSelect);
  populateCountries(countrySelect, continentSelect.value);

  continentSelect.addEventListener("change", () => {
    populateCountries(countrySelect, continentSelect.value);
  });

  form.addEventListener("submit", handleSubmit);

  const yearEl = document.querySelector("#year");
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }
}

document.addEventListener("DOMContentLoaded", init);
