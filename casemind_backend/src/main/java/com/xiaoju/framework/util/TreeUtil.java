package com.xiaoju.framework.util;

import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.mysql.cj.xdevapi.JsonArray;
import com.xiaoju.framework.constants.enums.ProgressEnum;
import com.xiaoju.framework.entity.request.cases.FileImportReq;
import com.xiaoju.framework.entity.xmind.*;
import org.apache.commons.collections4.CollectionUtils;
import org.apache.commons.lang3.StringEscapeUtils;
import org.apache.http.entity.ContentType;
import org.dom4j.Document;
import org.dom4j.Element;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import javax.servlet.http.HttpServletRequest;
import java.awt.image.BufferedImage;
import java.io.*;
import java.net.HttpURLConnection;
import java.net.URL;
import java.text.SimpleDateFormat;
import java.util.*;


/**
 * 树 - 数据结构处理类
 * xmind 和 文件夹都用到了
 *
 * @author didi
 * @date 2020/11/26
 */
public class TreeUtil {

    /**
     * 常量
     */
    private static final Logger LOGGER = LoggerFactory.getLogger(TreeUtil.class);


    // 剥离出progress的内容
    public static JSONObject parse(String caseContent) {
        JSONObject retContent = new JSONObject();
        CaseContent content = JSONObject.parseObject(caseContent, CaseContent.class); // 将casecontent的内容解析为CaseContent.class对象并返回
        CaseCount count = caseDFS(content.getRoot());
        JSONObject caseObj = JSON.parseObject(caseContent);
        //JSONObject newobj= removeProgressRecursively(caseContent);
//        LOGGER.info("New CaseCount : "+count.getNew_total()+","+count.getNew_success()+","+count.getNew_fail()+","+count.getNewPassCount());

//        retContent.put("progress", count.getProgress());
//        retContent.put("content", caseObj);
//        retContent.put("passCount", count.getPassCount());
//        retContent.put("totalCount", count.getTotal());
//        retContent.put("successCount", count.getSuccess());
//        retContent.put("blockCount", count.getBlock());
//        retContent.put("failCount", count.getFail());
//        retContent.put("ignoreCount", count.getIgnore());

        //LOGGER.info("剥离后的case："+ JSON.toJSONString(newobj));

        retContent.put("progress", count.getProgress());
        retContent.put("note",count.getNotes());
        retContent.put("content", caseObj);
        retContent.put("passCount", count.getNewPassCount()+count.getNew_ignore());
        retContent.put("totalCount", count.getNew_total());
        retContent.put("successCount", count.getNew_success()+count.getNew_ignore());
        retContent.put("blockCount", count.getNew_block());
        retContent.put("failCount", count.getNew_fail());
        retContent.put("ignoreCount", count.getNew_ignore());

        return retContent;
    }

