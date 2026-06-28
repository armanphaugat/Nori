import { useState, useEffect, useCallback } from "react";
import { API } from "../utils/api.js";
import {
  Spinner,
  StatusBadge,
  Tag,
  Btn,
  Icon,
  Card,
  SectionHeader,
  NoServerSelected,
} from "./Common.jsx";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
} from "recharts";

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const WEEKDAYS_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const formatHour = (h) => {
  if (h === 0) return "12 AM";
  if (h === 12) return "12 PM";
  return h > 12 ? `${h - 12} PM` : `${h} AM`;
};

export default function AnalyticsTab({ guildId, onGoToOverview }) {
  const [summary, setSummary] = useState(null);
  const [history, setHistory] = useState([]);
  const [recentEvents, setRecentEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isReloading, setIsReloading] = useState(false);
  const [status, setStatus] = useState(null);
  const [hasNoData, setHasNoData] = useState(false);
  const [hoveredCell, setHoveredCell] = useState(null);
  const [channelsAnalytics, setChannelsAnalytics] = useState([]);
  const [channelNames, setChannelNames] = useState({});

  const loadAnalytics = useCallback(async (id, silent = false) => {
    if (!id) {
      setSummary(null);
      setHistory([]);
      setRecentEvents([]);
      return;
    }
    if (silent) {
      setIsReloading(true);
    } else {
      setLoading(true);
    }
    setStatus(null);
    setHasNoData(false);

    try {
      // 1. Fetch Summary
      let summaryData = null;
      try {
        const res = await API.getAnalytics(id);
        summaryData = res.data || res;
      } catch (err) {
        if (err.message.includes("404") || err.message.toLowerCase().includes("no analytics")) {
          setHasNoData(true);
          if (silent) {
            setIsReloading(false);
          } else {
            setLoading(false);
          }
          return;
        }
        throw err;
      }

      setSummary(summaryData);

      // 2. Fetch Historical Trends (All Analytics)
      try {
        const resHistory = await API.getAllAnalytics(id, 30);
        const hist = resHistory.data || resHistory || [];
        // Map history to standard format if needed, and reverse to chronological order
        const mappedHistory = Array.isArray(hist)
          ? [...hist].reverse().map(item => ({
              ...item,
              day: item.day ? new Date(item.day).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "",
              answered: Number(item.answered || 0),
              unanswered: Number(item.unanswered || 0),
              total: Number(item.total || 0),
            }))
          : [];
        setHistory(mappedHistory);
      } catch (_) {
        setHistory([]);
      }

      // 3. Fetch Recent Events
      try {
        const resRecent = await API.getRecentAnalytics(id, 100);
        setRecentEvents(resRecent.data || resRecent || []);
      } catch (_) {
        setRecentEvents([]);
      }

      // 4. Fetch Channels Analytics
      try {
        const resChannels = await API.getAnalyticsByAllChannels(id, 50);
        setChannelsAnalytics(resChannels.data || resChannels || []);
      } catch (_) {
        setChannelsAnalytics([]);
      }

      // 5. Fetch Guild Channels for mapping IDs to names
      try {
        const dc = await API.getGuildChannels(id);
        const mapping = {};
        (dc.categories || []).forEach(cat => {
          (cat.channels || []).forEach(ch => {
            mapping[ch.id] = ch.name;
          });
        });
        if (dc.uncategorized && dc.uncategorized.channels) {
          dc.uncategorized.channels.forEach(ch => {
            mapping[ch.id] = ch.name;
          });
        }
        setChannelNames(mapping);
      } catch (err) {
        console.error("Failed to fetch guild channels names:", err);
      }

    } catch (err) {
      setStatus({ ok: false, msg: `Failed to load analytics: ${err.message}` });
    } finally {
      if (silent) {
        setIsReloading(false);
      } else {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadAnalytics(guildId);
  }, [guildId, loadAnalytics]);

  // Compute Heatmap Matrix (7 days x 24 hours) from recent query events
  const computeHeatmap = () => {
    const matrix = Array.from({ length: 7 }, () => Array(24).fill(0));
    recentEvents.forEach(event => {
      if (!event.asked_at) return;
      const date = new Date(event.asked_at);
      if (!isNaN(date.getTime())) {
        // Javascript returns 0 = Sunday, 1 = Monday. We want 0 = Monday, ..., 6 = Sunday.
        const day = (date.getDay() + 6) % 7;
        const hour = date.getHours();
        matrix[day][hour]++;
      }
    });

    let maxVal = 0;
    for (let d = 0; d < 7; d++) {
      for (let h = 0; h < 24; h++) {
        if (matrix[d][h] > maxVal) maxVal = matrix[d][h];
      }
    }

    return { matrix, maxVal };
  };

  const { matrix: heatmapMatrix, maxVal: heatmapMax } = computeHeatmap();

  // Find the quietest consecutive 2-hour window using member search patterns
  const getRecommendedMaintenanceWindow = () => {
    const hourlyTotals = Array(24).fill(0);
    recentEvents.forEach(event => {
      if (!event.asked_at) return;
      const date = new Date(event.asked_at);
      if (!isNaN(date.getTime())) {
        const hour = date.getHours();
        hourlyTotals[hour]++;
      }
    });

    let minVolume = Infinity;
    let bestHour = 2; // Default to 2 AM

    for (let h = 0; h < 24; h++) {
      const volume = hourlyTotals[h] + hourlyTotals[(h + 1) % 24];
      if (volume < minVolume) {
        minVolume = volume;
        bestHour = h;
      } else if (volume === minVolume) {
        // If volumes are tied, prefer typical late-night hours (e.g., between 1 AM and 5 AM)
        const currentIsLateNight = h >= 1 && h <= 4;
        const bestIsLateNight = bestHour >= 1 && bestHour <= 4;
        if (currentIsLateNight && !bestIsLateNight) {
          bestHour = h;
        }
      }
    }

    const startHour = bestHour;
    const endHour = (bestHour + 2) % 24;
    return { startHour, endHour };
  };

  const { startHour, endHour } = getRecommendedMaintenanceWindow();
  const startHourStr = formatHour(startHour);
  const endHourStr = formatHour(endHour);

  if (!guildId) {
    return (
      <div>
        <SectionHeader
          label="Server Dashboard"
          title="Server Analytics"
          subtitle="Track member queries, response latency, and Bot query volume statistics."
        />
        <NoServerSelected onGoToOverview={onGoToOverview} />
      </div>
    );
  }

  // Loader state
  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "120px 20px" }}>
        <Spinner size={32} />
        <span style={{ fontSize: 14, color: "var(--text-s)", marginTop: 12, fontWeight: 500 }}>Retrieving server statistics...</span>
      </div>
    );
  }

  // Beautiful Empty State when no query statistics are available
  if (hasNoData) {
    return (
      <div className="au">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 20, marginBottom: 20 }}>
          <SectionHeader
            label="Server Dashboard"
            title="Server Analytics"
            subtitle="Track member queries, response latency, and Bot query volume statistics."
          />
          {guildId && (
            <div style={{ display: "flex", gap: 12, flexShrink: 0, marginTop: 4 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
                <button
                  onClick={() => loadAnalytics(guildId, true)}
                  disabled={isReloading}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 8,
                    padding: "7px 16px", borderRadius: "var(--r-full)",
                    background: isReloading ? "var(--surface-3)" : "var(--surface)",
                    border: `1px solid ${isReloading ? "var(--border-dark)" : "var(--border2)"}`,
                    cursor: isReloading ? "not-allowed" : "pointer",
                    transition: "all var(--tr)",
                    fontSize: 12.5, fontWeight: 600,
                    color: "var(--muted)",
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    opacity: isReloading ? 0.7 : 1,
                    boxSizing: "border-box",
                    height: 34,
                  }}
                  onMouseEnter={e => { if (!isReloading) { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(43,45,66,0.08)"; e.currentTarget.style.color = "var(--navy)"; e.currentTarget.style.borderColor = "var(--navy-light)"; } }}
                  onMouseLeave={e => { if (!isReloading) { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.color = "var(--muted)"; e.currentTarget.style.borderColor = "var(--border2)"; } }}
                >
                  {isReloading ? (
                    <><Spinner size={12} /><span>Refreshing…</span></>
                  ) : (
                    <><Icon name="refresh" size={15} style={{ color: "var(--muted)" }} /><span>Refresh</span></>
                  )}
                </button>
                <span style={{ fontSize: 11, color: "var(--muted)", textAlign: "center" }}>
                  {isReloading ? "Refreshing..." : "Refresh analytics metrics"}
                </span>
              </div>
            </div>
          )}
        </div>
        <Card style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "64px 32px", textAlign: "center", gap: 18, border: "1.5px dashed var(--border)" }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--accent-l)", border: "1px solid rgba(196,30,30,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="bar_chart" size={28} style={{ color: "var(--accent)" }} />
          </div>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text)", marginBottom: 6, fontFamily: "'Outfit', sans-serif" }}>No Analytics Recorded Yet</h2>
            <p style={{ fontSize: 14, color: "var(--text-s)", maxWidth: 520, lineHeight: 1.6, margin: "0 auto", fontWeight: 300 }}>
              Nori has not processed any search queries on this server. Once members start asking questions in the configured Discord channels, details of response metrics and bot usage will populate here instantly.
            </p>
          </div>
          <div style={{ width: "100%", maxWidth: 440, background: "var(--bg-s)", padding: 16, borderRadius: "var(--r-md)", border: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 10, textAlign: "left" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-s)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Configuration Status</div>
            <div style={{ display: "flex", alignItems: "center", justifyItems: "center", gap: 8, fontSize: 13, color: "var(--text-s)" }}>
              <Icon name="check_circle" size={15} style={{ color: "var(--success)" }} />
              <span>Bot configured and online on your Discord Server</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyItems: "center", gap: 8, fontSize: 13, color: "var(--text-s)" }}>
              <Icon name="info" size={15} style={{ color: "var(--accent)" }} />
              <span>Ensure channels are authorized under the <strong>Channels</strong> tab</span>
            </div>
          </div>
          <Btn onClick={() => loadAnalytics(guildId)} variant="ghost" style={{ padding: "8px 16px", minHeight: 38 }}>
            <Icon name="refresh" size={15} /> Refresh Analytics
          </Btn>
        </Card>
      </div>
    );
  }

  const answeredQuestions = Number(summary?.answered || 0);
  const totalQuestions = Number(summary?.total_questions || 0);
  const answerRate = Number(summary?.answer_rate_pct || 0);
  const uniqueUsers = Number(summary?.unique_users || 0);
  const avgLatency = Number(summary?.avg_latency_ms || 0);
  const totalMessagesProcessed = Number(summary?.total_messages_processed || 0);
  const queriesIdentified = Number(summary?.queries_identified || 0);

  const getAggregatedChannelAnalytics = () => {
    const agg = {};
    (channelsAnalytics || []).forEach(stat => {
      const cid = stat.channel_id;
      if (!cid) return;
      if (!agg[cid]) {
        agg[cid] = {
          channel_id: cid,
          total_questions: 0,
          answered_questions: 0,
          avg_latency_sum: 0,
          users: new Set(),
          latency_count: 0
        };
      }
      agg[cid].total_questions += Number(stat.total_questions || 0);
      agg[cid].answered_questions += Number(stat.answered_questions || 0);
      if (stat.avg_latency_ms) {
        agg[cid].avg_latency_sum += Number(stat.avg_latency_ms) * Number(stat.total_questions);
        agg[cid].latency_count += Number(stat.total_questions);
      }
      if (stat.user_id) {
        agg[cid].users.add(stat.user_id);
      }
    });
    return Object.values(agg).map(ch => ({
      channel_id: ch.channel_id,
      total_questions: ch.total_questions,
      answered_questions: ch.answered_questions,
      unique_users: ch.users.size,
      avg_latency_ms: ch.latency_count > 0 ? ch.avg_latency_sum / ch.latency_count : 0
    })).sort((a, b) => b.total_questions - a.total_questions);
  };

  const aggregatedChannelStats = getAggregatedChannelAnalytics();
  const activeChannelsCount = aggregatedChannelStats.length;

  return (
    <div className="au" style={{ width: "100%", display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 20, marginBottom: 20 }}>
        <SectionHeader
          label="Server Dashboard"
          title="Server Analytics"
          subtitle="Track member queries, response latency, and Bot query volume statistics."
        />
        {guildId && (
          <div style={{ display: "flex", gap: 12, flexShrink: 0, marginTop: 4 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
              <button
                onClick={() => loadAnalytics(guildId, true)}
                disabled={isReloading}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  padding: "7px 16px", borderRadius: "var(--r-full)",
                  background: isReloading ? "var(--surface-3)" : "var(--surface)",
                  border: `1px solid ${isReloading ? "var(--border-dark)" : "var(--border2)"}`,
                  cursor: isReloading ? "not-allowed" : "pointer",
                  transition: "all var(--tr)",
                  fontSize: 12.5, fontWeight: 600,
                  color: "var(--muted)",
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  opacity: isReloading ? 0.7 : 1,
                  boxSizing: "border-box",
                  height: 34,
                }}
                onMouseEnter={e => { if (!isReloading) { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(43,45,66,0.08)"; e.currentTarget.style.color = "var(--navy)"; e.currentTarget.style.borderColor = "var(--navy-light)"; } }}
                onMouseLeave={e => { if (!isReloading) { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.color = "var(--muted)"; e.currentTarget.style.borderColor = "var(--border2)"; } }}
              >
                {isReloading ? (
                  <><Spinner size={12} /><span>Refreshing…</span></>
                ) : (
                  <><Icon name="refresh" size={15} style={{ color: "var(--muted)" }} /><span>Refresh</span></>
                )}
              </button>
              <span style={{ fontSize: 11, color: "var(--muted)", textAlign: "center" }}>
                {isReloading ? "Refreshing..." : "Refresh analytics metrics"}
              </span>
            </div>
          </div>
        )}
      </div>

      {status && <StatusBadge {...status} />}

      {/* KPI Cards Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
        {/* Card 1: Total Messages Processed */}
        <Card className="card-hover" style={{ display: "flex", flexDirection: "column", gap: 8, padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-s)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Total Messages</span>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(26,122,74,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name="forum" size={14} style={{ color: "var(--success)" }} />
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            <span style={{ fontSize: 24, fontWeight: 800, color: "var(--text)", fontFamily: "'Outfit', sans-serif" }}>{totalMessagesProcessed}</span>
            <span style={{ fontSize: 11, color: "var(--text-s)" }}>processed</span>
          </div>
        </Card>

        {/* Card 2: Queries Identified */}
        <Card className="card-hover" style={{ display: "flex", flexDirection: "column", gap: 8, padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-s)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Queries Identified</span>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--accent-l)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name="search" size={14} style={{ color: "var(--accent)" }} />
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            <span style={{ fontSize: 24, fontWeight: 800, color: "var(--text)", fontFamily: "'Outfit', sans-serif" }}>{queriesIdentified}</span>
            <span style={{ fontSize: 11, color: "var(--text-s)" }}>detected</span>
          </div>
        </Card>




        {/* Card 5: Total Users Served */}
        <Card className="card-hover" style={{ display: "flex", flexDirection: "column", gap: 8, padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-s)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Total Users Served</span>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--accent-l)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name="group" size={14} style={{ color: "var(--accent)" }} />
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            <span style={{ fontSize: 24, fontWeight: 800, color: "var(--text)", fontFamily: "'Outfit', sans-serif" }}>{uniqueUsers}</span>
            <span style={{ fontSize: 11, color: "var(--text-s)" }}>members reached</span>
          </div>
        </Card>

        {/* Card 6: Answer Rate */}
        <Card className="card-hover" style={{ display: "flex", flexDirection: "column", gap: 8, padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-s)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Answer Rate</span>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(26,122,74,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name="verified_user" size={14} style={{ color: "var(--success)" }} />
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            <span style={{ fontSize: 24, fontWeight: 800, color: "var(--text)", fontFamily: "'Outfit', sans-serif" }}>{answerRate}%</span>
            <span style={{ fontSize: 11, color: "var(--text-s)" }}>({answeredQuestions} answered)</span>
          </div>
        </Card>

        {/* Card 7: Average Response Latency */}
        <Card className="card-hover" style={{ display: "flex", flexDirection: "column", gap: 8, padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-s)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Avg Latency</span>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(179,92,0,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name="speed" size={14} style={{ color: "var(--warning)" }} />
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            <span style={{ fontSize: 24, fontWeight: 800, color: "var(--text)", fontFamily: "'Outfit', sans-serif" }}>{(avgLatency / 1000).toFixed(2)}s</span>
            <span style={{ fontSize: 11, color: "var(--text-s)" }}>bot response</span>
          </div>
        </Card>

        {/* Card 8: Active Channels */}
        <Card className="card-hover" style={{ display: "flex", flexDirection: "column", gap: 8, padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-s)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Active Channels</span>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--accent-l)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name="layers" size={14} style={{ color: "var(--accent)" }} />
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            <span style={{ fontSize: 24, fontWeight: 800, color: "var(--text)", fontFamily: "'Outfit', sans-serif" }}>{activeChannelsCount}</span>
            <span style={{ fontSize: 11, color: "var(--text-s)" }}>answering queries</span>
          </div>
        </Card>
      </div>

      {/* Graphs & Heatmap Section */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(460px, 1fr))", gap: 20 }}>
        {/* Trend Area Chart Card */}
        <Card style={{ padding: 24, display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", fontFamily: "'Outfit', sans-serif" }}>Query Trends</h3>
              <p style={{ fontSize: 12, color: "var(--text-s)" }}>Daily query volume over the last 30 days</p>
            </div>
            <Btn onClick={() => loadAnalytics(guildId)} variant="ghost" style={{ padding: 6, minHeight: 30, minWidth: 30 }}>
              <Icon name="refresh" size={14} />
            </Btn>
          </div>

          <div style={{ width: "100%", height: 240 }}>
            {history.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={history} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="var(--accent)" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorAnswered" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--success)" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="var(--success)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,15,15,0.04)" />
                  <XAxis dataKey="day" tick={{ fontSize: 10.5, fill: "var(--text-s)" }} stroke="rgba(15,15,15,0.1)" />
                  <YAxis tick={{ fontSize: 10.5, fill: "var(--text-s)" }} stroke="rgba(15,15,15,0.1)" />
                  <ChartTooltip
                    contentStyle={{
                      background: "var(--bg)",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--r-md)",
                      fontSize: 12.5,
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
                    }}
                  />
                  <Area type="monotone" name="Total Queries" dataKey="total" stroke="var(--accent)" strokeWidth={2} fillOpacity={1} fill="url(#colorTotal)" />
                  <Area type="monotone" name="Answered Queries" dataKey="answered" stroke="var(--success)" strokeWidth={1.5} fillOpacity={1} fill="url(#colorAnswered)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--text-s)", fontSize: 13 }}>
                Insufficient trend logs to render graph.
              </div>
            )}
          </div>
        </Card>

        {/* Heatmap Grid Card */}
        <Card style={{ padding: 24, display: "flex", flexDirection: "column", gap: 18 }}>
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", fontFamily: "'Outfit', sans-serif" }}>Query Heatmap</h3>
            <p style={{ fontSize: 12, color: "var(--text-s)" }}>Analysis of query volume by weekday and hour of day</p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14, flex: 1, justifyContent: "center" }}>
            {/* Heatmap Matrix Grid */}
            <div style={{ display: "flex", gap: 8, width: "100%" }}>
              {/* Day Labels Column */}
              <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: 136, fontSize: 10.5, color: "var(--text-s)", fontWeight: 500, paddingRight: 4, width: 32 }}>
                {WEEKDAYS_SHORT.map((day, i) => (
                  <div key={i} style={{ height: 16, display: "flex", alignItems: "center" }}>{day}</div>
                ))}
              </div>

              {/* Heatmap Grid Array */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
                {heatmapMatrix.map((row, d) => (
                  <div key={d} style={{ display: "flex", gap: 4, height: 16 }}>
                    {row.map((count, h) => {
                      const opacity = heatmapMax > 0 ? (count / heatmapMax) * 0.9 + (count > 0 ? 0.1 : 0) : 0;
                      const hasCount = count > 0;
                      return (
                        <div
                          key={h}
                          onMouseEnter={() => setHoveredCell({ day: d, hour: h, count })}
                          onMouseLeave={() => setHoveredCell(null)}
                          style={{
                            flex: 1,
                            borderRadius: 3,
                            background: hasCount ? `rgba(196, 30, 30, ${opacity})` : "rgba(15,15,15,0.03)",
                            border: `1px solid ${hasCount ? "rgba(196,30,30,0.15)" : "transparent"}`,
                            cursor: "pointer",
                            transition: "all 0.1s ease",
                            transform: hoveredCell?.day === d && hoveredCell?.hour === h ? "scale(1.25)" : "none",
                            boxShadow: hoveredCell?.day === d && hoveredCell?.hour === h ? "0 0 6px rgba(196,30,30,0.3)" : "none",
                            zIndex: hoveredCell?.day === d && hoveredCell?.hour === h ? 5 : 1,
                          }}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Time Labels Row */}
            <div style={{ display: "flex", fontSize: 9.5, color: "var(--text-m)", fontWeight: 700, paddingLeft: 40, justifyContent: "space-between", letterSpacing: "0.03em" }}>
              <span>12 AM</span>
              <span>6 AM</span>
              <span>12 PM</span>
              <span>6 PM</span>
              <span>11 PM</span>
            </div>

            {/* Dynamic Cell Inspector Bar */}
            <div style={{
              background: "var(--bg-s)",
              padding: "10px 14px",
              borderRadius: "var(--r-sm)",
              border: "1px solid var(--border)",
              marginTop: 6,
              minHeight: 38,
              display: "flex",
              alignItems: "center"
            }}>
              <div style={{
                minHeight: 20,
                fontSize: 12.5,
                color: "var(--text-s)",
                fontStyle: hoveredCell ? "normal" : "italic",
                display: "flex",
                alignItems: "center",
                gap: 8,
                width: "100%"
              }}>
                {hoveredCell ? (
                  <>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: hoveredCell.count > 0 ? "var(--accent)" : "var(--text-m)", display: "inline-block" }} />
                    <span style={{ color: "var(--text)" }}>
                      <strong>{WEEKDAYS[hoveredCell.day]}s</strong> at <strong>{formatHour(hoveredCell.hour)}</strong>: <strong>{hoveredCell.count} query{hoveredCell.count === 1 ? "" : "ies"}</strong> logged.
                    </span>
                  </>
                ) : (
                  <>
                    <Icon name="info" size={13} style={{ color: "var(--text-m)" }} />
                    <span>Hover over cells in the grid to analyze hourly search metrics.</span>
                  </>
                )}
              </div>
            </div>

            {/* Recommended Sync Window Callout */}
            <div style={{
              background: "rgba(26, 122, 74, 0.05)",
              border: "1px solid rgba(26, 122, 74, 0.15)",
              padding: "12px 14px",
              borderRadius: "var(--r-sm)",
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
              marginTop: 10
            }}>
              <div style={{
                width: 24,
                height: 24,
                borderRadius: "50%",
                background: "rgba(26, 122, 74, 0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                marginTop: 1
              }}>
                <Icon name="schedule" size={13} style={{ color: "var(--success)" }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--success)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 3 }}>Recommended Sync Window</div>
                <div style={{ fontSize: 12.5, color: "var(--text-s)", lineHeight: 1.5, fontWeight: 300 }}>
                  Based on member search activity, your server is quietest between <strong style={{ color: "var(--text)", fontWeight: 600 }}>{startHourStr}</strong> and <strong style={{ color: "var(--text)", fontWeight: 600 }}>{endHourStr}</strong> (local time). We recommend scheduling document uploads, crawls, or sync updates during this window to minimize user impact.
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Channel Analytics Table */}
      {aggregatedChannelStats.length > 0 && (
        <Card pad="0" style={{ overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", fontFamily: "'Outfit', sans-serif" }}>Channel Activity & Query Distribution</h3>
              <p style={{ fontSize: 12, color: "var(--text-s)" }}>Overview of channels where messages and queries are being processed</p>
            </div>
            <Tag variant="neutral">{activeChannelsCount} active channels</Tag>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table className="data-table no-lines">
              <thead>
                <tr>
                  <th style={{ width: 220 }}>Channel ID / Name</th>
                  <th style={{ textAlign: "right" }}>Total Queries</th>
                  <th style={{ textAlign: "right" }}>Answered Questions</th>
                  <th style={{ textAlign: "right" }}>Unique Users Served</th>
                  <th style={{ textAlign: "right", paddingRight: 24 }}>Avg Latency</th>
                </tr>
              </thead>
              <tbody>
                {aggregatedChannelStats.map((stat, i) => {
                  const latency = Number(stat.avg_latency_ms || 0);
                  const isLatencyFast = latency < 800;
                  return (
                    <tr key={i}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <Icon name="tag" size={14} style={{ color: "var(--accent)" }} />
                          <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, fontWeight: 600, color: "var(--text)" }}>
                            {channelNames[stat.channel_id] ? `#${channelNames[stat.channel_id]}` : stat.channel_id}
                          </span>
                        </div>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{stat.total_questions}</span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--success)" }}>{stat.answered_questions}</span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <span style={{ fontSize: 13, color: "var(--text-s)" }}>{stat.unique_users}</span>
                      </td>
                      <td style={{ textAlign: "right", paddingRight: 24 }}>
                        <span
                          style={{
                            fontFamily: "'DM Mono', monospace",
                            fontSize: 12.5,
                            fontWeight: 600,
                            color: isLatencyFast ? "var(--success)" : "var(--warning)",
                            background: isLatencyFast ? "rgba(26,122,74,0.06)" : "rgba(179,92,0,0.06)",
                            padding: "3px 8px",
                            borderRadius: 4,
                            border: `1px solid ${isLatencyFast ? "rgba(26,122,74,0.15)" : "rgba(179,92,0,0.15)"}`,
                          }}
                        >
                          {latency ? `${(latency / 1000).toFixed(2)} s` : "—"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Recent Activity Table */}
      <Card pad="0" style={{ overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", fontFamily: "'Outfit', sans-serif" }}>Recent Bot Queries</h3>
            <p style={{ fontSize: 12, color: "var(--text-s)" }}>Chronological list of recent queries asked by server members</p>
          </div>
          <Tag variant="neutral">{totalQuestions} events logged</Tag>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className="data-table no-lines">
            <thead>
              <tr>
                <th style={{ width: 150 }}>User ID</th>
                <th>Channel</th>
                <th>Asked At</th>
                <th>Bot Answered</th>
                <th>Message Link</th>
                <th style={{ textAlign: "right", paddingRight: 24, width: 120 }}>Latency</th>
              </tr>
            </thead>
            <tbody>
              {recentEvents.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "40px 20px", color: "var(--text-s)" }}>
                    No recent events logged.
                  </td>
                </tr>
              ) : (
                recentEvents.slice(0, 15).map((event) => {
                  const hasAnswered = !!event.answered;
                  const latency = Number(event.latency_ms || 0);
                  const isLatencyFast = latency < 800;
                  const askedAtStr = event.asked_at
                    ? new Date(event.asked_at).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "—";

                  const parts = event.message_link ? event.message_link.split("/") : [];
                  const channelId = parts.length > 5 ? parts[5] : "—";

                  return (
                    <tr key={event.id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <Icon name="person" size={14} style={{ color: "var(--text-m)" }} />
                          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "var(--text)" }}>
                            {event.user_id}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <Icon name="tag" size={14} style={{ color: "var(--text-m)" }} />
                          <span style={{ fontSize: 13, color: "var(--text)" }}>
                            {channelNames[channelId] ? `#${channelNames[channelId]}` : channelId}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: 13, color: "var(--text-s)" }}>{askedAtStr}</span>
                      </td>
                      <td>
                        {hasAnswered ? (
                          <Tag variant="success">Answered</Tag>
                        ) : (
                          <Tag variant="error">Unanswered</Tag>
                        )}
                      </td>
                      <td>
                        {event.message_link && !event.message_link.includes("111111111111111111") ? (
                          <a 
                            href={event.message_link} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "var(--accent)", textDecoration: "none", fontWeight: 600, fontSize: 12.5 }}
                            onMouseEnter={e => e.currentTarget.style.textDecoration = "underline"}
                            onMouseLeave={e => e.currentTarget.style.textDecoration = "none"}
                          >
                            <Icon name="open_in_new" size={14} /> Jump to Msg
                          </a>
                        ) : (
                          <span style={{ color: "var(--text-m)", fontSize: 13 }}>—</span>
                        )}
                      </td>
                      <td style={{ textAlign: "right", paddingRight: 24 }}>
                        <span
                          style={{
                            fontFamily: "'DM Mono', monospace",
                            fontSize: 12.5,
                            fontWeight: 600,
                            color: isLatencyFast ? "var(--success)" : "var(--warning)",
                            background: isLatencyFast ? "rgba(26,122,74,0.06)" : "rgba(179,92,0,0.06)",
                            padding: "3px 8px",
                            borderRadius: 4,
                            border: `1px solid ${isLatencyFast ? "rgba(26,122,74,0.15)" : "rgba(179,92,0,0.15)"}`,
                          }}
                        >
                          {latency ? `${(latency / 1000).toFixed(2)} s` : "—"}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
