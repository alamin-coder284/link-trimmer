import { useParams, Navigate } from "react-router-dom";

export default function RedirectHandler() {
  const { code } = useParams();
  window.location.href = `http://localhost:1234/${code}`;
  return <div>Redirecting {code}...</div>;
}