document.addEventListener('DOMContentLoaded', () => {
    // Load saved data
    const savedDitta = localStorage.getItem('ditta');
    const savedTecnico = localStorage.getItem('tecnico');
    const savedEmails = localStorage.getItem('email_recipients');
    const saveDetails = localStorage.getItem('save_details') === 'true';

    // Populate Ditta/Tecnico if saved
    if (saveDetails) {
        if (savedDitta) document.getElementById('ditta').value = savedDitta;
        if (savedTecnico) document.getElementById('tecnico').value = savedTecnico;
        // Show checkmark
        document.getElementById('ditta_check').style.display = 'inline';
    }

    // Populate emails if saved (existence of key implies saved)
    if (savedEmails !== null) {
        document.getElementById('email_recipients').value = savedEmails;
        document.getElementById('email_check').style.display = 'inline';
    }

    // Global Visit counter using CountAPI - shared across all users and devices
    const counterElement = document.getElementById('visit_counter');
    counterElement.textContent = '...'; // Loading indicator

    // Increment and retrieve global visit count
    fetch('https://api.countapi.xyz/hit/chiusura-attivita-app/visits')
        .then(response => response.json())
        .then(data => {
            counterElement.textContent = data.value;
        })
        .catch(error => {
            console.warn('CountAPI non disponibile (probabilmente file locale), uso contatore locale:', error);
            // Fallback to local counter when API is unavailable (e.g., running from file://)
            let visitCount = parseInt(localStorage.getItem('visit_count') || '0');
            visitCount++;
            localStorage.setItem('visit_count', visitCount.toString());
            counterElement.textContent = `${visitCount} (locale)`;
        });
});

// Toggle Save Ditta Button Logic
document.getElementById('toggle_save_ditta').addEventListener('click', () => {
    const isSaved = localStorage.getItem('save_details') === 'true';
    const newState = !isSaved;

    if (newState) {
        localStorage.setItem('save_details', 'true');
        document.getElementById('ditta_check').style.display = 'inline';
        // Immediately save current values
        const ditta = document.getElementById('ditta').value;
        const tecnico = document.getElementById('tecnico').value;
        localStorage.setItem('ditta', ditta);
        localStorage.setItem('tecnico', tecnico);
    } else {
        localStorage.setItem('save_details', 'false');
        document.getElementById('ditta_check').style.display = 'none';
        localStorage.removeItem('ditta');
        localStorage.removeItem('tecnico');
    }
});

// Toggle Save Emails Button Logic
document.getElementById('save_emails_btn').addEventListener('click', () => {
    // Check if currently saved by checking presence of key
    const isSaved = localStorage.getItem('email_recipients') !== null;
    const newState = !isSaved;

    if (newState) {
        // Save
        const emails = document.getElementById('email_recipients').value;
        localStorage.setItem('email_recipients', emails);
        document.getElementById('email_check').style.display = 'inline';
    } else {
        // Unsave
        localStorage.removeItem('email_recipients');
        document.getElementById('email_check').style.display = 'none';
    }
});

// Verticale Checkbox Toggle
document.getElementById('verticale').addEventListener('change', function () {
    const verticaleField = document.getElementById('verticale_field');
    const cavettoInput = document.getElementById('cavetto');

    if (this.checked) {
        verticaleField.style.display = 'block';
        cavettoInput.disabled = true;
        cavettoInput.value = ''; // Optional: clear it if disabled
        cavettoInput.placeholder = "Disabilitato (Verticale attivo)";
    } else {
        verticaleField.style.display = 'none';
        cavettoInput.disabled = false;
        cavettoInput.placeholder = "Es. esterno 25mt";
        // Clear field when hiding
        document.getElementById('colore').value = '';
    }
});

// Modem Installed Checkbox Toggle
document.getElementById('modem_installed').addEventListener('change', function () {
    const modemFields = document.getElementById('modem_fields');
    if (this.checked) {
        modemFields.style.display = 'block';
    } else {
        modemFields.style.display = 'none';
        // Clear fields when hiding
        document.getElementById('modem_model').value = '';
        document.getElementById('modem_serial').value = '';
    }
});

// TimVisionBox Checkbox Toggle (only visible when modem is installed)
document.getElementById('timvisionbox_installed').addEventListener('change', function () {
    const timvisionField = document.getElementById('timvisionbox_field');
    if (this.checked) {
        timvisionField.style.display = 'block';
    } else {
        timvisionField.style.display = 'none';
        // Clear field when hiding
        document.getElementById('timvisionbox_serial').value = '';
    }
});

