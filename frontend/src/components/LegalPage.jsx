import { useEffect } from "react";
import { Card, Icon, Btn } from "./Common.jsx";

export default function LegalPage({ type, onBack }) {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [type]);

  const isPrivacy = type === "privacy";

  return (
    <div style={{
      background: "var(--bg)",
      color: "var(--text)",
      minHeight: "100vh",
      padding: "80px 24px 64px",
      fontFamily: "'Plus Jakarta Sans', sans-serif"
    }}>
      <style>{`
        @media(max-width:1150px) {
          .legal-nav { padding: 0 24px !important; }
        }
        @media(max-width:900px) {
          .legal-nav { padding: 0 16px !important; }
        }
      `}</style>
      {/* ── Navbar header ── */}
      <nav className="legal-nav" style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 200, height: 64,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 64px",
        background: "rgba(237,242,244,0.97)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid var(--border)",
      }}>
        <a href="#" onClick={(e) => { e.preventDefault(); onBack(); }} style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <img src="/LOGO.png" alt="Nori" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          </div>
          <span style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 600, fontSize: 22, color: "var(--navy)", letterSpacing: "0.01em" }}>Nori</span>
        </a>
        <Btn onClick={onBack} variant="ghost" style={{ fontSize: 13, height: 36 }}>
          <Icon name="arrow_back" size={14} /> Back to Home
        </Btn>
      </nav>

      {/* ── Main content card ── */}
      <div className="au" style={{ maxWidth: 800, margin: "0 auto" }}>
        <Card pad="40px" style={{ boxShadow: "var(--shadow-md)" }}>
          {isPrivacy ? (
            <div>
              <h1 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 32, color: "var(--navy)", marginBottom: 8 }}>Privacy Policy</h1>
              <p style={{ fontSize: 12.5, color: "var(--muted2)", marginBottom: 24 }}>Last updated: June 10, 2026</p>

              <p style={{ fontSize: 14.5, color: "var(--muted)", lineHeight: 1.75, marginBottom: 20 }}>
                At Nori, we are committed to protecting the privacy and security of your personal data. This Privacy Policy describes how we collect, use, and safeguard information when you use our website, Discord application, and administrative dashboard.
              </p>

              <h3 style={{ fontSize: 16, color: "var(--navy)", marginTop: 24, marginBottom: 10 }}>1. Information We Collect</h3>
              <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.7, marginBottom: 12 }}>
                We collect limited information required to provide the core service functionality, manage configurations, and render server analytics:
              </p>
              <ul style={{ fontSize: 13.5, color: "var(--muted)", paddingLeft: 20, lineHeight: 1.7, marginBottom: 16 }}>
                <li><strong>Discord Identifiers</strong>: Server (Guild) IDs, text channel IDs, and role IDs to store configuration states, and User IDs to manage administrative dashboard permissions.</li>
                <li><strong>Knowledge Base Data</strong>: Documents (PDFs, Word documents, plain text), URLs, and FAQs that you explicitly upload to train your server's assistant.</li>
                <li><strong>Chat Transcripts</strong>: Ingested text messages from channels if you use the "Chat History Import" utility, which are used solely to query the RAG system.</li>
                <li><strong>Analytics Data</strong>: Question logs, answer rates, response latency, and usage metrics for rendering dashboards.</li>
              </ul>

              <h3 style={{ fontSize: 16, color: "var(--navy)", marginTop: 24, marginBottom: 10 }}>2. How We Use Information</h3>
              <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.7, marginBottom: 12 }}>
                We utilize your data strictly to operate and improve Nori:
              </p>
              <ul style={{ fontSize: 13.5, color: "var(--muted)", paddingLeft: 20, lineHeight: 1.7, marginBottom: 16 }}>
                <li>To build localized search indexes via Graphlit's Retrieval-Augmented Generation (RAG) platform.</li>
                <li>To send query events to LLM inference endpoints (such as OpenAI's GPT-4o mini or Groq APIs).</li>
                <li>To display usage statistics, question latency logs, and answer success rates to server owners.</li>
                <li>To authenticate dashboard sessions via the official Discord OAuth2 API.</li>
              </ul>

              <h3 style={{ fontSize: 16, color: "var(--navy)", marginTop: 24, marginBottom: 10 }}>3. Data Storage & Security</h3>
              <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.7, marginBottom: 12 }}>
                We implement industry-standard safeguards to secure your database credentials, system configs, and uploaded contents:
              </p>
              <ul style={{ fontSize: 13.5, color: "var(--muted)", paddingLeft: 20, lineHeight: 1.7, marginBottom: 16 }}>
                <li>Relational database records are stored in protected Supabase PostgreSQL instances.</li>
                <li>Vector indexes and file storage are isolated within the secure Graphlit platform.</li>
                <li>All network communications utilize HTTPS / SSL encryption.</li>
              </ul>

              <h3 style={{ fontSize: 16, color: "var(--navy)", marginTop: 24, marginBottom: 10 }}>4. User Rights & Data Deletion</h3>
              <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.7, marginBottom: 12 }}>
                You maintain absolute ownership of your knowledge base files and configurations. You can delete uploaded files, crawler URL feeds, general settings, or individual FAQ logs at any time from the dashboard. Deletion requests instantly invoke deletion calls to the underlying Supabase and Graphlit servers.
              </p>

              <h3 style={{ fontSize: 16, color: "var(--navy)", marginTop: 24, marginBottom: 10 }}>5. Third-Party Services</h3>
              <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.7, marginBottom: 12 }}>
                Our application integrates with official external platforms to execute queries:
              </p>
              <ul style={{ fontSize: 13.5, color: "var(--muted)", paddingLeft: 20, lineHeight: 1.7, marginBottom: 16 }}>
                <li><strong>Discord API</strong>: For message listeners and user authentication.</li>
                <li><strong>Graphlit Core</strong>: For vector embeddings and specification prompts.</li>
                <li><strong>Tavily & Exa APIs</strong>: For executing web search fallbacks.</li>
              </ul>
            </div>
          ) : (
            <div>
              <h1 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 32, color: "var(--navy)", marginBottom: 8 }}>Terms & Conditions</h1>
              <p style={{ fontSize: 12.5, color: "var(--muted2)", marginBottom: 24 }}>Last updated: June 10, 2026</p>

              <p style={{ fontSize: 14.5, color: "var(--muted)", lineHeight: 1.75, marginBottom: 20 }}>
                Welcome to Nori. These Terms and Conditions govern your access to and use of Nori's website, dashboard, and Discord bot service. By logging in via Discord or adding the bot to your server, you agree to be bound by these terms.
              </p>

              <h3 style={{ fontSize: 16, color: "var(--navy)", marginTop: 24, marginBottom: 10 }}>1. User Accounts & Dashboard Security</h3>
              <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.7, marginBottom: 12 }}>
                You must authenticate your account using the official Discord OAuth2 service. You are responsible for keeping your session tokens secure. Any actions performed under your server dashboard are deemed to be authorized by you.
              </p>

              <h3 style={{ fontSize: 16, color: "var(--navy)", marginTop: 24, marginBottom: 10 }}>2. Permitted Content & Compliance</h3>
              <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.7, marginBottom: 12 }}>
                You are solely responsible for the documents, files, and URLs uploaded to the knowledge base:
              </p>
              <ul style={{ fontSize: 13.5, color: "var(--muted)", paddingLeft: 20, lineHeight: 1.7, marginBottom: 16 }}>
                <li>You agree not to upload any illegal, harassing, copyrighted (without permission), or harmful material.</li>
                <li>You represent that you own or have the appropriate rights to ingest the knowledge sources you provide.</li>
                <li>Nori reserves the right to suspend accounts or servers that engage in excessive API spam or service abuse.</li>
              </ul>

              <h3 style={{ fontSize: 16, color: "var(--navy)", marginTop: 24, marginBottom: 10 }}>3. Limitations of Service Availability</h3>
              <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.7, marginBottom: 12 }}>
                Nori relies on upstream APIs including Discord's Gateway connections and Graphlit's hosting infrastructure. While we strive to maintain high availability:
              </p>
              <ul style={{ fontSize: 13.5, color: "var(--muted)", paddingLeft: 20, lineHeight: 1.7, marginBottom: 16 }}>
                <li>The services are provided on an "as-is" and "as-available" basis.</li>
                <li>We do not guarantee that AI-generated responses will be 100% correct, and we are not liable for LLM hallucinations or unhelpful answers.</li>
              </ul>

              <h3 style={{ fontSize: 16, color: "var(--navy)", marginTop: 24, marginBottom: 10 }}>4. Termination</h3>
              <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.7, marginBottom: 12 }}>
                You may terminate your relationship with Nori at any time by removing the bot from your Discord servers. We reserve the right to suspend or block access to the dashboard for users violating these terms.
              </p>

              <h3 style={{ fontSize: 16, color: "var(--navy)", marginTop: 24, marginBottom: 10 }}>5. Modifications</h3>
              <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.7, marginBottom: 12 }}>
                We reserve the right to modify these Terms and Conditions at any time. Your continued use of the service after modifications have been posted constitutes your acceptance of the new terms.
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
