// 常量定义
const API_ENDPOINT = 'https://oneapi.adhmt.us/v1/chat/completions';
const STORAGE_KEYS = {
    API_KEY: 'translator_api_key',
    MODEL: 'translator_model'
};

// DOM 元素
const elements = {
    sourceText: document.getElementById('sourceText'),
    targetText: document.getElementById('targetText'),
    sourceLanguage: document.getElementById('sourceLanguage'),
    targetLanguage: document.getElementById('targetLanguage'),
    modelSelect: document.getElementById('modelSelect'),
    settingsBtn: document.getElementById('settingsBtn'),
    settingsModal: document.getElementById('settingsModal'),
    closeSettings: document.getElementById('closeSettings'),
    apiKeyInput: document.getElementById('apiKey'),
    saveSettings: document.getElementById('saveSettings'),
    cancelSettings: document.getElementById('cancelSettings'),
    togglePassword: document.getElementById('togglePassword')
};

// 初始化
function init() {
    loadStoredSettings();
    setupEventListeners();
    setupPasswordToggle();
    setupCopyButton();
}

// 加载存储的设置
function loadStoredSettings() {
    const storedApiKey = localStorage.getItem(STORAGE_KEYS.API_KEY);
    const storedModel = localStorage.getItem(STORAGE_KEYS.MODEL);

    if (storedApiKey) {
        elements.apiKeyInput.value = storedApiKey;
    }
    if (storedModel) {
        elements.modelSelect.value = storedModel;
    }
}

// 设置事件监听器
function setupEventListeners() {
    // 源文本变化时自动翻译
    let translationTimeout;
    elements.sourceText.addEventListener('input', () => {
        clearTimeout(translationTimeout);
        translationTimeout = setTimeout(translate, 1000);
    });

    // 语言选择变化时翻译
    elements.sourceLanguage.addEventListener('change', translate);
    elements.targetLanguage.addEventListener('change', translate);
    elements.modelSelect.addEventListener('change', () => {
        localStorage.setItem(STORAGE_KEYS.MODEL, elements.modelSelect.value);
        translate();
    });

    // 设置相关事件
    elements.settingsBtn.addEventListener('click', showSettingsModal);
    elements.closeSettings.addEventListener('click', hideSettingsModal);
    elements.cancelSettings.addEventListener('click', hideSettingsModal);
    elements.saveSettings.addEventListener('click', saveSettings);

    // 点击模态框外部关闭
    elements.settingsModal.addEventListener('click', (e) => {
        if (e.target === elements.settingsModal) {
            hideSettingsModal();
        }
    });

    // 按ESC键关闭模态框
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !elements.settingsModal.classList.contains('hidden')) {
            hideSettingsModal();
        }
    });
}

// 设置密码显示切换
function setupPasswordToggle() {
    elements.togglePassword.addEventListener('click', () => {
        const type = elements.apiKeyInput.type === 'password' ? 'text' : 'password';
        elements.apiKeyInput.type = type;
        elements.togglePassword.innerHTML = `<i class="fas fa-${type === 'password' ? 'eye' : 'eye-slash'}"></i>`;
    });
}

// 显示设置模态框
function showSettingsModal() {
    elements.settingsModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

// 隐藏设置模态框
function hideSettingsModal() {
    elements.settingsModal.classList.add('hidden');
    document.body.style.overflow = '';
}

// 保存设置
function saveSettings() {
    const apiKey = elements.apiKeyInput.value.trim();
    if (apiKey) {
        localStorage.setItem(STORAGE_KEYS.API_KEY, apiKey);
        hideSettingsModal();
        showToast('设置已保存');
        translate();
    } else {
        showToast('请输入有效的API密钥', 'error');
    }
}

// 显示提示消息
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `fixed bottom-4 right-4 px-6 py-3 rounded-xl shadow-lg ${
        type === 'success' ? 'bg-green-500' : 'bg-red-500'
    } text-white transform transition-all duration-300 translate-y-20 opacity-0`;
    toast.textContent = message;
    document.body.appendChild(toast);

    // 动画显示
    setTimeout(() => {
        toast.classList.remove('translate-y-20', 'opacity-0');
    }, 100);

    // 3秒后隐藏
    setTimeout(() => {
        toast.classList.add('translate-y-20', 'opacity-0');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// 翻译功能
async function translate() {
    const sourceText = elements.sourceText.value.trim();
    if (!sourceText) {
        elements.targetText.value = '';
        return;
    }

    const apiKey = localStorage.getItem(STORAGE_KEYS.API_KEY);
    if (!apiKey) {
        elements.targetText.value = '请先设置API密钥';
        showSettingsModal();
        return;
    }

    const sourceLang = elements.sourceLanguage.value;
    const targetLang = elements.targetLanguage.value;
    const model = elements.modelSelect.value;

    try {
        elements.targetText.value = '翻译中...';
        
        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: model,
                messages: [
                    {
                        role: "system",
                        content: `You are a professional translator. Translate the following text from ${sourceLang} to ${targetLang}. Provide only the translation without any explanations or notes.`
                    },
                    {
                        role: "user",
                        content: sourceText
                    }
                ],
                temperature: 0.3
            })
        });

        if (!response.ok) {
            throw new Error('翻译请求失败');
        }

        const data = await response.json();
        elements.targetText.value = data.choices[0].message.content.trim();
    } catch (error) {
        console.error('Translation error:', error);
        elements.targetText.value = '翻译出错，请重试';
        showToast('翻译失败，请检查网络连接或API密钥是否正确', 'error');
    }
}

// 添加新的复制按钮设置函数
function setupCopyButton() {
    const copyButton = document.getElementById('copyButton');
    if (!copyButton) {
        console.error('Copy button not found');
        return;
    }

    copyButton.addEventListener('click', async () => {
        const textToCopy = elements.targetText.value;
        if (!textToCopy) {
            console.log('No text to copy');
            return;
        }

        try {
            await navigator.clipboard.writeText(textToCopy);
            showToast('已复制到剪贴板');
        } catch (err) {
            console.error('Copy failed:', err);
            showToast('复制失败，请手动复制', 'error');
        }
    });
}

// 初始化应用
init();
