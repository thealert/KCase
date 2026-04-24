package com.xiaoju.framework.controller;

import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;
import com.xiaoju.framework.constants.SystemConstant;
import com.xiaoju.framework.constants.enums.StatusCode;
import com.xiaoju.framework.entity.exception.CaseServerException;
import com.xiaoju.framework.entity.request.cases.FileImportReq;
import com.xiaoju.framework.entity.response.cases.ExportExcelResp;
import com.xiaoju.framework.entity.response.cases.ExportFreemindResp;
import com.xiaoju.framework.entity.response.cases.ExportXmindResp;
import com.xiaoju.framework.entity.response.controller.Response;
import com.xiaoju.framework.service.FileService;
import com.xiaoju.framework.util.FileUtil;
import net.coobird.thumbnailator.Thumbnails;
import org.apache.commons.io.IOUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import javax.annotation.Resource;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.validation.constraints.NotNull;
import java.io.File;
import java.io.IOException;
import java.net.URLEncoder;
import java.nio.file.Files;
import java.nio.file.Path;

/**
 * 文件上传与导出
 *
 * @author didi
 * @date 2020/10/22
 */
@RestController
@CrossOrigin
@RequestMapping(value = "/api/file")
public class UploadController {

    private static final Logger LOGGER = LoggerFactory.getLogger(UploadController.class);

    @Resource
    FileService fileService;

    /**
     * 导入x-mind文件并且创建用例
     *
     * @param file 文件
     * @param creator 创建人
     * @param bizId 文件夹id
     * @param productLineId 业务线id
     * @param description 描述
     * @param channel 频道
     * @param requirementId 需求idStr
     * @return 响应体
     */

    @Value("${web.upload-path}")
    private String uploadPath;

    @PostMapping(value = "/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Response<Long> importXmind(@RequestParam MultipartFile file, String creator, String bizId,
                                      Long productLineId, String title, String description, Integer channel, String requirementId, HttpServletRequest request) {
        FileImportReq req = new FileImportReq(file, creator, productLineId, title, description, channel, requirementId, bizId);
        req.validate();
        try {
            return Response.success(fileService.importXmindFile(req, request, uploadPath));
        } catch (CaseServerException e) {
            throw new CaseServerException(e.getLocalizedMessage(), e.getStatus());
        } catch (Exception e) {
            LOGGER.error("[导入x-mind出错] 传参req={},错误原因={}", req.toString(), e.getMessage());
            e.printStackTrace();
            return Response.build(StatusCode.FILE_IMPORT_ERROR.getStatus(), StatusCode.FILE_IMPORT_ERROR.getMsg());
        }
    }

