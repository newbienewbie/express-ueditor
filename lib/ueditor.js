const path=require('path');
const readdir=require('./helper/read-dir.js');
const UploadPathHelper=require('./helper/upload-path-helper.js');

class UEditor {

    constructor(customConfig){
        const defaultConfig=require('./config.default.js');
        this.finalConfig=Object.assign({},defaultConfig,customConfig);
        this.uploadPathHelper=new UploadPathHelper(this.finalConfig);
    }
    
    /**
     * 生成一个中间件，用于返回配置
     */
    config() {
        return (req,res,next)=>{
            if(req.query.action =="config"){
                res.send(JSON.stringify(this.finalConfig));
            }else{
                next();
            }
        };
    }
    
    /**
     * 生成一个中间件，用于列出图片，
     * 待完成
     */
    listimage(dir) {
        return (req, res, next) => {

            const fileTypesAllowed = this.config.imageAllowFiles;
            const result = {
                state: 'SUCCESS',
                list: [],
                start: 1,
                total: 0,
            };

            if (req.query.action!="listimage") {
                next();
            } else {
                readdir(dir)
                    .then(
                        (files) => {
                            result.list = files.filter((f) => {
                                let ext = path.extname(f).toLowerCase();
                                return fileTypesAllowed.indexOf(ext) != -1;
                            });
                            result.total = result.list.length;
                            res.send(JSON.stringify(result));
                        }, 
                        (err) => {
                            throw new Error(err);
                        }
                    ).catch(e => {
                        result.state = "FAIL"
                        res.send(JSON.stringify(result));
                    });
            }
        };

    }
    
    /**
     * 生成一个中间件，用于上传图像、文件
     */
    upload() {
        const that=this;
        return (req, res, next) => {
            if (req.method.toLowerCase() != "post"
                && ["uploadimage", "uploadfile", "uploadscrawl", "uploadvideo", "uploadsnapscreen"].indexOf(req.query.action) == -1
            ) {
                next();
            } else {
                const busboy = new Busboy({
                    headers: req.headers
                });

                busboy.on('field', (fieldname, val, fieldnameTruncated, valTruncated, encoding, mimiType) => {
                    console.log(`Field:${val}`);
                });

                busboy.on('file', (fieldname, file, filename, encoding, mimeType) => {
                    console.log(`File:${fieldname},${filename}`);
                    const pattern = that.uploadPathHelper.getPattern(req.query.action);
                    const saveTo = that.uploadPathHelper.getPathWithoutExt(pattern) 
                        + path.extname(filename);
                    const dirname = path.dirname(saveTo);
                    // todo: 检查安全：是否运行上传
                    // todo: 是否超过大小限制

                    const json = {
                        'state': 'SUCCESS',
                        'url': getPath.getUrlPrefix(pattern) + saveTo,
                        'title': filename,
                        'original': filename,
                        'error': "",
                    }
                    // todo: 有没有安全问题？
                    mkdirs(dirname, 0o777)
                        .then(
                        (dirname) => {
                            file.on('end', function () {
                                res.writeHead(200, { 'Connection': 'close' });
                                res.end(JSON.stringify(json));
                                console.log(`文件上传成功 ${saveTo}`);
                            });
                            file.pipe(fs.createWriteStream(saveTo));
                        }, (err) => {
                            json.state='FAIL';
                            json.url="";
                            json.title='';
                            json.original='';
                            json.error=err;
                            res.writeHead(200, { 'Connection': 'close' });
                            res.end(JSON.stringify(json));
                            console.log("xxx", err);
                        }
                        ).catch(err => {
                            json.state='FAIL';
                            json.url="";
                            json.title='';
                            json.original='';
                            json.error=err;
                            res.writeHead(200, { 'Connection': 'close' });
                            res.end(JSON.stringify(json));
                            console.log(err);
                        });
                });

                busboy.on('finish', () => {
                    console.log('busbox处理请求完毕');
                });

                req.pipe(busboy);
            }
        };

    }


}



module.exports= UEditor;