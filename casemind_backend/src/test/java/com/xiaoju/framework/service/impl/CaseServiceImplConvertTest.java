package com.xiaoju.framework.service.impl;

import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;
import org.junit.Test;

import java.util.Arrays;
import java.util.Collections;

import static org.junit.Assert.*;

public class CaseServiceImplConvertTest {

    private final CaseServiceImpl caseService = new CaseServiceImpl();

    @Test
    public void convertCRToCaseContentShouldAddAiTagWhenPriorityExists() {
        JSONObject node = new JSONObject();
        JSONObject data = new JSONObject();
        JSONArray resource = new JSONArray();
        resource.add("已有标签");
        data.put("text", "CR用例");
        data.put("priority", 2);
        data.put("resource", resource);
        node.put("data", data);
        node.put("children", new JSONArray());

        String caseContent = caseService.convertCRToCaseContent(Collections.singletonList(node), "CR标题");
        JSONObject root = JSONObject.parseObject(caseContent).getJSONObject("root");
        JSONObject childData = root.getJSONArray("children").getJSONObject(0).getJSONObject("data");

        assertEquals(Integer.valueOf(2), childData.getInteger("priority"));
        assertEquals(Arrays.asList("已有标签", "AI"), childData.getJSONArray("resource").toJavaList(String.class));
    }

    @Test
    public void convertSkillToCaseContentShouldAddAiTagToCaseNode() {
        JSONObject node = new JSONObject();
        node.put("caseTitle", "skill用例");
        node.put("caseStep", "执行步骤");
        node.put("caseResult", "预期结果");
        node.put("priority", 3);

        String caseContent = caseService.convertSkillToCaseContent(Collections.singletonList(node), "skill标题");
        JSONObject root = JSONObject.parseObject(caseContent).getJSONObject("root");
        JSONObject caseNode = root.getJSONArray("children").getJSONObject(0);
        JSONObject caseData = caseNode.getJSONObject("data");
        JSONObject stepData = caseNode.getJSONArray("children").getJSONObject(0).getJSONObject("data");
        java.util.List<String> stepResources = stepData.getJSONArray("resource").toJavaList(String.class);

        assertEquals(Integer.valueOf(3), caseData.getInteger("priority"));
        assertEquals(Collections.singletonList("AI"), caseData.getJSONArray("resource").toJavaList(String.class));
        assertEquals(Collections.singletonList("执行步骤"), stepResources);
        assertFalse(stepResources.contains("AI"));
    }
}
