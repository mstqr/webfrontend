// Simple GDPR cookie consent banner
(function() {
    if (localStorage.getItem('cookieConsent') === 'accepted') return;
    var banner = document.createElement('div');
    banner.id = 'cookie-consent-banner';
    banner.innerHTML = `
        <div class="cookie-consent-content">
            <span>We use cookies to enhance your experience. By continuing to browse, you agree to our <a href="privacy-policy.html" target="_blank">Privacy Policy</a>.</span>
            <button id="accept-cookies">Accept</button>
        </div>
    `;
    document.body.appendChild(banner);
    document.getElementById('accept-cookies').onclick = function() {
        localStorage.setItem('cookieConsent', 'accepted');
        banner.remove();
    };
})();
