(function () {
  try {
    var saved = localStorage.getItem("atomz-theme") || localStorage.getItem("atomz_theme");
    if (saved === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
    } else if (saved === "light") {
      document.documentElement.removeAttribute("data-theme");
    }
  } catch (e) {}
})();
