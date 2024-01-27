document.addEventListener('DOMContentLoaded', () => {
    chrome.runtime.sendMessage({action: 'getPasswords'}, (response: any) => {
        const passwordsDiv = document.getElementById('passwords');
        if (passwordsDiv && typeof response === 'string') {
            passwordsDiv.textContent = response;
        }
    });
});