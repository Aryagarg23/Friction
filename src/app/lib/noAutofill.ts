// Every text box in the pretend laptop is part of a demo, never a login.
// Spread on each <input> and <textarea> so the browser and password managers
// (1Password, LastPass, Bitwarden, Dashlane) do not offer to fill or save
// passwords in them.
export const NO_AUTOFILL = {
  autoComplete: "off",
  "data-1p-ignore": "true",
  "data-lpignore": "true",
  "data-bwignore": "true",
  "data-form-type": "other",
} as const;
