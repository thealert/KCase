package com.xiaoju.framework.service.impl;

import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONObject;
import com.xiaoju.framework.constants.BizConstant;
import com.xiaoju.framework.constants.enums.StatusCode;
import com.xiaoju.framework.controller.DirController;
import com.xiaoju.framework.entity.persistent.Biz;
import com.xiaoju.framework.entity.dto.DirNodeDto;
import com.xiaoju.framework.entity.exception.CaseServerException;
import com.xiaoju.framework.entity.persistent.TestCase;
import com.xiaoju.framework.entity.request.dir.DirCreateReq;
import com.xiaoju.framework.entity.request.dir.DirDeleteReq;
import com.xiaoju.framework.entity.request.dir.DirMoveReq;
import com.xiaoju.framework.entity.request.dir.DirRenameReq;
import com.xiaoju.framework.entity.response.dir.DirTreeResp;
import com.xiaoju.framework.mapper.BizMapper;
import com.xiaoju.framework.mapper.TestCaseMapper;
import com.xiaoju.framework.service.DirService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.annotation.Resource;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 文件夹实现类
 *
 * @author hcy
 * @date 2020/11/24
 */
@Service
public class DirServiceImpl implements DirService {

    private static final Logger LOGGER = LoggerFactory.getLogger(DirServiceImpl.class);
    @Resource
    BizMapper bizMapper;

