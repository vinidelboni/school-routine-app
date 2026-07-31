"use client";

import { useEffect, useState } from "react";

const INTRO_SEEN_KEY = "somamais-login-intro-seen";

export function LoginIntro() {
  const [visible, setVisible] = useState(true);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (window.sessionStorage.getItem(INTRO_SEEN_KEY)) {
      const hideImmediately = window.setTimeout(() => setVisible(false), 0);
      return () => window.clearTimeout(hideImmediately);
    }

    window.sessionStorage.setItem(INTRO_SEEN_KEY, "true");
    const closeTimer = window.setTimeout(() => setClosing(true), 2300);
    const hideTimer = window.setTimeout(() => setVisible(false), 2850);

    return () => {
      window.clearTimeout(closeTimer);
      window.clearTimeout(hideTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`soma-intro fixed inset-0 z-[100] grid min-h-dvh place-items-center overflow-hidden bg-[#020f32] text-white ${
        closing ? "soma-intro--closing" : ""
      }`}
      aria-label="SomaMais"
      role="status"
    >
      <div className="soma-orb soma-orb--one" />
      <div className="soma-orb soma-orb--two" />
      <div className="soma-grid" />

      <div className="relative flex flex-col items-center px-6 text-center">
        <div className="soma-mark" aria-hidden="true">
          <span className="soma-letter">S</span>
          <span className="soma-plus">+</span>
        </div>

        <div className="soma-wordmark">
          <span>Soma</span>
          <strong>Mais</strong>
        </div>
        <p className="soma-tagline">Somando escola, família e futuro.</p>

        <div className="soma-progress" aria-hidden="true">
          <i />
        </div>
      </div>

      <style jsx>{`
        .soma-intro {
          opacity: 1;
          transition: opacity 520ms ease, transform 520ms ease;
        }
        .soma-intro--closing {
          opacity: 0;
          transform: scale(1.025);
          pointer-events: none;
        }
        .soma-grid {
          position: absolute;
          inset: 0;
          opacity: 0.13;
          background-image: linear-gradient(rgba(76, 152, 255, 0.16) 1px, transparent 1px),
            linear-gradient(90deg, rgba(76, 152, 255, 0.16) 1px, transparent 1px);
          background-size: 42px 42px;
          mask-image: radial-gradient(circle at center, black, transparent 72%);
        }
        .soma-orb {
          position: absolute;
          border-radius: 999px;
          filter: blur(18px);
          opacity: 0.5;
        }
        .soma-orb--one {
          width: 360px;
          height: 360px;
          top: -160px;
          left: -130px;
          background: #086ce6;
        }
        .soma-orb--two {
          width: 320px;
          height: 320px;
          right: -150px;
          bottom: -140px;
          background: #073bad;
        }
        .soma-mark {
          position: relative;
          display: grid;
          width: 156px;
          height: 156px;
          place-items: center;
          border: 1px solid rgba(96, 174, 255, 0.48);
          border-radius: 38px;
          overflow: hidden;
          background: linear-gradient(145deg, #0c73ee 0%, #073dac 42%, #03143d 100%);
          box-shadow: inset 0 2px 2px rgba(255, 255, 255, 0.22),
            0 28px 70px rgba(0, 49, 151, 0.48);
          animation: soma-mark-in 720ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
        }
        .soma-mark::before {
          content: "";
          position: absolute;
          width: 130px;
          height: 70px;
          top: -32px;
          left: -20px;
          border-radius: 999px;
          background: rgba(49, 177, 255, 0.42);
          filter: blur(18px);
          transform: rotate(-18deg);
        }
        .soma-letter {
          position: relative;
          margin-left: -18px;
          font-family: var(--font-display), sans-serif;
          font-size: 102px;
          font-weight: 850;
          font-style: italic;
          line-height: 1;
          letter-spacing: -0.13em;
          color: #fff;
          text-shadow: 0 7px 0 rgba(3, 22, 64, 0.34), 0 0 22px rgba(255, 255, 255, 0.24);
        }
        .soma-plus {
          position: absolute;
          right: 20px;
          bottom: 25px;
          font-family: Arial, sans-serif;
          font-size: 68px;
          font-weight: 900;
          line-height: 0.7;
          color: #12c8f3;
          text-shadow: 0 6px 0 #064bb9, 0 0 22px rgba(18, 200, 243, 0.55);
          animation: soma-plus-in 900ms 300ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
        }
        .soma-wordmark {
          margin-top: 28px;
          font-family: var(--font-display), sans-serif;
          font-size: 42px;
          font-weight: 750;
          letter-spacing: -0.055em;
          animation: soma-copy-in 560ms 720ms ease both;
        }
        .soma-wordmark strong {
          color: #13bff0;
          font-weight: inherit;
        }
        .soma-tagline {
          margin-top: 8px;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.24em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.72);
          animation: soma-copy-in 560ms 900ms ease both;
        }
        .soma-progress {
          width: 148px;
          height: 3px;
          margin-top: 42px;
          overflow: hidden;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.14);
          animation: soma-copy-in 400ms 980ms ease both;
        }
        .soma-progress i {
          display: block;
          width: 100%;
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, #1dcdf4, #1974ee);
          transform-origin: left;
          animation: soma-progress 1.15s 1s ease-in-out both;
        }
        @keyframes soma-mark-in {
          from { opacity: 0; transform: translateY(18px) scale(0.72) rotate(-4deg); filter: blur(10px); }
          to { opacity: 1; transform: translateY(0) scale(1) rotate(0); filter: blur(0); }
        }
        @keyframes soma-plus-in {
          from { opacity: 0; transform: translateX(-22px) scale(0.45); filter: blur(8px); }
          to { opacity: 1; transform: translateX(0) scale(1); filter: blur(0); }
        }
        @keyframes soma-copy-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes soma-progress {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }
        @media (max-width: 380px) {
          .soma-mark { width: 136px; height: 136px; border-radius: 32px; }
          .soma-letter { font-size: 88px; }
          .soma-plus { right: 17px; bottom: 22px; font-size: 58px; }
          .soma-wordmark { font-size: 36px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .soma-mark, .soma-plus, .soma-wordmark, .soma-tagline, .soma-progress, .soma-progress i {
            animation-duration: 1ms;
            animation-delay: 0ms;
          }
        }
      `}</style>
    </div>
  );
}
