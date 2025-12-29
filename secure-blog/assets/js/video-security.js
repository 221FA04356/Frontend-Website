/* ==========================
   VIDEO SECURITY FOR BLOG PAGES
   Based on demo security features
========================== */

(function() {
  'use strict';

  /* ==========================
     1. SESSION EXPIRY (5 MIN)
  ========================== */
  let remaining = 300; // 5 minutes in seconds
  const timerElement = document.getElementById('time');
  const sessionTimer = document.getElementById('session-timer');

  const timerInterval = setInterval(() => {
    if (timerElement) {
      const min = String(Math.floor(remaining / 60)).padStart(2, "0");
      const sec = String(remaining % 60).padStart(2, "0");
      timerElement.innerText = `${min}:${sec}`;
    }

    if (remaining <= 0) {
      clearInterval(timerInterval);
      alert("Demo session expired");
      location.reload();
    }
    remaining--;
  }, 1000);

  /* ==========================
     2. MOVING WATERMARK
  ========================== */
  let wmInterval;

  function startWatermark() {
    const wm = document.getElementById("watermark");

    if (wm) {
      wm.style.display = 'none'; // Initially hidden

      function moveWatermark() {
        wm.style.left = Math.random() * 60 + "%";
        wm.style.top = Math.random() * 60 + "%";

        wm.innerText =
          "DEMO ONLY\n" +
          new Date().toLocaleTimeString() +
          "\nUnauthorized Sharing Prohibited";
      }

      function showWatermark() {
        if (!wmInterval) {
          wm.style.display = 'block';
          wmInterval = setInterval(moveWatermark, 1200);
        }
      }

      function hideWatermark() {
        if (wmInterval) {
          clearInterval(wmInterval);
          wmInterval = null;
          wm.style.display = 'none';
        }
      }

      // Add event listeners to all videos
      const videos = document.querySelectorAll("video");
      videos.forEach(video => {
        video.addEventListener('play', showWatermark);
        video.addEventListener('pause', () => {
          // Check if any video is still playing
          const anyPlaying = Array.from(videos).some(v => !v.paused && !v.ended);
          if (!anyPlaying) {
            hideWatermark();
          }
        });
        video.addEventListener('ended', () => {
          // When video ends, check if others are playing
          const anyPlaying = Array.from(videos).some(v => !v.paused && !v.ended);
          if (!anyPlaying) {
            hideWatermark();
          }
        });
      });
    }
  }
  startWatermark();

  /* ==========================
     3. BLUR + PAUSE ON TAB CHANGE
  ========================== */
  document.addEventListener("visibilitychange", () => {
    const videos = document.querySelectorAll(".video-security-wrapper video, video");

    videos.forEach(video => {
      if (document.hidden) {
        video.pause();
        video.style.filter = "blur(15px)";
      } else {
        video.style.filter = "none";
        if (!video.paused) {
          video.play().catch(e => console.log("Video play prevented:", e));
        }
      }
    });
  });

  /* ==========================
     4. WINDOW FOCUS LOSS
  ========================== */
  window.addEventListener("blur", () => {
    const videos = document.querySelectorAll(".video-security-wrapper video, video");
    videos.forEach(video => {
      video.pause();
      video.style.filter = "blur(15px)";
    });
  });

  window.addEventListener("focus", () => {
    const videos = document.querySelectorAll(".video-security-wrapper video, video");
    videos.forEach(video => {
      video.style.filter = "none";
      if (video.hasAttribute("autoplay") || video.getAttribute("data-autoplay") === "true") {
        video.play().catch(e => console.log("Video play prevented:", e));
      }
    });
  });

  /* ==========================
     5. BREAK RECORDING QUALITY
  ========================== */
  setInterval(() => {
    const videos = document.querySelectorAll(".video-security-wrapper video, video");
    videos.forEach(video => {
      video.style.opacity = Math.random() > 0.95 ? "0.45" : "1";
    });
  }, 200);

  /* ==========================
     6. BLOCK SCREEN CAPTURE API
  ========================== */
  if (navigator.mediaDevices) {
    navigator.mediaDevices.getDisplayMedia = () => {
      alert("Screen recording is not allowed");
      throw new Error("Blocked");
    };
  }

  /* ==========================
     7. DEVTOOLS & COPY BLOCK
  ========================== */
  document.addEventListener("contextmenu", e => e.preventDefault());

  document.addEventListener("keydown", e => {
    if (
      e.key === "F12" ||
      (e.ctrlKey && e.shiftKey && ["I", "C", "J"].includes(e.key)) ||
      (e.ctrlKey && e.key === "U")
    ) {
      e.preventDefault();
      return false;
    }
  });

  /* ==========================
     8. BASIC RECORDING SOFTWARE DETECTION
  ========================== */
  setInterval(() => {
    if (window.outerWidth - window.innerWidth > 200) {
      alert("Recording software detected. Demo stopped.");
      location.reload();
    }
  }, 3000);

  /* ==========================
     SCREENSHOT BLUR HANDLING
  ========================== */
  const blurOverlay = document.getElementById("blurOverlay");

  function enableBlur() {
    if (blurOverlay) {
      blurOverlay.style.display = "block";
    }
  }

  function disableBlur() {
    if (blurOverlay) {
      blurOverlay.style.display = "none";
    }
  }

  /* Windows: PrintScreen */
  document.addEventListener("keyup", e => {
    if (e.key === "PrintScreen") {
      enableBlur();
      setTimeout(disableBlur, 1500);
    }
  });

  /* Mac: Cmd + Shift + 3 / 4 */
  document.addEventListener("keydown", e => {
    if (e.metaKey && e.shiftKey && (e.key === "3" || e.key === "4")) {
      enableBlur();
      setTimeout(disableBlur, 1500);
    }
  });

  /* Snipping Tool / Focus Loss */
  window.addEventListener("blur", () => {
    enableBlur();
  });

  window.addEventListener("focus", () => {
    disableBlur();
  });

  /* Print / Save as PDF */
  window.onbeforeprint = () => enableBlur();
  window.onafterprint = () => disableBlur();

  /* ==========================
     VIDEO CONTROLS RESTRICTION
  ========================== */
  document.addEventListener("DOMContentLoaded", () => {
    const videos = document.querySelectorAll(".video-security-wrapper video, video");
    
    videos.forEach(video => {
      // Ensure download is disabled
      video.setAttribute("controlsList", "nodownload noremoteplayback");
      video.setAttribute("disablePictureInPicture", "true");
      
      // Prevent right-click menu
      video.addEventListener("contextmenu", e => {
        e.preventDefault();
        return false;
      });

      // Prevent keyboard shortcuts
      video.addEventListener("keydown", e => {
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
        }
      });
    });
  });

  /* ==========================
     PAGE UNLOAD WARNING
  ========================== */
  window.addEventListener("beforeunload", (e) => {
    e.preventDefault();
    e.returnValue = "Are you sure you want to leave? Your session will end.";
    return e.returnValue;
  });

})();