import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function RedirectHandler() {
  const { code } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState(false);

  useEffect(() => {
    const checkAndRedirect = async () => {
      try {
        const res = await fetch("https://zip9-trimmer.onrender.com/links", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ codes: [code] }),
        });

        const data = await res.json();

        if (data.length > 0) {
          // Link exists — redirect via backend
          window.location.href = `https://zip9-trimmer.onrender.com/${code}`;
        } else {
          // Link not found — show error, go home
          setError(true);
          setTimeout(() => navigate("/"), 2000);
        }
      } catch (err) {
        setError(true);
        setTimeout(() => navigate("/"), 2000);
      }
    };

    checkAndRedirect();
  }, [code, navigate]);

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-red-400 font-mono text-lg">Link not found!</p>
          <p className="text-gray-500 font-mono text-sm">
            Redirecting to home...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <p className="text-gray-400 font-mono">Redirecting...</p>
    </div>
  );
}
