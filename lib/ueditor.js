const path=require('path');
const fs=require('fs');
const url=require('url');
const Busboy=require('busboy');

const mkdirs=require('./helper/mk-dirs.js');
const readdir=require('./helper/read-dir.js');
const UploadPathHelper=require('./helper/upload-path-helper.js');
const getItemInConfig=require('./helper/get-item-in-config.js');
const getPatternViaAction=require('./helper/get-pattern-via-action.js');

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
            const query=url.parse(req.url,true).query ;
            if(query && query.action && query.action=="config"){
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

            // const fileTypesAllowed = this.config.imageAllowFiles;
            // const result = {
            //     state: 'SUCCESS',
            //     list: [],
            //     start: 1,
            //     total: 0,
            // };

            // if (req.query.action!="listimage") {
            //     next();
            // } else {
            //     readdir(dir)
            //         .then(
            //             (files) => {
            //                 result.list = files.filter((f) => {
            //                     let ext = path.extname(f).toLowerCase();
            //                     return fileTypesAllowed.indexOf(ext) != -1;
            //                 });
            //                 result.total = result.list.length;
            //                 res.send(JSON.stringify(result));
            //             },
            //             (err) => {
            //                 throw new Error(err);
            //             }
            //         ).catch(e => {
            //             result.state = "FAIL"
            //             res.send(JSON.stringify(result));
            //         });
            // }
        };

    }

    /**
     * 生成一个中间件，用于上传图像、文件
     */
    upload(actionStr) {
        const that=this;
        return (req, res, next) => {
            const action=actionStr || "uploadfile";
            const contentType=req.header('Content-Type');
            if (req.method.toLowerCase() != "post"){
                next();
            }else if(action != req.query.action){
                next();
            }else if(!contentType ) {
                console.log(contentType);
                next();
            } else {
                const pattern =getPatternViaAction(req.query.action);
                const fileSize=getItemInConfig(pattern,"FileSize",that.finalConfig);
                // 从busboy源码分析来看，
                // 而众多的 headers 事实上目前只解析了 content-type;
                const busboy = new Busboy({
                    headers: {
                        'content-type':contentType,
                    },
                    limits:{
                        fileSize:fileSize
                    },
                });

                busboy.on('field', (fieldname, val, fieldnameTruncated, valTruncated, encoding, mimiType) => {
                    res.send(`field $(fieldname)`);
                    console.log(`Field:${val}`);
                });

                busboy.on('file', (fieldname, file, filename, encoding, mimeType) => {
                    console.log(`File:${fieldname},${filename}`);
                    const extname=path.extname(filename);
                    const saveTo = that.uploadPathHelper.getPathWithoutExt(pattern) + extname;
                    const dirname = path.dirname(saveTo);
                    // todo: 检查安全：是否允许上传
                    const allowedFiles=getItemInConfig(pattern,"AllowFiles",that.finalConfig);
                    const json = {
                        'state': 'SUCCESS',
                        'url': that.uploadPathHelper.getUrlPrefix(pattern) + saveTo,
                        'title': filename,
                        'original': filename,
                        'error': "",
                    }
                    // todo: 有没有安全问题？
                    if(allowedFiles.indexOf(extname)==-1){
                        json.state = 'FAIL';
                        json.url = '';
                        json.title = '';
                        json.original = '';
                        json.error = '错误的文件类型';
                        req.on('end', function () {
                            res.writeHead(200, { 'Connection': 'close' });
                            res.end(JSON.stringify(json));
                            console.log(`文章上传被拒绝：${json.error}`);
                        });
                    }else{
                        mkdirs(dirname, 0o777)
                        .then(
                            (dirname) => {
                                file.on('end', function () {
                                    res.writeHead(200, { 'Connection': 'close' });
                                    res.end(JSON.stringify(json));
                                    console.log(`文件上传成功 ${saveTo}`);
                                });
                                file.pipe(fs.createWriteStream(saveTo));
                            },
                            (err) => {
                                json.state = 'FAIL';
                                json.url = "";
                                json.title = '';
                                json.original = '';
                                json.error = err;
                                res.writeHead(200, { 'Connection': 'close' });
                                res.end(JSON.stringify(json));
                                console.log("xxx", err);
                            }
                        ).catch(err => {
                            json.state = 'FAIL';
                            json.url = "";
                            json.title = '';
                            json.original = '';
                            json.error = err;
                            res.writeHead(200, { 'Connection': 'close' });
                            res.end(JSON.stringify(json));
                            console.log(err);
                        });
                    }

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