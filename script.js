// Landing page interactions — relies on api.js being loaded first

// "File a Complaint" buttons (navbar + hero) — smart auth check
document.querySelectorAll(".btn-primary, .btn-main").forEach(btn => {
  btn.addEventListener("click", () => {
    fileComplaintRedirect();
  });
});

// "Track Existing" button — always goes to publicTracker
const trackBtn = document.querySelector(".btn-outline");
if (trackBtn) {
  trackBtn.addEventListener("click", () => {
    window.location.href = "publicTracker.html";
  });
}

// Navbar "Track Complaint" li — goes to publicTracker
const navLinks = document.querySelectorAll(".nav-links li");
if (navLinks[1]) {
  navLinks[1].addEventListener("click", () => {
    window.location.href = "publicTracker.html";
  });
}