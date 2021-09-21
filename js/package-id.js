window.addEventListener(
  "message",
  (event) => {
    if (event.origin !== "https://t3rm.dev" && event.origin !== "https://www.t3rm.dev") return;

    if (typeof event.data === 'string' && event.data.slice(0, 16) === "t3rm:package-id:") {
      const packageID = document.getElementById("package-id");
      if (packageID.style.display === "block") return;

      packageID.style.display = "block";
      packageID.innerText = "dev.t3rm." + event.data.slice(16);
    }
  },
  false
);