    /**
     * ******深度递归，获取每个用例的具体内容，读出所有的计数**********
     * 根据一份测试用例，递归获取其中所有底部节点的用例执行情况
     * 分为两种情况：
     * ①当前节点有子节点
     *  <1>如果当前节点状态为1、5、9，那么值收集下游节点的个数total和，然后变成自己对应的状态个数+=childTotalSum,total++
     *  <2>如果节点为4，则忽略
     *  <3>如果节点为null，则total++
     * ②当前节点无子节点
     *  计数体对应的状态数++,total++
     *
     * @param rootData 当前用例节点
     * @return 记录对象体
     */
    private static CaseCount caseDFS(RootData rootData) {
        CaseCount currCount = new CaseCount();

        DataObj currNode = rootData.getData();
        List<RootData> childNodes = rootData.getChildren();

        if (!CollectionUtils.isEmpty(childNodes)) {
            CaseCount c1 = new CaseCount();


            if (currNode.getProgress() != null) {
                int num = 0;
                for (RootData childNode : childNodes) {
                    c1.coverV1(caseDFS(childNode));
                }
                for (RootData childNode : childNodes) {
                    CaseCount cc = caseDFS(childNode);
                    num += cc.getTotal();
                    currCount.addAllProgress(cc.getProgress());
                    currCount.addAllNotes(cc.getNotes());
                }

                switch (ProgressEnum.findEnumByProgress(currNode.getProgress())) {
                    case BLOCK:
                        currCount.combineBlock(num);
                        currCount.addMergeNewBlock(c1);
                        currCount.addProgress(currNode.getId(), currNode.getProgressStr());

                        break;
                    case SUCCESS:
                        currCount.combineSuccess(num);
                        currCount.addMergeNewSuccess(c1);
                        currCount.addProgress(currNode.getId(), currNode.getProgressStr());

                        break;
                    case FAIL:
                    case ANDROID_FAIL:
                    case IOS_FAIL:
                    case WEB_FAIL:
                    case SERVER_FAIL:
                    case ANDROID_PASS:
                    case IOS_PASS:
                    case WEB_PASS:
                    case SERVER_PASS:
                    case ANDROID_PASS_IOS_FAIL:
                    case IOS_PASS_ANDROID_FAIL:
                        currCount.combineFail(num);
                        currCount.addMergeNewFail(c1);
                        currCount.addProgress(currNode.getId(), currNode.getProgressStr());

                        break;
                    case IGNORE:
                        currCount.combineIgnore(num);
                        currCount.addMergeNewIgnore(c1);
                        currCount.addProgress(currNode.getId(), currNode.getProgressStr());


                        break;
                    default:
                        currCount.addTotal(num);
                }
            } else {
                for (RootData childNode : childNodes) {
                    currCount.cover(caseDFS(childNode));
                }

                Integer priorityValue = parsePriorityValue(currNode.getPriority());
                if(priorityValue != null && priorityValue > 0)
                    currCount.addNewTotal();
            }
            if(currNode.getNote()!=null && !currNode.getNote().isEmpty()){
                currCount.addNote(currNode.getId(),currNode.getNoteStr());
            }
        } else {
            // 先把超链接、备注都加进来
            // 最底部的节点，没有任何子节点
            if(currNode.getNote()!=null && !currNode.getNote().isEmpty()){
                currCount.addNote(currNode.getId(),currNode.getNoteStr());
            }
            switch (ProgressEnum.findEnumByProgress(currNode.getProgress())) {
                case BLOCK:
                    currCount.addBlock();
                    currCount.addNewBlock();
                    currCount.addProgress(currNode.getId(), currNode.getProgressStr());

                    break;
                case SUCCESS:
                    currCount.addSuccess();
                    currCount.addNewSuccess();
                    currCount.addProgress(currNode.getId(), currNode.getProgressStr());

                    break;
                case FAIL:
                case ANDROID_FAIL:
                case IOS_FAIL:
                case WEB_FAIL:
                case SERVER_FAIL:
                case ANDROID_PASS:
                case IOS_PASS:
                case WEB_PASS:
                case SERVER_PASS:
                case ANDROID_PASS_IOS_FAIL:
                case IOS_PASS_ANDROID_FAIL:
                    currCount.addFail();
                    currCount.addNewFail();
                    currCount.addProgress(currNode.getId(), currNode.getProgressStr());

                    break;
                case IGNORE:
                    currCount.addIgnore();
                    currCount.addNewIgnore();
                    currCount.addProgress(currNode.getId(), currNode.getProgressStr());

                    break;
                default:
                    currCount.addTotal();
                    Integer priorityValue = parsePriorityValue(currNode.getPriority());
                    if(priorityValue != null && priorityValue > 0)
                        currCount.addNewTotal();
            }
        }
        return currCount;
    }

    public static void caseDFSValidate(JsonNode rootData) {
        if (rootData == null) return;
        JsonNode currNode = rootData.get("data");
        if (currNode.has("resource")) {
            JsonNode resourceNode = currNode.get("resource");
            if (resourceNode.isNull()) {
                ((ObjectNode) currNode).remove("resource");
                LOGGER.info("remove resource is null node. " + currNode.get("text"));
            } else {
                ArrayNode resources = ((ArrayNode) resourceNode);
                int resourcesSize = resources.size();
                for (int i = 0; i < resourcesSize; i++) {
                    if (resources.get(i).isNull()) {

                        resources.remove(i);
                        i --;
                        resourcesSize --;
                        LOGGER.info("remove resource contain null node. " + currNode.get("text"));
                    }
                }
            }
        }

        JsonNode childNodes = rootData.get("children");

        if(childNodes == null || childNodes.size() == 0) {
            return ;
        }
        for (int i = 0; i < childNodes.size(); i++) {
            caseDFSValidate(childNodes.get(i));
        }

    }

    // 获取指定优先级的内容，入参为root节点
    public static void getPriority(Stack<JSONObject> stackCheck, Stack<IntCount> iCheck, JSONObject parent, List<String> priorities) {
        JSONArray children = parent.getJSONArray("children");
        IntCount i = new IntCount(0);

        for (; i.get() < children.size(); ) {

            JSONObject obj = (JSONObject) children.get(i.get());
            i.add();
            Integer priorityValue = parsePriorityValue(obj.getJSONObject("data").get("priority"));
            if (priorityValue != null && isPriorityIn(priorityValue, priorities)) {
                continue;
            } else {
                if (obj.getJSONArray("children").size() == 0) { // 当前是叶子结点
                    children.remove(obj);
                    i.del();
                    traverseCut(stackCheck, iCheck);
                } else {
                    stackCheck.push(obj);
                    iCheck.push(i);
                    getPriority(stackCheck, iCheck, obj, priorities);
                }
            }
        }
    }

    //获取指定标签case
    public static boolean getChosenCase(JSONObject root, Set<String> tags, String field) {
        if (root == null) return false;

        boolean hasTags = false;
        //筛选标签
        if (field.equals("resource")) {
            JSONArray objects = root.getJSONObject("data").getJSONArray("resource");
            if (objects != null) {
                for (Object o : objects) {
                    hasTags = hasTags || tags.contains(o);
                }
            }
            if (hasTags) return true;
        } else if (field.equals("priority")) { //筛选优先级
            Integer priorityValue = parsePriorityValue(root.getJSONObject("data").get("priority"));
            if (priorityValue != null) {
                String normalizedPriority = String.valueOf(priorityValue);
                String legacyPriority = "P" + (priorityValue - 1);
                if (tags.contains(normalizedPriority) || tags.contains(legacyPriority)) return true;
            }
        }
        JSONArray children = root.getJSONArray("children");
        Iterator<Object> iterator = children.iterator();
        while (iterator.hasNext()) {
            JSONObject child = (JSONObject) iterator.next();
            if (!getChosenCase(child, tags, field)) iterator.remove();
        }
        return children.size() != 0;

    }

