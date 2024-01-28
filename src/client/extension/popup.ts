import { main as readCredMain } from '../read-cred';
import { main as writeCredMain } from '../write-cred';

// Listen for the DOM to be completely loaded
document.addEventListener('DOMContentLoaded', () => {
    // Find the buttons with the ids 'readCredBtn' and 'writeCredBtn'
   // const readCredBtn = document.getElementById('readCredBtn');
    const writeCredBtn = document.getElementById('writeCredBtn');

    // Check if the buttons exist
   /*  if (readCredBtn) {
        // Add a click event listener to the 'Read Cred' button
        readCredBtn.addEventListener('click', () => {
            // When the button is clicked, call the main function from read-cred.ts
            readCredMain();
        });
    } */

    if (writeCredBtn) {
        // Add a click event listener to the 'Write Cred' button
        writeCredBtn.addEventListener('click', () => {
            // When the button is clicked, call the main function from write-cred.ts
            writeCredMain();
        });
    }
});