    @Resource
    TestCaseMapper caseMapper;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public DirNodeDto addDir(DirCreateReq request) {
        DirNodeDto root = getDirTree(request.getProductLineId(), request.getChannel());
        checkNodeExists(request.getText(), request.getParentId(), root);
        DirNodeDto dir = getDir(request.getParentId(), root);
        if (dir == null) {
            throw new CaseServerException("目录节点获取为空", StatusCode.INTERNAL_ERROR);
        }

        List<DirNodeDto> children = dir.getChildren();
        DirNodeDto newDir = new DirNodeDto();
        newDir.setId(UUID.randomUUID().toString().substring(0,8));
        newDir.setText(request.getText());
        newDir.setParentId(dir.getId());
        //children.add(newDir);
        if(children!=null && children.size()>0)
            children.add(0,newDir);
        else
            children.add(newDir);

        bizMapper.updateContent(request.getProductLineId(), JSONObject.toJSONString(root), request.getChannel());
        return root;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public DirNodeDto renameDir(DirRenameReq request) {
        DirNodeDto dirTree = getDirTree(request.getProductLineId(), request.getChannel());
        if (!BizConstant.ROOT_BIZ_ID.equalsIgnoreCase(request.getId())) {
            String parentId = getParentIdWithRecursion(request.getId(), dirTree);
            if (null != parentId) {
                checkNodeExists(request.getText(), parentId, dirTree);
            }
        }

        DirNodeDto root = getDirTree(request.getProductLineId(), request.getChannel());
        DirNodeDto dir = getDir(request.getId(), root);
        if (dir == null) {
            throw new CaseServerException("目录节点获取为空", StatusCode.INTERNAL_ERROR);
        }

        dir.setText(request.getText());
        bizMapper.updateContent(request.getProductLineId(), JSONObject.toJSONString(root), request.getChannel());
        return root;
    }



    @Override
    public DirNodeDto delDir(DirDeleteReq request) {
        DirNodeDto root = getDirTree(request.getProductLineId(), request.getChannel());
        DirNodeDto dir = getDir(request.getParentId(), root);
        if (dir == null) {
            throw new CaseServerException("目录节点获取为空", StatusCode.INTERNAL_ERROR);
        }

        Iterator<DirNodeDto> iterator = dir.getChildren().iterator();
        while (iterator.hasNext()) {
            DirNodeDto next = iterator.next();
            if (request.getDelId().equals(next.getId())) {
                iterator.remove();
                break;
            }
        }
        bizMapper.updateContent(request.getProductLineId(), JSONObject.toJSONString(root), request.getChannel());
        return root;
    }

    @Override
    public DirNodeDto getDir(String bizId, DirNodeDto root) {
        if (root == null) {
            return null;
        }
        if (bizId.equals(root.getId())) {
            return root;
        }

        List<DirNodeDto> children = root.getChildren();
        for (DirNodeDto child : children) {
            DirNodeDto dir = getDir(bizId, child);
            if (dir != null) {
                return dir;
            }
        }
        return null;
    }

    @Override
    public DirNodeDto getDirTree(Long productLineId, Integer channel) {
        Biz dbBiz = bizMapper.selectOne(productLineId, channel);
        // 如果有，那么就直接返回
        if (dbBiz != null) {
            return JSONObject.parseObject(dbBiz.getContent(), DirNodeDto.class);
        }

        // 如果没有，则会自动生成一个
        DirNodeDto root = new DirNodeDto();
        root.setId("root");
        root.setText("用例目录");

        Set<String> ids = caseMapper.findCaseIdsInBiz(productLineId, channel);

        DirNodeDto child = new DirNodeDto();
        child.setId("-1");
        child.setParentId(root.getId());
        child.setText("未分类用例集");
        child.setCaseIds(ids);
        root.getChildren().add(child);

        Biz biz = new Biz();
        biz.setProductLineId(productLineId);
        biz.setChannel(channel);
        biz.setContent(JSONObject.toJSONString(root));
        bizMapper.insert(biz);
        root.getCaseIds().addAll(child.getCaseIds());
        return root;
    }

    void filterCaseIds(DirNodeDto root,List<TestCase> list,Long productLineId){

        List<Long> arr = new ArrayList<Long>();
        Set<String> ids=new HashSet<>();
        for(String id : root.getCaseIds()){
            arr.add(Long.parseLong(id));
        }
        if(arr.size()==0){
            arr.add(-1L);
        }
        if(list == null){
            list=caseMapper.search(0,arr,null,null,null,null,null,null,productLineId,null);
        }
        if(arr.size()>0){

            for(TestCase tc:list){
                if(tc.getCase_extype()==0 && arr.contains(tc.getId()))
                    ids.add(tc.getId().toString());
            }
        }

       //LOGGER.info("Dir Case :"+ids.toString());
        root.setCaseIds(ids);

        for (DirNodeDto child : root.getChildren()){

            filterCaseIds(child,list,productLineId);
        }

    }

    @Override
    public DirTreeResp getAllCaseDir(DirNodeDto root,Long productLineId) {
        DirTreeResp resp = new DirTreeResp();

        List<Long> captureIds=caseMapper.getCaptureCaseIds();
        Set<String> captureIdsSet = captureIds.stream()
                .map(Object::toString)
                .collect(Collectors.toSet());

        addChildrenCaseIds(root,captureIdsSet);
        //filterCaseIds(root,null,productLineId);
       // loopDirNode(root,"",new HashSet<>());
        resp.getChildren().add(root);
        return resp;
    }

    @Override
    public List<Long> getCaseIds(Long productLineId, String bizId, Integer channel) {
        DirTreeResp resp = getAllCaseDir(getDirTree(productLineId, channel),productLineId);
        DirNodeDto dir = getDir(bizId, resp.getChildren().get(0));
        if (dir == null) {
            return null;
        }
        Set<String> caseIds = dir.getCaseIds();

//        Set<String> vaild_caseIds=new HashSet<String>();
//        loopDirNode(getDirTree(productLineId, channel),"",vaild_caseIds);
//        Iterator<String> it=caseIds.iterator();
//        while(it.hasNext()){
//            String caseid=it.next();
//            if(!vaild_caseIds.contains(caseid))
//                it.remove();
//        }

        return caseIds.stream().map(Long::valueOf).collect(Collectors.toList());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean moveDir(DirMoveReq req) {
        Biz biz = bizMapper.selectOne(req.getProductLineId(), req.getChannel());
        if (biz == null) {
            throw new CaseServerException("目录节点获取为空", StatusCode.INTERNAL_ERROR);
        }
        DirNodeDto dataObj = JSONObject.parseObject(biz.getContent(), DirNodeDto.class);

        // DFS
        DirMoveDFS dfs = new DirMoveDFS(req.getFromId(), req.getToId());
        dfs.findNodeAndDelete(dataObj);

        if (dfs.getToObj() == null || dfs.getFromObj() == null) {
            throw new CaseServerException("被迁移的文件夹或者要迁移的文件夹不存在", StatusCode.INTERNAL_ERROR);
        }

        Integer pos_index=req.getDp()+1;
        // 剪下来的节点塞到要迁移到的地方去
        dfs.getFromObj().setParentId(dfs.getToObj().getId());
//        dfs.getToObj().getChildren().add(dfs.getFromObj());
        if(pos_index>=0 && pos_index<dfs.getToObj().getChildren().size())
            dfs.getToObj().getChildren().add(pos_index,dfs.getFromObj());
        else
            dfs.getToObj().getChildren().add(dfs.getFromObj());

        biz.setContent(JSON.toJSONString(dataObj));
        bizMapper.update(biz);
        return true;
    }


    private boolean hasDirAuthority(String path){
        List<String> dirlist=new ArrayList<String>();
        dirlist.add("/具体业务名称");
        dirlist.add("/未分类用例集");

        for(String dirpath : dirlist ){
            if(path.contains(dirpath))
                return true;
        }
        return  false;
    }

    public List<String> getDirBusineseNames(DirNodeDto root){
        List<String> businessnames= new ArrayList<String>();
        if(root.getChildren()!=null && root.getChildren().size()>0){
            for(DirNodeDto node : root.getChildren()){
                businessnames.add(node.getText());
            }
        }
        businessnames.add("All（全量）");
        return businessnames;
    }
    public void loopDirNode(DirNodeDto root,String path,Set<String> caseids){
        if (root == null) {
            return;
        }
        //path=path+"/"+root.getText();
        Iterator<DirNodeDto> iterator = root.getChildren().iterator();
        while (iterator.hasNext()){
            DirNodeDto child=iterator.next();
            String curl_path=path+"/"+child.getText();
            LOGGER.info("curl_path : "+curl_path);
            if(hasDirAuthority(curl_path)){

                loopDirNode(child,curl_path,caseids);

                caseids.addAll(child.getCaseIds());
            }

            else{
                iterator.remove();
            }
        }
    }
    /**
     * 将子目录的所有caseId分配到父目录
     *
     * @param root 当前节点
     */
    private void addChildrenCaseIds(DirNodeDto root,Set<String> filterCaseIds){
        if (root == null) {
            return;
        }

        //root.setCaseIds(new HashSet<>());

        for (DirNodeDto child : root.getChildren()){

            addChildrenCaseIds(child,filterCaseIds);

            Set<String> curCaseIds=child.getCaseIds();
            curCaseIds.removeAll(filterCaseIds);
            root.getCaseIds().addAll(curCaseIds);

        }

//        List<Long> arr = new ArrayList<Long>();
//        Set<String> ids=new HashSet<>();
//        for(String id : root.getCaseIds()){
//            arr.add(Long.parseLong(id));
//        }
//        if(arr.size()>0){
//            List<TestCase> list=caseMapper.search(0,arr,null,null,null,null,null,null,1L,null);
//            for(TestCase tc:list){
//                if(tc.getCase_extype()==0)
//                    ids.add(tc.getId().toString());
//            }
//        }
//
//       LOGGER.info("Dir Case :"+ids.toString());
//        //root.setCasenum(ids.size());
//        root.setCaseIds(ids);
    }

    /**
     *  校验同级节点下是否存在相同名字的子节点
     *
     * @param text  节点名称
     * @param parentId  父节点id
     * @param dirNodeDto  节点内容
     */
    private void checkNodeExists(final String text, final String parentId, final DirNodeDto dirNodeDto) {
        if (parentId.equalsIgnoreCase(dirNodeDto.getId())) {
            List<DirNodeDto> childrenNodes = dirNodeDto.getChildren();
            if (childrenNodes.stream().anyMatch(node -> text.equalsIgnoreCase(node.getText()))) {
                throw new CaseServerException("目标节点已存在", StatusCode.NODE_ALREADY_EXISTS);
            }
        }
        List<DirNodeDto> childrenNodes = dirNodeDto.getChildren();
        childrenNodes.forEach(node -> checkNodeExists(text, parentId, node));
    }

    /**
     *  获取当前节点的父节点id
     * @param nodeId ： 节点id
     * @param dirTree： 节点内容
     * @return 返回父节点id或者null
     */
    private String getParentIdWithRecursion(final String nodeId, final DirNodeDto dirTree) {
        if (nodeId.equalsIgnoreCase(dirTree.getId())) {
            return dirTree.getParentId();
        }
        List<DirNodeDto> children = dirTree.getChildren();
        for (DirNodeDto node : children) {
            String parentId = getParentIdWithRecursion(nodeId, node);
            if (parentId != null) {
                return parentId;
            }
        }
        return null;
    }

    @Override
    public String findDirIdByName(Long productLineId, Integer channel, String dirName) {
        if (dirName == null || dirName.isEmpty()) {
            return null;
        }
        DirNodeDto root = getDirTree(productLineId, channel);
        if (root == null || root.getChildren() == null) {
            return null;
        }
        for (DirNodeDto child : root.getChildren()) {
            if (dirName.equals(child.getText())) {
                return child.getId();
            }
        }
        return null;
    }
}
