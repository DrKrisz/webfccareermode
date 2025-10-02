export function qs(selector, scope = document) {
  const el = scope.querySelector(selector);
  if (!el) throw new Error(`Element not found: ${selector}`);
  return el;
}

export function qsa(selector, scope = document) {
  return Array.from(scope.querySelectorAll(selector));
}

export function setText(el, value) {
  if (!el) return;
  el.textContent = value;
}

export function setHTML(el, value) {
  if (!el) return;
  el.innerHTML = value;
}

export function toggleHidden(el, hidden) {
  if (!el) return;
  el.toggleAttribute("hidden", hidden);
}

export function setDataset(el, key, value) {
  if (!el) return;
  if (value === undefined || value === null) {
    delete el.dataset[key];
  } else {
    el.dataset[key] = value;
  }
}

export function clearChildren(el) {
  if (!el) return;
  el.replaceChildren();
}

export function formatList(items) {
  return items.map((item) => `<li>${item}</li>`).join("");
}
