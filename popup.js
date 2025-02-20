document.addEventListener('DOMContentLoaded', function() {
    loadChannels();

    // Export Excel butonu
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportToExcel);
    }

    // Export JSON butonu
    const exportJSONBtn = document.getElementById('exportJSON');
    if (exportJSONBtn) {
        exportJSONBtn.addEventListener('click', exportToJSON);
    }

    // Import JSON butonu
    const importJSONInput = document.getElementById('importJSON');
    if (importJSONInput) {
        importJSONInput.addEventListener('change', importFromJSON);
    }
});

function loadChannels() {
    chrome.storage.sync.get(['savedChannels'], function(result) {
        const channelsDiv = document.getElementById('channels');
        const savedChannels = result.savedChannels || {};

        if (Object.keys(savedChannels).length === 0) {
            channelsDiv.innerHTML = `
                <div class="no-channels">
                    <p>No channels saved yet! 🎈</p>
                    <p style="font-size: 12px; margin-top: 8px;">Visit any YouTube channel and click "Save Channel" button.</p>
                </div>`;
            return;
        }

        channelsDiv.innerHTML = '';

        for (let category in savedChannels) {
            const categoryDiv = document.createElement('div');
            categoryDiv.className = 'category';
            
            categoryDiv.innerHTML = `<h3>${category}</h3>`;

            savedChannels[category].forEach((channel, index) => {
                const channelDiv = document.createElement('div');
                channelDiv.className = 'channel';
                
                channelDiv.innerHTML = `
                    <a href="${channel.url}" target="_blank" title="${channel.name}">
                        ${channel.name}
                    </a>
                    <button class="delete-btn" data-category="${category}" data-index="${index}">×</button>
                `;
                
                categoryDiv.appendChild(channelDiv);
            });

            channelsDiv.appendChild(categoryDiv);
        }

        // Silme butonları için event listener
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const category = this.dataset.category;
                const index = parseInt(this.dataset.index);

                chrome.storage.sync.get(['savedChannels'], function(result) {
                    const savedChannels = result.savedChannels;
                    savedChannels[category].splice(index, 1);

                    if (savedChannels[category].length === 0) {
                        delete savedChannels[category];
                    }

                    chrome.storage.sync.set({savedChannels}, function() {
                        loadChannels();
                    });
                });
            });
        });
    });
}

function exportToExcel() {
    chrome.storage.sync.get(['savedChannels'], function(result) {
        const savedChannels = result.savedChannels || {};
        const data = [['Channel Name', 'Channel Link', 'Category']];

        for (let category in savedChannels) {
            savedChannels[category].forEach(channel => {
                data.push([channel.name, channel.url, category]);
            });
        }

        try {
            const ws = XLSX.utils.aoa_to_sheet(data);
            const wb = XLSX.utils.book_new();
            
            ws['!cols'] = [
                {wch: 30},
                {wch: 50},
                {wch: 15}
            ];

            XLSX.utils.book_append_sheet(wb, ws, "YouTube Channels");

            const fileName = `YouTube_Channels_${new Date().toLocaleDateString().replace(/\//g, '-')}.xlsx`;
            XLSX.writeFile(wb, fileName);
        } catch (error) {
            console.error('Export error:', error);
            alert('Export failed! Error: ' + error.message);
        }
    });
}

function exportToJSON() {
    chrome.storage.sync.get(['savedChannels'], function(result) {
        const dataStr = JSON.stringify(result.savedChannels, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = 'youtube_channels_backup.json';
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    });
}

function importFromJSON(event) {
    const file = event.target.files[0];
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            const jsonData = JSON.parse(e.target.result);
            
            // JSON formatı kontrolü
            if (typeof jsonData !== 'object') {
                throw new Error('Invalid JSON format');
            }

            // Veri yapısı kontrolü
            for (let category in jsonData) {
                if (!Array.isArray(jsonData[category])) {
                    throw new Error('Invalid data structure');
                }

                // Her kanal için gerekli alanların kontrolü
                jsonData[category].forEach(channel => {
                    if (!channel.id || !channel.name || !channel.url) {
                        throw new Error('Missing required channel data');
                    }
                });
            }

            // Veriyi kaydet
            chrome.storage.sync.set({savedChannels: jsonData}, function() {
                alert('Channels imported successfully! 💖');
                loadChannels();
            });
        } catch (error) {
            console.error('Import error:', error);
            alert(`Import failed! ${error.message} 😢\n\nPlease make sure you're using a valid backup file.`);
        }
    };
    
    reader.onerror = function() {
        alert('Error reading file! Please try again. 😢');
    };
    
    reader.readAsText(file);
}