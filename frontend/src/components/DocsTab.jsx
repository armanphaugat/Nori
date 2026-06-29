import { useState } from "react";
import { Card, Icon, Btn, Tag, SectionHeader } from "./Common.jsx";

// ─── ALERTS ──────────────────────────────────────────────────────────────────
function Alert({ type = "note", title, children }) {
  const styles = {
    note: {
      bg: "var(--navy-light)",
      border: "rgba(43,45,66,0.15)",
      text: "var(--navy)",
      icon: "info",
      color: "var(--navy-mid)"
    },
    warning: {
      bg: "rgba(234,179,8,0.06)",
      border: "rgba(234,179,8,0.25)",
      text: "#854d0e",
      icon: "warning",
      color: "#a16207"
    },
    tip: {
      bg: "rgba(34,197,94,0.06)",
      border: "rgba(34,197,94,0.2)",
      text: "#15803d",
      icon: "lightbulb",
      color: "#16a34a"
    }
  };

  const current = styles[type] || styles.note;

  return (
    <div style={{
      display: "flex",
      gap: 12,
      padding: "14px 18px",
      borderRadius: "var(--r-md)",
      background: current.bg,
      border: `1px solid ${current.border}`,
      margin: "16px 0 20px"
    }}>
      <Icon name={current.icon} size={20} style={{ color: current.color, flexShrink: 0, marginTop: 1 }} />
      <div>
        {title && <h5 style={{ fontWeight: 700, color: current.text, fontSize: 13.5, marginBottom: 4, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{title}</h5>}
        <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.5, fontWeight: 450 }}>
          {children}
        </div>
      </div>
    </div>
  );
}

