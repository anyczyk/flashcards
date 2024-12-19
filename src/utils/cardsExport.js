const cardsExport = async (dataToExport) => {
    if (window.cordova) { // Cordova
        try {
            const jsonData = JSON.stringify(dataToExport, null, 2);
            const blob = new Blob([jsonData], { type: 'application/json' });
            const fileName = `index-db-${Date.now()}.json`;

            window.resolveLocalFileSystemURL(cordova.file.dataDirectory, async (dirEntry) => {
                try {
                    const fileEntry = await new Promise((resolve, reject) => {
                        dirEntry.getFile(fileName, { create: true, exclusive: false }, resolve, reject);
                    });

                    const fileWriter = await new Promise((resolve, reject) => {
                        fileEntry.createWriter(resolve, reject);
                    });

                    fileWriter.onwriteend = async () => {
                        const filePath = fileEntry.nativeURL;
                        console.log("Plik zapisany w:", filePath);

                        if (window.plugins && window.plugins.socialsharing) {
                            window.plugins.socialsharing.share(
                                'Eksportowane dane',
                                'Eksportowane dane',
                                filePath,
                                null,
                                () => {
                                    alert("Plik został pomyślnie wyeksportowany i udostępniony.");
                                },
                                (error) => {
                                    console.error("Udostępnianie nie powiodło się:", error);
                                    alert("Nie udało się udostępnić pliku: " + error);
                                }
                            );
                        } else {
                            alert("Brak wtyczki SocialSharing.");
                        }
                    };

                    fileWriter.onerror = (e) => {
                        console.error("Zapis pliku nie powiódł się:", e);
                        alert("Nie udało się zapisać pliku: " + e.toString());
                    };

                    fileWriter.write(blob);
                } catch (error) {
                    console.error("Błąd podczas operacji na plikach:", error);
                    alert("Wystąpił błąd podczas eksportu pliku.");
                }
            }, (error) => {
                console.error("Błąd podczas rozwiązywania systemu plików:", error);
                alert("Błąd podczas rozwiązywania systemu plików: " + error.toString());
            });

        } catch (error) {
            console.error("Eksport nie powiódł się: ", error);
            alert("Wystąpił błąd podczas eksportu.");
        }
    } else { // Browser
        try {
            const jsonData = JSON.stringify(dataToExport, null, 2);

            const fileName = `index-db-${Date.now()}.json`;
            const blob = new Blob([jsonData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            a.click();

            URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Eksport w przeglądarce nie powiódł się:", error);
            alert("Wystąpił błąd podczas eksportu w przeglądarce.");
        }
    }
};

export default cardsExport;