const UEditor = require('../lib/ueditor');
const defaultConfig = require('../lib/config.default.js');

const assert = require('assert');


const ueditor = new UEditor();

describe('测试UEditor类', function () {


    const req={
        query:{
            action:'',
        }
    };
    
    const res={
        send:(str)=>{},    // 留待具体业务场景模拟
        end:(str)=>{},     // 留待具体业务场景模拟
    };

    describe('默认情况下的finalConifg方法：', function(){
        it('不提供配置的情况下，配置和直接读取的配置应该相等', function () {
            assert.ok(deepCompare(ueditor.finalConfig, defaultConfig), "二者理应相等，包括属性出现的顺序");
        });
    });
    
    describe("测试config()方法",()=>{
    
       it('action="config"时不会触发next()',()=>{
            const configMiddle=ueditor.config();
            const executed=false;
            req.query.action="config";
            configMiddle(req,res,()=>{
                executed=true;
                assert.fail('这里不该被执行');
            });
            assert.ok(!executed,"当action='config',理应不会触发next()");
        });
        
        
        it('action="config"时，res.send()会被调用并返回配置',()=>{
            const executed=false
            let changedBySend="";
            res.send=function(str){
                changedBySend=str;
            };
            ueditor.config()(req,res,()=>{
                executed=true;
                assert.fail('这里不该被执行');
            });
            assert.ok(!executed,"next()方法不该被执行");
            assert.equal(changedBySend,JSON.stringify(ueditor.finalConfig),"send(str)发送的数据理应是最终的config");
        });
        
        
        it("action!='config'会触发next()",()=>{
            const actions=['config1',undefined,null,''];
            actions.forEach(i=>{
                req.query.action=i;
                let executed=false;
                ueditor.config()(req,res,()=>{
                    executed=true;
                });
                assert.ok(executed,`当action!=${i},理应触发next()`);
            });
        });

    });

    describe('测试listimage()方法');


});

/**
 * 这段代码拷贝自
 *     http://stackoverflow.com/questions/1068834/object-comparison-in-javascript
 * 用于深度比较两个对象是否相等，返回bool
 */
function deepCompare() {
    var i, l, leftChain, rightChain;

    function compare2Objects(x, y) {
        var p;

        // remember that NaN === NaN returns false
        // and isNaN(undefined) returns true
        if (isNaN(x) && isNaN(y) && typeof x === 'number' && typeof y === 'number') {
            return true;
        }

        // Compare primitives and functions.     
        // Check if both arguments link to the same object.
        // Especially useful on the step where we compare prototypes
        if (x === y) {
            return true;
        }

        // Works in case when functions are created in constructor.
        // Comparing dates is a common scenario. Another built-ins?
        // We can even handle functions passed across iframes
        if ((typeof x === 'function' && typeof y === 'function') ||
            (x instanceof Date && y instanceof Date) ||
            (x instanceof RegExp && y instanceof RegExp) ||
            (x instanceof String && y instanceof String) ||
            (x instanceof Number && y instanceof Number)) {
            return x.toString() === y.toString();
        }

        // At last checking prototypes as good as we can
        if (!(x instanceof Object && y instanceof Object)) {
            return false;
        }

        if (x.isPrototypeOf(y) || y.isPrototypeOf(x)) {
            return false;
        }

        if (x.constructor !== y.constructor) {
            return false;
        }

        if (x.prototype !== y.prototype) {
            return false;
        }

        // Check for infinitive linking loops
        if (leftChain.indexOf(x) > -1 || rightChain.indexOf(y) > -1) {
            return false;
        }

        // Quick checking of one object being a subset of another.
        // todo: cache the structure of arguments[0] for performance
        for (p in y) {
            if (y.hasOwnProperty(p) !== x.hasOwnProperty(p)) {
                return false;
            }
            else if (typeof y[p] !== typeof x[p]) {
                return false;
            }
        }

        for (p in x) {
            if (y.hasOwnProperty(p) !== x.hasOwnProperty(p)) {
                return false;
            }
            else if (typeof y[p] !== typeof x[p]) {
                return false;
            }

            switch (typeof (x[p])) {
                case 'object':
                case 'function':

                    leftChain.push(x);
                    rightChain.push(y);

                    if (!compare2Objects(x[p], y[p])) {
                        return false;
                    }

                    leftChain.pop();
                    rightChain.pop();
                    break;

                default:
                    if (x[p] !== y[p]) {
                        return false;
                    }
                    break;
            }
        }

        return true;
    }

    if (arguments.length < 1) {
        return true; //Die silently? Don't know how to handle such case, please help...
        // throw "Need two or more arguments to compare";
    }

    for (i = 1, l = arguments.length; i < l; i++) {

        leftChain = []; //Todo: this can be cached
        rightChain = [];

        if (!compare2Objects(arguments[0], arguments[i])) {
            return false;
        }
    }

    return true;
}