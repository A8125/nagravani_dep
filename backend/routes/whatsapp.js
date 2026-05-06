import { Router } from "express";
import { createHash } from "crypto";
import { createClient } from "@supabase/supabase-js";
import twilio from "twilio";
import { query } from "../db.js";

const router = Router();

const sessions = new Map();
const restartCommands = new Set(["hi", "hello", "start", "report"]);

const categories = [
  { label: "Road", value: "road" },
  { label: "Water", value: "water" },
  { label: "Street Light", value: "streetlight" },
  { label: "Garbage", value: "garbage" },
  { label: "Sewage", value: "sewage" },
  { label: "Noise", value: "noise" },
  { label: "Encroachment", value: "encroachment" },
];

const severityOptions = [
  { label: "Low", value: "Low" },
  { label: "Medium", value: "Medium" },
  { label: "High", value: "High" },
  { label: "Critical", value: "Critical" },
];

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
);

function createSession(from) {
  const session = {
    from,
    step: "TITLE",
    data: {},
    wards: [],
  };
  sessions.set(from, session);
  return session;
}

function resetSession(from) {
  sessions.delete(from);
  return createSession(from);
}

function getBodyText(req) {
  return (req.body?.Body || "").trim();
}

function isRestartCommand(text) {
  return restartCommands.has(text.toLowerCase());
}

function formatNumberedOptions(options) {
  return options.map((option, index) => `${index + 1}. ${option.label}`).join("\n");
}

async function loadWardOptions() {
  const { rows } = await query("SELECT name FROM wards ORDER BY name");
  return rows.map((row) => row.name).filter(Boolean);
}

function parseCategorySelection(text) {
  const numeric = Number.parseInt(text, 10);
  if (Number.isInteger(numeric) && numeric >= 1 && numeric <= categories.length) {
    return categories[numeric - 1];
  }

  const normalized = text.toLowerCase();
  return categories.find(
    (category) =>
      category.value === normalized ||
      category.label.toLowerCase() === normalized,
  );
}

function parseSeveritySelection(text) {
  const numeric = Number.parseInt(text, 10);
  if (
    Number.isInteger(numeric) &&
    numeric >= 1 &&
    numeric <= severityOptions.length
  ) {
    return severityOptions[numeric - 1];
  }

  const normalized = text.toLowerCase();
  return severityOptions.find(
    (severity) => severity.value.toLowerCase() === normalized,
  );
}

function parseWardSelection(text, wards) {
  const numeric = Number.parseInt(text, 10);
  if (Number.isInteger(numeric) && numeric >= 1 && numeric <= wards.length) {
    return wards[numeric - 1];
  }

  const normalized = text.toLowerCase();
  return wards.find((ward) => ward.toLowerCase() === normalized) ?? null;
}

function inferExtension(contentType = "", url = "") {
  const contentTypeMap = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
  };

  if (contentTypeMap[contentType.toLowerCase()]) {
    return contentTypeMap[contentType.toLowerCase()];
  }

  const match = url.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
  return match?.[1]?.toLowerCase() || "jpg";
}

