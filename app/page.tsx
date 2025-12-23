"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";

interface Feed {
  id: number;
  startTime: string;
  amountMl: number | null;
  notes: string | null;
  feedType: {
    name: string;
  };
}

interface Baby {
  id: number;
  name: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function Home() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [customTime, setCustomTime] = useState(() => {
    const now = new Date();
    return now.toTimeString().slice(0, 5);
  });
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [milkAmount, setMilkAmount] = useState(150);
  const [newBabyName, setNewBabyName] = useState("");
  const [showNewBabyForm, setShowNewBabyForm] = useState(false);
  const [editingBabyId, setEditingBabyId] = useState<number | null>(null);
  const [editingBabyName, setEditingBabyName] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedBabyId, setSelectedBabyId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"log" | "summary">("summary");

  const toLocalDateString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Fetch feeds with SWR
  const { data: feedsData, mutate: mutateFeedsData } = useSWR(
    `/api/feeds/today?date=${toLocalDateString(selectedDate)}`,
    fetcher,
    { revalidateOnFocus: false },
  );
  const feeds = feedsData?.feeds || [];

  // Fetch babies with SWR
  const { data: babiesData, mutate: mutateBabiesData } = useSWR(
    "/api/babies",
    fetcher,
    { revalidateOnFocus: false },
  );
  const babies = babiesData?.babies || [];

  useEffect(() => {
    if (babies.length > 0 && !selectedBabyId) {
      setSelectedBabyId(babies[0].id);
    }
  }, [babies, selectedBabyId]);