    @PostMapping(value = "/importExcel", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Response<Long> importExcel(@RequestParam MultipartFile file, String creator, String bizId,
                                      Long productLineId, String title, String description, Integer channel, String requirementId, HttpServletRequest request) {
        FileImportReq req = new FileImportReq(file, creator, productLineId, title, description, channel, requirementId, bizId);
        req.validate();
        try {
            return Response.success(fileService.importExcelFile(req, request));
        } catch (CaseServerException e) {
            throw new CaseServerException(e.getLocalizedMessage(), e.getStatus());
        } catch (Exception e) {
            LOGGER.error("[导入x-excel出错] 传参req={},错误原因={}", req.toString(), e.getMessage());
            e.printStackTrace();
            return Response.build(StatusCode.FILE_IMPORT_ERROR.getStatus(), StatusCode.FILE_IMPORT_ERROR.getMsg());
        }
    }

    @PostMapping(value = "/uploadFile", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public JSONObject uploadFile(@RequestParam MultipartFile file, HttpServletRequest request) {
        JSONObject response = new JSONObject();
        Path tempPath = null;
        try {
            // 创建临时文件
            tempPath = Files.createTempFile("temp", file.getOriginalFilename());
            file.transferTo(tempPath.toFile());
            Thumbnails.of(new File(tempPath.toString()))
                    .scale(1f)
                    .outputQuality(0.8f)
                    .toFile(tempPath.toString());
            String fileUrlPath = FileUtil.fileUpload(uploadPath, tempPath.toFile(), file.getOriginalFilename());

            response.put("status", "success");
            response.put("url", buildFileAccessUrl(request, fileUrlPath));

        } catch (Exception e) {
            response.put("status", "error");
            response.put("message", e.getMessage());
        } finally {
            if (tempPath != null) {
                try {
                    Files.deleteIfExists(tempPath);
                } catch (IOException e) {
                    LOGGER.warn("删除临时图片失败: {}", tempPath, e);
                }
            }
        }
        return response;
    }



    @PostMapping(value = "/uploadAttachment", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public JSONObject uploadAttachment(@RequestParam MultipartFile file, HttpServletRequest request) {
        JSONObject ret = new JSONObject();
        try {
            String fileUrlPath = FileUtil.fileUpload(uploadPath, file);

            JSONArray datas = new JSONArray();
            JSONObject data = new JSONObject();
            data.put("url", buildFileAccessUrl(request, fileUrlPath));
            ret.put("success", 1);
            datas.add(data);
            ret.put("data", datas);
            return ret;
        } catch (Exception e) {
            LOGGER.error("上传文件失败, 请重试。", e);
            ret.put("success", 0);
            ret.put("data", "");
            return ret;
        }
    }
    /**
     * 根据caseId导出用例
     * response 文件在http响应中输出
     *
     * @param id 用例id
     */
    @GetMapping(value = "/export")
    public void exportXmind(@RequestParam @NotNull(message = "用例id为空") Long id, HttpServletRequest request, HttpServletResponse response) {
        try {
            ExportXmindResp resp = fileService.exportXmindFile(id, request.getHeader(SystemConstant.HTTP_USER_AGENT));
            populateHttpResponse(response, resp.getData(), resp.getFileName());
        } catch (CaseServerException e) {
            throw new CaseServerException(e.getLocalizedMessage(), e.getStatus());
        } catch (Exception e) {
            LOGGER.error("[导出x-mind错误] caseId={}, 错误原因={}", id, e.getMessage());
            e.printStackTrace();
            response.setStatus(StatusCode.FILE_IMPORT_ERROR.getStatus());
        }
    }

    @GetMapping(value = "/exportFreeMind")
    public void exportFreeMind(@RequestParam @NotNull(message = "用例id为空") Long id, HttpServletRequest request, HttpServletResponse response) {
        try {
            ExportFreemindResp resp = fileService.exportFreeMindFile(id, request.getHeader(SystemConstant.HTTP_USER_AGENT));
            populateHttpResponse(response, resp.getData(), resp.getFileName());
        } catch (CaseServerException e) {
            throw new CaseServerException(e.getLocalizedMessage(), e.getStatus());
        } catch (Exception e) {
            LOGGER.error("[导出free-mind错误] caseId={}, 错误原因={}", id, e.getMessage());
            e.printStackTrace();
            response.setStatus(StatusCode.FILE_IMPORT_ERROR.getStatus());
        }
    }

    @GetMapping(value = "/exportExcel")
    public void exportExcel(@RequestParam @NotNull(message = "用例id为空") Long id, HttpServletRequest request, HttpServletResponse response) {
        try {
            ExportExcelResp resp = fileService.exportExcelFile(id, request.getHeader(SystemConstant.HTTP_USER_AGENT));
            populateHttpResponse(response, resp.getData(), resp.getFileName());
        } catch (CaseServerException e) {
            throw new CaseServerException(e.getLocalizedMessage(), e.getStatus());
        } catch (Exception e) {
            LOGGER.error("[导出excel错误] caseId={}, 错误原因={}", id, e.getMessage());
            e.printStackTrace();
            response.setStatus(StatusCode.FILE_IMPORT_ERROR.getStatus());
        }
    }

    /**
     * DispatchServlet手动扔出响应
     */
    private void populateHttpResponse(HttpServletResponse response, byte[] data, String fileName) throws Exception {
        response.setContentType("application/octet-stream; charset=UTF-8");
        response.setHeader("Content-Disposition", "attachment; fileName=" + fileName + ";filename*=utf-8''" + URLEncoder.encode(fileName, "UTF-8"));
        response.addHeader("Content-Length", "" + data.length);
        response.setStatus(StatusCode.SERVICE_RUN_SUCCESS.getStatus());
        IOUtils.write(data, response.getOutputStream());
    }

    private String buildFileAccessUrl(HttpServletRequest request, String fileUrlPath) {
        return request.getScheme() + "://" + request.getServerName()
                + ":" + request.getServerPort() + "/" + fileUrlPath;
    }
}