// Barcode Scanner Button - Opens native camera with barcode detection
document.getElementById('scan_barcode_btn').addEventListener('click', () => {
    // Create a hidden file input that opens the camera
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment'; // Use back camera (with flash and zoom available)

    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Try to use BarcodeDetector if available
        if ('BarcodeDetector' in window) {
            try {
                const barcodeDetector = new BarcodeDetector({
                    formats: ['code_128', 'code_39', 'ean_13', 'qr_code', 'code_93', 'codabar', 'ean_8', 'itf', 'upc_a', 'upc_e']
                });

                // Create image from file
                const img = new Image();
                img.src = URL.createObjectURL(file);

                img.onload = async () => {
                    try {
                        const barcodes = await barcodeDetector.detect(img);
                        if (barcodes.length > 0) {
                            const code = barcodes[0].rawValue;
                            document.getElementById('modem_serial').value = code;
                            alert('✅ Codice scansionato: ' + code);
                        } else {
                            alert('❌ Nessun codice rilevato nell\'immagine.\n\nRiprova con:\n• Migliore illuminazione\n• Codice più centrato\n• Immagine più nitida');
                        }
                    } catch (err) {
                        console.error('Detection error:', err);
                        alert('❌ Errore nella scansione.\n\nPuoi inserire il codice manualmente.');
                    }
                    URL.revokeObjectURL(img.src);
                };
            } catch (err) {
                console.error('BarcodeDetector error:', err);
                alert('⚠️ Scansione automatica non supportata su questo browser.\n\nInserisci il codice manualmente.');
            }
        } else {
            // Fallback for browsers without BarcodeDetector
            alert('💡 Il tuo browser non supporta la scansione automatica.\n\nInserisci il codice manualmente dopo averlo fotografato.');
        }
    };

    input.click();
});

// TimVisionBox Scanner Button - Same functionality as modem scanner
document.getElementById('scan_timvision_btn').addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';

    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if ('BarcodeDetector' in window) {
            try {
                const barcodeDetector = new BarcodeDetector({
                    formats: ['code_128', 'code_39', 'ean_13', 'qr_code', 'code_93', 'codabar', 'ean_8', 'itf', 'upc_a', 'upc_e']
                });

                const img = new Image();
                img.src = URL.createObjectURL(file);

                img.onload = async () => {
                    try {
                        const barcodes = await barcodeDetector.detect(img);
                        if (barcodes.length > 0) {
                            const code = barcodes[0].rawValue;
                            document.getElementById('timvisionbox_serial').value = code;
                            alert('✅ Codice scansionato: ' + code);
                        } else {
                            alert('❌ Nessun codice rilevato nell\'immagine.\n\nRiprova con:\n• Migliore illuminazione\n• Codice più centrato\n• Immagine più nitida');
                        }
                    } catch (err) {
                        console.error('Detection error:', err);
                        alert('❌ Errore nella scansione.\n\nPuoi inserire il codice manualmente.');
                    }
                    URL.revokeObjectURL(img.src);
                };
            } catch (err) {
                console.error('BarcodeDetector error:', err);
                alert('⚠️ Scansione automatica non supportata su questo browser.\n\nInserisci il codice manualmente.');
            }
        } else {
            alert('💡 Il tuo browser non supporta la scansione automatica.\n\nInserisci il codice manualmente dopo averlo fotografato.');
        }
    };

    input.click();
});

// Presa Scanner Button
document.getElementById('scan_presa_btn').addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';

    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if ('BarcodeDetector' in window) {
            try {
                const barcodeDetector = new BarcodeDetector({
                    formats: ['code_128', 'code_39', 'ean_13', 'qr_code', 'code_93', 'codabar', 'ean_8', 'itf', 'upc_a', 'upc_e']
                });

                const img = new Image();
                img.src = URL.createObjectURL(file);

                img.onload = async () => {
                    try {
                        const barcodes = await barcodeDetector.detect(img);
                        if (barcodes.length > 0) {
                            const code = barcodes[0].rawValue;
                            document.getElementById('presa').value = code;
                            alert('✅ Codice scansionato: ' + code);
                        } else {
                            alert('❌ Nessun codice rilevato nell\'immagine.');
                        }
                    } catch (err) {
                        console.error('Detection error:', err);
                        alert('❌ Errore nella scansione.');
                    }
                    URL.revokeObjectURL(img.src);
                };
            } catch (err) {
                console.error('BarcodeDetector error:', err);
                alert('⚠️ Scansione automatica non supportata su questo browser.');
            }
        } else {
            alert('💡 Il tuo browser non supporta la scansione automatica.');
        }
    };

    input.click();
});

