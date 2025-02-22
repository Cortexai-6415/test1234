// content.js
// Save Channel function update
function saveChannel() {
    const channelName = getChannelName();
    const channelId = getChannelId();
    
    if (!channelId) {
        alert('Could not find channel ID! Please try again. 😢');
        return;
    }

    if (!channelName || channelName === 'Unknown Channel') {
        alert('Could not find channel name! Please try again. 😢');
        return;
    }

    // Log the values for debugging
    console.log('Saving channel:', { name: channelName, id: channelId });

    // Önceden kaydedilmiş kategorileri al
    chrome.storage.sync.get(['savedChannels'], function(result) {
        const savedChannels = result.savedChannels || {};
        const existingCategories = Object.keys(savedChannels);
        
        // Kategori seçim mesajını oluştur
        let promptMessage = 'Enter a category name:\n\n';
        if (existingCategories.length > 0) {
            promptMessage += 'Existing categories:\n' + existingCategories.join('\n') + '\n\n';
        }
        promptMessage += 'Type a new category name or select from existing ones';

        // Kullanıcıdan kategori adını al
        const category = prompt(promptMessage);
        
        if (!category) return; // İptal edilirse çık

        // Kategoriyi kaydet
        if (!savedChannels[category]) {
            savedChannels[category] = [];
        }
        
        // Kanal zaten kaydedilmiş mi kontrol et
        const isAlreadySaved = savedChannels[category].some(ch => ch.id === channelId);
        if (isAlreadySaved) {
            alert('This channel is already saved in this category! 😊');
            return;
        }

        // Save only the necessary data
        savedChannels[category].push({
            id: channelId,
            name: channelName
        });
        
        // Log the updated savedChannels for debugging
        console.log('Updated savedChannels:', savedChannels);
        
        chrome.storage.sync.set({savedChannels}, function() {
            if (chrome.runtime.lastError) {
                console.error('Error saving channel:', chrome.runtime.lastError);
                alert('Error saving channel! Please try again. 😢');
            } else {
                alert('Channel saved successfully! 💖');
            }
        });
    });
}