  const createBaby = async () => {
    if (!newBabyName.trim()) return;

    try {
      const response = await fetch("/api/babies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newBabyName }),
      });

      const json = await response.json();
      if (json.success) {
        setNewBabyName("");
        setShowNewBabyForm(false);
        await mutateBabiesData();
        setSelectedBabyId(json.baby.id);
      }
    } catch (error) {
      console.error("Error creating baby:", error);
    }
  };

  const renameBaby = async (babyId: number) => {
    if (!editingBabyName.trim()) return;

    try {
      const response = await fetch("/api/babies/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: babyId, name: editingBabyName }),
      });

      const json = await response.json();
      if (json.success) {
        setEditingBabyId(null);
        setEditingBabyName("");
        await mutateBabiesData();
      }
    } catch (error) {
      console.error("Error renaming baby:", error);
    }
  };

  useEffect(() => {
    if (babies.length > 0 && !selectedBabyId) {
      setSelectedBabyId(babies[0].id);
    }
  }, [babies, selectedBabyId]);

  useEffect(() => {
    const checkMidnight = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      const timeUntilMidnight = tomorrow.getTime() - now.getTime();

      const timeout = setTimeout(() => {
        setSelectedDate(new Date());
      }, timeUntilMidnight);

      return () => clearTimeout(timeout);
    };

    return checkMidnight();
  }, []);

  const handleAddFeed = async (feedType: string) => {
    if (loading) return;

    setLoading(true);
    try {
      const feedTime = customTime
        ? new Date(`${toLocalDateString(selectedDate)}T${customTime}`)
        : new Date();
      // Use milkAmount for Milk feeds, null for other feeds
      const amountValue = feedType === "Milk" ? milkAmount : null;

      const response = await fetch("/api/feeds/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          feedType,
          customTime: feedTime.toISOString(),
          amountMl: amountValue,
        }),
      });

      const json = await response.json();
      if (json.success) {
        await mutateFeedsData();
        // Reset time to NOW after adding
        const now = new Date();
        setCustomTime(now.toTimeString().slice(0, 5));
      }
    } catch (error) {
      console.error("Error adding feed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFeed = async (feedId: number) => {
    if (!confirm("Delete this entry?")) return;

    try {
      const response = await fetch(`/api/feeds/delete?id=${feedId}`, {
        method: "DELETE",
      });

      const json = await response.json();
      if (json.success) {
        await mutateFeedsData();
      }
    } catch (error) {
      console.error("Error deleting feed:", error);
    }
  };

  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getTimeSince = (dateString: string) => {
    const now = new Date();
    const past = new Date(dateString);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 0) return "future";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    const remainingMins = diffMins % 60;
    if (diffHours < 24) return `${diffHours}h ${remainingMins}m ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const formatDateDisplay = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);

    if (compareDate.getTime() === today.getTime()) return "Today";

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (compareDate.getTime() === yesterday.getTime()) return "Yesterday";

    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const isToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const compare = new Date(selectedDate);
    compare.setHours(0, 0, 0, 0);
    return compare.getTime() === today.getTime();
  };

  const handleTimeChange = (hours: number, minutes: number) => {
    const h = String(hours).padStart(2, "0");
    const m = String(minutes).padStart(2, "0");
    setCustomTime(`${h}:${m}`);
  };

  return (
    <main
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        width: "100%",
        backgroundColor: "#f8f9fa",
      }}
    >
      <style>{`
        @media (max-width: 768px) {
          .button-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
      {/* Header with Date Navigation */}
      <div
        style={{
          padding: "1.5rem 2rem 0",
          // borderBottom: '2px solid #e0e0e0',
          backgroundColor: "#fff",
          boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "0.75rem",
            maxWidth: "1200px",
            margin: "0 auto 0.75rem auto",
          }}
        >
          <h1 style={{ margin: 0, fontSize: "1.75rem", color: "#333" }}>
            BabyBot
          </h1>
          {!isToday() && (
            <button
              onClick={() => setSelectedDate(new Date())}
              style={{
                padding: "0.5rem 1rem",
                fontSize: "0.85rem",
                color: "#4a90e2",
                backgroundColor: "#e8f4fd",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "600",
              }}
            >
              Today
            </button>
          )}
        </div>

        {/* Date Navigator */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0",
            maxWidth: "1200px",
            margin: "0 auto",
          }}
        >
          <button
            onClick={() => changeDate(-1)}
            style={{
              padding: "1.25rem 1.5rem",
              fontSize: "2rem",
              color: "#333",
              backgroundColor: "#f8f9fa",
              border: "1px solid #e0e0e0",
              borderLeft: "1px solid #e0e0e0",
              borderRadius: "12px 0 0 12px",
              cursor: "pointer",
              fontWeight: "bold",
              height: "60px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ‹
          </button>

          <input
            type="date"
            value={toLocalDateString(selectedDate)}
            onChange={(e) => setSelectedDate(new Date(e.target.value))}
            style={{
              padding: "1.25rem 1.5rem",
              fontSize: "1.1rem",
              border: "1px solid #e0e0e0",
              borderRadius: "0",
              minWidth: "200px",
              height: "60px",
              boxSizing: "border-box",
            }}
          />

          <button
            onClick={() => changeDate(1)}
            style={{
              padding: "1.25rem 1.5rem",
              fontSize: "2rem",
              color: "#333",
              backgroundColor: "#f8f9fa",
              border: "1px solid #e0e0e0",
              borderLeft: "none",
              borderRadius: "0 12px 12px 0",
              cursor: "pointer",
              fontWeight: "bold",
              height: "60px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ›
          </button>
        </div>
        {/* Baby Selector Tab View */}
        <div
          style={{
            backgroundColor: "#fff",
          }}
        >
          <div
            style={{
              maxWidth: "1200px",
              margin: "0 auto",
              display: "flex",
              alignItems: "center",
              overflow: "auto",
            }}
          >
            {babies.map((baby: Baby) => (
              <div
                key={baby.id}
                style={{ position: "relative", flex: "shrink" }}
              >
                {editingBabyId === baby.id ? (
                  <input
                    autoFocus
                    type="text"
                    value={editingBabyName}
                    onChange={(e) => setEditingBabyName(e.target.value)}
                    onBlur={() => renameBaby(baby.id)}
                    onKeyPress={(e) => e.key === "Enter" && renameBaby(baby.id)}
                    style={{
                      padding: "1rem 1.5rem",
                      backgroundColor: "#fff",
                      border: "2px solid #4a90e2",
                      borderBottom: "none",
                      fontSize: "0.95rem",
                      fontWeight: "600",
                    }}
                  />
                ) : (
                  <div
                    onMouseEnter={(e) => {
                      const icon = e.currentTarget.querySelector(
                        "[data-edit-icon]",
                      ) as HTMLElement;
                      if (icon) icon.style.opacity = "1";
                    }}
                    onMouseLeave={(e) => {
                      const icon = e.currentTarget.querySelector(
                        "[data-edit-icon]",
                      ) as HTMLElement;
                      if (icon) icon.style.opacity = "0";
                    }}
                    style={{
                      position: "relative",
                    }}
                  >
                    <button
                      onClick={() => setSelectedBabyId(baby.id)}
                      style={{
                        padding: "1rem 1.5rem",
                        backgroundColor:
                          selectedBabyId === baby.id ? "#fff" : "#f5f5f5",
                        color: selectedBabyId === baby.id ? "#4a90e2" : "#666",
                        border: "none",
                        borderBottom:
                          selectedBabyId === baby.id
                            ? "3px solid #4a90e2"
                            : "3px solid transparent",
                        cursor: "pointer",
                        fontSize: "0.95rem",
                        fontWeight: selectedBabyId === baby.id ? "600" : "500",
                        whiteSpace: "nowrap",
                        transition: "all 0.2s",
                        paddingRight: "2.5rem",
                      }}
                    >
                      {baby.name}
                    </button>
                    <button
                      data-edit-icon
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingBabyId(baby.id);
                        setEditingBabyName(baby.name);
                      }}
                      style={{
                        position: "absolute",
                        right: "0.5rem",
                        top: "50%",
                        transform: "translateY(-50%)",
                        padding: "0.25rem",
                        backgroundColor: "transparent",
                        color: "#4a90e2",
                        border: "none",
                        cursor: "pointer",
                        fontSize: "1rem",
                        opacity: 0,
                        transition: "opacity 0.2s",
                      }}
                    >
                      ✏️
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "2rem",
          backgroundColor: "#f8f9fa",
        }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          {/* View Mode Toggle */}
          <div
            style={{
              display: "flex",
              gap: "0.5rem",
              marginBottom: "2rem",
              justifyContent: "center",
            }}
          >
            <button
              onClick={() => setViewMode("summary")}
              style={{
                padding: "0.75rem 1.5rem",
                backgroundColor: viewMode === "summary" ? "#4a90e2" : "#e8f4fd",
                color: viewMode === "summary" ? "#fff" : "#4a90e2",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "0.95rem",
              }}
            >
              Summary
            </button>
            <button
              onClick={() => setViewMode("log")}
              style={{
                padding: "0.75rem 1.5rem",
                backgroundColor: viewMode === "log" ? "#4a90e2" : "#e8f4fd",
                color: viewMode === "log" ? "#fff" : "#4a90e2",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "0.95rem",
              }}
            >
              Log
            </button>
          </div>

          {viewMode === "log" ? (
            // Log View
            feeds.length === 0 ? (
              <p
                style={{
                  textAlign: "center",
                  color: "#999",
                  marginTop: "2rem",
                  fontSize: "1.1rem",
                }}
              >
                No events on this day
              </p>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                }}
              >
                {feeds.map((feed: Feed) => (
                  <div
                    key={feed.id}
                    style={{
                      padding: "1.25rem",
                      backgroundColor: "#fff",
                      border: "1px solid #e0e0e0",
                      borderRadius: "12px",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                      position: "relative",
                    }}
                  >
                    <button
                      onClick={() => handleDeleteFeed(feed.id)}
                      style={{
                        position: "absolute",
                        top: "0.75rem",
                        right: "0.75rem",
                        padding: "0.25rem 0.5rem",
                        fontSize: "0.85rem",
                        color: "#dc3545",
                        backgroundColor: "transparent",
                        border: "0px solid #dc3545",
                        borderRadius: "4px",
                        cursor: "pointer",
                        opacity: 0.7,
                        transition: "opacity 0.2s",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.opacity = "1")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.opacity = "0.7")
                      }
                    >
                      ❌
                    </button>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: "0.5rem",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.75rem",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "2rem",
                          }}
                        >
                          {feed.feedType.name === "Milk" ? "🍼" : "🍽️"}
                        </div>
                        <div>
                          <div
                            style={{
                              fontSize: "1.2rem",
                              fontWeight: "600",
                              color: "#333",
                            }}
                          >
                            {feed.feedType.name}
                          </div>
                          {feed.feedType.name === "Milk" &&
                            typeof feed.amountMl === "number" && (
                              <div
                                style={{
                                  fontSize: "1rem",
                                  color: "#4a90e2",
                                  marginTop: "0.15rem",
                                  fontWeight: 600,
                                }}
                              >
                                {Math.round(feed.amountMl)} ml
                              </div>
                            )}
                          <div
                            style={{
                              fontSize: "1rem",
                              color: "#666",
                              marginTop: "0.15rem",
                            }}
                          >
                            {formatTime(feed.startTime)}
                          </div>
                        </div>
                      </div>
                    </div>
                    {isToday() && (
                      <div
                        style={{
                          fontSize: "0.9rem",
                          color: "#999",
                          marginTop: "0.5rem",
                        }}
                      >
                        {getTimeSince(feed.startTime)}
                      </div>
                    )}
                    {feed.notes && (
                      <div
                        style={{
                          marginTop: "0.5rem",
                          fontSize: "0.95rem",
                          color: "#666",
                        }}
                      >
                        {feed.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )
          ) : (
            // Summary View
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "2rem",
                maxWidth: "600px",
                margin: "3rem auto",
              }}
            >
              <div
                style={{
                  padding: "2rem",
                  backgroundColor: "#fff",
                  border: "2px solid #4a90e2",
                  borderRadius: "12px",
                  textAlign: "center",
                  boxShadow: "0 2px 8px rgba(74,144,226,0.1)",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div>
                  <div style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>
                    🍼
                  </div>
                  <div
                    style={{
                      fontSize: "2.5rem",
                      fontWeight: "700",
                      color: "#4a90e2",
                      marginBottom: "0.5rem",
                    }}
                  >
                    {
                      feeds.filter((f: Feed) => f.feedType.name === "Milk")
                        .length
                    }
                  </div>
                  <div
                    style={{
                      fontSize: "1rem",
                      color: "#666",
                      fontWeight: "600",
                    }}
                  >
                    Milk Feeds
                  </div>
                  <div
                    style={{
                      fontSize: "0.9rem",
                      color: "#999",
                      marginTop: "1rem",
                      marginBottom: "1rem",
                    }}
                  >
                    Total:{" "}
                    {Math.round(
                      feeds
                        .filter((f: Feed) => f.feedType.name === "Milk")
                        .reduce(
                          (sum: number, f: Feed) => sum + (f.amountMl || 0),
                          0,
                        ),
                    )}{" "}
                    ml
                  </div>
                </div>
                <div
                  style={{
                    fontSize: "0.85rem",
                    color: "#999",
                    marginTop: "auto",
                    paddingTop: "1rem",
                    borderTop: "1px solid #eee",
                  }}
                >
                  Last:{" "}
                  {feeds.filter((f: Feed) => f.feedType.name === "Milk")
                    .length > 0
                    ? formatTime(
                        feeds
                          .filter((f: Feed) => f.feedType.name === "Milk")
                          .sort(
                            (a: Feed, b: Feed) =>
                              new Date(b.startTime).getTime() -
                              new Date(a.startTime).getTime(),
                          )[0].startTime,
                      )
                    : "—"}
                </div>
              </div>

              <div
                style={{
                  padding: "2rem",
                  backgroundColor: "#fff",
                  border: "2px solid #f39c12",
                  borderRadius: "12px",
                  textAlign: "center",
                  boxShadow: "0 2px 8px rgba(243,156,18,0.1)",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div>
                  <div style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>
                    🍽️
                  </div>
                  <div
                    style={{
                      fontSize: "2.5rem",
                      fontWeight: "700",
                      color: "#f39c12",
                      marginBottom: "0.5rem",
                    }}
                  >
                    {
                      feeds.filter((f: Feed) => f.feedType.name === "Feed")
                        .length
                    }
                  </div>
                  <div
                    style={{
                      fontSize: "1rem",
                      color: "#666",
                      fontWeight: "600",
                    }}
                  >
                    Meal Feeds
                  </div>
                </div>
                <div
                  style={{
                    fontSize: "0.85rem",
                    color: "#999",
                    marginTop: "auto",
                    paddingTop: "1rem",
                    borderTop: "1px solid #eee",
                  }}
                >
                  Last:{" "}
                  {feeds.filter((f: Feed) => f.feedType.name === "Feed")
                    .length > 0
                    ? formatTime(
                        feeds
                          .filter((f: Feed) => f.feedType.name === "Feed")
                          .sort(
                            (a: Feed, b: Feed) =>
                              new Date(b.startTime).getTime() -
                              new Date(a.startTime).getTime(),
                          )[0].startTime,
                      )
                    : "—"}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div
        style={{
          padding: "1.5rem 2rem",
          borderTop: "2px solid #e0e0e0",
          backgroundColor: "#fff",
          boxShadow: "0 -2px 4px rgba(0,0,0,0.05)",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
          }}
        >
          {/* Time & Amount Picker Toggles */}
          <div style={{ marginBottom: "1rem" }}>
            <button
              onClick={() => setShowTimePicker(!showTimePicker)}
              style={{
                padding: "0.75rem 1.5rem",
                backgroundColor: showTimePicker ? "#4a90e2" : "#e8f4fd",
                color: showTimePicker ? "#fff" : "#4a90e2",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "1rem",
                width: "100%",
              }}
            >
              {showTimePicker ? "✓ Hide Time Picker" : "⏰ Show Time Picker"}
            </button>
          </div>

          {/* Native Time Picker */}
          {showTimePicker && (
            <div
              style={{
                marginBottom: "1.5rem",
              }}
            >
              <label
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  fontSize: "0.95rem",
                  fontWeight: "600",
                  color: "#333",
                }}
              >
                Time:
              </label>
              <input
                type="time"
                value={customTime}
                onChange={(e) => setCustomTime(e.target.value)}
                style={{
                  padding: "0.75rem",
                  fontSize: "1.1rem",
                  border: "2px solid #4a90e2",
                  borderRadius: "8px",
                  cursor: "pointer",
                }}
              />
            </div>
          )}

          {/* Log Buttons */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "1.5rem",
            }}
            className="button-grid"
          >
            {/* Milk Button with Amount Controls */}
            <div
              style={{
                display: "flex",
                gap: "0.5rem",
              }}
              className="milk-controls"
            >
              <button
                onClick={() => setMilkAmount((prev) => Math.max(10, prev - 10))}
                disabled={loading}
                style={{
                  padding: "2rem 1.5rem",
                  fontSize: "1.5rem",
                  fontWeight: "600",
                  color: "#fff",
                  backgroundColor: loading ? "#f5a5a5" : "#dc3545",
                  border: "none",
                  borderRadius: "12px",
                  cursor: loading ? "not-allowed" : "pointer",
                  boxShadow: "0 2px 8px rgba(220,53,69,0.3)",
                  transition: "all 0.1s",
                  flex: "0 0 auto",
                }}
                onMouseDown={(e) => {
                  if (!loading) {
                    e.currentTarget.style.transform = "scale(0.95)";
                    e.currentTarget.style.boxShadow =
                      "0 1px 4px rgba(220,53,69,0.3)";
                  }
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow =
                    "0 2px 8px rgba(220,53,69,0.3)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow =
                    "0 2px 8px rgba(220,53,69,0.3)";
                }}
              >
                −
              </button>
              <button
                onClick={() => handleAddFeed("Milk")}
                disabled={loading}
                style={{
                  padding: "2rem",
                  fontSize: "1.2rem",
                  fontWeight: "600",
                  color: "#fff",
                  backgroundColor: loading ? "#a0c4e8" : "#4a90e2",
                  border: "none",
                  borderRadius: "12px",
                  cursor: loading ? "not-allowed" : "pointer",
                  boxShadow: "0 2px 8px rgba(74,144,226,0.3)",
                  transition: "all 0.1s",
                  flex: "1",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "0.25rem",
                }}
                onMouseDown={(e) => {
                  if (!loading) {
                    e.currentTarget.style.transform = "scale(0.95)";
                    e.currentTarget.style.boxShadow =
                      "0 1px 4px rgba(74,144,226,0.3)";
                  }
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow =
                    "0 2px 8px rgba(74,144,226,0.3)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow =
                    "0 2px 8px rgba(74,144,226,0.3)";
                }}
              >
                <span style={{ fontSize: "1.5rem" }}>🍼</span>
                <span>Log Milk</span>
                <span style={{ fontSize: "1rem", opacity: 0.9 }}>
                  ({milkAmount}ml)
                </span>
              </button>
              <button
                onClick={() => setMilkAmount((prev) => prev + 10)}
                disabled={loading}
                style={{
                  padding: "2rem 1.5rem",
                  fontSize: "1.5rem",
                  fontWeight: "600",
                  color: "#fff",
                  backgroundColor: loading ? "#a8d5a8" : "#28a745",
                  border: "none",
                  borderRadius: "12px",
                  cursor: loading ? "not-allowed" : "pointer",
                  boxShadow: "0 2px 8px rgba(40,167,69,0.3)",
                  transition: "all 0.1s",
                  flex: "0 0 auto",
                }}
                onMouseDown={(e) => {
                  if (!loading) {
                    e.currentTarget.style.transform = "scale(0.95)";
                    e.currentTarget.style.boxShadow =
                      "0 1px 4px rgba(40,167,69,0.3)";
                  }
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow =
                    "0 2px 8px rgba(40,167,69,0.3)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow =
                    "0 2px 8px rgba(40,167,69,0.3)";
                }}
              >
                +
              </button>
            </div>
            <button
              onClick={() => handleAddFeed("Feed")}
              disabled={loading}
              style={{
                padding: "2rem",
                fontSize: "1.5rem",
                fontWeight: "600",
                color: "#fff",
                backgroundColor: loading ? "#f5c97d" : "#f39c12",
                border: "none",
                borderRadius: "12px",
                cursor: loading ? "not-allowed" : "pointer",
                boxShadow: "0 2px 8px rgba(243,156,18,0.3)",
                transition: "all 0.1s",
              }}
              onMouseDown={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = "scale(0.95)";
                  e.currentTarget.style.boxShadow =
                    "0 1px 4px rgba(243,156,18,0.3)";
                }
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.boxShadow =
                  "0 2px 8px rgba(243,156,18,0.3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.boxShadow =
                  "0 2px 8px rgba(243,156,18,0.3)";
              }}
            >
              🍽️ Log Feed
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