// Clear All Button Logic
document.getElementById('clear_all_btn').addEventListener('click', () => {
    if (confirm('Sei sicuro di voler cancellare i campi compilati? (I dati salvati come Ditta, Tecnico e Email rimarranno)')) {
        // Clear all form inputs EXCEPT saved ones
        const inputs = document.querySelectorAll('input, textarea');
        inputs.forEach(input => {
            // Skip buttons, submits
            if (input.type === 'button' || input.type === 'submit') {
                return;
            }

            // Uncheck checkboxes
            if (input.type === 'checkbox') {
                input.checked = false;
                return;
            }

            // Skip saved fields if saving is enabled
            if (input.id === 'ditta' && localStorage.getItem('save_details') === 'true') return;
            if (input.id === 'tecnico' && localStorage.getItem('save_details') === 'true') return;
            if (input.id === 'email_recipients' && localStorage.getItem('email_recipients') !== null) return;

            // Clear value
            input.value = '';
        });

        // Reset UI states (hide conditional fields)
        document.getElementById('verticale_field').style.display = 'none';
        document.getElementById('modem_fields').style.display = 'none';
        document.getElementById('timvisionbox_field').style.display = 'none';

        // Re-enable cavetto if it was disabled
        const cavettoInput = document.getElementById('cavetto');
        cavettoInput.disabled = false;
        cavettoInput.placeholder = "Es. esterno 25mt";

        alert('Campi cancellati!');
    }
});

document.getElementById('closureForm').addEventListener('submit', function (e) {
    e.preventDefault();

    try {
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());

        // Update Ditta/Tecnico storage if saving is enabled
        if (localStorage.getItem('save_details') === 'true') {
            localStorage.setItem('ditta', data.ditta);
            localStorage.setItem('tecnico', data.tecnico);
        }

        // Update Emails storage if saving is enabled (key exists)
        if (localStorage.getItem('email_recipients') !== null) {
            localStorage.setItem('email_recipients', data.email_recipients);
        }

        // Get Header Values safely
        const wrInput = document.getElementById('wr');
        const phoneInput = document.getElementById('phone');

        if (!wrInput || !phoneInput) {
            throw new Error("Campi WR o Telefono non trovati.");
        }

        const wr = wrInput.value;
        const phone = phoneInput.value;

        // Construct Subject
        const subject = `${wr} ${phone}`;

        // Construct Body
        // Check if Verticale is selected
        const verticaleSelected = document.getElementById('verticale').checked;
        const coloreValue = document.getElementById('colore').value;
        const cavettoLine = verticaleSelected
            ? `sbraccio ${coloreValue}`
            : `Posato cavetto monofibra ${data.cavetto}`;

        const collegamentoLine = `arl ${data.arl} quartina ${data.quartina} ss${data.ss}`;
        const ontLine = data.ont ? `ont ${data.ont}` : '';

        // Check if modem is installed
        const modemInstalled = document.getElementById('modem_installed').checked;
        const modemLine = modemInstalled
            ? `posato modem ${data.modem_model} ${data.modem_serial}`
            : 'router cliente';

        // Handle interno - only add "int" if interno has a value
        const internoText = data.interno ? `int ${data.interno}` : '';
        const pianoLine = data.piano + (internoText ? ' ' + internoText : '');

        // Check if TimVisionBox is installed
        const timvisionInstalled = document.getElementById('timvisionbox_installed').checked;
        const timvisionLine = timvisionInstalled ? `timvisionbox ${data.timvisionbox_serial}` : '';

        const body = `
${cavettoLine}
${collegamentoLine}
${ontLine ? ontLine + '\n' : ''}${modemLine}
${timvisionLine ? timvisionLine + '\n' : ''}presa ${data.presa}
prove con ${data.prove}
ditta esecutrice ${data.ditta}
nome del tecnico ${data.tecnico}
${data.collaudo}
${pianoLine}
        `.trim();

        // Prepare Mailto
        // Handle potential undefined email_recipients
        const rawRecipients = data.email_recipients || '';
        const recipients = rawRecipients.replace(/\s/g, ''); // Remove spaces

        const mailtoLink = `mailto:${recipients}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

        console.log("Generated Link:", mailtoLink); // For debugging
        window.location.href = mailtoLink;

    } catch (error) {
        console.error("Errore generazione email:", error);
        alert("Si è verificato un errore: " + error.message);
    }
});
