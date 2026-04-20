import React from "react";
import { useNavigate } from "react-router-dom";
import Logo from "./Logo";

const Footer = () => {
  const navigate = useNavigate();

  const links = [
    { label: "Home", path: "/" },
    { label: "About", path: "/AboutPage" },
    { label: "Register", path: "/register" },
    { label: "Sign In", path: "/login" },
  ];

  const tech = ["Ethereum", "IPFS", "Zero Knowledge Proofs", "ABAC"];

  return (
    <footer className="border-t border-white/5 bg-black/20 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">
          {/* Brand */}
          <div>
            <Logo size="md" showText={true} />
            <p className="mt-4 text-sm text-gray-500 leading-relaxed max-w-xs">
              Decentralized health record management built on Ethereum, secured
              with Zero Knowledge Proofs and IPFS.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-sm font-semibold text-gray-300 mb-4 uppercase tracking-wider">
              Navigation
            </h4>
            <ul className="space-y-2">
              {links.map((link) => (
                <li key={link.path}>
                  <button
                    onClick={() => navigate(link.path)}
                    className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Tech stack */}
          <div>
            <h4 className="text-sm font-semibold text-gray-300 mb-4 uppercase tracking-wider">
              Built With
            </h4>
            <div className="flex flex-wrap gap-2">
              {tech.map((t) => (
                <span
                  key={t}
                  className="px-3 py-1 rounded-full text-xs text-gray-400 border border-white/10 bg-white/5"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-600">
            &copy; {new Date().getFullYear()} MediChain. All rights reserved.
          </p>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-gray-600">Network: Anvil Local</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
