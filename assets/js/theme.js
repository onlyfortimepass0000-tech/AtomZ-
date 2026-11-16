(function () {
  try {
    var saved = localStorage.getItem("atomz_theme");
    if (saved) {
      document.documentElement.setAttribute("data-theme", saved);
    }
  } catch (e) {}
})();
