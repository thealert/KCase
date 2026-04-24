package com.xiaoju.framework.service;

import com.xiaoju.framework.entity.dto.DirNodeDto;
import com.xiaoju.framework.entity.request.dir.DirCreateReq;
import com.xiaoju.framework.entity.request.dir.DirDeleteReq;
import com.xiaoju.framework.entity.request.dir.DirMoveReq;
import com.xiaoju.framework.entity.request.dir.DirRenameReq;
import com.xiaoju.framework.entity.response.dir.DirTreeResp;

import java.util.List;
import java.util.Set;

/**
 * 文件夹接口
 *
 * @author didi
 * @date 2020/9/9
 */
public interface DirService {

    /**
     * 增加文件夹
     *
     * @param request 请求体
     * @return 树
     */
    DirNodeDto addDir(DirCreateReq request);

    /**
     * 重命名文件夹
     *
     * @param request 请求体
     * @return 树
     */
    DirNodeDto renameDir(DirRenameReq request);

    /**
     * 删除文件夹
     *
     * @param request 请求体
     * @return 树
     */
    DirNodeDto delDir(DirDeleteReq request);

    /**
     * 获取一个节点的内容
     *
     * @param bizId 节点id
     * @param root 要搜索的树
     * @return 树
     */
    DirNodeDto getDir(String bizId, DirNodeDto root);

    /**
     * 查询文件树
     *
     * @param productLineId 业务线id
     * @param channel 渠道 默认为1
     * @return 树
     */
    DirNodeDto getDirTree(Long productLineId, Integer channel);

    /**
     * 查询文件树，并且给文件树装配caseIds
     *
     * @param root 通过getDirTree传入的整棵树
     * @return 响应体
     */
    DirTreeResp getAllCaseDir(DirNodeDto root,Long productLineId);

    /**
     * 获取当前节点的关联用例
     *
     * @param productLineId 业务线id
     * @param bizId 文件夹id
     * @param channel 渠道
     * @return case-id-list
     */
    List<Long> getCaseIds(Long productLineId, String bizId, Integer channel);

    /**
     * 移动文件夹
     *
     * @param req 请求体
     * @return true 成功，实际上没什么用
     */
    boolean moveDir(DirMoveReq req);


    public void loopDirNode(DirNodeDto root, String path, Set<String> caseids);

    public List<String> getDirBusineseNames(DirNodeDto root);

    /**
     * 在根目录下按名称查找目录节点
     *
     * @param productLineId 业务线id
     * @param channel 渠道
     * @param dirName 目录名称（如 "CR用例生成"）
     * @return 目录节点 id，未找到返回 null
     */
    String findDirIdByName(Long productLineId, Integer channel, String dirName);
}
