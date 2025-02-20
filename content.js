// Buton ekleme fonksiyonunu güncelle
function addSaveButton() {
    // Kanal sayfası için buton ekle
    addChannelPageButton();
    // Video sayfası için buton ekle
    addVideoPageButton();
}

// Kanal sayfası için buton
function addChannelPageButton() {
    if (document.getElementById('save-channel-btn-page')) return;
    
    const targetContainer = document.querySelector('#page-header-container');
    if (!targetContainer) return;

    const buttonContainer = createButtonContainer('save-channel-btn-page');
    targetContainer.appendChild(buttonContainer);
}

// Video sayfası için buton
function addVideoPageButton() {
    if (document.getElementById('save-channel-btn-video')) return;
    
    const subscribeButton = document.querySelector('ytd-subscribe-button-renderer');
    if (!subscribeButton) return;

    const buttonContainer = createButtonContainer('save-channel-btn-video');
    // Abone ol butonunun altına ekle
    subscribeButton.parentNode.insertBefore(buttonContainer, subscribeButton.nextSibling);
}

// Buton container oluştur
function createButtonContainer(btnId) {
    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
        display: inline-flex;
        align-items: center;
        margin: 8px 0;
    `;

    const saveBtn = document.createElement('button');
    saveBtn.id = btnId;
    saveBtn.innerHTML = '💾 Save Channel';
    saveBtn.style.cssText = `
        background: #ff0000;
        color: white;
        border: none;
        padding: 10px 16px;
        border-radius: 18px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        gap: 8px;
        font-family: Roboto, Arial, sans-serif;
    `;
    
    saveBtn.addEventListener('mouseover', () => {
        saveBtn.style.background = '#cc0000';
        saveBtn.style.transform = 'translateY(-1px)';
    });
    
    saveBtn.addEventListener('mouseout', () => {
        saveBtn.style.background = '#ff0000';
        saveBtn.style.transform = 'translateY(0)';
    });
    
    saveBtn.addEventListener('click', saveChannel);
    buttonContainer.appendChild(saveBtn);
    
    return buttonContainer;
}

// Kanal ID'sini al
function getChannelId() {
    // URL'den kanal bilgisini al
    const currentUrl = window.location.href;
    
    // Video sayfasında kanal ID'sini bul
    if (currentUrl.includes('/watch')) {
        const channelElement = document.querySelector('#upload-info #channel-name a');
        if (channelElement) {
            const channelUrl = channelElement.href;
            const videoChannelMatch = channelUrl.match(/\/@([^/]+)/);
            if (videoChannelMatch) {
                const pageSource = document.documentElement.innerHTML;
                const idMatch = pageSource.match(/"channelId":"(UC[\w-]+)"/);
                if (idMatch) return idMatch[1];
            }
        }
    }
    
    // @ handle formatı için kontrol
    if (currentUrl.includes('/@')) {
        const pageSource = document.documentElement.innerHTML;
        const idMatch = pageSource.match(/"channelId":"(UC[\w-]+)"/);
        if (idMatch) return idMatch[1];
    }
    
    // Normal kanal ID formatı için kontrol
    const channelMatch = currentUrl.match(/youtube\.com\/channel\/(UC[\w-]+)/);
    if (channelMatch) return channelMatch[1];

    // Meta tag'den kontrol
    const metaTag = document.querySelector('meta[itemprop="channelId"]');
    if (metaTag) return metaTag.content;

    return null;
}

// Kanal adını al
function getChannelName() {
    // Video sayfası için kanal adını al
    if (window.location.href.includes('/watch')) {
        // Önce video sahibinin adını bulmaya çalış
        const channelNameSelectors = [
            '#upload-info #channel-name .ytd-channel-name', // Ana kanal adı
            '#upload-info #channel-name a', // Kanal linki içindeki ad
            'ytd-video-owner-renderer #channel-name .ytd-channel-name', // Video sahibi
            'ytd-video-owner-renderer #channel-name a', // Video sahibi linki
            '#above-the-fold #channel-name .ytd-channel-name', // Üst kısımdaki kanal adı
            '#above-the-fold #channel-name a', // Üst kısımdaki kanal linki
            '#owner-name a', // Video detaylarındaki kanal adı
            '#owner #channel-name' // Alternatif kanal adı lokasyonu
        ];

        for (let selector of channelNameSelectors) {
            const element = document.querySelector(selector);
            if (element) {
                const name = element.textContent.trim();
                if (name) return name;
            }
        }

        // Alternatif yöntem: meta verilerden kanal adını al
        const metaName = document.querySelector('meta[itemprop="channelId"]')?.content;
        if (metaName) {
            const channelElement = document.querySelector(`[data-channelid="${metaName}"]`);
            if (channelElement) {
                return channelElement.textContent.trim();
            }
        }
    }

    // Kanal sayfası için kanal adını al
    const selectors = [
        'ytd-channel-name yt-formatted-string.ytd-channel-name',
        '#channel-name yt-formatted-string',
        '#text.ytd-channel-name',
        '#channel-name', // Genel kanal adı container'ı
        '#owner-name a', // Video detaylarındaki kanal adı
        '#owner #channel-name' // Alternatif kanal adı lokasyonu
    ];

    for (let selector of selectors) {
        const element = document.querySelector(selector);
        if (element) {
            const name = element.textContent.trim();
            if (name) return name;
        }
    }

    // URL'den @ handle'ı al
    const match = window.location.href.match(/@([^/]+)/);
    if (match) return '@' + match[1];

    return 'Unknown Channel';
}

// Kanalı kaydet
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
        
        // Kanal URL'sini al
        let channelUrl = window.location.href;
        if (window.location.href.includes('/watch')) {
            const channelElement = document.querySelector('#upload-info #channel-name a');
            if (channelElement) {
                channelUrl = channelElement.href;
            }
        }

        savedChannels[category].push({
            id: channelId,
            name: channelName,
            url: channelUrl
        });
        
        chrome.storage.sync.set({savedChannels}, function() {
            alert('Channel saved successfully! 💖');
        });
    });
}

// Sayfa değişikliklerini daha sık kontrol et
function checkForChanges() {
    // URL kontrolü
    const isChannelPage = window.location.href.includes('/@') || 
                         window.location.href.includes('/channel/');
    const isVideoPage = window.location.href.includes('/watch');

    if (isChannelPage || isVideoPage) {
        addSaveButton();
    }
}

// Sayfa değişikliklerini izle
const observer = new MutationObserver((mutations) => {
    checkForChanges();
});

// Tüm sayfa değişikliklerini izle
observer.observe(document.body, {
    childList: true,
    subtree: true
});

// Sayfa yüklendiğinde ve URL değiştiğinde kontrol et
document.addEventListener('yt-navigate-finish', checkForChanges);
window.addEventListener('load', checkForChanges);

// Daha sık kontrol et
setInterval(checkForChanges, 1000);

// İlk yüklemede kontrol et
checkForChanges();
