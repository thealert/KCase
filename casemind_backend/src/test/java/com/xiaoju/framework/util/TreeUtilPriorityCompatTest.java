package com.xiaoju.framework.util;

import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;
import org.junit.Test;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Set;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;

public class TreeUtilPriorityCompatTest {

    @Test
    public void shouldCountCaseWhenPriorityUsesLegacyP0Format() {
        JSONObject root = buildLeafNode("P0");

        Integer caseNum = TreeUtil.getCaseNumV2(root, new HashSet<>(), new ArrayList<>(), new ArrayList<>());

        assertEquals(Integer.valueOf(1), caseNum);
    }

    @Test
    public void shouldAggregateLegacyP0PriorityIntoPriorityMap() {
        JSONObject root = buildLeafNode("P0");
        HashMap<String, Integer> priorityMap = new HashMap<>();

        Integer caseNum = TreeUtil.getCaseNumV1(root, new HashSet<>(), priorityMap);

        assertEquals(Integer.valueOf(1), caseNum);
        assertEquals(Integer.valueOf(1), priorityMap.get("P0"));
    }

    @Test
    public void shouldMatchPriorityFilterForLegacyAndNormalizedFormats() {
        Set<String> legacyPriority = new HashSet<>(Collections.singletonList("P0"));
        Set<String> normalizedPriority = new HashSet<>(Collections.singletonList("1"));

        assertTrue(TreeUtil.getChosenCase(buildLeafNode("P0"), legacyPriority, "priority"));
        assertTrue(TreeUtil.getChosenCase(buildLeafNode("P0"), normalizedPriority, "priority"));
    }

    private JSONObject buildLeafNode(String priority) {
        JSONObject data = new JSONObject();
        data.put("text", "case");
        data.put("priority", priority);

        JSONObject root = new JSONObject();
        root.put("data", data);
        root.put("children", new JSONArray());
        return root;
    }
}
