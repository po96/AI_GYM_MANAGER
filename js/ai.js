// OpenAI API 설정
const OPENAI_API_KEY = process.env.OPENAI_API_KEY; // 여기에 API 키 입력
async function startAnalysis() {
    const uploadedImage = document.getElementById('uploaded-img');
    
    if (!uploadedImage) {
        alert("이미지를 먼저 업로드해주세요.");
        return;
    }

    try {
        // 1. 이미지 압축 및 변환
        const base64Image = await getBase64(uploadedImage);
        console.log("이미지 변환 완료");

        // 2. OpenAI API 호출
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [
                    {
                        role: "system",
                        content: "당신은 관상 전문가입니다. 사진을 분석해 닮은 동물을 하나 정하고 '동물:숫자' 형식으로 답하세요."
                    },
                    {
                        role: "user",
                        content: [
                            { type: "text", text: "이 사람의 얼굴과 가장 닮은 동물을 '동물:확신도' 형식으로만 답해줘." },
                            {
                                type: "image_url",
                                image_url: { "url": base64Image }
                            }
                        ]
                    }
                ],
                max_tokens: 50
            })
        });

        const data = await response.json();

        // API 응답 자체가 에러인 경우 (키 문제 등)
        if (data.error) {
            console.error("API Error Detail:", data.error);
            alert(`OpenAI 에러 발생: ${data.error.message}`);
            return;
        }

        const resultText = data.choices[0].message.content.trim();
        console.log("AI 응답:", resultText);

        // 3. 결과 파싱 및 이동
        const match = resultText.match(/([^: \n]+):([0-9]+)/);
        if (match) {
            const animal = match[1].replace(/['"“”]/g, "").trim();
            const percent = match[2];
            window.location.href = `result.html?animal=${encodeURIComponent(animal)}&match_perc=${percent}`;
        } else {
            alert(`응답 형식이 다릅니다: ${resultText}`);
        }

    } catch (error) {
        console.error("전체 에러:", error);
        alert("네트워크 오류 또는 서버 응답 실패입니다. 인터넷 연결과 API 키를 확인하세요.");
    }
}

// 이미지 리사이징 (API 안정성을 위해 크기 조절)
function getBase64(img) {
    return new Promise((resolve) => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        
        // 최대 너비 500px로 리사이징하여 전송 속도 향상
        const maxWidth = 500;
        const scale = maxWidth / img.naturalWidth;
        canvas.width = maxWidth;
        canvas.height = img.naturalHeight * scale;
        
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.7)); // 품질 0.7로 압축
    });
}