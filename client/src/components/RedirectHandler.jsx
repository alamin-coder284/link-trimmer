import { useEffect } from "react";
import { useParams } from "react-router-dom";

export default function RedirectHandler() {
  const { code } = useParams();

  useEffect(() => {
    window.location.replace(`https://zip9-trimmer.onrender.com/${code}`);
  }, [code]);

  return <div>Redirecting...</div>;
}