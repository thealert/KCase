package com.xiaoju.framework.entity.xmind;

import com.alibaba.fastjson.JSONObject;
import lombok.Data;

/**
 * 用例计算成功、失败、阻塞、总计的结构体
 *
 * @author didi
 * @date 2020/8/17
 */
@Data
public class CaseCount {

    /**
     * 成功用例数
     */
    private int success;

    /**
     * 失败用例数
     */
    private int fail;

    /**
     * 阻塞用例数
     */
    private int block;

    /**
     * 不执行用例数
     */
    private int ignore;

    /**
     * 用例总数
     */
    private int total;


    private  int new_total;
    private  int new_success;
    private  int new_fail;
    private  int new_block;
    private  int new_ignore;

    /**
     * 遍历时把操作记录拉进来
     */
    private JSONObject progress = new JSONObject();
    private JSONObject notes = new JSONObject();

    public void addProgress(String id, Object progressObj) {
        if (progressObj != null) {
            progress.put(id, progressObj);
        }
    }

    public void addNote(String id, Object noteObj){
        if(noteObj != null ){
            notes.put(id,noteObj);
        }
    }

    public void addAllProgress(JSONObject obj) {
        if (obj != null) {
            progress.putAll(obj);
        }
    }

    public void addAllNotes(JSONObject obj){
        if (obj != null) {
            notes.putAll(obj);
        }
    }

    public JSONObject getProgress() {
        return progress;
    }

    /**
     * 获取用例执行数
     * 即失败的+成功的+阻塞的个数总和
     * 表示用户操作过了
     */
    public int getPassCount() {
        return success + fail + block;
    }

    public int getNewPassCount(){
        return new_success + new_fail + new_block;
    }

    /**
     * 这里与直接带参的方法不同
     * 无参方法主要针对最深的叶节点，也就是没有子节点的节点，进行简单的++
     * 而有参方法主要针对根&树干节点，也就是有子节点的节点，需要把最深的叶节点的信息带过来
     */
    public void addSuccess() {
        success ++;
        addTotal();
    }

    public void combineSuccess(int num) {
        clear();
        addTotal(num);
        success = total;
    }

    public void addFail() {
        fail ++;
        addTotal();
    }

    public void combineFail(int num) {
        clear();
        addTotal(num);
        fail = total;
    }

    public void addBlock() {
        block ++;
        addTotal();
    }

    public void combineBlock(int num) {
        clear();
        addTotal(num);
        block = total;
    }

    public void addIgnore() {
        ignore ++;
        // 发现节点为不执行后，当前节点和后续节点total均为0
        total = 0;
    }

    public void combineIgnore(int num) {
        clear();
        ignore = num;
        total = 0;
    }

    public void addTotal() {
        total ++;
    }

    public void addNewTotal(){
        new_total++;
    }

    public void addNewSuccess(){
        new_success++;
        addNewTotal();
    }
    public  void addMergeNewSuccess(CaseCount cc){
        new_success=cc.getNew_success()+1;
        new_fail=cc.getNew_fail();
        new_block=cc.getNew_block();
        new_ignore=cc.getNew_ignore();
        new_total=cc.getNew_total()+1;
    }

    public void addNewFail(){
        new_fail++;
        addNewTotal();
    }
    public  void addMergeNewFail(CaseCount cc){
        new_success=cc.getNew_success();
        new_fail=cc.getNew_fail()+1;
        new_block=cc.getNew_block();
        new_ignore=cc.getNew_ignore();
        new_total=cc.getNew_total()+1;
    }

    public void addNewBlock(){
        new_block++;
        addNewTotal();
    }
    public  void addMergeNewBlock(CaseCount cc){
        new_success=cc.getNew_success();
        new_fail=cc.getNew_fail();
        new_block=cc.getNew_block()+1;
        new_ignore=cc.getNew_ignore();
        new_total=cc.getNew_total()+1;
    }

    public void addNewIgnore(){
        new_ignore++;
        addNewTotal();
    }
    public  void addMergeNewIgnore(CaseCount cc){
        new_success=cc.getNew_success();
        new_fail=cc.getNew_fail();
        new_block=cc.getNew_block();
        new_ignore=cc.getNew_ignore()+1;
        new_total=cc.getNew_total()+1;
    }

    public void addTotal(int num) {
        total += num;
    }

    private void clear() {
        this.success = 0;
        this.block = 0;
        this.fail = 0;
    }


    /**
     * 将别的计数体数据 加到自己身上
     *
     * @param count 另外节点的计数体
     */
    public void cover(CaseCount count) {
        this.success += count.getSuccess();
        this.fail += count.getFail();
        this.block += count.getBlock();
        this.ignore += count.getIgnore();
        this.total += count.getTotal();
        this.progress.putAll(count.progress);
        this.notes.putAll(count.notes);
        this.new_success+=count.getNew_success();
        this.new_fail+=count.getNew_fail();
        this.new_block+=count.getNew_block();
        this.new_ignore+=count.getNew_ignore();
        this.new_total+=count.getNew_total();
    }

    public void coverV1(CaseCount count){
        this.new_success+=count.getNew_success();
        this.new_fail+=count.getNew_fail();
        this.new_block+=count.getNew_block();
        this.new_ignore+=count.getNew_ignore();
        this.new_total+=count.getNew_total();
    }


}
