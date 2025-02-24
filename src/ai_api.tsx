import parseDataURL from "data-urls";

interface Part {
    text?: string;
    inline_data?: {
        mimeType: string;
        data: string;
    };
}

export function processSubmissionData(submissionData: string): Part[] {
    const dataURL = parseDataURL(submissionData);

    if (!dataURL) {
        return [{ text: `The discussion originates from this submission:\n${submissionData}` }];
    }

    if (!dataURL.mimeType.type.startsWith("image")) {
        return [{ text: `The discussion originates from this submission:\n${submissionData}` }];
    }

    return [
        {
            text: "Please summarize the following comment in relation to the image provided below. Explain how the image content is relevant to the comment's meaning.",
        },
        { inline_data: { mimeType: dataURL.mimeType.toString(), data: submissionData.split(",")[1] } },
    ];
}

export async function getCommentSummary(apiKey: string, commentBody: string, parentComment?: string, submissionData?: string | null): Promise<string> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const parts: Part[] = [{ text: `Please summarize the following comment. Aim for 500 characters or less:\n${commentBody}` }];

    if (parentComment) {
        parts.push({ text: `This comment is a reply to:\n${parentComment}` });
    }

    if (submissionData) {
        parts.push(...processSubmissionData(submissionData));
    }

    // console.log(parts);

    const requestBody = {
        contents: [{ parts }],
        safetySettings: [
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
        ],
    };

    let response;
    try {
        response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            throw new Error(`Request failed with status ${response.status}`);
        }
    } catch (error) {
        console.error("Error generating comment summary:", error);
        return "Failed to generate summary";
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "Failed to generate summary";
}