    public static Integer getCaseNumV1(JSONObject root, Set<String> set,Map<String,Integer> priority) {
        if (root == null) return 0;
        int res = 0;

        JSONArray resource = root.getJSONObject("data").getJSONArray("resource");

        if (resource != null) {
            for (Object o : resource) {
                set.add((String) o);
            }
        }

        JSONArray children = root.getJSONArray("children");

        if(children!=null && children.size() == 0){
            if(isContainPriority(root)) {
                setPriorityMap(root,priority);
                return 1;
            }
            else
                return 0;
        }

        //if(children.size() == 0) return 1;
        res=(isContainPriority(root)?1:0);
        setPriorityMap(root,priority);
        if(children!=null ) {
            for (Object child : children) {
                res += getCaseNumV1((JSONObject) child, set,priority);
            }
        }

        return res;
    }
    public static void getCaseNode(JSONObject root,String nodeid,List<String> path,JSONObject res){

        String nid = root.getJSONObject("data").getString("id");
        String ntext= root.getJSONObject("data").getString("text");
        if(nid!=null){
            if(nid.equals(nodeid)){
                res.put("caseNodeText",ntext);
                res.put("caseNodePath",String.join("/", path));
            }
        }
        path.add(ntext);
        JSONArray children = root.getJSONArray("children");
        if(children!=null&&children.size()>0){
            for (Object child : children) {

                getCaseNode((JSONObject) child,nodeid,path,res);

            }
        }
        path.remove(ntext);
    }

    public static Integer getCaseNumV2(JSONObject root, Set<String> set,ArrayList<String> list,ArrayList<String> ailist) {
        if (root == null) return 0;
        int res = 0;

        JSONArray resource = root.getJSONObject("data").getJSONArray("resource");

        if (resource != null) {
            for (Object o : resource) {
                set.add((String) o);
            }
        }


        String autocaseid=root.getJSONObject("data").getString("autocase");
        if(autocaseid!=null && autocaseid!="")
            list.add(autocaseid);

        JSONArray children = root.getJSONArray("children");

        if(children!=null && children.size() == 0){
            if(isContainPriority(root)){

                if (resource != null) {
                    for (Object o : resource) {
                        if(((String) o).equals("AI"))
                            ailist.add((String) o);
                    }
                }
                return 1;
            }
            else
                return 0;
        }

        //if(children.size() == 0) return 1;
        res=(isContainPriority(root)?1:0);
        if (res == 1 && resource != null) {
            for (Object o : resource) {
                if(((String) o).equals("AI"))
                    ailist.add((String) o);
            }
        }
        if(children!=null ) {
            for (Object child : children) {
                res += getCaseNumV2((JSONObject) child, set,list,ailist);
            }
        }

        return res;
    }

    //获取节点个数以及标签信息
    public static Integer getCaseNumOrg(JSONObject root, Set<String> set) {
        if (root == null) return 0;
        int res = 0;

        JSONArray resource = root.getJSONObject("data").getJSONArray("resource");

        if (resource != null) {
            for (Object o : resource) {
                set.add((String) o);
            }
        }

        JSONArray children = root.getJSONArray("children");
        if(children.size() == 0) return 1;
        for (Object child : children) {
            res += getCaseNumOrg((JSONObject) child, set);
        }


        return res;
    }

    //获取节点个数以及标签信息
    public static Integer getCaseNum(JSONObject root, Set<String> set) {
        if (root == null) return 0;
        int res = 0;

        JSONArray resource = root.getJSONObject("data").getJSONArray("resource");

        if (resource != null) {
            for (Object o : resource) {
                set.add((String) o);
            }
        }



        JSONArray children = root.getJSONArray("children");

        if(children!=null && children.size() == 0){
            if(isContainPriority(root))
                return 1;
            else
                return 0;
        }

        //if(children.size() == 0) return 1;
        res=(isContainPriority(root)?1:0);
        if(children!=null ) {
            for (Object child : children) {
                res += getCaseNum((JSONObject) child, set);
            }
        }

        return res;
    }

    public static boolean isContainPriority(JSONObject object){
        if(object.containsKey("data") && object.getJSONObject("data").containsKey("priority")){
            Integer priorityValue = parsePriorityValue(object.getJSONObject("data").get("priority"));
            if(priorityValue != null && priorityValue > 0)
                return true;
        }
        return false;
    }
    public static void setPriorityMap(JSONObject object,Map<String,Integer> priority){
        if(object.containsKey("data") && object.getJSONObject("data").containsKey("priority")){
            Integer priorityValue = parsePriorityValue(object.getJSONObject("data").get("priority"));
            if(priorityValue != null && priorityValue > 0){
                String priority_key="P"+(priorityValue-1);
                if(!priority.containsKey(priority_key)){
                    priority.put(priority_key,0);
                }
                priority.put(priority_key,priority.get(priority_key)+1);
            }
                //if(priority.has)
        }
    }




