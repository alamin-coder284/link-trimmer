import React, { useState, useEffect, Fragment } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import {
  faTerminal,
  faArrowUpRightFromSquare,
  faChartLine,
  faCircleCheck,
  faCodeCommit,
  faFileLines,
  faLock,
  faClock,
} from "@fortawesome/free-solid-svg-icons";

import { faCopy, faTrashCan } from "@fortawesome/free-regular-svg-icons";

export default function LinksDashboard({ links, setLinks, isLoading }) {
  const [redisStatus, setRedisStatus] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [analyticsData, setAnalyticsData] = useState({});
  const [loadingAnalytics, setLoadingAnalytics] = useState(null);
  const STORAGE_KEY = "link_trimmer_urls";

  //utility f() for expiration date
  const getTimeLeft = (expiresAt) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires - now;

    if (diff <= 0) return "Expired";

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Less than a minute left";
    if (minutes < 60) return `${minutes} min left`;
    if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} left`;
    return `${days} day${days > 1 ? "s" : ""} left`;
  };

  const fetchAnalytics = async (shortCode, linkId) => {
    setLoadingAnalytics(linkId);
    try {
      const res = await fetch(
        `https://zip9-trimmer.onrender.com/api/analytics/${shortCode}`,
      );
      if (res.ok) {
        const data = await res.json();
        setAnalyticsData((prev) => ({ ...prev, [linkId]: data }));
      }
    } catch (err) {
      console.log("Analytics fetch failed:", err);
    } finally {
      setLoadingAnalytics(null);
    }
  };

  const toggleAnalytics = (shortCode, linkId) => {
    if (expandedId === linkId) {
      setExpandedId(null);
    } else {
      setExpandedId(linkId);
      if (!analyticsData[linkId]) {
        fetchAnalytics(shortCode, linkId);
      }
    }
  };

  const handleCopy = async (text, id) => {
    try {
      await navigator.clipboard.writeText("http://zip9.gt.tc/" + text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const handleDelete = (id) => {
    const updatedLinks = links.filter(
      (link) => link._id !== id && link.id !== id,
    );
    setLinks(updatedLinks);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedLinks));
  };

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch("https://zip9-trimmer.onrender.com/api/status");
        const data = await res.json();
        setRedisStatus(data.redis);
      } catch {
        setRedisStatus("unknown");
      }
    };
    checkStatus();
  }, []);

  return (
    <section id="dashboard-section" className="py-12 max-w-4xl mx-auto">
      <div className="bg-black/90 border border-gray-800 rounded-xl shadow-2xl overflow-hidden backdrop-blur-md">
        {/* Header Component */}
        <div className="bg-gradient-to-r from-gray-950 to-black border-b border-gray-800 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <FontAwesomeIcon
              icon={faTerminal}
              className="text-gray-500 text-xs"
            />
            <h3 className="font-bold text-white text-sm tracking-tight font-mono">
              active_redirects<span className="text-[#CB3837]">.log</span>
            </h3>
            <span className="bg-[#CB3837]/10 text-[#CB3837] border border-[#CB3837]/30 font-mono text-xs px-2 py-0.5 rounded-full font-bold">
              {isLoading ? "..." : links.filter((l) => l.short_code).length}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {/* Redis Status */}
            {redisStatus && (
              <div className="flex items-center gap-1.5">
                <span
                  className={`inline-block w-2 h-2 rounded-full ${
                    redisStatus === "connected"
                      ? "bg-emerald-400 animate-pulse"
                      : redisStatus === "unknown"
                        ? "bg-yellow-400"
                        : "bg-red-400"
                  }`}
                ></span>
                <span className="text-xs font-mono text-gray-500 whitespace-nowrap">
                  {redisStatus === "connected"
                    ? "Redis online"
                    : redisStatus === "unknown"
                      ? "Redis checking..."
                      : "Redis offline"}
                </span>
              </div>
            )}

            {/* Rate limit badge */}
            {redisStatus === "connected" && (
              <div className="flex items-center gap-1.5 text-xs font-mono text-gray-500 whitespace-nowrap">
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" />
                </svg>
                <span>Rate limited</span>
              </div>
            )}
          </div>
        </div>

        {/* Links Map Grid */}
        <div className="divide-y divide-gray-900">
          {/* Loading Skeleton */}
          {isLoading && (
            <Fragment>
              {[1, 2, 3].map((n) => (
                <div key={n} className="p-5 sm:p-6 animate-pulse">
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-800 rounded w-48"></div>
                    <div className="h-3 bg-gray-800 rounded w-72"></div>
                  </div>
                </div>
              ))}
            </Fragment>
          )}

          {/* Empty State */}
          {!isLoading && links.length === 0 && (
            <div className="p-16 text-center text-gray-500 text-sm font-mono">
              <FontAwesomeIcon
                icon={faCodeCommit}
                className="text-2xl block mb-3 text-gray-700 mx-auto"
              />
              <span>No trimmed paths committed yet. Paste a link above.</span>
            </div>
          )}

          {/* MongoDB Waking Up */}
          {!isLoading &&
            links.length > 0 &&
            links.some((link) => !link.short_code) && (
              <div className="p-16 text-center text-gray-500 text-sm font-mono">
                <svg
                  className="w-8 h-8 animate-spin text-[#CB3837] mx-auto mb-3"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                <span>Waking up database...</span>
              </div>
            )}

          {/* Valid Links */}
          {!isLoading &&
            links.length > 0 &&
            links.every((link) => link.short_code) &&
            links.map((link) => {
              const linkId = link.id || link._id;
              return (
                <div
                  key={linkId}
                  className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/[0.02] transition duration-150"
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center space-x-2">
                      <FontAwesomeIcon
                        icon={faFileLines}
                        className="text-gray-500 text-xs"
                      />
                      <a
                        href={`https://zip9-trimmer.onrender.com/${link.short_code}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-sm font-bold text-[#CB3837] hover:text-red-400 hover:underline flex items-center gap-1.5 truncate transition-colors"
                      >
                        {"zip9.gt.tc/" + link.short_code}
                        <FontAwesomeIcon
                          icon={faArrowUpRightFromSquare}
                          className="text-[9px] text-gray-500"
                        />
                      </a>
                    </div>
                    <div className="text-xs text-gray-400 font-mono truncate max-w-md pl-5">
                      <span className="text-gray-600">→</span>{" "}
                      {link.original_url}
                      {link.password && (
                        <span
                          className="text-gray-500 text-xs ml-2"
                          title="Password protected"
                        >
                          <FontAwesomeIcon
                            icon={faLock}
                            className="text-gray-500 text-[10px]"
                          />

                          <span className="text-gray-600 text-xs ml-2">
                            {link.expiresAt &&
                            !isNaN(new Date(link.expiresAt).getTime()) ? (
                              `⏳ ${getTimeLeft(link.expiresAt)}`
                            ) : (
                              <Fragment>
                                <FontAwesomeIcon
                                  icon={faClock}
                                  className="text-gray-500 text-[10px]"
                                />
                                {" No Expiry"}
                              </Fragment>
                            )}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Metrics & Controls */}
                  <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-none pt-3 sm:pt-0 border-gray-900">
                    <div className="flex items-center space-x-1.5 text-xs text-gray-300 bg-gray-900 px-3 py-1.5 rounded-md border border-gray-800 font-mono whitespace-nowrap">
                      <FontAwesomeIcon
                        icon={faChartLine}
                        className="text-gray-500 text-[10px]"
                      />
                      <span>
                        <strong>{link.clicks || 0}</strong> hits
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      {/* Copy Button */}
                      <button
                        onClick={() => handleCopy(link.short_code, linkId)}
                        className={`text-xs font-mono font-medium py-1.5 px-3 border rounded-md shadow-sm flex items-center space-x-1.5 transition duration-150 ${
                          copiedId === linkId
                            ? "bg-emerald-950/30 border-emerald-500/50 text-emerald-400"
                            : "bg-black text-white hover:bg-gray-900 border-gray-800 hover:border-gray-700"
                        }`}
                      >
                        <FontAwesomeIcon
                          icon={copiedId === linkId ? faCircleCheck : faCopy}
                          className={
                            copiedId === linkId
                              ? "text-emerald-400"
                              : "text-gray-500"
                          }
                        />
                        <span>{copiedId === linkId ? "Copied!" : "Copy"}</span>
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={() => handleDelete(linkId)}
                        className="bg-black hover:bg-red-950/20 text-gray-500 hover:text-red-500 text-xs py-1.5 px-2.5 border border-gray-800 hover:border-red-900/50 rounded-md transition duration-150"
                        title="Delete Link"
                      >
                        <FontAwesomeIcon icon={faTrashCan} />
                      </button>
                      {/* Analytics Button */}
                      <button
                        onClick={() => toggleAnalytics(link.short_code, linkId)}
                        className={`text-xs py-1.5 px-2.5 border rounded-md transition duration-150 ${
                          expandedId === linkId
                            ? "bg-[#CB3837]/10 border-[#CB3837]/50 text-[#CB3837]"
                            : "bg-black text-gray-500 hover:text-gray-300 border-gray-800 hover:border-gray-700"
                        }`}
                        title="Analytics"
                      >
                        <svg
                          className="w-3.5 h-3.5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                        >
                          <path d="M18 20V10M12 20V4M6 20v-6" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  {/* Analytics Panel */}
                  {expandedId === linkId && (
                    <div className="px-5 sm:px-6 pb-5">
                      <AnalyticsPanel
                        data={analyticsData[linkId]}
                        isLoading={loadingAnalytics === linkId}
                      />
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      </div>
    </section>
  );
}

const AnalyticsPanel = ({ data, isLoading }) => {
  if (isLoading) {
    return (
      <div className="mt-4 pt-4 border-t border-gray-800 animate-pulse">
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="space-y-2">
              <div className="h-3 bg-gray-800 rounded w-16"></div>
              <div className="h-8 bg-gray-800 rounded w-24"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const topCountries = Object.entries(data.countries || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  const topDevices = Object.entries(data.devices || {}).sort(
    (a, b) => b[1] - a[1],
  );

  return (
    <div className="mt-4 pt-4 border-t border-gray-800">
      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
        {/* Total Clicks */}
        <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-800">
          <div className="text-[10px] text-gray-500 font-mono uppercase tracking-wider mb-1">
            Total Clicks
          </div>
          <div className="text-lg font-bold text-white font-mono">
            {data.totalClicks}
          </div>
        </div>

        {/* Countries */}
        <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-800">
          <div className="text-[10px] text-gray-500 font-mono uppercase tracking-wider mb-1">
            Top Countries
          </div>
          <div className="space-y-1">
            {topCountries.length > 0 ? (
              topCountries.map(([country, count]) => (
                <div
                  key={country}
                  className="flex items-center justify-between text-xs"
                >
                  <span className="text-gray-300 font-mono truncate">
                    {getFlag(country)} {country}
                  </span>
                  <span className="text-gray-500 font-mono ml-2">{count}</span>
                </div>
              ))
            ) : (
              <span className="text-gray-500 text-xs font-mono">
                No data yet
              </span>
            )}
          </div>
        </div>

        {/* Devices */}
        <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-800">
          <div className="text-[10px] text-gray-500 font-mono uppercase tracking-wider mb-1">
            Devices
          </div>
          <div className="space-y-1">
            {topDevices.length > 0 ? (
              topDevices.map(([device, count]) => (
                <div
                  key={device}
                  className="flex items-center justify-between text-xs"
                >
                  <span className="text-gray-300 font-mono flex items-center gap-1">
                    {getDeviceIcon(device)} {device}
                  </span>
                  <span className="text-gray-500 font-mono ml-2">{count}</span>
                </div>
              ))
            ) : (
              <span className="text-gray-500 text-xs font-mono">
                No data yet
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      {data.recentActivity && data.recentActivity.length > 0 && (
        <div>
          <div className="text-[10px] text-gray-500 font-mono uppercase tracking-wider mb-2">
            Recent Activity
          </div>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {data.recentActivity.slice(0, 5).map((activity, i) => (
              <div
                key={i}
                className="flex items-center justify-between text-xs bg-gray-900/30 rounded px-2 py-1"
              >
                <div className="flex items-center gap-2 text-gray-400 font-mono">
                  <span>{getFlag(activity.country)}</span>
                  <span>{activity.country}</span>
                  <span className="text-gray-600">·</span>
                  <span>
                    {getDeviceIcon(activity.device)} {activity.device}
                  </span>
                  <span className="text-gray-600">·</span>
                  <span>{activity.browser}</span>
                </div>
                <span className="text-gray-600 font-mono text-[10px]">
                  {new Date(activity.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Helper functions for flags and icons
const getFlag = (country) => {
  const flags = {
    Bangladesh: "🇧🇩",
    "United States": "🇺🇸",
    "United Kingdom": "🇬🇧",
    India: "🇮🇳",
    Germany: "🇩🇪",
    Canada: "🇨🇦",
    France: "🇫🇷",
    "Saudi Arabia": "🇸🇦",
    UAE: "🇦🇪",
    Pakistan: "🇵🇰",
    unknown: "🌍",
  };
  return flags[country] || "🌍";
};

const getDeviceIcon = (device) => {
  const icons = {
    desktop: "💻",
    mobile: "📱",
    tablet: "📋",
    smarttv: "📺",
    unknown: "❓",
  };
  return icons[device] || "❓";
};
