import { useState, useEffect } from "react";
import {
  Scissors,
  Link,
  Bolt,
  Bookmark,
  Gauge,
  ShieldHalf,
  Boxes,
  Send,
} from "lucide-react";

import { FaGithub } from "react-icons/fa";
import LinksDashboard from "./LinksDashboard.jsx";

export default function Main() {
  const [showSuccess, setShowSuccess] = useState(false);
  const [newShortLink, setNewShortLink] = useState("");
  const [isLoadingLinks, setIsLoadingLinks] = useState(false);

  const [isTrimming, setIsTrimming] = useState(false);
  const [trimError, setTrimError] = useState("");
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [rateLimit, setRateLimit] = useState({ remaining: 10, resetIn: 0 });

  const STORAGE_KEY = "link_trimmer_urls";
  const USER_LINKS_FLAG = "user_has_trimmed";
  const [dashboardLinks, setDashboardLinks] = useState(() => {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  });

  const fetchRateLimit = async () => {
    try {
      const res = await fetch(
        "https://zip9-trimmer.onrender.com/api/rate-limit-status",
      );
      if (res.ok) {
        const data = await res.json();
        setRateLimit(data.trim);
      }
    } catch (err) {
      // Silently fail — indicator is bonus, not critical
    }
  };

  useEffect(() => {
    fetchRateLimit();
  }, [dashboardLinks]);

  const syncLinksFromServer = async (linksToSync) => {
    setIsLoadingLinks(true);
    const links =
      linksToSync || JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (links.length === 0) {
      setIsLoadingLinks(false);
      return;
    }

    const codes = links.map((link) => link.short_code).filter(Boolean);

    try {
      const response = await fetch("https://zip9-trimmer.onrender.com/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codes }),
      });

      if (response.ok) {
        const freshData = await response.json();
        setDashboardLinks(freshData);
        localStorage.removeItem(STORAGE_KEY);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(freshData));
      }
    } catch (err) {
      console.log("Sync failed:", err.message);
    } finally {
      setIsLoadingLinks(false);
    }
  };

  useEffect(() => {
    const fetchCommonLinks = async () => {
      setIsLoadingLinks(true);
      try {
        const targetCodes = ["f2KyylN", "25hozRT", "elh12MG"];
        const response = await fetch(
          "https://zip9-trimmer.onrender.com/links",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ codes: targetCodes }),
          },
        );

        if (!response.ok) {
          throw new Error("Failed to fetch links");
        }

        const data = await response.json();
        setDashboardLinks(data);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch (err) {
        console.log(err.message);
      } finally {
        setIsLoadingLinks(false);
      }
    };

    const storedLinks = localStorage.getItem(STORAGE_KEY);
    const userHasTrimmed = localStorage.getItem(USER_LINKS_FLAG);

    if (userHasTrimmed) {
      // User has created links before — load only their links
      if (storedLinks) {
        setDashboardLinks(JSON.parse(storedLinks));
      }
    } else if (storedLinks && storedLinks !== "[]") {
      // Returning visitor who hasn't trimmed — show whatever is stored
      setDashboardLinks(JSON.parse(storedLinks));
    } else {
      // First visit ever — fetch defaults
      fetchCommonLinks();
    }
  }, []);

  useEffect(() => {
    if (dashboardLinks.length > 0) {
      syncLinksFromServer();
    }
  }, []);

  // State for URL Shortener
  const [longUrl, setLongUrl] = useState("");

  // State for Contact Form
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    message: "",
  });

  const handleTrimSubmit = async (e) => {
    e.preventDefault();

    setIsTrimming(true);
    setTrimError("");

    try {
      const res = await fetch("https://zip9-trimmer.onrender.com/api/shorten", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: longUrl }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Something went wrong!");
      }

      if (res.status === 200) {
        setNewShortLink(`zip9.gt.tc/${data.short_code}`);
        setIsDuplicate(true);
        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
          setIsDuplicate(false);
        }, 4000);
        setLongUrl("");
        return; // 🛑 Stop here. No localStorage, no sync, no state update.
      }

      const newLink = data;

      const userHasTrimmed = localStorage.getItem(USER_LINKS_FLAG);
      let updated;

      if (!userHasTrimmed) {
        // First time trimming — replace defaults entirely
        updated = [newLink];
        localStorage.setItem(USER_LINKS_FLAG, "true");
      } else {
        // Already trimmed before — append
        const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
        updated = [...existing, newLink];
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setDashboardLinks(updated);
      syncLinksFromServer(updated);

      // Show success feedback
      setNewShortLink(`zip9.gt.tc/${newLink.short_code}`);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 4000); // Auto-hide after 4s

      fetchRateLimit();
      setLongUrl("");
    } catch (err) {
      setTrimError(err.message || "Something went wrong");
    } finally {
      setIsTrimming(false);
    }
  };

  const handleContactSubmit = (e) => {
    e.preventDefault();
    alert(`Message logged successfully for ${contactForm.name}!`);
    setContactForm({ name: "", email: "", message: "" });
  };

  return (
    <div className="bg-[#f6f8fa] text-[#24292e] font-sans antialiased selection:bg-red-500 selection:text-white min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-black/90 backdrop-blur-md text-white border-b border-gray-800 px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <a
            href="#"
            className="flex items-center space-x-2 font-mono text-xl font-bold tracking-tight hover:text-gray-300 transition"
          >
            <Scissors className="w-5 h-5 text-[#CB3837] transform -rotate-45" />
            <span>
              zip<span className="text-[#CB3837]">_</span>9
            </span>
          </a>

          <nav className="hidden md:flex space-x-8 text-sm font-medium text-gray-400">
            <a
              href="#"
              className="hover:text-white transition-colors duration-200"
            >
              Home
            </a>
            <a
              href="#about"
              className="hover:text-white transition-colors duration-200"
            >
              About
            </a>
            <a
              href="#contact"
              className="hover:text-white transition-colors duration-200"
            >
              Contact
            </a>
          </nav>

          <div className="flex items-center space-x-4">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xl text-gray-400 hover:text-white transition"
            >
              <FaGithub className="w-5 h-5" />
            </a>
            <a
              href="#trim-section"
              className="bg-white text-black text-xs font-semibold px-4 py-2 rounded-md border border-white hover:bg-transparent hover:text-white transition-all duration-200"
            >
              Deploy App
            </a>
          </div>
        </div>
      </header>

      <main>
        {/* Hero / Trim Section */}
        <section
          id="trim-section"
          className="bg-black text-white py-24 px-6 text-center relative overflow-hidden border-b border-gray-900"
        >
          {/* Grid Background Effect */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f1f1f_1px,transparent_1px),linear-gradient(to_bottom,#1f1f1f_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-60"></div>

          <div className="relative max-w-3xl mx-auto space-y-6">
            <span className="inline-flex items-center space-x-2 bg-[#CB3837]/10 text-[#CB3837] text-xs font-mono font-bold px-3 py-1 rounded-full border border-[#CB3837]/30">
              <span className="font-extrabold tracking-tighter text-sm mr-1">
                npm
              </span>
              <span>v1.0.4 stable</span>
            </span>

            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-400">
              Shorten links instantly.
            </h1>
            <p className="text-gray-400 text-lg max-w-xl mx-auto">
              A high-performance, developer-first URL shortener built to handle
              npm-scale traffic with Vercel speed.
            </p>

            <div className="pt-6 max-w-2xl mx-auto">
              <form
                onSubmit={handleTrimSubmit}
                className="flex flex-col sm:flex-row gap-3 bg-[#111] p-2 rounded-xl border border-gray-800 shadow-2xl"
              >
                <div
                  className={`relative flex-grow rounded-lg p-[1.5px] transition-all duration-300 ${
                    isTrimming
                      ? "revolving-border"
                      : trimError
                        ? "bg-red-500/60 shadow-lg shadow-red-500/20"
                        : "bg-transparent"
                  }`}
                >
                  <div
                    className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${
                      trimError ? "text-red-400" : "text-gray-500"
                    }`}
                  >
                    <Link className="w-4 h-4" />
                  </div>
                  <input
                    type="url"
                    required
                    placeholder="Paste your long destination URL here..."
                    value={longUrl}
                    disabled={isTrimming}
                    onFocus={(e) => {
                      if (!longUrl) {
                        setLongUrl("http://");
                        setTimeout(() => {
                          e.target.setSelectionRange(7, 7);
                        }, 0);
                      }
                    }}
                    onChange={(e) => {
                      setLongUrl(e.target.value);
                      if (trimError) setTrimError("");
                    }}
                    className={`w-full pl-10 pr-3 py-3 bg-[#111] rounded-lg text-white placeholder-gray-600 focus:outline-none text-sm font-mono transition-all duration-300 ${
                      trimError ? "ring-2 ring-red-500/30" : ""
                    }`}
                  />

                  {/* Loading spinner inside input */}
                  {isTrimming && (
                    <div className="absolute inset-y-0 right-3 flex items-center">
                      <svg
                        className="w-4 h-4 animate-spin text-[#CB3837]"
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
                    </div>
                  )}

                  {/* Fixed Success Toast */}
                  {showSuccess && (
                    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="bg-emerald-950/60 border border-emerald-500/40 rounded-lg px-5 py-3 flex items-center gap-3 backdrop-blur-md shadow-2xl shadow-emerald-900/20">
                        {/* Animated checkmark */}
                        <div className="relative flex-shrink-0">
                          <svg
                            className="w-5 h-5 text-emerald-400"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                          >
                            <path
                              d="M22 11.08V12a10 10 0 1 1-5.93-9.14"
                              strokeDasharray="40"
                              strokeDashoffset="40"
                              className="animate-[draw_0.4s_ease-out_forwards]"
                            />
                            <path
                              d="M22 4 12 14.01l-3-3"
                              strokeDasharray="20"
                              strokeDashoffset="20"
                              className="animate-[draw_0.3s_ease-out_0.2s_forwards]"
                            />
                          </svg>
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-emerald-300 text-sm font-semibold">
                            {isDuplicate ? "Already exists!" : "Link trimmed!"}
                          </p>
                          <p className="text-emerald-400/70 text-xs font-mono truncate">
                            {newShortLink}
                          </p>
                        </div>

                        {/* Close button */}
                        <button
                          onClick={() => setShowSuccess(false)}
                          className="text-emerald-600 hover:text-emerald-400 transition-colors flex-shrink-0 ml-2"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                          >
                            <path d="M18 6 6 18M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}

                  {trimError && (
                    <div className="flex items-center gap-2 text-xs text-red-200/90 font-mono px-3 pt-1 animate-in fade-in duration-200">
                      <svg
                        className="w-3.5 h-3.5 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 8v4M12 16h.01" />
                      </svg>
                      <span>{trimError}</span>
                    </div>
                  )}
                </div>
                <button
                  type="submit"
                  className="bg-[#CB3837] hover:bg-[#b02e2d] text-white font-medium text-sm px-6 py-3 rounded-lg transition-all duration-150 flex items-center justify-center space-x-2 shadow-lg shadow-red-900/20 whitespace-nowrap"
                >
                  <span>Trim URL</span>
                  <Bolt className="w-3.5 h-3.5 fill-current" />
                </button>
              </form>
              <p className="text-left text-xs text-gray-600 mt-2 ml-2 font-mono">
                Press{" "}
                <kbd className="bg-gray-900 px-1 rounded border border-gray-800">
                  Enter
                </kbd>{" "}
                to execute command.
              </p>
              <div className="text-left text-xs font-mono mt-1 ml-2 flex items-center gap-2">
                <span
                  className={`inline-block w-1.5 h-1.5 rounded-full ${
                    rateLimit.remaining > 5
                      ? "bg-emerald-400"
                      : rateLimit.remaining > 2
                        ? "bg-yellow-400"
                        : "bg-red-400"
                  }`}
                ></span>
                <span className="text-gray-500">
                  {rateLimit.remaining} / {rateLimit.limit} trims remaining
                </span>
                {rateLimit.remaining <= 3 && (
                  <span className="text-gray-600">
                    (resets in {Math.ceil(rateLimit.resetIn)}s)
                  </span>
                )}
              </div>
            </div>
          </div>
          <LinksDashboard
            links={dashboardLinks}
            setLinks={setDashboardLinks}
            isLoading={isLoadingLinks}
          />
        </section>

        {/* About Section */}
        <section id="about" className="py-20 px-6 max-w-5xl mx-auto">
          <div className="text-center md:text-left mb-12">
            <h2 className="text-2xl font-bold tracking-tight flex items-center justify-center md:justify-start space-x-2">
              <Bookmark className="w-5 h-5 text-gray-500" />
              <span>About zip_9</span>
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              Open-source utility optimized for developers.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:border-gray-300 transition">
              <div className="text-gray-900 mb-3">
                <Gauge className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">
                Vercel Edge Speed
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Redirects happen globally at the edge layer, minimizing latency
                to sub-millisecond ranges.
              </p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:border-gray-300 transition">
              <div className="text-gray-900 mb-3">
                <ShieldHalf className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">GitHub Security</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Automatic malicious URL filtering keeping your audiences safe
                from phishing vectors.
              </p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:border-gray-300 transition">
              <div className="text-gray-900 mb-3">
                <Boxes className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">NPM Architecture</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Built like a dependency module. Highly scaling API structure
                built for rapid deployment pipelines.
              </p>
            </div>
          </div>
        </section>

        <hr className="border-gray-200 max-w-5xl mx-auto" />

        {/* Contact Section */}
        <section id="contact" className="py-20 px-6 max-w-xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
              Get in touch
            </h2>
            <p className="text-gray-500 mt-2 text-sm">
              Have scaling needs or feature requests? Drop us a line.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-200 px-6 py-3 flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-gray-500">
                issue_template.md
              </span>
              <div className="flex space-x-1.5">
                <span className="w-3 h-3 rounded-full bg-gray-200 inline-block"></span>
                <span className="w-3 h-3 rounded-full bg-gray-200 inline-block"></span>
                <span className="w-3 h-3 rounded-full bg-gray-200 inline-block"></span>
              </div>
            </div>

            <form onSubmit={handleContactSubmit} className="p-6 space-y-4">
              <div>
                <label
                  htmlFor="name"
                  className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1"
                >
                  Full Name <span className="text-[#CB3837]">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  required
                  placeholder="Octocat"
                  value={contactForm.name}
                  onChange={(e) =>
                    setContactForm({ ...contactForm, name: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm shadow-inner focus:outline-none focus:ring-2 focus:ring-[#CB3837]/20 focus:border-[#CB3837] transition"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1"
                >
                  Email Address <span className="text-[#CB3837]">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  required
                  placeholder="developer@github.com"
                  value={contactForm.email}
                  onChange={(e) =>
                    setContactForm({ ...contactForm, email: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm shadow-inner focus:outline-none focus:ring-2 focus:ring-[#CB3837]/20 focus:border-[#CB3837] transition"
                />
              </div>

              <div>
                <label
                  htmlFor="message"
                  className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1"
                >
                  Your Message <span className="text-[#CB3837]">*</span>
                </label>
                <textarea
                  id="message"
                  rows="4"
                  required
                  placeholder="Describe your request or issue here..."
                  value={contactForm.message}
                  onChange={(e) =>
                    setContactForm({ ...contactForm, message: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm shadow-inner focus:outline-none focus:ring-2 focus:ring-[#CB3837]/20 focus:border-[#CB3837] transition resize-none"
                ></textarea>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-black hover:bg-gray-900 text-white font-medium text-sm py-2.5 px-4 rounded-md transition duration-150 flex items-center justify-center space-x-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Issue</span>
                </button>
              </div>
            </form>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-8 px-6 text-center text-xs text-gray-400 font-mono">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            &copy; 2026 Link Trimmer. Capable of handling unlimited inputs.
          </div>
          <div className="flex space-x-4 text-gray-500">
            <a href="#" className="hover:text-black">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-black">
              Terms of Service
            </a>
            <a href="#" className="hover:text-black">
              Status
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