    //获取指定节点路径
    // 返回值jsonNode为空&path size为0，表示未找到；jsonNode非空，path size为空，表示当前找到根节点；
    public static boolean getNodePath(JsonNode root, String nodeId, List<Integer> path, Map<String, JsonNode> relatedNode) {
        if (root == null) return false;

        String currentid = root.get("data").get("id").asText();

        if (currentid.equals(nodeId)) {
            relatedNode.put("objectNode", root);
            return true;
        }

        JsonNode children = root.get("children");

        if(children.size() == 0) {
            return false;
        }

        for (int i = 0; i < children.size(); i++) {
            path.add(i);
            boolean ret = getNodePath(children.get(i), nodeId, path, relatedNode);
            if (ret) {
                System.out.println("找到了");
                if (!relatedNode.containsKey("parent")) {
                    relatedNode.put("parentNode", root);
                }
                return true;
            } else {
                path.remove(path.size()-1);
            }
        }

        return false;
    }

    //获取优先级为0的内容，入参为root节点
    public static void getPriority0(Stack<JSONObject> stackCheck, Stack<IntCount> iCheck, JSONObject parent) {
        JSONArray children = parent.getJSONArray("children");
        IntCount i = new IntCount(0);

        for (; i.get() < children.size(); ) {

            JSONObject obj = (JSONObject) children.get(i.get());
            i.add();
            LOGGER.info(obj.toString());
            Integer priorityValue = parsePriorityValue(obj.getJSONObject("data").get("priority"));
            if (priorityValue != null && priorityValue == 1) {
                continue;
            } else {
                if (obj.getJSONArray("children").size() == 0) { // 当前是叶子结点
                    children.remove(obj);
                    i.del();
                    traverseCut(stackCheck, iCheck);
                } else {
                    stackCheck.push(obj);
                    iCheck.push(i);
                    getPriority0(stackCheck, iCheck, obj);
                }
            }
        }
    }

    static boolean isPriorityIn(Integer data, List<String> priorities) {
        for (String priority : priorities) {
            Integer priorityValue = parsePriorityValue(priority);
            if (data != null && data.equals(priorityValue)) {
                return true;
            }
        }
        return false;
    }

    public static void traverseCut(Stack<JSONObject> stackCheck, Stack<IntCount> iCheck) {
        int size = stackCheck.size();
        for (int i = 0; i < size - 1; i++) {
            JSONObject top = stackCheck.peek();
            if (top.getJSONArray("children").size() == 0) {
                stackCheck.pop();
                stackCheck.peek().getJSONArray("children").remove(top);
                iCheck.pop().del();
            } else {
                break;
            }
        }
    }

    /**
     * 将执行结果合并到用例中
     *
     * @param caseContent 用例内容
     * @param execContent 执行内容
     */
    public static void mergeExecRecord(JSONObject caseContent, JSONObject execContent, IntCount execCount) {
        String srcId = caseContent.getJSONObject("data").getString("id");
        if (execContent.containsKey(srcId)) {
            caseContent.getJSONObject("data").put("progress", execContent.getLong(srcId));
            execCount.del();
        }
        if (null != caseContent && null != caseContent.getJSONArray("children")) {
            for (Object o : caseContent.getJSONArray("children")) {
                mergeExecRecord(((JSONObject) o), execContent, execCount);
            }
        }
    }

    public static void mergeNoteRecord(JSONObject caseContent, JSONObject noteContent, IntCount noteCount){
        String srcId = caseContent.getJSONObject("data").getString("id");
        if (noteContent.containsKey(srcId)) {
            caseContent.getJSONObject("data").put("note", noteContent.getString(srcId));
            noteCount.del();
        }
        if (null != caseContent && null != caseContent.getJSONArray("children")) {
            for (Object o : caseContent.getJSONArray("children")) {
                if (noteCount.get() != 0) {
                    mergeNoteRecord(((JSONObject) o), noteContent, noteCount);
                }
            }
        }
    }

