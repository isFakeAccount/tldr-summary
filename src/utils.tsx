import { Devvit } from "@devvit/public-api";

export type PreprocessDataResponse = {
    commentBody: string;
    parentCommentBody?: string;
    submissionData: string | null;
};

function bufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return `data:image/png;base64,${btoa(binary)}`;
}

async function fetchImageAsBase64(imageUrl: string): Promise<string | null> {
    try {
        // Validate if the URL is an image
        if (!imageUrl.match(/\.(jpeg|jpg|gif|png)$/)) {
            console.warn("The provided URL does not seem to be an image.");
            return null;
        }

        // Fetch the image data
        const response = await fetch(imageUrl);

        if (!response.ok) {
            console.error(`Failed to fetch image: ${response.status} ${response.statusText}`);
            return null;
        }

        // Convert image to base64
        const imageBuffer = await response.arrayBuffer();
        return bufferToBase64(imageBuffer);
    } catch (error) {
        console.error(`Error fetching image: ${(error as Error).message}`);
        return null;
    }
}

export async function preprocessData(ctx: Devvit.Context, targetId: string): Promise<PreprocessDataResponse | null> {
    let submission;
    let parentComment;
    let comment;

    let commentBody;
    let parentCommentBody;
    let submissionData;

    comment = await ctx.reddit.getCommentById(targetId);
    commentBody = comment.body;

    // Check if parent is a comment or submission
    const parentId = comment.parentId;
    if (parentId.startsWith("t1_")) {
        // If parent is a comment
        parentComment = await ctx.reddit.getCommentById(parentId);
        parentCommentBody = parentComment.body;
        submission = await ctx.reddit.getPostById(comment.postId);
    } else {
        // If parent is a submission
        submission = await ctx.reddit.getPostById(parentId);
    }

    if (submission.nsfw) {
        return null;
    }

    // Check if submission is a text submission or not
    if (submission.body === "") {
        submissionData = await fetchImageAsBase64(submission.url);
    } else {
        submissionData = submission.body;
    }

    const preprocessedData: PreprocessDataResponse = { commentBody: commentBody, parentCommentBody: parentCommentBody, submissionData: submissionData };
    return preprocessedData;
}
