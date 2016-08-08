
为 [ueditor](http://ueditor.baidu.com/website/) 编写的Express服务端中间件。

## 入口程序：UEditor

示例：

```JavaScript
const app=express();
const router=express.Router();

const ueditor=new UEditor({
    //...如果不提供，则使用默认参数
});

router.use("/controller",ueditor.config());
router.use("/controller",ueditor.upload('uploadimage'));
router.use("/controller",ueditor.upload('uploadfile'));

app.use(router);
```

会根据ueditor前端传来的actionz做出响应

## api

### config()

生成配置中间件。当ueditor前端传来的action=config时，会自动根据服务端的配置来返回JSON字符串给前端。

### upload(actionStr)

生成上传中间件：用于根据服务端配置的actionStr的不同，生成不同的中间件，处理图像上传、文件上传、视频上传、涂鸦上传、和远程抓取上传。

前端上传文件时，会向后端相应URL发送请求，QueryString中带上action=`uploadimage`、`uploadfile`之类的参数

## todo

* listimage暂时之搭建了一个框架
* 更方便的路由配置