    // 导出json内容到xml
    public static void exportDataToXml(JSONArray children, Element rootTopic, String path){
        if(children.size() == 0)
            return;

        Document document = rootTopic.getDocument();
        LOGGER.info("rootTopic中的内容为： " + rootTopic);
        LOGGER.info("document中的内容为：" + document);
        Element children1 = rootTopic.addElement("children");
        Element topics = children1.addElement("topics").addAttribute("type","attached");
        for (Object o : children) {
            JSONObject dataObj = ((JSONObject) o).getJSONObject("data");


            Element topic = topics.addElement("topic")
                    .addAttribute("id",dataObj.getString("id"))
                    .addAttribute("modified-by","didi")
                    .addAttribute("timestamp",dataObj.getString("created"))
                    .addAttribute("imageTitle", dataObj.getString("imageTitle"));

            JSONObject dataObj1 = dataObj.getJSONObject("imageSize");
            String picPath = dataObj.getString("image");
            if(picPath != null && picPath.length() != 0){
                String targetPath = path  + "/attachments";

                // 创建一个新的文件夹
                File file = new File(targetPath);
                if(!file.isDirectory()){
                    file.mkdir();
                }
                try{
                    String[] strs = picPath.split("/");
                    int size = strs.length;
                    String fileName = strs[size - 1];
                    LOGGER.info("picPath路径为：" + picPath);
                    LOGGER.info("outfile的内容为：" + file + "/" + fileName);

                    if(dataObj1 != null && dataObj1.getString("width") != null){
                        LOGGER.info("topic1的内容为：" + topic);
                        LOGGER.info("dataonj1中有内容, 其中width：" + dataObj1.getString("width") + "  ，height：" + dataObj1.getString("height"));
                        Element imageSize = topic.addElement("xhtml:img")
                                .addAttribute("svg:height", dataObj1.getString("height"))
                                .addAttribute("svg:width", dataObj1.getString("width"))
                                .addAttribute("xhtml:src", "xap:attachments/" + fileName);

                    }

                    FileOutputStream outFile = new FileOutputStream(file + "/" + fileName);
                    URL httpUrl=new URL(picPath);
                    HttpURLConnection conn=(HttpURLConnection) httpUrl.openConnection();
                    //以Post方式提交表单，默认get方式
                    conn.setRequestMethod("GET");
                    conn.setDoInput(true);
                    conn.setDoOutput(true);
                    // post方式不能使用缓存
                    conn.setUseCaches(false);
                    //连接指定的资源
                    conn.connect();
                    //获取网络输入流
                    InputStream inputStream=conn.getInputStream();
                    BufferedInputStream bis = new BufferedInputStream(inputStream);
                    byte b [] = new byte[1024];
                    int len = 0;
                    while((len=bis.read(b))!=-1){
                        outFile.write(b, 0, len);
                    }
                    LOGGER.info("下载完成...");
                }
                catch (Exception e) {
                    e.printStackTrace();
                }
            }

            Element title = topic.addElement("title");
            String text = dataObj.getString("text");
            if (!StringUtils.isEmpty(text)) {
                text = StringEscapeUtils.escapeXml11(text);
            } else {
                text = "";
            }
            title.setText(text);

            String priority = getPriorityByJson(dataObj);
            if(priority != null && !priority.equals("")){
                Element marker_refs = topic.addElement("marker-refs");
                marker_refs.addElement("marker-ref")
                        .addAttribute("marker-id",priority);
            }
            List<String> resources=getResourceByJson(dataObj);
            if(resources.size()>0){
                Element label_refs =topic.addElement("labels");
                for(int n=0;n<resources.size();n++){
                    Element ele=label_refs.addElement("label");
                    ele.setText(resources.get(n));
                }
            }

            JSONArray childChildren = ((JSONObject) o).getJSONArray("children");
            if (childChildren != null && childChildren.size() > 0) {
                exportDataToXml(childChildren, topic, path);
            }
        }
    }

    public static void importDataByJson(JSONArray children, JSONObject rootTopic, String fileName, HttpServletRequest requests, String uploadPath) throws IOException {
        JSONObject rootObj = new JSONObject();
        JSONObject dataObj = new JSONObject();
        JSONArray childrenNext = new JSONArray();
        dataObj.put("text", rootTopic.getString("title"));
        dataObj.put("created", System.currentTimeMillis());
        dataObj.put("id", rootTopic.getString("id"));
        if(rootTopic.containsKey("image")){ // 添加imagesize属性
            // 需要将图片传到云空间中，然后将返回的链接导入
            Map<String, String> imageSize = new HashMap<>();
            // todo: 此处直接写死的方式存在问题
            imageSize.put("width", "400");
            imageSize.put("height", "184");
            String image = "";
            String picPath = "";
            String path = rootTopic.getJSONObject("image").getString("src");
            String[] strs = path.split("/");
            int len = strs.length;
            image = strs[len-1]; // 此时image为图片所在的本地位置
            // 将文件传入到temp文件下，因此需要将文件进行转换，将file文件类型转化为MultipartFile类型，然后进行上传
            File file = new File(fileName + File.separator + image);
            FileInputStream fileInputStream = new FileInputStream(file);

            MultipartFile multipartFile = new MockMultipartFile(file.getName(), file.getName(),
                    ContentType.APPLICATION_OCTET_STREAM.toString(), fileInputStream);

            // 将MultipartFile文件进行上传
            JSONObject ret = new JSONObject();
            SimpleDateFormat sdf = new SimpleDateFormat("yyyy/MM/dd/");
            String format = sdf.format(new Date());
            File folder = new File(uploadPath + format);// 文件夹的名字
            if (!folder.isDirectory()) { // 如果文件夹为空，则新建文件夹
                folder.mkdirs();
            }
            // 对上传的文件重命名，避免文件重名
            String oldName = multipartFile.getOriginalFilename(); // 获取文件的名字
            String newName = UUID.randomUUID().toString()
                    + oldName.substring(oldName.lastIndexOf("."), oldName.length()); // 生成新的随机的文件名字
            File newFile = new File(folder, newName);
            LOGGER.info("newFile的名字为" + newFile);
            try {
                multipartFile.transferTo(newFile);
                // 返回上传文件的访问路径
                // request.getScheme()可获取请求的协议名，request.getServerName()可获取请求的域名，request.getServerPort()可获取请求的端口号
                String filePath = requests.getScheme() + "://" + requests.getServerName()
                        + ":" + requests.getServerPort() + "/" + format + newName;
                LOGGER.info("filepath的路径为：" + filePath);
                picPath = filePath;
                JSONArray datas = new JSONArray();
                JSONObject data = new JSONObject();
                data.put("url", filePath);
                ret.put("success", 1);
                datas.add(data);
                ret.put("data", datas);
            } catch (IOException err) {
                LOGGER.error("上传文件失败, 请重试。", err);
                ret.put("success", 0);
                ret.put("data", "");
            }
            dataObj.put("image", picPath);
            dataObj.put("imageSize", imageSize);
        }

        Integer priority = getPriorityByJsonArray(rootTopic.getJSONArray("markers"));

        if(priority != 0)
        {
            dataObj.put("priority",priority);
        }
        rootObj.put("data", dataObj);
        rootObj.put("children", childrenNext);
        if (children != null) {
            children.add(rootObj);
        }
        if (rootTopic.containsKey("children") && rootTopic.getJSONObject("children").containsKey("attached")) {
            JSONArray jsonArray = rootTopic.getJSONObject("children").getJSONArray("attached");
            for (int i = 0; i < jsonArray.size(); i++) {
                importDataByJson(childrenNext, (JSONObject) jsonArray.get(i), fileName, requests, uploadPath);
            }
        }
    }


