document.addEventListener('DOMContentLoaded', () => {
    const authForm = document.getElementById('authForm');
    const messageDiv = document.getElementById('message');

    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;

        try {
            const response = await fetch('/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const data = await response.json();
            
            if (response.ok) {
                messageDiv.textContent = data.message;
                messageDiv.className = 'text-green-500 text-center py-4';
            } else {
                messageDiv.textContent = data.error;
                messageDiv.className = 'text-red-500 text-center py-4';
            }
        } catch (error) {
            console.error('Error:', error);
            messageDiv.textContent = 'An error occurred. Please try again.';
            messageDiv.className = 'text-red-500 text-center py-4';
        }
    });
});