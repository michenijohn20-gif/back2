import { Outlet } from "react-router-dom";
import { Navbar } from "./Navbar.jsx";
import { Footer } from "./Footer.jsx";
import { WhatsAppButton } from "../WhatsAppButton.jsx";

export function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <WhatsAppButton />
      <Footer />
    </div>
  );
}