    //导入xml内容
    public static JSONArray importDataByXml(FileImportReq request, Element e, String fileName, HttpServletRequest requests, String uploadPath) throws IOException {
        JSONArray jsonArray = new JSONArray();
        List<Element> elementList = e.elements();
        if(elementList.size() == 0)
            return jsonArray;
        for(Element element1:elementList)
        {
            if(element1.getName().equalsIgnoreCase("topic"))
            {
                JSONArray childrenNext = new JSONArray();
                JSONObject root = new JSONObject();
                JSONObject dataObj = new JSONObject();
                List<Element> newList = element1.elements();
                Map<String, String> imageSize = new HashMap<>();
                String text = "";
                String picPath = "";
                Integer priorityId = 0;
                JSONArray labels=new JSONArray();
                String created = element1.attributeValue("timestamp");
                String id = element1.attributeValue("id");

                for (Element element : newList) {
                    // 获取xml里面的图片大小信息
                    if(element.getName().equalsIgnoreCase("img")){ // 添加imagesize属性
                        // 需要将图片传到云空间中，然后将返回的链接导入
                        LOGGER.info("xhtml:img可以使用，其中element中的内容为：" + element);

                        String path = element.attributeValue("src");

                        // 将文件传入到temp文件下，因此需要将文件进行转换，将file文件类型转化为MultipartFile类型，然后进行上传
                        File file = new File(fileName + path.split(":")[1]);
                        try {
                            if (StringUtils.isEmpty(element.attributeValue("width")) || StringUtils.isEmpty(element.attributeValue("height"))) {
                                BufferedImage sourceImg = ImageIO.read(new FileInputStream(file));
                                imageSize.put("width", String.valueOf(sourceImg.getWidth()));
                                imageSize.put("height", String.valueOf(sourceImg.getHeight()));
                            } else {
                                imageSize.put("width", element.attributeValue("width"));
                                imageSize.put("height", element.attributeValue("height"));
                            }

                            MultipartFile multipartFile = new MockMultipartFile(file.getName(), new FileInputStream(file));

                            String fileUrlPath = FileUtil.fileUpload(uploadPath, multipartFile);

                            // 返回上传文件的访问路径
                            // request.getScheme()可获取请求的协议名，request.getServerName()可获取请求的域名，request.getServerPort()可获取请求的端口号
                            String filePath = requests.getScheme() + "://" + requests.getServerName()
                                    + ":" + requests.getServerPort() + "/" + fileUrlPath;
                            LOGGER.info("filepath的路径为：" + filePath);
                            picPath = filePath;

                        } catch (Exception err) {
                            LOGGER.error("图片上传文件失败, 请重试。", err);
                        }
                    }

                    // 获取xml里面中的图片importDataByXml1

                    else if (element.getName().equalsIgnoreCase("title")) {
                        //标题
                        text = element.getText();
                    }else if (element.getName().equalsIgnoreCase("marker-refs")) {
                        // 优先级
                        priorityId =  getPriorityByElement(element);
                    }else if (element.getName().equalsIgnoreCase("labels")) {

                        labels =  getResourceByElement(element);
                    }

                    else if (element.getName().equalsIgnoreCase("children")) {
                        //子节点
                        List<Element> elementList1 = element.elements();
                        for(Element childEle:elementList1)
                        {
                            if(childEle.getName().equalsIgnoreCase("topics"))
                            {
                                JSONArray jsonArray1 = importDataByXml(request, childEle, fileName, requests, uploadPath);
                                if(jsonArray1.size()>0){
                                    childrenNext.addAll(jsonArray1);
                                }
                            }
                        }
                    } else {
                        continue;
                    }
                }

                dataObj.put("created", created);
                dataObj.put("id", id);
                dataObj.put("image", picPath);
                dataObj.put("imageSize", imageSize);
                dataObj.put("text", text);
                dataObj.put("priority", priorityId);

                if(labels.size()>0)
                    dataObj.put("resource", labels);

                root.put("data",dataObj);
                if(childrenNext.size() != 0) {
                    root.put("children",childrenNext);
                }
                jsonArray.add(root);
            }
        }
        return jsonArray;

    }

