export const config = {
    runtime: 'edge', 
};

export default async function handler(req) {
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
    }

    try {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            return new Response(JSON.stringify({ error: 'Server Error: OPENAI_API_KEY is missing in Vercel Settings.' }), { status: 500 });
        }

        const requestBody = await req.json();
        const image = requestBody.image;
        
        if (!image) {
            return new Response(JSON.stringify({ error: 'No image provided' }), { status: 400 });
        }

        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [
                    {
                        role: "user",
                        content: [
                            { type: "text", text: "You are a Professional Gym Trainner. Analyze fitness form. Give 1 short correction in Korean (max 15 words). If good, say '잘하고 있어요!'." },
                            { type: "image_url", image_url: { "url": image } }
                        ]
                    }
                ],
                max_tokens: 50
            })
        });

        const data = await response.json();
        
        if (data.error) {
            return new Response(JSON.stringify({ error: "OpenAI Error: " + data.error.message }), { status: 500 });
        }

        return new Response(JSON.stringify({ advice: data.choices[0].message.content }), { status: 200 });

    } catch (error) {
        return new Response(JSON.stringify({ error: "Crash: " + error.message }), { status: 500 });
    }
}