package com.xiaoju.framework.service.impl;

import org.apache.commons.lang3.StringUtils;

public final class AiPromptBuilder {

    private AiPromptBuilder() {
    }

    public static String buildPrompt(int queryType, int answerType, String query) {
        String userInput = StringUtils.defaultString(query).trim();
        if (queryType == 1) {
            return buildCasePrompt(answerType, userInput);
        }
        return buildQaPrompt(userInput);
    }

    private static String buildCasePrompt(int answerType, String query) {
        boolean isContinuation = answerType == 1;
        StringBuilder prompt = new StringBuilder();

        prompt.append("你是测试用例脑图生成助手。请严格按以下规则输出，任何偏离都视为错误。\n\n");

        prompt.append("【本次任务】\n");
        if (isContinuation) {
            prompt.append("基于用户给出的已有用例脑图上下文，对现有分支进行\"续写/补充\"，新增缺失的测试点或子用例。\n")
                    .append("不要改写、删除或重复已有节点，只追加新的节点。\n");
        } else {
            prompt.append("根据用户给出的需求描述，从零生成一份完整的测试用例脑图。\n");
        }
        prompt.append('\n');

        prompt.append("【输出格式：严格 JSON，仅允许 JSON 数组，不允许任何其他字符】\n")
                .append("1. 只输出一个顶层 JSON 数组，不要输出 Markdown 代码块标记（不要 ``` 或 ```json）。\n")
                .append("2. 不要输出任何解释性文字、标题、前后缀、注释、换行以外的空白符。\n")
                .append("3. 输出必须能被 JSON.parse 直接解析，所有键名与字符串值都使用英文双引号，不得使用单引号或裸键。\n")
                .append("4. 不要在 JSON 中出现尾随逗号、未转义的换行、未闭合的括号。\n")
                .append("5. 字符串中的双引号、反斜杠、换行必须使用 JSON 标准转义（\\\" \\\\ \\n）。\n")
                .append("6. 除纯文本字段外，字段值不得包含 Markdown、HTML 或 emoji。\n\n");

        prompt.append("【节点结构（kityminder 兼容）】\n")
                .append("每个节点必须严格满足如下形状：\n")
                .append("{\n")
                .append("  \"data\": {\n")
                .append("    \"text\": \"<中文节点文本，必填，非空字符串>\",\n")
                .append("    \"expandState\": \"expand\",\n")
                .append("    \"priority\": <可选，整数 1~4，仅用于具体用例叶子节点；分组/分类节点不要输出该字段>,\n")
                .append("    \"resource\": [\"AI\"]  // 仅对本次新增节点必须包含，且值固定为 [\"AI\"]；未改动的已有节点不要输出 resource\n")
                .append("  },\n")
                .append("  \"children\": [ <同样结构的子节点；无子节点时必须输出空数组 []> ]\n")
                .append("}\n")
                .append("说明：\n")
                .append("- data.text 必填，不允许空串、null、undefined。\n")
                .append("- data.expandState 固定为字符串 \"expand\"。\n")
                .append("- data.priority 只允许整数 1、2、3、4，对应 P0~P3；不要写成 \"P2\" 字符串。\n")
                .append("- data.resource 是字符串数组；新增的 AI 节点必须写成 [\"AI\"]，不要写成 \"AI\" 字符串，也不要写成 [].\n")
                .append("- children 必须为数组，无子节点时为 []，禁止使用 null。\n\n");

        prompt.append("【顶层数组的含义】\n");
        if (isContinuation) {
            prompt.append("顶层数组表示\"要追加到已有脑图中的新节点集合\"。\n")
                    .append("- 每个元素是一棵完整的子树，其根节点的 data.text 必须与用户上下文中某个已存在节点的文本完全一致，表示\"挂载在该节点下\"。\n")
                    .append("- 该根节点的 data 中不要输出 resource、priority（除非它本身就是新增的用例节点）。\n")
                    .append("- 真正新增的子节点全部位于它的 children 中，且每个新增节点必须包含 \"resource\": [\"AI\"]。\n")
                    .append("- 禁止重复已经存在于上下文中的子节点文本。\n")
                    .append("- 如果没有任何可补充的新内容，直接输出空数组 []，不要输出其他字符。\n");
        } else {
            prompt.append("顶层数组一般只有 1 个元素，即整张脑图的根节点（通常是需求/功能名）。\n")
                    .append("根节点下按\"模块 -> 功能点 -> 测试点/用例\"逐层展开。\n")
                    .append("所有节点的 data.resource 均为 [\"AI\"]。\n");
        }
        prompt.append('\n');

        prompt.append("【输出示例（必须严格匹配此形状，文案仅为示意）】\n")
                .append("[\n")
                .append("  {\n")
                .append("    \"data\": {\"text\": \"心率\", \"expandState\": \"expand\"},\n")
                .append("    \"children\": [\n")
                .append("      {\"data\": {\"text\": \"最大值\", \"expandState\": \"expand\", \"priority\": 2, \"resource\": [\"AI\"]}, \"children\": []},\n")
                .append("      {\"data\": {\"text\": \"最小值\", \"expandState\": \"expand\", \"priority\": 2, \"resource\": [\"AI\"]}, \"children\": []}\n")
                .append("    ]\n")
                .append("  }\n")
                .append("]\n\n");

        prompt.append("【自检清单：输出前请逐项核对，不满足则修正后再输出】\n")
                .append("- [ ] 全文只含一个 JSON 数组，开头是 [ 结尾是 ]，没有任何多余字符。\n")
                .append("- [ ] 每个节点都有 data 和 children 两个键。\n")
                .append("- [ ] 每个 data 都有 text 和 expandState。\n")
                .append("- [ ] 所有 children 都是数组，叶子节点为 []。\n")
                .append("- [ ] 所有新增节点都带 \"resource\": [\"AI\"]。\n")
                .append("- [ ] priority 仅出现于用例叶子节点，且为 1~4 的整数。\n")
                .append("- [ ] 没有注释、没有 Markdown、没有多余空行。\n\n");

        prompt.append("【用户输入】\n").append(query);
        return prompt.toString();
    }

    private static String buildQaPrompt(String query) {
        return "你是测试用例助手。请直接回答用户问题，内容清晰、准确、简洁。\n"
                + "如果涉及测试设计，优先给出可执行建议。\n"
                + "用户输入如下：\n"
                + query;
    }
}