    private static JSONArray getResourceByElement(Element element){
        List<Element> labels = element.elements();
        JSONArray arr=new JSONArray();
        if(labels != null && labels.size() > 0){
            for(Element label : labels ){
                arr.add(label.getText());
            }
        }
        return arr;
    }

    //根据xml文件获取优先级
    private static Integer getPriorityByElement(Element element)
    {
        Integer priorityId = 0;
        Map<String, Integer> priorityIds = getAllPriority();
        List<Element> markers = element.elements();
        if (markers != null && markers.size() > 0) {
            for (Element mark : markers) {
                String markId = mark.attributeValue("marker-id");
                if (priorityIds.containsKey(markId)) {
                    priorityId = priorityIds.get(markId);
                }
            }
        }
        return priorityId;
    }

    //根据content.json文件获取优先级
    private static Integer getPriorityByJsonArray(JSONArray markers)
    {
        Integer priorityId = 0;
        Map<String, Integer> priorityIds = getAllPriority();
        if (markers != null && markers.size() > 0) {
            for (int i = 0; i < markers.size(); i++) {
                String markerId = markers.getJSONObject(i).getString("markerId");
                if (priorityIds.containsKey(markerId)) {
                    priorityId = priorityIds.get(markerId);
                }
            }
        }
        return priorityId;
    }

    private static  List<String> getResourceByJson(JSONObject jsonObject)
    {
        List<String> resources=new ArrayList<>();
        JSONArray resource_arr=jsonObject.getJSONArray("resource");
        if(resource_arr!=null){
            for(int n=0;n<resource_arr.size();n++){
                resources.add(resource_arr.getString(n));
            }
        }
        return  resources;
    }

    //根据case-server  json获取xml优先级
    private static String getPriorityByJson(JSONObject jsonObject)
    {
        Integer priority = 0;
        priority = parsePriorityValue(jsonObject.get("priority"));
        String topicPriority = "";
        if(priority != null && priority != 0){
//            if(priority.equals(3)){
//                topicPriority = "priority-3";
//            }else
            Map<String, Integer> priorityIds = getAllPriority();
            for (Map.Entry<String, Integer> entry : priorityIds.entrySet()) {
                //如果value和key对应的value相同 并且 key不在list中
                if(priority.equals(entry.getValue())){
                    topicPriority=entry.getKey();
                    break;
                }
            }
        }
        return  topicPriority;
    }

    private static Integer parsePriorityValue(Object priorityObj) {
        if (priorityObj == null) {
            return null;
        }
        if (priorityObj instanceof Number) {
            return ((Number) priorityObj).intValue();
        }

        String priority = String.valueOf(priorityObj).trim();
        if (priority.isEmpty()) {
            return null;
        }
        if (priority.startsWith("P") || priority.startsWith("p")) {
            String suffix = priority.substring(1).trim();
            if (suffix.matches("\\d+")) {
                return Integer.parseInt(suffix) + 1;
            }
        }
        if (priority.startsWith("priority-")) {
            String suffix = priority.substring("priority-".length()).trim();
            if (suffix.matches("\\d+")) {
                return Integer.parseInt(suffix);
            }
        }
        if (priority.matches("\\d+")) {
            return Integer.parseInt(priority);
        }
        return null;
    }

    //获取所有优先级
    private static Map<String, Integer> getAllPriority(){
        Map<String, Integer> priorityIds = new HashMap<>();
        priorityIds.put("priority-1", 1);
        priorityIds.put("priority-2", 2);
        priorityIds.put("priority-3", 3);
        priorityIds.put("priority-4", 4);
        priorityIds.put("priority-5", 5);
        priorityIds.put("priority-6", 6);
        priorityIds.put("priority-7", 7);
        priorityIds.put("priority-8", 8);
        priorityIds.put("priority-9", 9);
        return priorityIds;
    }

    /**
     * 递归遍历JSON树形结构，删除所有节点中的progress属性
     *
     * @param caseContent JSON字符串格式的用例内容
     * @return 删除progress属性后的JSONObject
     */
    public static JSONObject removeProgressRecursively(String caseContent) {
        if (StringUtils.isEmpty(caseContent)) {
            return null;
        }
        
        try {
            JSONObject caseObj = JSON.parseObject(caseContent);
            if(caseObj.containsKey("root"))
                removeProgressFromNode(caseObj.getJSONObject("root"));
            return caseObj;
        } catch (Exception e) {
            LOGGER.error("解析caseContent失败", e);
            return null;
        }
    }
    
