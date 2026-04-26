import React ,{ useState, useEffect } from 'react';
const axios = require('axios')
import getQueryString from '@/utils/getCookies'
import envurls from '@/utils/envurls'
import { buildAuthHeaders } from '@/utils/authHeaders'
const getCookies = getQueryString.getCookie
const getEnvUrlbyKey=envurls.getEnvUrlbyKey
import { Modal, Form, Input, Radio, Upload, Button, Icon,message,Slider,InputNumber,Row } from 'antd';

const normalizeImageUrl = url => {
  if (!url || typeof window === 'undefined') return url;
  try {
    const imageUrl = new URL(url, window.location.href);
    const localHosts = ['localhost', '127.0.0.1', '[::1]'];
    if (localHosts.includes(imageUrl.hostname) && !localHosts.includes(window.location.hostname)) {
      imageUrl.protocol = window.location.protocol;
      imageUrl.hostname = window.location.hostname;
      return imageUrl.href;
    }
  } catch (e) {
    return url;
  }
  return url;
};

const ImageModal = (props) => {
  const defaultObj = props.minder.queryCommandValue('Image');
  const { getFieldDecorator, getFieldValue, setFieldsValue } = props.form;
  const { baseUrl = '', uploadUrl = '' } = props;
  const [uploadFinish, setUploadFinish] = useState(true);
  const [widthValue, setWidthValue] = useState(1);
  const [heightValue, setHeightValue] = useState(1);
  const maxImageWidth=800;
  const maxImageHeight=800;
  const onChangeWidth = (value) => {
    //setWidthValue(value)
    //setHeightValue(Math.round(value*defaultObj.imageSize.height/defaultObj.imageSize.width))
    setFieldsValue({
      imageSizeWidth: value,
      imageSizeHeight: Math.round(value*defaultObj.imageSize.height/defaultObj.imageSize.width),
    });
  };

  const onChangeHeight = (value) => {
   // setWidthValue(Math.round(value*defaultObj.imageSize.width/defaultObj.imageSize.height))
    //setHeightValue(value)
    setFieldsValue({
      imageSizeWidth: Math.round(value*defaultObj.imageSize.width/defaultObj.imageSize.height),
      imageSizeHeight: value,
    });
  };

  const onOk = () => {

     
    if(!uploadFinish){
      message.warn("请等待上传完成")
      return
    }
      
    const { form, minder, onCancel } = props;
    form.validateFields((err, values) => {
      if (err) {
        console.log('Received values of form: ', values);
        return;
      }
      const params = { ...values };
      console.log(params)

      if(params.url && params.url!==""){
        params.url = normalizeImageUrl(params.url);
        if(params.imageSizeWidth && params.imageSizeHeight){
          
          minder.execCommand('image', params.url, params.title,params.imageSizeWidth,params.imageSizeHeight);
        }
        else
          minder.execCommand('image', params.url, params.title);
      }
      
      else{
        for(var i=0;i<params.upload.length;i++){
          //console.log(params.upload[i])
          minder.execCommand('image', normalizeImageUrl(params.upload[i].thumbUrl), params.title);
        }
      }
        
      setTimeout(() => {
        onCancel();
      }, 300);
    });
  };
  const normFile = (e) => {
    if (Array.isArray(e)) {
      return e;
    }
    if (e) {
      const fileList = e.file.status === 'removed' ? [] : [e.file];
      return e && fileList;
    }
  };
  const onImageChange = (e) => {
     
    if (e.file.status === 'done') {
      const { response = {} } = e.file;
      
      setFieldsValue({ url: response ? normalizeImageUrl(response) : '' });
      
    }
  };
  const onTypeChange = (value) => {
    if (value === 'upload') {
      getFieldDecorator('url');
    }
    return value;
  };

 
    const customRequest = async (options) => {  
      
      setUploadFinish(false)
      const { onSuccess, onError, file, onProgress } = options;  
      const formData = new FormData()
        formData.append('file', file)
        
        axios.post(baseUrl + '/file/uploadFile', formData, {
          headers: buildAuthHeaders({
            'Content-Type': 'multipart/form-data',
            Username: getCookies('username'),
          }),
          onUploadProgress: function(progressEvent) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress({ percent: percentCompleted, file});
            // You can update the UI here to show the upload progress
          }
        })
        .then(function (response) {
          console.log('Success:', response.data);
         
          onSuccess(normalizeImageUrl(response.data.url)); 
          setUploadFinish(true)
          
        })
        .catch(function (error) {
          
          onError('upload error');  
          setUploadFinish(true)
        });
      }
    


   
  const fileUpload = function(info){

    console.log(info)
    const formData = new FormData()
    formData.append('file', info.file)

    // var reader = new FileReader();
        
    // reader.onload = function(e) {
    //     console.log('XXXX');
        
    //     console.log(e.target.result); // 打印出Base64字符串
    //    // picbase64=e.target.result
    //     // 可以将e.target.result用作图像的src来显示图像或发送到服务器
    // };
    
    // reader.readAsDataURL(info.file); // 将文件读取为DataURL
    
    axios({
      method: 'post',
      url: baseUrl + '/file/uploadFile',
      data: formData,
      headers: buildAuthHeaders({
        'Content-Type': 'multipart/form-data',
        Username: getCookies('username'),
      })
    })
    .then(function (response) {
      console.log('Success:', response);
      
    })
    .catch(function (error) {
      console.log('Error:', error);
    });

  };

  return (
    <Modal
      title="图片"
      className="agiletc-modal"
      visible={props.visible}
      onOk={onOk}
      onCancel={props.onCancel}
    >
      <Form layout="vertical">
        <Form.Item>
          {getFieldDecorator('type', {
            initialValue: props.imageType=='add'?'upload':'out',
            normalize: onTypeChange,
          })(
            <Radio.Group>
              <Radio.Button value="upload">上传图片</Radio.Button>
              <Radio.Button value="out">外链图片</Radio.Button>
              
            </Radio.Group>
          )}
        </Form.Item>
        {getFieldValue('type') === 'out' ? (
          <Form.Item label="图片地址">
            {getFieldDecorator('url', {
              rules: [
                {
                  required: true,
                  message: '必填：以 http(s):// 或 ftp:// 开头',
                },
              ],
              initialValue: defaultObj.url,
            })(<Input placeholder="必填：以 http(s):// 或 ftp:// 开头" />)}
          </Form.Item>
        ) : (
          <Form.Item label="上传图片">
            {getFieldDecorator('upload', {
              rules: [{ required: true, message: '请上传图片！' }],
              valuePropName: 'fileList',
              normalize: normFile,
            })(
              <Upload
                //action={baseUrl + uploadUrl}
                
                customRequest={customRequest}
                name="file"
                listType="picture"
                accept="image/*"
                withCredentials
                onChange={onImageChange}
              >
                <Button>
                  <Icon type="upload" /> 点击上传
                </Button>
              </Upload>
            )}
          </Form.Item>
        )}

        <Form.Item label="提示文本">
          {getFieldDecorator('title', {
            initialValue: defaultObj.title,
          })(<Input placeholder="选填：鼠标在图片上悬停时提示的文本" />)}
        </Form.Item>

        {props.imageModle === 'edit' && (<Form.Item label="图片宽度">
          {getFieldDecorator('imageSizeWidth', {
            initialValue: defaultObj.imageSize.width,
          })(
          <Slider
            min={1}
            max={maxImageWidth}
            onChange={onChangeWidth}
            tooltipVisible
            value={typeof widthValue === 'number' ? widthValue : 0}
          />)}
        </Form.Item> )}

        {props.imageModle === 'edit' && (<Form.Item label="图片高度">
          {getFieldDecorator('imageSizeHeight', {
            initialValue: defaultObj.imageSize.height,
          })( <Slider
            min={1}
            max={maxImageWidth}
            onChange={onChangeHeight}
            tooltipVisible
            value={typeof heightValue === 'number' ? heightValue : 0}
          />)}
        </Form.Item>)}


      </Form>
    </Modal>
  );
};
const WrappedImageForm = Form.create({ name: 'image' })(ImageModal);
export default WrappedImageForm;
