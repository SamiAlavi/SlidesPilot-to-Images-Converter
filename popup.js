document.getElementById("captureDivBtn").addEventListener("click", async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // Load both html2canvas
    const scriptsToLoad = [
        'html2canvas.min.js',
    ];

    // Execute script loading in parallel
    const loadScripts = scriptsToLoad.map(script => 
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: [script]
        })
    );

    // Wait for all scripts to be loaded
    Promise.all(loadScripts).then(() => {
        // Now run the capture logic
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: saveDivsAsImages // Pass the function directly to be executed
        });
    }).catch(error => {
        console.error("Error loading scripts:", error);
    });
});

// This function runs in the context of the webpage
function saveDivsAsImages() {
    const xpath = "/html/body/div[1]/div/div[2]/div[2]/div[2]/div[1]";
    const parentDiv = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;

    if (parentDiv) {
        const childDivs = parentDiv.children; // Get child divs
        let promises = []; // To hold the promises of html2canvas calls

        for (let i = 0; i < childDivs.length; i++) {
            let childDiv = childDivs[i];

            // Create a promise for each child div
            promises.push(
                html2canvas(childDiv).then(canvas => {
                    const imgData = canvas.toDataURL('image/png');

                    // Create a link to download the image
                    const link = document.createElement('a');
                    link.href = imgData;
                    link.download = `div_image_${i + 1}.png`; // Naming the image
                    document.body.appendChild(link); // Append link to body (required for Firefox)
                    link.click(); // Trigger the download
                    document.body.removeChild(link); // Remove link after downloading
                })
            );
        }

        // Once all promises are resolved, notify the user
        Promise.all(promises).then(() => {
            console.log('All images saved!');
        }).catch(error => {
            console.error('Error capturing the child divs:', error);
        });
    } else {
        console.error("Parent div not found");
    }
}