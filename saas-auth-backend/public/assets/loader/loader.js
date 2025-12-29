/**
 * Show loader and redirect after delay
 * @param {string} targetPage
 * @param {number} delay
 * @param {string} message
 */
function showLoaderAndRedirect(targetPage, delay = 6500, message = "") {
  const loader = document.getElementById("page-loader");
  const text = document.getElementById("loader-text");

  if (message && text) {
    text.innerText = message;
  }

  loader.classList.add("active");

  setTimeout(() => {
    window.location.href = targetPage;
  }, delay);
}
