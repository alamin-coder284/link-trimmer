import { useParams, Navigate } from "react-router-dom";

export default function RedirectHandler() {
  const { code } = useParams();
  window.location.href = `https://zip9-trimmer.onrender.com/${code}`;
  return <div>Redirecting {code}...</div>;
}