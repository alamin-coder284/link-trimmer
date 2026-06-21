import React, { useState, useEffect } from "react";
// Core React Component Wrapper
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import {
  faTerminal,
  faArrowUpRightFromSquare,
  faChartLine,
  faCircleCheck,
  faCodeCommit,
  faFileLines,
} from "@fortawesome/free-solid-svg-icons";

import { faCopy, faTrashCan } from "@fortawesome/free-regular-svg-icons";

export default function LinksDashboard({ links, setLinks,isLoading }) {
  const [copiedId, setCopiedId] = useState(null);
  const STORAGE_KEY = "link_trimmer_urls";
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
  return (
    <section id="dashboard-section" className="py-12 px-6 max-w-4xl mx-auto">
      <div className="bg-black/90 border border-gray-800 rounded-xl shadow-2xl overflow-hidden backdrop-blur-md">
        {/* Header Component */}
        <div className="bg-gradient-to-r from-gray-950 to-black border-b border-gray-800 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            {/* Native SVG Render via npm */}
            <FontAwesomeIcon
              icon={faTerminal}
              className="text-gray-500 text-xs"
            />
            <h3 className="font-bold text-white text-sm tracking-tight font-mono">
              active_redirects<span className="text-[#CB3837]">.log</span>
            </h3>
            <span className="bg-[#CB3837]/10 text-[#CB3837] border border-[#CB3837]/30 font-mono text-xs px-2 py-0.5 rounded-full font-bold">
              {isLoading ? "..." : links.length}
            </span>
          </div>
          <p className="text-xs text-gray-500 font-mono">
            {isLoading ? "..." : "localStorage sync: enabled"}
          </p>
        </div>

        {/* Links Map Grid */}
 <div className="divide-y divide-gray-900">
          {/* Loading Skeleton */}
          {isLoading && (
            <>
              {[1, 2, 3].map((n) => (
                <div key={n} className="p-5 sm:p-6 animate-pulse">
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-800 rounded w-48"></div>
                    <div className="h-3 bg-gray-800 rounded w-72"></div>
                  </div>
                </div>
              ))}
            </>
          )}
          {links.length === 0 ? (
            <div className="p-16 text-center text-gray-500 text-sm font-mono">
              <FontAwesomeIcon
                icon={faCodeCommit}
                className="text-2xl block mb-3 text-gray-700 mx-auto"
              />
              <span>No trimmed paths committed yet. Paste a link above.</span>
            </div>
          ) : (
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
                        href={link.short_code}
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
                        <strong>{link.clicks}</strong> hits
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
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
