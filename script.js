// DOM 요소들
const apiKeyInput = document.getElementById('apiKey');
const saveApiKeyBtn = document.getElementById('saveApiKey');
const topicInput = document.getElementById('topic');
const moodSelect = document.getElementById('mood');
const generateBtn = document.getElementById('generateLyrics');
const loadingOverlay = document.getElementById('loading');

// 출력 요소들
const lyricsContent = document.getElementById('lyricsContent');
const styleContent = document.getElementById('styleContent');
const sunoContent = document.getElementById('sunoContent');

// 복사 버튼들
const copyLyricsBtn = document.getElementById('copyLyrics');
const copyStyleBtn = document.getElementById('copyStyle');
const copySunoBtn = document.getElementById('copySuno');

// 저장된 API 키 불러오기
function loadApiKey() {
    const savedApiKey = localStorage.getItem('geminiApiKey');
    if (savedApiKey) {
        apiKeyInput.value = savedApiKey;
    }
}

// API 키 저장
function saveApiKey() {
    const apiKey = apiKeyInput.value.trim();
    if (!apiKey) {
        showNotification('API 키를 입력해주세요.', 'error');
        return;
    }
    
    localStorage.setItem('geminiApiKey', apiKey);
    showNotification('API 키가 저장되었습니다!', 'success');
}

