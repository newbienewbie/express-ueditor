const UEditor = require('../lib/ueditor');
const defaultConfig = require('../lib/config.default.js');

const fs = require('fs');
const path=require('path');
const assert = require('assert');
const express = require('express');
const supertest = require('supertest');


describe('测试UEditor::upload()方法', function () {

    it('非指定的HTTP 方法，不会触发上传', function (done) {
        const app = express();
        const ueditor = new UEditor({});
        app.use("/testeditor", ueditor.upload());
        supertest(app)
            .get("/testeditor")
            .query({
                action:"uploadimage"
            })
            .end(function (err, res) {
                if (err) {
                    throw (err);
                } else {
                    done();
                }
            });
    });


    it('非指定的action，不会触发上传', function (done) {
        const app = express();
        const ueditor = new UEditor({});
        app.use("/testeditor", ueditor.upload());
        supertest(app)
            .post("/testeditor")
            .query({
                action: "upload-image"
            })
            .end(function (err, res) {
                if (err) {
                    assert.fail(err);
                } else {
                    assert.equal(res.status,'404','get请求应无响应');
                    done();
                }
            });
    });


    it('给予指定的action，会触发上传', function (done) {
        const app = express();
        const ueditor = new UEditor({});
        const action='uploadimage';
        app.use("/testeditor", ueditor.upload(action));
        supertest(app)
            .post("/testeditor")
            .query({
                action: action
            })
            .attach('aa',path.join(__dirname,'test-upload-static-files','image','test-upload-bg-qingchen-chouyouji.jpg'))
            .end(function (err, res) {
                if (err) {
                    assert.fail(err);
                } else{
                    assert.equal(res.status,'200','post提交正常');
                    const response=JSON.parse(res.text);
                    assert.equal(response.state,'SUCCESS','上传应该成功');
                    assert.equal(response.title,'test-upload-bg-qingchen-chouyouji.jpg',"title应该为文件名");
                    done();
                }
            });
    });

});