// ─── MAIN DOCUMENTATION COMPONENT ────────────────────────────────────────────
export default function DocsTab({ guildId, onGoToOverview }) {
  const [activeSubTab, setActiveSubTab] = useState("members_qa");

  const SUB_TABS = [
    { id: "members_qa", label: "User Q&A & Command", icon: "forum" },
    { id: "tickets", label: "Support Ticket System", icon: "confirmation_number" },
    { id: "profile_servers", label: "Profile & Server Mgmt", icon: "manage_accounts" },
    { id: "billing_patreon", label: "Billing & Patreon Plan", icon: "payments" },
    { id: "admin_setup", label: "Admin: General & Style Setup", icon: "settings_suggest" },
    { id: "admin_kb", label: "Admin: Knowledge Base", icon: "upload_file" },
    { id: "admin_search_analytics", label: "Admin: Web Search & Control", icon: "analytics" },
  ];

  return (
    <div className="au">
      <SectionHeader
        label="Documentation"
        title="Walkthrough & User Manual"
        subtitle="Detailed step-by-step instructions on bot commands, support channel ticketing flows, admin dashboard customization, and knowledge ingestion."
      />

      <div style={{
        display: "grid",
        gridTemplateColumns: "270px 1fr",
        gap: 32,
        alignItems: "start",
        marginTop: 16,
      }}>
        {/* Left Side Sub-Navigation */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          gap: 6,
          position: "sticky",
          top: 80,
          background: "var(--surface)",
          padding: 16,
          borderRadius: "var(--r-lg)",
          border: "1px solid var(--border2)",
          boxShadow: "var(--shadow-sm)"
        }}>
          <div style={{
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: "0.1em",
            color: "var(--slate)",
            textTransform: "uppercase",
            marginBottom: 10,
            paddingLeft: 12,
            fontFamily: "'Plus Jakarta Sans', sans-serif"
          }}>
            Manual Sections
          </div>
          {SUB_TABS.map((sub) => {
            const isSel = activeSubTab === sub.id;
            return (
              <button
                key={sub.id}
                onClick={() => setActiveSubTab(sub.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 14px",
                  borderRadius: "var(--r-md)",
                  fontSize: 13,
                  fontWeight: isSel ? 700 : 500,
                  color: isSel ? "var(--accent-deep)" : "var(--muted)",
                  background: isSel ? "var(--accent-dim)" : "transparent",
                  border: "none",
                  cursor: "pointer",
                  width: "100%",
                  textAlign: "left",
                  transition: "all var(--tr)",
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
                onMouseEnter={e => {
                  if (!isSel) {
                    e.currentTarget.style.background = "var(--navy-light)";
                    e.currentTarget.style.color = "var(--accent-deep)";
                  }
                }}
                onMouseLeave={e => {
                  if (!isSel) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "var(--muted)";
                  }
                }}
              >
                <Icon name={sub.icon} size={16} style={{ color: isSel ? "var(--accent-deep)" : "var(--slate)" }} />
                <span>{sub.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Documentation Pane */}
        <Card pad="32px" style={{ minWidth: 0 }}>
          
          {/* ── SUBTAB: USER Q&A & COMMAND ── */}
          {activeSubTab === "members_qa" && (
            <div className="au">
              <h3 style={{ fontSize: 18, color: "var(--navy)", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                <Icon name="chat_bubble" size={20} style={{ color: "var(--accent)" }} />
                User Q&A & Interaction Walkthrough
              </h3>
              <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.6, marginBottom: 16 }}>
                Nori acts as a factual assistant inside your Discord server. It parses questions, scans vector databases, and executes search queries to return accurate responses.
              </p>

              <h4 style={{ fontSize: 14, color: "var(--navy)", marginTop: 18, marginBottom: 6 }}>1. Asking Questions in Monitored Channels</h4>
              <p style={{ fontSize: 13.5, color: "var(--muted)", lineHeight: 1.5, marginBottom: 12 }}>
                Server administrators designate specific text channels (such as <code>#faq</code>, <code>#helpdesk</code>, or <code>#general</code>) for Nori to monitor. In these channels, you do not need prefix commands:
              </p>
              <ol style={{ fontSize: 13, color: "var(--muted)", paddingLeft: 20, lineHeight: 1.7, marginBottom: 12 }}>
                <li>Navigate to the monitored text channel using the Discord channel list on the left.</li>
                <li>Locate the text area at the bottom of the screen (placeholder labeled <code>Message #channel-name</code>).</li>
                <li>Type your question directly (e.g. <code>How do I change my profile password?</code>) and press the <strong>Enter</strong> key.</li>
                <li>The bot will trigger a typing indicator and display its response inline.</li>
              </ol>
              <div style={{
                background: "var(--surface-2)",
                padding: "12px 16px",
                borderRadius: "var(--r-md)",
                border: "1px solid var(--border)",
                fontSize: 13,
                marginBottom: 16,
                fontFamily: "'Plus Jakarta Sans', sans-serif"
              }}>
                <div style={{ fontWeight: 700, color: "var(--navy)", marginBottom: 4 }}>User:</div>
                <div style={{ color: "var(--muted)", marginBottom: 10 }}>How do I change my profile password?</div>
                <div style={{ fontWeight: 700, color: "var(--accent)", marginBottom: 4 }}>Nori:</div>
                <div style={{ color: "var(--muted)" }}>
                  To change your password: 1) Click Settings in the bottom left, 2) Select "My Account", 3) Click the "Change Password" button.
                </div>
              </div>

              <h4 style={{ fontSize: 14, color: "var(--navy)", marginTop: 18, marginBottom: 6 }}>2. Querying via the Prefix Command (-ask)</h4>
              <p style={{ fontSize: 13.5, color: "var(--muted)", lineHeight: 1.5, marginBottom: 12 }}>
                In server channels that are not actively monitored, you can invoke the bot manually using the prefix query:
              </p>
              <ol style={{ fontSize: 13, color: "var(--muted)", paddingLeft: 20, lineHeight: 1.7, marginBottom: 12 }}>
                <li>Type <code>-ask</code> in lowercase.</li>
                <li>Press the <strong>Spacebar</strong> once.</li>
                <li>Type your question (e.g. <code>-ask What is the refund policy for premium subscriptions?</code>) and press <strong>Enter</strong>.</li>
              </ol>
              <div style={{
                background: "var(--navy)",
                color: "var(--light)",
                padding: "12px 16px",
                borderRadius: "var(--r-md)",
                fontFamily: "'DM Mono', monospace",
                fontSize: 12.5,
                marginBottom: 16
              }}>
                -ask What is the refund policy for premium subscriptions?
              </div>

              <h4 style={{ fontSize: 14, color: "var(--navy)", marginTop: 18, marginBottom: 6 }}>3. AI-Powered Question Detection (Global Auto-Reply)</h4>
              <p style={{ fontSize: 13.5, color: "var(--muted)", lineHeight: 1.5, marginBottom: 12 }}>
                Nori incorporates a Llama 3-powered intent classifier that dynamically analyzes incoming messages. If a member asks a question (direct, indirect, or implied) in any channel on the server, the bot automatically classifies the message intent and responds. This enables seamless, zero-prefix auto-responses across your server without requiring administrators to explicitly designate monitored channels for every scenario.
              </p>

              <h4 style={{ fontSize: 14, color: "var(--navy)", marginTop: 18, marginBottom: 6 }}>4. Submitting Attachments (OCR & Voice Transcripts)</h4>
              <p style={{ fontSize: 13.5, color: "var(--muted)", lineHeight: 1.5, marginBottom: 12 }}>
                You can feed images or audio/video media directly into your query using the <code>-ask</code> command:
              </p>
              <ul style={{ fontSize: 13, color: "var(--muted)", paddingLeft: 20, lineHeight: 1.7, marginBottom: 16 }}>
                <li><strong>Image Submissions (OCR)</strong>: Click the plus (<code>+</code>) icon next to the chat bar or drag-and-drop an image (screenshot, photo) under 10MB. Type your question with the <code>-ask</code> prefix and send. The bot extracts text from the image using Optical Character Recognition (OCR) to evaluate the answer.</li>
                <li><strong>Voice Submissions (Whisper)</strong>: Drag-and-drop an audio file (MP3, WAV) or video file (MP4, MOV) under 10MB into the chat box. Type your question with the <code>-ask</code> prefix. The bot will transcribe the voice content locally using the OpenAI Whisper model and query the resulting text.</li>
              </ul>

              <h4 style={{ fontSize: 14, color: "var(--navy)", marginTop: 18, marginBottom: 6 }}>5. Performance Rating & Moderator Reporting</h4>
              <p style={{ fontSize: 13.5, color: "var(--muted)", lineHeight: 1.5, marginBottom: 12 }}>
                Each bot answer is appended with Thumbs Up (👍) and Thumbs Down (👎) reaction emojis, active for 120 seconds:
              </p>
              <ul style={{ fontSize: 13, color: "var(--muted)", paddingLeft: 20, lineHeight: 1.7, marginBottom: 16 }}>
                <li>Click the <strong>Thumbs Up</strong> emoji if the answer was correct. The bot responds with confirmation.</li>
                <li>Click the <strong>Thumbs Down</strong> emoji if the answer was unhelpful. The bot deletes the reactions, apologizes, and automatically posts an alert to the server's administrator logging channel containing the user details, question, and bot answer.</li>
              </ul>
            </div>
          )}

          {/* ── SUBTAB: SUPPORT TICKET SYSTEM ── */}
          {activeSubTab === "tickets" && (
            <div className="au">
              <h3 style={{ fontSize: 18, color: "var(--navy)", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                <Icon name="confirmation_number" size={20} style={{ color: "var(--accent)" }} />
                Support Ticket System Walkthrough
              </h3>
              <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.6, marginBottom: 16 }}>
                The bot features an integrated private support ticketing flow. This allows server members to open private consultation channels for isolated query resolution.
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
                <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: 16 }}>
                  <h4 style={{ fontSize: 13.5, color: "var(--navy)", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                    <Icon name="add_circle" size={16} style={{ color: "var(--accent)" }} />
                    1. Opening the Ticket Channel
                  </h4>
                  <p style={{ fontSize: 12.5, color: "var(--muted)", lineHeight: 1.5 }}>
                    Navigate to the designated support channel (typically named <code>#support</code>). Locate the support embed panel and click the grey button labeled <strong>Create Query</strong>.
                  </p>
                </div>

                <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: 16 }}>
                  <h4 style={{ fontSize: 13.5, color: "var(--navy)", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                    <Icon name="cancel" size={16} style={{ color: "var(--navy)" }} />
                    2. Closing & Deleting the Thread
                  </h4>
                  <p style={{ fontSize: 12.5, color: "var(--muted)", lineHeight: 1.5 }}>
                    Once your query is answered, click the red button labeled <strong>Close Ticket</strong> in the thread. The bot will automatically delete the thread to maintain channel cleanliness.
                  </p>
                </div>
              </div>

              <h4 style={{ fontSize: 14, color: "var(--navy)", marginBottom: 6 }}>Support Ticket Flow</h4>
              <ol style={{ fontSize: 13, color: "var(--muted)", paddingLeft: 20, lineHeight: 1.7, marginBottom: 16 }}>
                <li>User clicks the <code>Create Query</code> button in the main support channel.</li>
                <li>The bot generates a private Discord thread named <code>ticket-yourusername</code>.</li>
                <li>The user receives a notification. Inside the thread, they can type any question directly. Nori listens to all messages in the thread and answers without requiring the <code>-ask</code> prefix.</li>
                <li>User clicks the red <code>Close Ticket</code> button, and the thread is purged from the server list.</li>
              </ol>

              <Alert type="tip" title="Channel Permissions">
                Nori configures the base support channel permissions so that general members cannot send messages directly. They must use the ticketing button to query, avoiding channel clutter.
              </Alert>
            </div>
          )}

          {/* ── SUBTAB: PROFILE & SERVER MANAGEMENT ── */}
          {activeSubTab === "profile_servers" && (
            <div className="au">
              <h3 style={{ fontSize: 18, color: "var(--navy)", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                <Icon name="manage_accounts" size={20} style={{ color: "var(--accent)" }} />
                Profile & Server Management
              </h3>
              <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.6, marginBottom: 16 }}>
                Manage your Discord account link, switch server management focus, and invite the bot to new guilds.
              </p>

              <h4 style={{ fontSize: 14, color: "var(--navy)", marginTop: 18, marginBottom: 6 }}>1. Profile Settings Overview</h4>
              <p style={{ fontSize: 13.5, color: "var(--muted)", lineHeight: 1.5, marginBottom: 12 }}>
                In the <strong>Profile</strong> tab, you can view your primary account metadata retrieved from Discord:
              </p>
              <ul style={{ fontSize: 13, color: "var(--muted)", paddingLeft: 20, lineHeight: 1.7, marginBottom: 16 }}>
                <li><strong>Avatar & Username</strong>: Displays your Discord avatar image and username tag.</li>
                <li><strong>Discord ID</strong>: Displays your unique snowflake ID (with a one-click copy button next to it for quick reference).</li>
                <li><strong>Email Address</strong>: The email address linked to your Discord account.</li>
                <li><strong>Role Designation</strong>: Your administrative access role (e.g. <code>Server Manager</code>).</li>
              </ul>

              <h4 style={{ fontSize: 14, color: "var(--navy)", marginTop: 18, marginBottom: 6 }}>2. Relocated Sign Out Button</h4>
              <p style={{ fontSize: 13.5, color: "var(--muted)", lineHeight: 1.5, marginBottom: 12 }}>
                To optimize the dashboard's layout, the <strong>Sign Out</strong> button has been relocated from the bottom-left sidebar to the top-right corner of the Profile card. Use this button to log out of the dashboard session securely.
              </p>

              <h4 style={{ fontSize: 14, color: "var(--navy)", marginTop: 18, marginBottom: 6 }}>3. Server Selection & Bot Installation</h4>
              <p style={{ fontSize: 13.5, color: "var(--muted)", lineHeight: 1.5, marginBottom: 12 }}>
                The Profile section acts as the central hub for managing which Discord server you are administering:
              </p>
              <ul style={{ fontSize: 13, color: "var(--muted)", paddingLeft: 20, lineHeight: 1.7, marginBottom: 16 }}>
                <li><strong>Active Servers</strong>: Shows all guilds where you are an admin and Nori is already configured. Clicking on a server card instantly switches the active dashboard session to that server, taking you directly to its channel settings.</li>
                <li><strong>Available to Setup</strong>: Lists eligible servers where you have manager permissions but Nori is not yet present. Clicking the <strong>Invite</strong> button prompts the Discord bot invitation dialog.</li>
                <li><strong>Add to New Server</strong>: Opens the general bot invite URL in a new window to install Nori on a completely new Discord server.</li>
              </ul>
            </div>
          )}

          {/* ── SUBTAB: BILLING & PATREON PLAN ── */}
          {activeSubTab === "billing_patreon" && (
            <div className="au">
              <h3 style={{ fontSize: 18, color: "var(--navy)", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                <Icon name="payments" size={20} style={{ color: "var(--accent)" }} />
                Billing & Patreon Plan Integration
              </h3>
              <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.6, marginBottom: 16 }}>
                Monitor your server's message credits, learn about our subscription tiers, and link Patreon pledges for premium features.
              </p>

              <h4 style={{ fontSize: 14, color: "var(--navy)", marginTop: 18, marginBottom: 6 }}>1. Tracking Usage & Message Limits</h4>
              <p style={{ fontSize: 13.5, color: "var(--muted)", lineHeight: 1.5, marginBottom: 12 }}>
                Each subscription plan grants your server a monthly question quota. You can inspect usage in the <strong>Billing</strong> tab:
              </p>
              <ul style={{ fontSize: 13, color: "var(--muted)", paddingLeft: 20, lineHeight: 1.7, marginBottom: 16 }}>
                <li><strong>Current Plan Card</strong>: Displays active plan name, price, monthly limits, and core features.</li>
                <li><strong>Usage Meter</strong>: A visual, dynamic progress bar indicating how many questions have been asked by server users relative to your monthly limit (resets every billing cycle).</li>
              </ul>

              <Alert type="warning" title="Limit Enforcement">
                If the server exceeds its monthly question limit, the bot will stop answering questions in chat and reply with a notice instructing moderators/admins to upgrade on the dashboard.
              </Alert>

              <h4 style={{ fontSize: 14, color: "var(--navy)", marginTop: 18, marginBottom: 6 }}>2. Upgrading via Patreon Integration</h4>
              <p style={{ fontSize: 13.5, color: "var(--muted)", lineHeight: 1.5, marginBottom: 12 }}>
                Upgrading your server plan is handled securely through Patreon:
              </p>
              <ol style={{ fontSize: 13, color: "var(--muted)", paddingLeft: 20, lineHeight: 1.7, marginBottom: 16 }}>
                <li>On the <strong>Billing</strong> tab, click the <strong>Upgrade on Patreon</strong> button (or <strong>Manage Pledge on Patreon</strong> if already pledged).</li>
                <li>You will be redirected to Patreon to choose or manage your subscription tier.</li>
                <li><strong>Important:</strong> Ensure that you link your Discord account in your Patreon settings (Patreon &rarr; Profile Settings &rarr; Connected Apps &rarr; Discord). This allows the dashboard to associate your pledge with your Discord identity automatically.</li>
              </ol>

              <h4 style={{ fontSize: 14, color: "var(--navy)", marginTop: 18, marginBottom: 6 }}>3. Available Subscription Tiers</h4>
              <div style={{ 
                overflowX: "auto", 
                margin: "20px 0", 
                border: "1px solid var(--border2)", 
                borderRadius: "var(--r-md)",
                boxShadow: "var(--shadow-sm)"
              }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, textAlign: "left", background: "white" }}>
                  <thead>
                    <tr style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--border2)", color: "var(--navy)" }}>
                      <th style={{ padding: "12px 16px", fontWeight: 700 }}>Tier</th>
                      <th style={{ padding: "12px 16px", fontWeight: 700 }}>Price</th>
                      <th style={{ padding: "12px 16px", fontWeight: 700 }}>Monthly Questions</th>
                      <th style={{ padding: "12px 16px", fontWeight: 700 }}>Knowledge Limits</th>
                      <th style={{ padding: "12px 16px", fontWeight: 700 }}>Supported Types</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { name: "Free", price: "$0/mo", limit: "50", kb: "5 Documents", types: "PDF, TXT" },
                      { name: "Starter", price: "$25/mo", limit: "200", kb: "10 Documents + 5 URLs", types: "PDF, DOCX, XLSX, Images" },
                      { name: "Pro", price: "$99/mo", limit: "800", kb: "50 Documents", types: "All Files + Advanced Analytics + Multi-Persona" },
                      { name: "Custom", price: "Custom Pricing", limit: "Unlimited", kb: "Unlimited Documents", types: "White-label + Dedicated SLA" }
                    ].map((item, idx) => (
                      <tr key={idx} style={{ 
                        borderBottom: idx === 4 ? "none" : "1px solid var(--border)", 
                        color: "var(--muted)",
                        background: idx % 2 === 1 ? "var(--surface-2)" : "white"
                      }}>
                        <td style={{ padding: "12px 16px", fontWeight: 600, color: "var(--navy)" }}>{item.name}</td>
                        <td style={{ padding: "12px 16px", fontWeight: 500, color: "var(--accent-deep)" }}>{item.price}</td>
                        <td style={{ padding: "12px 16px" }}>{item.limit}</td>
                        <td style={{ padding: "12px 16px" }}>{item.kb}</td>
                        <td style={{ padding: "12px 16px", fontSize: 12 }}>{item.types}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── SUBTAB: ADMIN SETUP ── */}
          {activeSubTab === "admin_setup" && (
            <div className="au">
              <h3 style={{ fontSize: 18, color: "var(--navy)", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                <Icon name="supervisor_account" size={20} style={{ color: "var(--accent)" }} />
                Admin: General & Personality Configuration
              </h3>
              <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.6, marginBottom: 16 }}>
                Configure where Nori responds, what personality it uses, and where it logs user feedback.
              </p>

              <h4 style={{ fontSize: 14, color: "var(--navy)", marginTop: 18, marginBottom: 6 }}>1. Registering Monitored Channels</h4>
              <p style={{ fontSize: 13.5, color: "var(--muted)", lineHeight: 1.5, marginBottom: 12 }}>
                To set channels where the bot responds to direct text messages:
              </p>
              <ol style={{ fontSize: 13, color: "var(--muted)", paddingLeft: 20, lineHeight: 1.7, marginBottom: 12 }}>
                 <li>Select the <strong>General Settings</strong> tab on the dashboard menu.</li>
                <li>Under the dropdown list, select the text channel you want the bot to watch.</li>
                <li>Click the <strong>Add Monitored Channel</strong> button. The channel will appear in the table below.</li>
              </ol>

              <h4 style={{ fontSize: 14, color: "var(--navy)", marginTop: 18, marginBottom: 6 }}>2. Customizing Language & Tone Style</h4>
              <p style={{ fontSize: 13.5, color: "var(--muted)", lineHeight: 1.5, marginBottom: 12 }}>
                You can customize the bot's response behavior for each monitored channel separately:
              </p>
              <ul style={{ fontSize: 13, color: "var(--muted)", paddingLeft: 20, lineHeight: 1.7, marginBottom: 12 }}>
                <li><strong>Language Dropdown</strong>: Select from supported languages (e.g. English, Spanish, French, German).</li>
                <li><strong>Tone Dropdown</strong>: Choose the conversational tone style (e.g. <code>Professional</code>, <code>Friendly</code>, <code>Casual</code>, or <code>Humorous</code>). The bot dynamically generates localized completion specifications.</li>
              </ul>

              <h4 style={{ fontSize: 14, color: "var(--navy)", marginTop: 18, marginBottom: 6 }}>3. Setting up the Moderator Logging Channel</h4>
              <p style={{ fontSize: 13.5, color: "var(--muted)", lineHeight: 1.5, marginBottom: 12 }}>
                The bot alerts staff when users are unsatisfied or when questions fail. To configure:
              </p>
              <ol style={{ fontSize: 13, color: "var(--muted)", paddingLeft: 20, lineHeight: 1.7, marginBottom: 12 }}>
                 <li>Navigate to the General Settings tab.</li>
                <li>Locate the selector labeled <strong>Configure Moderator Alert Channel</strong>.</li>
                <li>Select a staff-only channel and confirm. The bot will automatically push rich logs here when users click Thumbs Down (👎).</li>
              </ol>
            </div>
          )}

          {/* ── SUBTAB: ADMIN KB ── */}
          {activeSubTab === "admin_kb" && (
            <div className="au">
              <h3 style={{ fontSize: 18, color: "var(--navy)", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                <Icon name="school" size={20} style={{ color: "var(--accent)" }} />
                Admin: Knowledge Base Ingestions
              </h3>
              <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.6, marginBottom: 16 }}>
                Feed data sources into the Vector Database to train your bot. Select the <strong>Knowledge Base</strong> tab to upload:
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16, marginBottom: 20 }}>
                <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: 16 }}>
                  <h4 style={{ fontSize: 13, color: "var(--navy)", marginBottom: 6, display: "flex", alignItems: "center", gap: 4 }}><Icon name="picture_as_pdf" size={14} style={{ color: "var(--accent)" }} /> Documents & PDFs</h4>
                  <p style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.5 }}>
                    Drag and drop files (PDF, TXT, Word, Images) into the Upload Area. The bot parses text contents and vectorizes them immediately.
                  </p>
                </div>

                <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: 16 }}>
                  <h4 style={{ fontSize: 13, color: "var(--navy)", marginBottom: 6, display: "flex", alignItems: "center", gap: 4 }}><Icon name="link" size={14} style={{ color: "var(--accent)" }} /> Single URLs</h4>
                  <p style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.5 }}>
                    Type the link to a single web page (e.g. your privacy policy) and click Upload to index the page contents.
                  </p>
                </div>

                <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: 16 }}>
                  <h4 style={{ fontSize: 13, color: "var(--navy)", marginBottom: 6, display: "flex", alignItems: "center", gap: 4 }}><Icon name="live_help" size={14} style={{ color: "var(--accent)" }} /> Manual FAQs</h4>
                  <p style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.5 }}>
                    Type questions and answers directly into the FAQ panel to create hardcoded rules the bot must follow.
                  </p>
                </div>

                <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: 16 }}>
                  <h4 style={{ fontSize: 13, color: "var(--navy)", marginBottom: 6, display: "flex", alignItems: "center", gap: 4 }}><Icon name="question_answer" size={14} style={{ color: "var(--accent)" }} /> Channel Ingestion</h4>
                  <p style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.5 }}>
                    Select a text channel and time duration (e.g., past 7 days) and click Ingest Channel Messages to import actual server logs.
                  </p>
                </div>
              </div>

              <h4 style={{ fontSize: 14, color: "var(--navy)", marginTop: 18, marginBottom: 6 }}>Web Crawler Scanner (Bulk-import)</h4>
              <ol style={{ fontSize: 13, color: "var(--muted)", paddingLeft: 20, lineHeight: 1.7, marginBottom: 12 }}>
                <li>Navigate to the <strong>URL Crawler</strong> utility tab.</li>
                <li>Enter the site domain link (e.g., <code>https://docs.yoursite.com</code>) and click <strong>Discover</strong>.</li>
                <li>Wait for the crawler to compile the sub-page index. Select the checkboxes next to the URLs you want to add, and click **Ingest**.</li>
              </ol>

              <h4 style={{ fontSize: 14, color: "var(--navy)", marginTop: 18, marginBottom: 6 }}>Reviewing & Deleting Ingested Sources</h4>
              <p style={{ fontSize: 13.5, color: "var(--muted)", lineHeight: 1.5, marginBottom: 12 }}>
                Click the <strong>Ingested Sources</strong> tab. Here, you can review the file names, feed details, and content indices. To remove any document from the bot's memory, click the red <strong>Delete</strong> button next to the item.
              </p>
            </div>
          )}

          {/* ── SUBTAB: ADMIN SEARCH & ANALYTICS ── */}
          {activeSubTab === "admin_search_analytics" && (
            <div className="au">
              <h3 style={{ fontSize: 18, color: "var(--navy)", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                <Icon name="query_stats" size={20} style={{ color: "var(--accent)" }} />
                Admin: Search Fallback & Analytics
              </h3>
              <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.6, marginBottom: 16 }}>
                Control how the bot behaves when answers are missing, and inspect query analytics.
              </p>

              <h4 style={{ fontSize: 14, color: "var(--navy)", marginTop: 18, marginBottom: 6 }}>1. Web Search Fallback</h4>
              <p style={{ fontSize: 13.5, color: "var(--muted)", lineHeight: 1.5, marginBottom: 12 }}>
                By default, if the bot doesn't find matching facts in your files, it outputs <code>I don't have this information</code>. Enabling the web fallback allows it to search the internet:
              </p>
              <ol style={{ fontSize: 13, color: "var(--muted)", paddingLeft: 20, lineHeight: 1.7, marginBottom: 12 }}>
                <li>Go to the Knowledge Base tab.</li>
                <li>Locate the <strong>Web Search</strong> toggle button and switch it to active.</li>
                <li>When active, the bot will use Tavily/Exa search results to answer questions that are not covered in your uploaded files, appending references and URL citations to its responses.</li>
              </ol>

              <h4 style={{ fontSize: 14, color: "var(--navy)", marginTop: 18, marginBottom: 6 }}>2. Analytics Dashboard</h4>
              <p style={{ fontSize: 13.5, color: "var(--muted)", lineHeight: 1.5, marginBottom: 12 }}>
                Review live usage metrics under the <strong>Analytics</strong> tab:
              </p>
              <ul style={{ fontSize: 13, color: "var(--muted)", paddingLeft: 20, lineHeight: 1.7, marginBottom: 12 }}>
                <li><strong>Total Questions</strong>: Metric detailing daily question counts.</li>
                <li><strong>Answer Rate</strong>: Percentage of questions answered successfully.</li>
                <li><strong>Response Latency</strong>: Average response speed in seconds.</li>
                <li><strong>Recent Events Log</strong>: Detailed query table containing timestamps, active user IDs, answered status, and latency speeds.</li>
              </ul>

              <h4 style={{ fontSize: 14, color: "var(--navy)", marginTop: 18, marginBottom: 6 }}>3. Pausing bot responses</h4>
              <p style={{ fontSize: 13.5, color: "var(--muted)", lineHeight: 1.5, marginBottom: 12 }}>
                If you need to perform server maintenance: click the <strong>Pause Bot</strong> toggle button in the header dashboard menu. When active, Nori ignores user queries and replies with a maintenance message.
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