// Gemini API 호출
async function callGeminiAPI(prompt) {
    const apiKey = apiKeyInput.value.trim();
    if (!apiKey) {
        throw new Error('API 키가 필요합니다.');
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
    
    const requestBody = {
        contents: [{
            parts: [{
                text: prompt
            }]
        }]
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API 오류: ${errorData.error?.message || '알 수 없는 오류가 발생했습니다.'}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
}

// 가사 생성
async function generateLyrics() {
    const topic = topicInput.value.trim();
    const mood = moodSelect.value;
    
    if (!topic) {
        showNotification('주제를 입력해주세요.', 'error');
        return;
    }

    const apiKey = apiKeyInput.value.trim();
    if (!apiKey) {
        showNotification('API 키를 입력해주세요.', 'error');
        return;
    }

    // 로딩 시작
    loadingOverlay.style.display = 'flex';
    generateBtn.disabled = true;

    try {
        // 프롬프트 구성
        let prompt = `다음 주제로 한국어 노래 가사를 작성해주세요: "${topic}"

요구사항:
1. 한국어로 자연스러운 가사를 작성해주세요
2. 후렴구(코러스)를 포함한 완성된 가사 형태로 작성해주세요
3. 감정이 풍부하고 공감할 수 있는 내용으로 작성해주세요
4. 가사는 3-4절 정도의 적당한 길이로 작성해주세요

출력 형식:
[가사]
(여기에 가사를 작성)

[음악 스타일 추천]
(여기에 음악 스타일을 추천)`;

        if (mood) {
            const moodText = {
                'happy': '행복하고 경쾌한',
                'sad': '슬프고 감성적인',
                'energetic': '활기찬',
                'calm': '차분하고 평화로운',
                'romantic': '로맨틱한',
                'melancholic': '멜랑콜릭한'
            }[mood];
            prompt += `\n\n음악 분위기는 ${moodText} 스타일로 작성해주세요.`;
        }

        const response = await callGeminiAPI(prompt);
        
        // 응답 파싱
        const lyricsMatch = response.match(/\[가사\]([\s\S]*?)(?=\[음악 스타일 추천\]|$)/);
        const styleMatch = response.match(/\[음악 스타일 추천\]([\s\S]*?)$/);
        
        const lyrics = lyricsMatch ? lyricsMatch[1].trim() : response;
        const style = styleMatch ? styleMatch[1].trim() : '음악 스타일 정보를 찾을 수 없습니다.';
        
        // 결과 표시
        displayResults(lyrics, style);
        
    } catch (error) {
        console.error('가사 생성 오류:', error);
        showNotification(`오류가 발생했습니다: ${error.message}`, 'error');
    } finally {
        // 로딩 종료
        loadingOverlay.style.display = 'none';
        generateBtn.disabled = false;
    }
}

// 결과 표시
function displayResults(lyrics, style) {
    // 가사 표시
    lyricsContent.innerHTML = lyrics;
    copyLyricsBtn.style.display = 'block';
    
    // 스타일 표시
    styleContent.innerHTML = style;
    copyStyleBtn.style.display = 'block';
    
    // SUNO AI 포맷 생성
    const sunoFormat = createSunoFormat(lyrics, style);
    sunoContent.innerHTML = sunoFormat;
    copySunoBtn.style.display = 'block';
}

// SUNO AI 포맷 생성
function createSunoFormat(lyrics, style) {
    // 가사에서 줄바꿈을 제거하고 하나의 텍스트로 만들기
    const cleanLyrics = lyrics.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
    
    // 스타일에서 주요 키워드 추출
    const styleKeywords = style.replace(/[^\w\s가-힣]/g, '').split(/\s+/).slice(0, 5).join(', ');
    
    return `🎵 가사:
${cleanLyrics}

🎼 음악 스타일:
${styleKeywords}

📝 SUNO AI 사용법:
1. SUNO AI 웹사이트에 접속
2. 위의 가사를 복사하여 붙여넣기
3. 음악 스타일 키워드를 참고하여 원하는 스타일 선택
4. 생성 버튼 클릭`;
}

// 복사 기능
async function copyToClipboard(text, button) {
    try {
        await navigator.clipboard.writeText(text);
        
        // 버튼 상태 변경
        const originalText = button.innerHTML;
        button.innerHTML = '<i class="fas fa-check"></i> 복사됨!';
        button.classList.add('copied');
        
        setTimeout(() => {
            button.innerHTML = originalText;
            button.classList.remove('copied');
        }, 2000);
        
        showNotification('클립보드에 복사되었습니다!', 'success');
    } catch (error) {
        console.error('복사 오류:', error);
        showNotification('복사에 실패했습니다.', 'error');
    }
}

// 알림 표시
function showNotification(message, type = 'info') {
    // 기존 알림 제거
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    // 스타일 적용
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#00b894' : type === 'error' ? '#e17055' : '#74b9ff'};
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        box-shadow: 0 8px 25px rgba(0,0,0,0.2);
        z-index: 10000;
        display: flex;
        align-items: center;
        gap: 10px;
        font-weight: 500;
        animation: slideInRight 0.3s ease-out;
        max-width: 400px;
    `;
    
    document.body.appendChild(notification);
    
    // 3초 후 자동 제거
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, 3000);
}

// CSS 애니메이션 추가
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// 이벤트 리스너 등록
document.addEventListener('DOMContentLoaded', function() {
    // 저장된 API 키 불러오기
    loadApiKey();
    
    // API 키 저장 버튼
    saveApiKeyBtn.addEventListener('click', saveApiKey);
    
    // 가사 생성 버튼
    generateBtn.addEventListener('click', generateLyrics);
    
    // 복사 버튼들
    copyLyricsBtn.addEventListener('click', () => {
        const lyrics = lyricsContent.textContent;
        copyToClipboard(lyrics, copyLyricsBtn);
    });
    
    copyStyleBtn.addEventListener('click', () => {
        const style = styleContent.textContent;
        copyToClipboard(style, copyStyleBtn);
    });
    
    copySunoBtn.addEventListener('click', () => {
        const suno = sunoContent.textContent;
        copyToClipboard(suno, copySunoBtn);
    });
    
    // Enter 키로 가사 생성
    topicInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            generateLyrics();
        }
    });
    
    // API 키 입력 필드에서 Enter 키
    apiKeyInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            saveApiKey();
        }
    });
    
    // 초기 안내 메시지
    showNotification('뮤직뱅크에 오신 것을 환영합니다! 🎵', 'info');
});

// 페이지 언로드 시 로딩 상태 정리
window.addEventListener('beforeunload', function() {
    loadingOverlay.style.display = 'none';
}); 