const express = require("express");
const path = require("path");
const { phases, days } = require("./data/course");
const { processCommand } = require("./data/terminal");

const app = express();
const PORT = process.env.PORT || 3000;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

// Helper: get phase for a day
function getPhase(phaseId) {
  return phases.find((p) => p.id === phaseId);
}

// Home — dashboard
app.get("/", (req, res) => {
  res.render("index", { phases, days, getPhase });
});

// Individual day page
app.get("/day/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const day = days.find((d) => d.id === id);
  if (!day) return res.redirect("/");
  const phase = getPhase(day.phase);
  const prev = days.find((d) => d.id === id - 1) || null;
  const next = days.find((d) => d.id === id + 1) || null;
  res.render("day", { day, phase, prev, next, days, phases });
});

// Deep dive page
app.get("/day/:id/deep-dive", (req, res) => {
  const id = parseInt(req.params.id);
  const day = days.find((d) => d.id === id);
  if (!day) return res.redirect("/");
  const phase = getPhase(day.phase);
  res.render("deep-dive", { day, phase, days, phases });
});

// AI deep dive API — calls Anthropic
app.post("/api/deep-dive", async (req, res) => {
  const { question, dayId, context } = req.body;
  if (!question) return res.status(400).json({ error: "No question provided" });

  const day = days.find((d) => d.id === dayId);
  const phase = day ? getPhase(day.phase) : null;

  const systemPrompt = `You are an expert Terraform and Azure instructor teaching a 30-day course. The student is on Day ${dayId}: "${day?.title}". Phase: "${phase?.name}".

Your job: give deep, technically accurate explanations with real HCL code examples. Always use Azure-specific context. Format your response in clean HTML using these classes:
- <p class="prose"> for paragraphs
- <pre class="code-block"><code> for code blocks (HCL/bash/yaml)
- <div class="concept-card"><h4>Title</h4><p>Content</p></div> for key concept boxes
- <div class="tip-box">text</div> for tips
- <div class="warn-box">text</div> for warnings
- <ul class="bullet-list"><li>item</li></ul> for lists

Keep answers focused, practical, and include runnable Terraform code where relevant. The student has 8 years of IT experience but is learning Terraform specifically.`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1500,
        system: systemPrompt,
        messages: [{ role: "user", content: question }],
      }),
    });

    const data = await response.json();
    if (data.error) return res.status(500).json({ error: data.error.message });
    const text = data.content?.[0]?.text || "No response received.";
    res.json({ answer: text });
  } catch (err) {
    res.status(500).json({ error: "Failed to reach AI: " + err.message });
  }
});


// In-memory session store (keyed by sessionId)
const terminalSessions = new Map();

// Terminal command API
app.post("/api/terminal", (req, res) => {
  const { command, dayId, sessionId } = req.body;
  if (!command || !dayId || !sessionId)
    return res.status(400).json({ error: "command, dayId, sessionId required" });
  const key = `${sessionId}:${dayId}`;
  const state = terminalSessions.get(key) || { initialized: false, applied: false };
  const result = processCommand(dayId, command, state);
  terminalSessions.set(key, result.state);
  res.json({ output: result.output, clear: result.clear || false });
});

app.post("/api/terminal/reset", (req, res) => {
  const { dayId, sessionId } = req.body;
  if (dayId && sessionId) terminalSessions.delete(`${sessionId}:${dayId}`);
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`Terraform Learn running at http://localhost:${PORT}`);
});
