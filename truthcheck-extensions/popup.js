document.addEventListener("DOMContentLoaded", function () {
    loadFactHistory(); // Load previous fact-check history on startup
});

// Fact Checking with Wikipedia & News Source References
document.getElementById("checkFactBtn").addEventListener("click", async function () {
    let claim = document.getElementById("claim").value;
    if (!claim) {
        alert("Enter a fact to check!");
        return;
    }

    document.getElementById("factResult").innerHTML = "🔍 Checking...";
    
    try {
        let response = await fetch(`http://127.0.0.1:5000/check_fact?claim=${encodeURIComponent(claim)}`);
        let data = await response.json();
        
        let factResult = `<strong>Result:</strong> ${data.analysis}`;
        let references = await fetchSources(claim); // Fetch reliable sources
        
        document.getElementById("factResult").innerHTML = factResult + references;
        
        saveFactHistory(claim, data.analysis, references); // Save to history
    } catch (error) {
        document.getElementById("factResult").innerHTML = " Error: Unable to connect to server.";
    }
});

// Image Fake Detection
document.getElementById("checkImageBtn").addEventListener("click", async function () {
    let imageFile = document.getElementById("imageUpload").files[0];
    if (!imageFile) {
        alert("Upload an image!");
        return;
    }

    let formData = new FormData();
    formData.append("file", imageFile);

    document.getElementById("imageResult").innerHTML = " Analyzing...";
    
    try {
        let response = await fetch("http://127.0.0.1:5001/analyze-image", {
            method: "POST",
            body: formData
        });
        let data = await response.json();

        if (data.error) {
            document.getElementById("imageResult").innerHTML = `<strong>Error:</strong> ${data.error}`;
        } else {
            document.getElementById("imageResult").innerHTML = 
                `<strong>Result:</strong> ${data.result} <br> 
                <strong>Confidence:</strong> ${data.confidence}%`;
        }
    } catch (error) {
        document.getElementById("imageResult").innerHTML = " Error: Unable to connect to server.";
    }
});

// Fetch Reliable Sources (Wikipedia & News)
async function fetchSources(query) {
    let sourcesHTML = "<br><strong> Related Sources:</strong><br>";

    // Wikipedia Search API
    let wikiUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*`;
    try {
        let wikiResponse = await fetch(wikiUrl);
        let wikiData = await wikiResponse.json();
        if (wikiData.query.search.length > 0) {
            let wikiTitle = wikiData.query.search[0].title;
            let wikiLink = `https://en.wikipedia.org/wiki/${encodeURIComponent(wikiTitle)}`;
            sourcesHTML += `<a href="${wikiLink}" target="_blank"> Wikipedia: ${wikiTitle}</a><br>`;
        }
    } catch (error) {
        console.error("Wikipedia API Error:", error);
    }

    // Google News Search Link
    let newsSearchLink = `https://news.google.com/search?q=${encodeURIComponent(query)}`;
    sourcesHTML += `<a href="${newsSearchLink}" target="_blank"> Google News: ${query}</a>`;

    return sourcesHTML;
}

// Save Fact History
function saveFactHistory(claim, analysis, references) {
    let history = JSON.parse(localStorage.getItem("factHistory")) || [];
    history.unshift({ claim, analysis, references, timestamp: new Date().toLocaleString() });
    localStorage.setItem("factHistory", JSON.stringify(history));
    loadFactHistory();
}

// Load Fact History
function loadFactHistory() {
    let history = JSON.parse(localStorage.getItem("factHistory")) || [];
    let historyContainer = document.getElementById("factHistory");

    if (!historyContainer) return; // If the history section doesn't exist

    historyContainer.innerHTML = history.length === 0 ? "<p>No history available.</p>" : "";

    history.forEach(entry => {
        let div = document.createElement("div");
        div.classList.add("history-entry");
        div.innerHTML = `<strong>${entry.claim}</strong><br>${entry.analysis}<br>${entry.references}<br><small>${entry.timestamp}</small>`;
        historyContainer.appendChild(div);
    });
}

// Clear History
document.getElementById("clearHistoryBtn").addEventListener("click", function () {
    localStorage.removeItem("factHistory");
    loadFactHistory();
});
