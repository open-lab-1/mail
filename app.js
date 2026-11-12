import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SUPABASE_URL = "https://sdqtgluhgywedjwgolei.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_zY7V5CoRa2mYRYhZdm8v7Q_lc5U1Lm_";
const ADMIN_IDS = new Set([
  "0fe7f46c-647c-48c4-a413-e52bcef97041",
  "b84b2db7-333e-437a-bc60-cd24004f9930",
]);
const SIGNATURE = "\n\n—\nL'Atelier de Noël 3D\nSaint-Witz et alentours";
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

const $ = (id) => document.getElementById(id);
const loginPanel = $("login-panel");
const appPanel = $("mail-app");
const loginForm = $("login-form");
const loginError = $("login-error");
const composeForm = $("compose-form");
const sendButton = $("send-button");
const recipient = $("recipient");
const subject = $("subject");
const message = $("message");
const signature = $("signature");
let sending = false;

function showLogin(error = "") {
  loginPanel.hidden = false;
  appPanel.hidden = true;
  loginError.textContent = error;
}
function showApp() {
  loginPanel.hidden = true;
  appPanel.hidden = false;
  $("login-footer").hidden = true;
}
async function checkSession(session) {
  if (!session) { showLogin(); return; }
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user || !ADMIN_IDS.has(data.user.id)) {
    await supabase.auth.signOut();
    showLogin("Ce compte n'a pas l'autorisation d'accéder à cette messagerie.");
    return;
  }
  showApp();
}

supabase.auth.onAuthStateChange((_event, session) => {
  if (!session) showLogin();
  else checkSession(session);
});

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = loginForm.querySelector("button");
  button.disabled = true;
  loginError.textContent = "Connexion en cours…";
  loginError.className = "feedback";
  const { error } = await supabase.auth.signInWithPassword({
    email: $("login-email").value.trim(),
    password: $("login-password").value,
  });
  button.disabled = false;
  if (error) {
    loginError.textContent = "Connexion impossible. Vérifie ton adresse et ton mot de passe.";
    loginError.className = "feedback error";
  }
});

$("logout-button").addEventListener("click", async () => {
  await supabase.auth.signOut();
  showLogin();
});

function updatePreview() {
  $("preview-to").textContent = recipient.value.trim() || "destinataire@exemple.fr";
  $("preview-subject").textContent = subject.value.trim() || "Objet de votre e-mail";
  $("preview-message").textContent = message.value || "Ton message apparaîtra ici…";
  $("preview-signature").hidden = !signature.checked;
  $("char-count").textContent = message.value.length.toLocaleString("fr-FR") + " / 15 000";
}
[recipient, subject, message, signature].forEach((field) => field.addEventListener("input", updatePreview));
signature.addEventListener("change", updatePreview);

$("clear-button").addEventListener("click", () => {
  if (!confirm("Effacer le destinataire, l'objet et le message ?")) return;
  composeForm.reset();
  updatePreview();
  $("send-feedback").textContent = "";
  $("send-feedback").className = "feedback";
});

composeForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (sending) return;
  const to = recipient.value.trim();
  const mailSubject = subject.value.trim();
  let mailMessage = message.value.trim();
  if (signature.checked) mailMessage += SIGNATURE;
  if (!to || !mailSubject || !mailMessage.trim()) return;

  if (!confirm("Envoyer cet e-mail à " + to + " ?\n\nObjet : " + mailSubject + "\n\nVérifie une dernière fois le destinataire et le message.")) return;

  sending = true;
  sendButton.disabled = true;
  sendButton.querySelector("span").textContent = "Envoi en cours…";
  const feedback = $("send-feedback");
  feedback.textContent = "Connexion au relais Gmail…";
  feedback.className = "feedback";

  try {
    const { data, error } = await supabase.functions.invoke("mail-send", {
      body: { action: "send_email", to, subject: mailSubject, message: mailMessage },
    });
    if (error) {
      let detail = "";
      try { detail = await error.context?.json?.().then((x) => x.error || "").catch(() => ""); } catch {}
      throw new Error(detail || "Le service d'envoi n'a pas répondu correctement.");
    }
    if (!data?.success) throw new Error(data?.error || "L'envoi n'a pas été confirmé.");
    feedback.textContent = "E-mail envoyé avec succès depuis l'adresse Gmail de l'Atelier.";
    feedback.className = "feedback success";
    message.value = "";
    updatePreview();
  } catch (error) {
    feedback.textContent = error.message || "Une erreur est survenue. L'e-mail n'a pas été confirmé.";
    feedback.className = "feedback error";
  } finally {
    sending = false;
    sendButton.disabled = false;
    sendButton.querySelector("span").textContent = "Envoyer l'e-mail";
  }
});

updatePreview();
const { data: sessionData } = await supabase.auth.getSession();
await checkSession(sessionData.session);
