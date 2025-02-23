import { Devvit } from "@devvit/public-api";
import { getCommentSummary } from "./ai_api.js";
import { preprocessData } from "./utils.js";
Devvit.configure({ redditAPI: true, http: true });

Devvit.addSettings([
    {
        name: "Gemini-API-Key",
        label: "Gemini API Key",
        type: "string",
        scope: "installation",
        helpText: "Enter your Gemini API Key here",
    },
]);

const summaryCard = Devvit.createForm(
    (data) => {
        return {
            fields: [
                {
                    name: "commentSummary",
                    label: "COMMENT SUMMARY",
                    type: "paragraph",
                    defaultValue: `${data.commentSummary}`,
                    disabled: false,
                    lineHeight: 10,
                    helpText: "NOTE: This is an AI-generated summary of the comment and may not be fully accurate.",
                },
            ],
            title: `TL;DR Comment Summary`,
            acceptLabel: "OK",
        };
    },
    async (_) => {}
);

Devvit.addMenuItem({
    label: "TL;DR Summary",
    location: ["comment"],
    onPress: async (event, ctx) => {
        const apiKey = (await ctx.settings.get("Gemini-API-Key")) as string;
        const preprocessedData = await preprocessData(ctx, event.targetId);

        if (preprocessedData === null || preprocessedData === undefined) {
            return ctx.ui.showForm(summaryCard, { commentSummary: "Error: 403 Forbidden!" });
        }

        const CommentSummary = await getCommentSummary(
            apiKey,
            preprocessedData.commentBody,
            preprocessedData.parentCommentBody,
            preprocessedData.submissionData
        );

        return ctx.ui.showForm(summaryCard, { commentSummary: CommentSummary });
    },
});

export default Devvit;