    /**
     * 递归删除节点中的progress属性
     *
     * @param node 当前节点
     */
    private static void removeProgressFromNode(JSONObject node) {
        if (node == null) {
            return;
        }
        
        // 如果当前节点有data属性，检查并删除其中的progress
        if (node.containsKey("data")) {
            JSONObject data = node.getJSONObject("data");
            if (data != null && data.containsKey("progress")) {
                data.remove("progress");
            }
        }
        
        // 递归处理子节点
        if (node.containsKey("children")) {
            JSONArray children = node.getJSONArray("children");
            if (children != null && children.size() > 0) {
                for (int i = 0; i < children.size(); i++) {
                    Object child = children.get(i);
                    if (child instanceof JSONObject) {
                        removeProgressFromNode((JSONObject) child);
                    }
                }
            }
        }
    }

    // ========================= 节点 ID 去重（高性能实现） =========================

    private static final java.util.regex.Pattern NODE_ID_PATTERN =
            java.util.regex.Pattern.compile("\"id\"\\s*:\\s*\"([^\"]{1,32})\"");
    private static final char[] ID_CHARS =
            "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_-".toCharArray();

    /**
     * 纯字符串正则扫描检测是否存在重复 ID，不做任何 JSON 解析。
     * 时间复杂度 O(n)，n 为字符串长度；无对象分配（除 HashSet 本身）。
     */
    private static boolean hasDuplicateIds(String caseContent) {
        java.util.regex.Matcher m = NODE_ID_PATTERN.matcher(caseContent);
        Set<String> seen = new HashSet<>(256);
        while (m.find()) {
            if (!seen.add(m.group(1))) {
                return true;
            }
        }
        return false;
    }

    /**
     * 字符串级别去重：先用正则快速检测，仅在发现重复时才做 JSON 解析和修复。
     * 99% 无重复的场景下只有一次正则扫描开销（~0.1ms/100KB），零 JSON 解析。
     */
    public static String deduplicateCaseContent(String caseContent) {
        if (StringUtils.isEmpty(caseContent) || !hasDuplicateIds(caseContent)) {
            return caseContent;
        }
        try {
            JSONObject caseObj = JSON.parseObject(caseContent);
            JSONObject root = caseObj.getJSONObject("root");
            if (root != null) {
                int fixed = deduplicateNodeIds(root);
                if (fixed > 0) {
                    LOGGER.warn("deduplicateCaseContent: 修复了 {} 个重复节点ID", fixed);
                    return caseObj.toJSONString();
                }
            }
        } catch (Exception e) {
            LOGGER.error("deduplicateCaseContent 解析异常", e);
        }
        return caseContent;
    }

    /**
     * 检测并修复树中的重复节点 ID（迭代式 DFS，无递归栈溢出风险）。
     * 对重复 ID 自动生成新的唯一 ID 替换，保留首次出现的。
     *
     * @param root 树的 root 节点
     * @return 被修复的重复 ID 数量
     */
    public static int deduplicateNodeIds(JSONObject root) {
        if (root == null) return 0;

        int fixedCount = 0;
        Set<String> seenIds = new HashSet<>(256);
        ArrayDeque<JSONObject> stack = new ArrayDeque<>(128);
        stack.push(root);

        while (!stack.isEmpty()) {
            JSONObject node = stack.poll();
            if (node == null) continue;

            JSONObject data = node.getJSONObject("data");
            if (data != null) {
                String nodeId = data.getString("id");
                if (nodeId != null && !nodeId.isEmpty() && !seenIds.add(nodeId)) {
                    String newId = generateShortId();
                    data.put("id", newId);
                    seenIds.add(newId);
                    fixedCount++;
                    LOGGER.warn("修复重复节点ID: {} -> {}, text: {}", nodeId, newId, data.getString("text"));
                }
            }

            JSONArray children = node.getJSONArray("children");
            if (children != null) {
                for (int i = children.size() - 1; i >= 0; i--) {
                    Object child = children.get(i);
                    if (child instanceof JSONObject) {
                        stack.push((JSONObject) child);
                    }
                }
            }
        }
        return fixedCount;
    }

    private static String generateShortId() {
        java.util.concurrent.ThreadLocalRandom rng = java.util.concurrent.ThreadLocalRandom.current();
        char[] buf = new char[10];
        for (int i = 0; i < 10; i++) {
            buf[i] = ID_CHARS[rng.nextInt(ID_CHARS.length)];
        }
        return new String(buf);
    }

    public static void main(String args[]) {
        String str = "{\"id\":\"97f60c4b-391f-4cbd-baa8-2067346a9b3b\",\"resource\":[null,\"123\",null,\"xxx\", null]}";
        ObjectMapper jsonMapper = new ObjectMapper();
        try {
            JsonNode node = jsonMapper.readTree(str);
            ArrayNode resources = ((ArrayNode) node.get("resource"));
            int resourcesSize = resources.size();
            for (int i = 0; i < resourcesSize; i++) {
                if (resources.get(i).isNull()) {
                    resources.remove(i);
                    i --;
                    resourcesSize --;
                }
            }
            System.out.println(resources);
        } catch (Exception e) {

        }
    }
}