// Helper function to send emails using EmailJS
emailjs.init("eqniDTOTImEKBZiz7");
async function sendEmail(formData) {
    try {
        const response = await emailjs.send(
            'service_l12hcln',    // Your service ID
            'template_h4nzkdg',   // Your template ID
            {
                to_name: 'MSTQR Team',
                from_name: formData.name || formData.contactName,
                from_email: formData.email,
                subject: formData.subject || 'New Get Started Request',
                message: formData.message,
                ...formData
            }
        );
        console.log('Email sent successfully:', response);
        return true;
    } catch (error) {
        console.error('Failed to send email:', error);
        return false;
    }
}

// Form handling
document.addEventListener('DOMContentLoaded', function() {
    // Mobile Menu Toggle
    const menuToggle = document.querySelector('.menu-toggle');
    const navMenu = document.querySelector('.main-nav ul');

    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            menuToggle.classList.toggle('active');
            console.log('Menu toggled');
        });

        // Close menu when clicking outside
        document.addEventListener('click', function(event) {
            const isClickInsideMenu = event.target.closest('.main-nav ul');
            const isClickOnToggle = event.target.closest('.menu-toggle');
            
            if (!isClickInsideMenu && !isClickOnToggle && navMenu.classList.contains('active')) {
                navMenu.classList.remove('active');
                menuToggle.classList.remove('active');
            }
        });

        // Close menu when clicking on a link
        const menuLinks = navMenu.querySelectorAll('a');
        menuLinks.forEach(function(link) {
            link.addEventListener('click', function() {
                navMenu.classList.remove('active');
                menuToggle.classList.remove('active');
            });
        });
    }

    // Get Started form handling
    const getStartedForm = document.getElementById('getStartedForm');
    if (getStartedForm) {
        getStartedForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const formData = {
                communityName: document.getElementById('communityName').value,
                contactName: document.getElementById('contactName').value,
                email: document.getElementById('email').value,
                phone: document.getElementById('phone').value,
                usersCount: document.getElementById('usersCount').value,
                message: document.getElementById('message').value
            };
            
            const templateParams = {
                to_name: 'MSTQR Team',
                from_name: formData.contactName,
                reply_to: formData.email,
                message: `Community Name: ${formData.communityName}\n` +
                        `Contact Person: ${formData.contactName}\n` +
                        `Email: ${formData.email}\n` +
                        `Phone: ${formData.phone}\n` +
                        `Number of Users: ${formData.usersCount}\n\n` +
                        `Additional Information:\n${formData.message}`
            };
            
            const button = e.submitter;
            button.disabled = true;
            button.textContent = 'Sending...';

            const success = await sendEmail(templateParams);
            button.disabled = false;
            button.textContent = 'Submit Request';

            if (success) {
                alert('Thank you for your interest! We will contact you shortly.');
                getStartedForm.reset();
            } else {
                alert('Failed to send the request. Please try again or contact us directly at info@mstqr.com');
            }
        });
    }


    // Contact form handling
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const formData = {
                name: document.getElementById('name').value,
                email: document.getElementById('email').value,
                subject: document.getElementById('subject').value,
                message: document.getElementById('message').value
            };
            
            const templateParams = {
                to_name: 'MSTQR Team',
                from_name: formData.name,
                reply_to: formData.email,
                message: `Subject: ${formData.subject}\n\n${formData.message}`
            };

            const button = e.submitter;
            button.disabled = true;
            button.textContent = 'Sending...';

            const success = await sendEmail(templateParams);
            button.disabled = false;
            button.textContent = 'Send Message';

            if (success) {
                alert('Thank you for your message! We will get back to you soon.');
                contactForm.reset();
            } else {
                alert('Failed to send the message. Please try again or contact us directly at info@mstqr.com');
            }
        });
    }

    // Account deletion form handling
    const deletionForm = document.getElementById('deletionForm');
    if (deletionForm) {
        deletionForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const formData = {
                email: document.getElementById('email').value,
                reason: document.getElementById('reason').value
            };
            
            const templateParams = {
                to_name: 'MSTQR Team',
                from_name: 'Account Deletion Request',
                reply_to: formData.email,
                message: `Account Email: ${formData.email}\n\nReason for Deletion:\n${formData.reason}`
            };

            const button = e.submitter;
            button.disabled = true;
            button.textContent = 'Sending...';

            const success = await sendEmail(templateParams);
            button.disabled = false;
            button.textContent = 'Submit Request';

            if (success) {
                alert('Your account deletion request has been received. We will process it within 30 days.');
                deletionForm.reset();
            } else {
                alert('Failed to send the request. Please try again or contact us directly at info@mstqr.com');
            }
        });
    }

    // Active navigation link highlighting
    const currentPage = window.location.pathname.split('/').pop();
    const navLinks = document.querySelectorAll('.main-nav a');
    
    navLinks.forEach(link => {
        const linkPage = link.getAttribute('href').split('/').pop();
        if (currentPage === linkPage) {
            link.classList.add('active');
        }
    });
});