async function downloadTwilioMedia(mediaUrl) {
  const auth = Buffer.from(
    `${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`,
  ).toString("base64");

  const response = await fetch(mediaUrl, {
    headers: {
      Authorization: `Basic ${auth}`,
    },
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(`Twilio media download failed with ${response.status}`);
  }

  return Buffer.from(await response.arrayBuffer());
}

async function uploadWhatsAppPhoto(mediaUrl, contentType) {
  const ext = inferExtension(contentType, mediaUrl);
  const path = `whatsapp/${Date.now()}_photo.${ext}`;
  const buffer = await downloadTwilioMedia(mediaUrl);

  const { error } = await supabase.storage
    .from("complaint-photos")
    .upload(path, buffer, { contentType, upsert: false });

  if (error) {
    throw new Error(`Supabase upload failed: ${error.message}`);
  }

  const { data } = supabase.storage.from("complaint-photos").getPublicUrl(path);
  return data.publicUrl;
}

function buildSummary(data) {
  return [
    "Please confirm your complaint:",
    `Title: ${data.title}`,
    `Category: ${data.categoryLabel}`,
    `Ward: ${data.ward}`,
    `Description: ${data.description}`,
    `Name: ${data.citizen_name}`,
    `Aadhaar: XXXX XXXX ${data.aadhaar_last4}`,
    `Severity: ${data.severity}`,
    `Photo: ${data.photo_url ? "Attached" : "Skipped"}`,
    `Location: ${
      data.lat != null && data.lng != null
        ? `${data.lat}, ${data.lng}`
        : "Skipped"
    }`,
    "",
    "Reply YES to submit or NO to cancel.",
  ].join("\n");
}

async function submitComplaint(session) {
  const form = new FormData();
  const { data, from } = session;

  form.set("title", data.title);
  form.set("category", data.category);
  form.set("ward", data.ward);
  form.set("description", data.description);
  form.set("citizen_name", data.citizen_name);
  form.set("aadhaar", data.aadhaar);
  form.set("severity", data.severity);
  form.set("source", "whatsapp");
  form.set("whatsapp_number", from);

  if (data.photo_url) {
    form.set("photo_url", data.photo_url);
  }
  if (data.lat != null) {
    form.set("lat", String(data.lat));
  }
  if (data.lng != null) {
    form.set("lng", String(data.lng));
  }

  const backendUrl = process.env.BACKEND_URL || "http://localhost:3000";
  const response = await fetch(`${backendUrl}/api/report`, {
    method: "POST",
    body: form,
    signal: AbortSignal.timeout(20000),
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.error || `Complaint submission failed with ${response.status}`);
  }

  return payload;
}

router.post("/webhook", async (req, res) => {
  const twiml = new twilio.twiml.MessagingResponse();
  const from = req.body?.From;
  const text = getBodyText(req);

  if (!from) {
    return res.status(400).send("Twilio only");
  }

  try {
    let session = sessions.get(from);

    if (!session || isRestartCommand(text)) {
      session = resetSession(from);
      twiml.message(
        "Welcome to NagaraVaani WhatsApp complaints.\n\nWhat is the complaint title?",
      );
      return res.type("text/xml").send(twiml.toString());
    }

    switch (session.step) {
      case "TITLE":
        if (!text) {
          twiml.message("Please send a short complaint title.");
          break;
        }
        session.data.title = text;
        session.step = "CATEGORY";
        twiml.message(
          `Choose a category:\n${formatNumberedOptions(categories)}`,
        );
        break;

      case "CATEGORY": {
        const selected = parseCategorySelection(text);
        if (!selected) {
          twiml.message(
            `Invalid category. Reply with a number:\n${formatNumberedOptions(categories)}`,
          );
          break;
        }
        session.data.category = selected.value;
        session.data.categoryLabel = selected.label;
        session.wards = await loadWardOptions();
        session.step = "WARD";
        twiml.message(
          `Choose your ward:\n${session.wards
            .map((ward, index) => `${index + 1}. ${ward}`)
            .join("\n")}`,
        );
        break;
      }

      case "WARD": {
        const ward = parseWardSelection(text, session.wards);
        if (!ward) {
          twiml.message("Invalid ward. Reply with the ward number or exact ward name.");
          break;
        }
        session.data.ward = ward;
        session.step = "DESCRIPTION";
        twiml.message("Describe the issue in detail.");
        break;
      }

      case "DESCRIPTION":
        if (!text) {
          twiml.message("Please send a description of the issue.");
          break;
        }
        session.data.description = text;
        session.step = "NAME";
        twiml.message("What is your full name?");
        break;

      case "NAME":
        if (!text || text.length > 100) {
          twiml.message("Please send your full name in under 100 characters.");
          break;
        }
        session.data.citizen_name = text;
        session.step = "AADHAAR";
        twiml.message("Send your 12-digit Aadhaar number.");
        break;

      case "AADHAAR":
        if (!/^\d{12}$/.test(text)) {
          twiml.message("Aadhaar must be exactly 12 digits. Please try again.");
          break;
        }
        session.data.aadhaar = text;
        session.data.aadhaar_hash = createHash("sha256").update(text).digest("hex");
        session.data.aadhaar_last4 = text.slice(-4);
        session.step = "SEVERITY";
        twiml.message(
          `Choose severity:\n${formatNumberedOptions(severityOptions)}`,
        );
        break;

      case "SEVERITY": {
        const severity = parseSeveritySelection(text);
        if (!severity) {
          twiml.message(
            `Invalid severity. Reply with a number:\n${formatNumberedOptions(severityOptions)}`,
          );
          break;
        }
        session.data.severity = severity.value;
        session.step = "PHOTO";
        twiml.message(
          'Send a photo of the issue now, or reply "SKIP" to continue without one.',
        );
        break;
      }

      case "PHOTO":
        if (text.toLowerCase() === "skip") {
          session.data.photo_url = null;
          session.step = "LOCATION";
          twiml.message(
            'Share your WhatsApp location now, or reply "SKIP" to continue without it.',
          );
          break;
        }
        if (!req.body?.MediaUrl0) {
          twiml.message('Please send one photo, or reply "SKIP".');
          break;
        }
        session.data.photo_url = await uploadWhatsAppPhoto(
          req.body.MediaUrl0,
          req.body.MediaContentType0 || "image/jpeg",
        );
        session.step = "LOCATION";
        twiml.message(
          'Photo received. Share your WhatsApp location now, or reply "SKIP".',
        );
        break;

      case "LOCATION":
        if (text.toLowerCase() === "skip") {
          session.data.lat = null;
          session.data.lng = null;
          session.step = "CONFIRM";
          twiml.message(buildSummary(session.data));
          break;
        }
        if (!req.body?.Latitude || !req.body?.Longitude) {
          twiml.message(
            'Please share your WhatsApp location, or reply "SKIP".',
          );
          break;
        }
        session.data.lat = Number.parseFloat(req.body.Latitude);
        session.data.lng = Number.parseFloat(req.body.Longitude);
        session.step = "CONFIRM";
        twiml.message(buildSummary(session.data));
        break;

      case "CONFIRM":
        if (text.toLowerCase() === "yes") {
          const result = await submitComplaint(session);
          sessions.delete(from);
          twiml.message(
            result?.message
              ? `Complaint submitted.\n${result.message}`
              : `Complaint submitted successfully. ID: ${result?.complaint?.id || "generated"}`,
          );
          break;
        }
        if (text.toLowerCase() === "no") {
          sessions.delete(from);
          twiml.message(
            'Complaint cancelled. Reply "START" whenever you want to report a new issue.',
          );
          break;
        }
        twiml.message('Reply YES to submit or NO to cancel.');
        break;

      default:
        sessions.delete(from);
        twiml.message(
          'Session reset. Reply "START" to begin a new complaint.',
        );
        break;
    }
  } catch (err) {
    console.error("[WHATSAPP WEBHOOK ERROR]", err);
    sessions.delete(from);
    twiml.message(
      'Something went wrong while processing your complaint. Reply "START" to try again.',
    );
  }

  res.type("text/xml").send(twiml.toString());
});

export default router;
