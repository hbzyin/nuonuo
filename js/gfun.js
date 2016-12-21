var GbSize = 1024*1024*1024;
var MbSize = 1024*1024;
var KbSize = 1024;

var data_loading = null;

var power_map = {
    1 : '目录查看',
    2 : '创建目录',
    3 : '文件移动',
    4 : '删除',
    8 : '上传',
    16 : '源文件下载',
    32 : 'PDF下载',
    64 : 'EXE下载',
    128 : '授权',
    256 : '在线阅读',
    512 : '在线编辑',
    1024 : '远程打印',
    2048 : '版本回滚'
};

var address_para = undefined;
/*$.address.externalChange(function(event) {
	var random = event.parameters.i,
		p = event.parameters;
	if(p)
	{
		var page = undefined , sky = undefined , path = undefined, param = undefined;
		if( p.name )
			p.find = {name:p.name};
		if(p.sky == 'undefined')
			p.sky = undefined;
		if( p.param ){
			param = $.parseJSON( decodeURIComponent( p.param ) );
			$.extend( p, param );
		}
		address_para = p;
		if(p.page)
		{
			for(var i in homePageList)
			{
				var it = homePageList[i];
				if(it && it.selected == true)
					it.selected = false;
			}
			if(homePageList[p.page])
				homePageList[p.page].selected  = true;
			if(!initSky)
				gotoPane(p);
		}
	}
});*/

adndisk.toLogin = function(){
    return  ;
    window.location = 'login.html';
};

Date.prototype.Format = function (fmt) {
    var o = {
        "M+": this.getMonth() + 1, //月份        
        "d+": this.getDate(), //日        
        "h+": this.getHours(), //小时        
        "m+": this.getMinutes(), //分        
        "s+": this.getSeconds(), //秒        
        "q+": Math.floor((this.getMonth() + 3) / 3), //季度        
        "S": this.getMilliseconds() //毫秒    
    };
    if (/(y+)/.test(fmt))
        fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));

    for (var k in o)
        if (new RegExp("(" + k + ")").test(fmt))
            fmt = fmt.replace(RegExp.$1,  (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" +  o[k]).length)));
    return fmt;
};

function showDataLoading(){
	if(data_loading == null)
		data_loading = $('#data_loading');
    if( !window.loadCnt )
        window.loadCnt = 0;
    ++window.loadCnt;
	data_loading.show();
}

function hideDataLoading(){
	if(data_loading == null)
        data_loading = $('#data_loading');
    --window.loadCnt;
    if( window.loadCnt == 0 ){
        data_loading.hide();
    }
}

var err_map = {
    '-2':{err:'登录错误'},
    '-3':{err:'试用已过期'},
    '-4':{err:'用户审批中'},
    '-8':{err:'该用户已被禁用'},
    '-10':{err:'license 过期'},
    '-11':{err:'验证码错误'},
	0: {err:'操作失败'},
	2: {err:'操作失败，存在同名项'},
	3: {err:'操作失败，权限不足'},
	4: {err:'文件移动失败，请确定目的文件夹不是本目录或者子目录'},
	5: {err:'该文件已取消共享'},
	11:{err:'删除目录里面包含共享文件,请先取消文件共享'},
	12:{err:'操作失败，文件已被删除'},
	17:{err:'操作失败，文件已被锁定'},
    23:{err:'验证码错误'}
};

adndisk.xhrPost = function( data,handleFunc,args ){
    var url = 'core/index.php',
        sync = false,
        notifyErr = true;

    if( args ){
        url = args.url || 'core/index.php';
        sync = false || args.sync;
        notifyErr = args.notifyErr;
    }

	if( sync ){
		showDataLoading();	//start loading
	}

	$.ajax({
	   type: 'post',
	   url: url,
	   beforeSend: function(xhr){
	    xhr.setRequestHeader("Content-Type","application/x-www-form-urlencoded");
           if( auName ){
               xhr.setRequestHeader('ONEST_USERNAME', auName);
               xhr.setRequestHeader('ONEST_SIGNATURE', auSignature);
           }
	   },
       data: $.toJSON(data),
	   success: function(res,state){
			if( sync )
				hideDataLoading();	//end loading 
			if(!res || res.ret == undefined)
				return	;
			if(res.ret < 0) {
				$.cookie('musername', '', { expires: -1 });
				$.cookie('mkeyword', '', { expires: -1 });
				auName = undefined;
				auSignature = undefined;
				adndisk.toLogin();
			} else if(res.ret == 1){
				if(handleFunc)
					return handleFunc(res);
			} else if( notifyErr != false && res.error && $.type(res.error)=='string' ){
				notify( 'error', res.error );
			} else if( notifyErr != false && err_map[res.ret] ){
                notify( 'error', err_map[res.ret].err );
			}
			
			if(handleFunc)
				handleFunc(res);
	   },
	   error: function(){
			var res = {err:1};

            if( sync )
               hideDataLoading();	//end loading
			if( handleFunc )
				handleFunc(res);
	   },
	   async: true
	});
};

adndisk.getUserInfo = function(callback){//获取当前用户信息

	function getUserHandle(res){
		if(res.cont){
			userInfo = res.cont;
		} else {
			auName = undefined;
			auSignature = undefined;
			$.cookie('musername', '', { expires: -1 });
			$.cookie('mkeyword', '', { expires: -1 });
			return  adndisk.toLogin();
		}
		
		if(userInfo.level == undefined)
			userInfo.level = 0;

		userInfo.config = res.config;
		secret_level = res.config.secret_level;
		enckey = res.config.enckey;
		userInfo.pwarn = $.cookie( 'pwarn' );
        userInfo.pwdout = res.pwdout;
        applog = res.applog;
		$.cookie('pwarn', '', { expires: -1 });

        if( res.sysconfig )
		    sysconfig = res.sysconfig;
		sysversion = res.sysversion;
		umessage = res.message;
		
		if(sysversion == undefined || sysversion < 0)
			sysversion = 0;

        if( res.logwarn ){
            $.alert({
                title : '系统提醒',
                body  : '<p style="padding: 30px 10px;text-align: center;color: red;">系统日志将满，请及时清理!</p>',
                buttons:[
                    {
                        text : '确定',
                        'class': 'btn blue_btn',
                        click : function(){
                            $(this).dialog('destroy');
                        }
                    }
                ]
            });
        }
		
		if(umessage){
			$(".btnwrap1 .abs").addClass("mesTip");
		} else {
			$(".btnwrap1 .abs").removeClass("mesTip");
		}

        if( callback )
            callback( userInfo );
	}
	
	adndisk.xhrPost({mod:'skyuserget'},function(res){
		getUserHandle(res);
	},{sync:true});
};

//跳转到指定页面,指定面板,指定目录
//sky 空间id, path 初始化路径, page 功能页(如:'doccenter_pane'->资料库),sdir 涉密空间标识
function gotoPane(info){
	var newpage = undefined;
	if(info.page){
		newpage = info.page;
	} else {
		for(var i in homePageList){
			if(info.sky == homePageList[i].sky){
				newpage = i;
				break;
			}
		}
	}
	if( typeof mainTabs != 'undefined' )
        global_info.mainTabs.activePage(newpage,info);
}

function setCurPage( page ){
    if( !page )
        return  ;
    else if( typeof page == 'string' ){
        global_info.curPage = homePageList[page];
    } else {
        global_info.curPage = page;
    }
    global_info.curSubPage = undefined;
}

function getCurPage(){
    return	global_info.curPage;
}

function setCurSubPage( page ){
    if( !page )
        return  ;
    else if( typeof page == 'string' ){
        global_info.curSubPage = homePageList.subPage[page];
    } else {
        global_info.curSubPage = page;
    }
}

function getCurSubPage(){
    return	global_info.curSubPage;
}

function login(){
	var _tmpl = tmpl('login_tmpl');

    $.confirm({
        title : '登录',
        body  : _tmpl(),
        width : 500,
        open : function(){
            var dom = $(this);
            dom.find('input').valid();
            dom.find('input:first').focus();
        },
        ok : function(){
            var dom = $(this),
                fill = dom.find('.filldata'),
                err  = dom.find('input').valid('collectErrors'),
                info = {},
                close = true;

            if( !$.isEmptyObject( err ) ){
                for( var i in err ){
                    notify( 'error', err[i][0] );
                    break;
                }
                return	false;
            }

            fill.each(function( i, n ){
                var key = $(this).attr('name'),
                    val = $.trim( $(this).val() );
                if( key && val )
                    info[key] = $.trim( $(this).val() );
            });

            adndisk.xhrPost({mod:'login',user:info.user,pass:hex_md5(info.pass),type:2},function( res ){
                if( res.ret == 1 ){
                    $.cookie( 'musername', info.user );
                    $.cookie( 'mkeyword' , res.cont.keyword  );
                    location.reload();
                    dom.find('input').valid('destroy');
                    dom.dialog('destroy');
                } else {
                    close = false;
                }
            },{sync:true});
        }
    });
}

function regist(){
	var _tmpl = tmpl('regist_tmpl');

    $.confirm({
        title : '注册',
        body  : _tmpl(),
        width : 500,
        open : function(){
            var dom = $(this);
            dom.find('input').valid();
            dom.find('input:first').focus();
        },
        ok : function(){
            var dom = $(this),
                fill = dom.find('.filldata'),
                err  = dom.find('input').valid('collectErrors'),
                info = {},
                close = true;

            if( !$.isEmptyObject( err ) ){
                for( var i in err ){
                    notify( 'error', err[i][0] );
                    break;
                }
                return	false;
            }

            fill.each(function( i, n ){
                var key = $(this).attr('name'),
                    val = $.trim( $(this).val() );
                if( key && val )
                    info[key] = $.trim( $(this).val() );
            });

            if( info.pass != info.chkpwd ){
                notify( 'error', '密码不一致');
                return	false;
            }

            info.name = info.uname = info.email;
            info.pass = hex_md5(info.pass);
            info.chkpwd = undefined;

            adndisk.xhrPost({mod:'useradd',postData:info},function( res ) {
                if (res.ret == 1){
                    dom.find('input').valid('destroy');
                    dom.dialog('destroy');
                    notify('success', '注册成功');
                } else
                    close = false;
            },{sync:true});
        }
    });
}

function inputHolder( $elm ){
	if( !$.browser.msie || !$elm )
		return	;
	if( !$elm.val() )
		$elm.val( $elm.attr('placeholder') );
	$elm.focus(function(){
		if( $.browser.msie && $(this).val() == $(this).attr('placeholder') )
			$(this).val('');
	}).blur(function(){
		if( $.browser.msie && !$(this).val() )
			$(this).val( $(this).attr('placeholder') );
	});
}

function downloadFilePro(info){
	var action = info.url || "core/index.php";
	var valueHtml = '';
	var conv = 0;
	$("#downfile").attr("action",action);
	if( auName )
		valueHtml += '<input type="hidden" name="HTTP_ONEST_USERNAME" value="' + auName + '" />';
	if( auSignature )
		valueHtml += '<input type="hidden" name="HTTP_ONEST_SIGNATURE" value="' + auSignature + '" />';

    if( !info.mod && !info.HTTP_MOD )
        valueHtml += '<input type="hidden" name="mod" value="webdownload" />';
	if(navigator.userAgent.indexOf("Windows") >= 0){
		conv = 1;
	}
	
	valueHtml += '<input type="hidden" name="conv" value="' + conv + '" />';
	
	for( var i in info ){
		var item = info[i];
		if( item == undefined )
			continue;
		if( $.isArray( item ) ){
			for( var k in item ){
				valueHtml += '<input type="hidden" name="'+i+'[]" value="' + item[k] + '" />';
			}
		} else {
			valueHtml += '<input type="hidden" name="'+i+'" value="'+item+'" />';
		}
	}
	
	$("#downfile").html(valueHtml);
	$("#downfile").submit();
}

function format_filesize(size){
	if(size != '' && size != undefined)
	{
		size = parseInt(size);
		if (typeof size !== 'number') {
			return '';
		}
		var retsize = size +' B';//'Byte';
		if (size >= GbSize) {
			retsize = (size / GbSize).toFixed(2) + ' GB';
		}
		else if (size >= MbSize) {
			retsize = (size / MbSize).toFixed(2) + ' MB';
		}
		else if (size >= KbSize) {
			retsize = (size / KbSize).toFixed(1) + ' KB';
		}else if (size <= 0){
			retsize = '0 B';
		};
		return retsize;
	} else {
		return '0 B';
	}
}

//文件大小格式化为字符串 根据文件大小字节数(size) 输出如'1 GB'
function formatSize(size,hasUnit,split){
    var unit = true;
    if( hasUnit == false )
        unit = false;
    if(size != undefined)
    {
        size = parseInt(size);
        if (typeof size !== 'number') {
                return '';
        }
        var retsize;
        if(split)
        {
            retsize = {};
            retsize.size = size;
            retsize.unit = 'B';
        }
        else
        {
            retsize = size;
            if(unit)
                retsize += ' B';
        }
        if (size >= GbSize) {
            if(split)
            {
                retsize.size = (size / GbSize).toFixed(2);
                retsize.unit = 'GB';
            }
            else
            {
                retsize = (size / GbSize).toFixed(2);
                if(unit)
                    retsize += ' GB';
            }
        }
        else if (size >= MbSize) {
            if(split)
            {
                retsize.size = (size / MbSize).toFixed(2);
                retsize.unit = 'MB';
            }
            else
            {
                retsize = (size / MbSize).toFixed(2);
                if(unit)
                    retsize += ' MB'
            }
        }
        else if (size >= KbSize) {
            if(split)
            {
                retsize.size = (size / KbSize).toFixed(1);
                retsize.unit = 'KB';
            }
            else
            {
                retsize = (size / KbSize).toFixed(1);
                if(unit)
                    retsize += ' KB'
            }
        }
        return retsize;
    } else {
        return '0 B';
    }
}

function formatSizeTo(size,unit){
    if(size == undefined)
        return  0;
    var  retsize,u;
    if(unit.indexOf('K') != -1)
        u = KbSize;
    else if(unit.indexOf('M') != -1)
        u = MbSize;
    else if(unit.indexOf('G') != -1)
        u = GbSize;

    size = parseInt(size);
    if (typeof size !== 'number') {
        return 0;
    }
    retsize = size * u;
    return  retsize;
}

/** 转换时间
* 参数second ：秒
*/
function getTime(second){
    var dateObj = new Date(second*1000);
    var showdate = dateObj.getFullYear() + '-';
    if((dateObj.getMonth()+1)<10)
        showdate += ('0'+(dateObj.getMonth()+1));
    else
        showdate += (dateObj.getMonth()+1);
    showdate += '-';
    showdate += dateObj.getDate()<10?'0'+dateObj.getDate():dateObj.getDate();
    showdate += ' ';
    var hour = dateObj.getHours() < 10?'0'+(dateObj.getHours()):(dateObj.getHours());
    var minutes = dateObj.getMinutes() < 10?'0'+dateObj.getMinutes():dateObj.getMinutes();
    var second = dateObj.getSeconds() < 10?'0'+dateObj.getSeconds():dateObj.getSeconds();
    showdate += (hour)+':'+ minutes+':'+ second;
    return showdate;
}

//格式化秒的时间
function secToDays(sec){
	var day = 24*60*60;
	var hours = 60*60;
	var d = '',h = '';
	var res = '';
	if(sec > day)
	{
		d = Math.floor(sec/day);
		h = Math.floor((sec%day)/hours);
		m = Math.floor((sec-d*day-h*hours)/60);
		return	d + '天 '+h + '小时 '+m + '分钟';
	}
	else
	{
		h = Math.floor(sec/hours);
		m = Math.floor((sec-h*hours)/60);
		return	h + '小时 '+m + '分钟';
	}
//	return	d + ' 天'+h + ' 小时'+m + ' 分钟';
}

//退出登录
/*!
 *	增加了弹出框的样式   by cb
 */
adndisk.logout = function(){
    $.confirm({
        title : '退出',
        body  : tmpl("alert_tip_tmpl")({title:"您确定要退出系统吗？"}),
        width : 500,
        ok : function(){
            adndisk.xhrPost({mod:'logout'},function(res){
                $.cookie('musername', '', { expires: -1 });
                $.cookie('mkeyword', '', { expires: -1 });
                $.cookie('wdisk_his', '', { expires: -1 });
                auName = undefined;
                auSignature = undefined;
                adndisk.toLogin();
            });
        }
    });
	/*
	if(window.confirm("确定注销当前用户吗?"))
		dologout();
	*/
};


adndisk.modpwd = function( force ){
    require([
        'jquery',
        'knockout',
        'knockout.validation'
    ],function($,ko){
        var viewModel = function( option ){
                var self = this;
                self.oldpass = ko.observable('').extend({
                    required:{message:'请填写原密码'}
                });
                self.newpass = ko.observable('').extend({
                    required:{message:'请填写新密码'},
                    notEqual:{params:self.oldpass,message:'新密码不可与旧密码一致'},
                    minLength:{params:option.minlen,message:'请填写'+option.minlen+'位以上密码'},
                    validation: {
                        validator: function (val) {
                            if(checkPwdLevel(val) > 3){
                                return true;
                            } else {
                                return false;
                            }
                        },
                        message: '新密码必须包含大小写字母、数字以及特殊字符'
                    }
                });
                self.checkpass = ko.observable('').extend({
                    required:{message:'请填写确定密码'},
                    equal:{params:self.newpass,message:'与新密码不一致'},
                    minLength:{params:option.minlen,message:'请填写'+option.minlen+'位以上密码'}
                });
            },
            config = {
                minlen : 6
            },
            model = null;

        ko.validation.configuration.insertMessages = false;

        adndisk.xhrPost({'mod':'sysconfig','stype':'safepwd',ac:'get'},function(res){
            if( res.ret == 1 && res.cont ){
                config.minlen = res.cont.manage_pwd_len;
            }
            show();
        },{sync:true});

        function show(){
            var p = {tip:''};
            if( force )
                p.tip = '首次登录或密码到期必须修改密码';
            $.dialog({
                title : '修改密码',
                width : 600,
                body  : tmpl('modpwd_tmpl')(p),
                open : function(){
                    model = new viewModel( config );
                    ko.applyBindings( model, this );
                },
                beforeClose : function(){
                    if( force )
                        return  false;

                    if( model ){
                        delete model;
                        model = null;
                    }
                },
                buttons :[
                    {
                        text: '确定',
                        'class': 'btn blue_btn',
                        click: function() {
                            var dlg = $(this),
                                errors = ko.validation.group(model)();
                            if( errors.length )
                                return  ;

                            adndisk.xhrPost( { mod:"regupdate" , oldpass : hex_md5(model.oldpass()) , newpass : hex_md5(model.newpass()) } , function( rtn ){
                                if( rtn.ret == 1 ){
                                    force = false;
                                    notify('success','操作成功');
                                    dlg.dialog('close');
                                }
                            },{sync:true});
                        }
                    },
                    {
                        text: '关闭',
                        'class': 'btn t_grey_btn',
                        click: function() {
                            if( !force )
                                $(this).dialog('close');
                        }
                    }
                ]
            });
        }
    });
};

//设置系统最高密级
adndisk.initSlevel = function(){
    var _html = '<div class="fslevel" style="padding:20px 50px;">';
    $.each( secret_level, function( i , v ){
        _html += '<input type="radio" name="file_slevel" value="'+i+'" '+ (v=='机密'?' checked=true ':'') +'style="margin:0 5px 0 20px;"/>'+v;
    });
    _html += '</div>';

    $.dialog({
        title : '设置最高密级',
        body  : _html,
        width : 500,
        beforeClose:function(){
            return  false;
        },
        buttons: [{
            text: '确定',
            'class': 'btn t_grey_btn',
            click: function() {
                var dlg = $(this);
                var level = parseInt( dlg.find("[name='file_slevel']:checked").val() );

                var _post = {mod:'sethighslevel',maxlevel:level };
                adndisk.xhrPost(_post,function(response){
                    if(response.ret == 1){
                        dlg.dialog('destroy');
                        return	notify('success','设置成功');
                    }
                });
            }
        }]
    });
};

function checkPwdLevel( pwd ){
    var level = 0;
    if( !pwd )
        return  level;

    function containsAlpha(str) {
        var rx = new RegExp(/[a-z]/);
        if (rx.test(str)) return 1;
        return 0;
    }

    function containsNumeric(str) {
        var rx = new RegExp(/[0-9]/);
        if (rx.test(str)) return 1;
        return 0;
    }

    function containsUpperCase(str) {
        var rx = new RegExp(/[A-Z]/);
        if (rx.test(str)) return 1;
        return 0;
    }

    function containsSpecialCharacter(str) {

        var rx = new RegExp(/[\W]/);
        if (rx.test(str)) return 1;
        return 0;
    }

    var alpha = containsAlpha(pwd),
        number = containsNumeric(pwd),
        upper = containsUpperCase(pwd),
        special = containsSpecialCharacter(pwd);
    level = alpha + number + upper + special;

    return  level;
}

//创建下拉弹出式按钮
//wrap 整个下拉按钮jq对象
//addmenu 向弹出菜单添加子项 addmenu(label,fun,data,cl) label:显示的菜单文字;fun:点击回调;data:存储的数据对象,cl：自定义的class
function dropdownBtn( args ){
	if( !args || !args.btn_label)
		return	;
	if(!window.dbtn_idIncrement)
		window.dbtn_idIncrement = 0;
	var index = window.dbtn_idIncrement++;
	var html = '<div class="btn-group">'
			+'<button class="btn dropdown_btn '+(args.split?'dropdown_split':'')+'" dd_id="dbtn_i_'+(index)+'"><span class="text">'+args.btn_label+'</span>';
	if(args.split == true){
		html += '</button><div class="btn dropdown_s" dd_id="dbtn_i_'+(index)+'" style="*padding-top:3px;"><s></s></div>';
	} else {
		html += '<s></s></button>';
	}
	html += '<ul class="dropdown_menu" id="dropd_men'+index+'" style="display: none;"></ul></div>';
			
	var dbtn = this;
	this.select_type = false;
	if(args.seltype === true)
		this.select_type = true;
	this.wrap = $(html);
	this.btn = this.wrap.find('.dropdown_btn');
	this.btn_id = this.btn.attr('dd_id');
	this.btn_text = this.btn.find('.text');
	this.dropmenu = this.wrap.find('.dropdown_menu');
	this.menu_items = [];
	this.addmenu = function(label,fun,data,cl){
		var mit = $('<li><a><i></i><span class="text">'+label+'</span></a></li>');
        dbtn.dropmenu.append( mit );
		if(fun)
			mit.click(function(){
				var i = dbtn.dropmenu.find('li').index($(this));
				dbtn.btn.data('d',data);
				if(dbtn.select_type)
					dbtn.btn_text.text($(this).find('.text').text());
				if($.isFunction(fun))
					fun(i,$(this),$(this).data('d'));
			});
		if(data)
			mit.data('d',data);
		if(cl)
			mit.addClass(cl);
		dbtn.menu_items.push(mit);
		return	mit;
	}
	this.getsel = function(){
		return dbtn.btn;
	}
	if(args.its && args.its.length)
	{
		for(var i in args.its)
		{
			var it = args.its[i];
			if(it.text)
				this.addmenu(it.text,it.fun,it.data,it.cl);
		}
	}
	$(document).on('click',function(event){
		var target = $( event.target );
		var p = $( event.target ).parent();
		if(p.hasClass( 'dropdown_s' ))
			target = $(p);
		if( target.hasClass( 'dropdown_s' ) )
		{
			var id = target.attr('dd_id');
			if(!id || id != dbtn.btn_id)
				dbtn.dropmenu.hide();
			else
				dbtn.dropmenu.show();
			return	;
		}
		if(p.hasClass( 'dropdown_btn' ))
			target = $(p);
		if ( target.hasClass( 'dropdown_btn' ) && !target.hasClass( 'dropdown_split' )) {
			var id = target.attr('dd_id');
			if(!id || id != dbtn.btn_id)
				dbtn.dropmenu.hide();
			else
				dbtn.dropmenu.show();
			return	;
		}
		if ( !$( event.target ).closest( '.dropdown_btn' ).length ) {
			dbtn.dropmenu.hide();
		}
	});
}

//消息提示框
var Notice = function(a) {
	this._$wrapper = $("body");
};

Notice.prototype = {
	
	setHtmlElem:function(a, b) {
		var c;
		if (a.toLowerCase() =='loading'){
				c = '<img alt="" src="images/loading.gif">'+(b ? b : '正在提交您的请求，请稍候...');
			} else if (a.toLowerCase() =='warn'){
				c = '<span class="gtl_ico_hits"></span>'+ b;
			} else if (a.toLowerCase() =='warm'){
				c = '<span class="gtl_ico_hits"></span>'+ b;
			} else if (a.toLowerCase() =='error'){
				c = '<span class="gtl_ico_fail"></span>'+ b;
			} else if (a.toLowerCase() =='success'){
				c = '<span class="gtl_ico_succ"></span>'+ b;
			}
		this._$htmlElem = $('<div class="msgbox_layer_wrap">' + '<span id="mode_tips_v2" style="z-index: 10000;" class="msgbox_layer"><span class="gtl_ico_clear"></span>' + c + '<span class="gtl_end"></span></span></div>');
	},    
	getHtmlElem:function() {
		return this._$htmlElem
	},		
	alreadyExist:function() {
		if($("body").find(".msgbox_layer_wrap").length > 0){
			return $("body").find(".msgbox_layer_wrap").is(":visible");
		} else {
			return false;
		};
	},
   _timeOutFn:function(a) {
		var b = this;
		this._timeOut = setTimeout(function() {
			b.hide(function() {
				b._timeOut = 0
			})
		},
		a)
	},
	show:function(a, b) {
		var c = this;
		var d = this._$htmlElem;
		//this._$wrapper.append(d);
		$("body").append(d);
		d.hide().stop().slideDown(500,
		function() {
			if (typeof(b) != "undefined") c._timeOutFn(b);
			if (a instanceof Function) a();
		})
	},
	update:function(a, b) {
		var sel = this._$htmlElem;
		if (this._timeOut) clearTimeout(this._timeOut);
		
		var c;
		if (a.toLowerCase() =='loading'){
				c = '<img alt="" src="images/loading.gif">'+(b ? b : '正在提交您的请求，请稍候...');
			} else if (a.toLowerCase() =='warn'){
				c = '<span class="gtl_ico_hits"></span>'+ b;
			} else if (a.toLowerCase() =='warm'){
				c = '<span class="gtl_ico_hits"></span>'+ b;
			} else if (a.toLowerCase() =='error'){
				c = '<span class="gtl_ico_fail"></span>'+ b;
			} else if (a.toLowerCase() =='success'){
				c = '<span class="gtl_ico_succ"></span>'+ b;
			}
		sel.html('<div class="msgbox_layer_wrap">' + '<span id="mode_tips_v2" style="z-index: 10000;" class="msgbox_layer"><span class="gtl_ico_clear"></span>' + c + '<span class="gtl_end"></span></span></div>');
	},
	hide:function(a) {
		var b = this._$htmlElem;
		b.slideUp(500,
		function() {
			b.remove();
			if (a instanceof Function) a()
		})
	}
};
function Notices(a, b, c, d, e) {
	if (a.alreadyExist()) {
		a.update(b, c);
		a.show(d, e)
	} else 
	{
		a.setHtmlElem(b, c);
		a.show(d, e)
	}
}

var notice = new Notice("body");
function notify(type,msg,ms)
{
	if(notice)
		Notices(notice, type, msg, "", ms || 500);
}

//将字符串中指定字符转义
function toConvert(str){ 
	 if(!str || typeof(str) != 'string')
		return	str;
     var RexStr = /\<|\>|\"|\'|\&/g 
     str = str.replace(RexStr, 
         function(MatchStr){ 
             switch(MatchStr){ 
                 case "<": 
                     return "&lt;"; 
                     break; 
                 case ">": 
                     return "&gt;"; 
                     break; 
                 case "\"": 
                     return "&quot;";
                     break; 
                 case "'": 
                     return "&#39;"; 
                     break; 
                 case "&": 
                     return "&amp;"; 
                     break; 
                 default : 
                     break; 
             } 
         } 
     ) 
     return str; 
}

function stop_event(event){
    if(event.stopPropagation)
        event.stopPropagation();
    else if(window.event)
    {
        window.event.returnValue = true;
    }
}

//输入框验证
function inputValid(e,rep){
	e = window.event || e;
	var code = e.keyCode || e.which;
	var validKey = [
			8,        // backspace
			9,        // tab
			13,       // enter
			27,       // escape
			35,       // end
			36,       // home
			37,       // left arrow
			39,       // right arrow
			46,       // delete
			110, 190  // period
	];
	if(e.ctrlKey && code == 86)
	{
		if(window.event){
			e.returnValue = false;
		}else{
			e.preventDefault();
		}
	}
	if(e.charCode == 0)
	{
		for (var i = 0, c; c = validKey[i]; i++) {
			if (code == c) 
				return ;
		}
	}
	
	var r = /\<|\>|\"|\&|\\|\%|\/|\:|\*|\?|\|/g;//禁止输入此类特殊字符
	//var r = /\<|\>|\"|\'|\&/g;
	if(r.test(String.fromCharCode(code))){
		if(window.event){
			e.returnValue = false;
		}else{
			e.preventDefault();
		}
	}
	
	if(!rep)
		return	;
	if(!rep.test(String.fromCharCode(code))){
		if(window.event){
			e.returnValue = false;
		}else{
			e.preventDefault();
		}
		return	false;
	}
}

function heartbreak( getinfo ){
	function exec(){
		adndisk.xhrPost({mod:'heartbreak',ask:2},function(res){
            if( res.ret == 1 ){
                dyinfo.link = res.lcnt;
                dyinfo.commend = res.ocnt;
            }
        });
		
		if( false == getinfo )
			return	;
	}
	exec();
	setInterval(exec,heart_time);
}

function setAddress( para ){
	var info = {},
        curPage = getCurPage(),
        subPage = getCurSubPage();

    if( curPage && curPage.curPaneinfo )
        info.page = curPage.curPaneinfo.pageId;
    if( subPage && subPage.curPaneinfo )
        info.subpage = subPage.curPaneinfo.pageId;
	
	for( var i in para ){
		if( para[i] != undefined && para[i] != 'undefined' )
			info[i] = para[i];
	}

    if( !$.isEmptyObject( info ) )
	    jq.address.value( '?' + decodeURIComponent( $.param( info ) ));
}

function getSessionId( callback ){
    var sid = '';
    sid = $.cookie('wdisk_sessid');
    if( sid ){
        if(callback)
            callback(sid);
        return  sid;
    }
    adndisk.xhrPost({mod:'getsessid'},function(res){
        var now = new Date(),
            time= now.setTime( now.getTime() + session_timeout );
        sid = res.sessid;
        $.cookie( 'wdisk_sessid', sid, time );
        if( callback )
            callback( sid );
    });
}

function vcodeImg( ele,codeType ){
    var img = '',
        num = 0;

    if( !ele )
        return  ;
    getSessionId(function( sid ){
        if( !sid )
            return  ;
        if( !window.vcodeImgNum )
            window.vcodeImgNum = 1;
        num = ++window.vcodeImgNum;
        img = 'core/mod/getseccode.php?sessid=' + sid + '&type='+codeType+'&num=' + num;
        $(ele).removeAttr('src').attr( 'src', img );
    });
}

function skyMapPage( sky ){
    var page = undefined;
    if( sky == undefined || sky == '-1')
        page = { page:'personDoc', subpage:'mydoc' };
    else if( sky == 1 )
        page = { page:'personDoc', subpage:'group' };
    else if( sky == '0' )
        page = { page:'companyDoc', subpage:'pubdoc' };
    return  page;
}

function log( msg ){
    if( !msg || !window.console || !DEBUG )
        return  ;
    var time = (new Date()).getTime();
    console.log( time + ' ' + msg );
}

function toast( msg, type, hide ){
    var _type = 'none';

    if( !window.$toast ){
        var _html = '<div id="toast" class="toast-dialog toast-content box-shadow"><div class="toast-outer"><div id="_disk_id_1" class="toast-msg ellipsis"><em class="sprite-ic toast-type"></em><span class="msg"></span><em class="close-tips" style="display: none;"> </em></div></div></div>';
        window.$toast = $( _html );
        $('body').append( window.$toast );
    }

    if( type ){
        _type = type;
    }
    window.$toast.find('.toast-type')
        .removeClass('toast-warn toast-success toast-error toast-none toast-loading')
        .addClass( 'toast-'+_type );
    if( msg ){
        window.$toast.find('.msg').text( msg );
    }
    window.$toast.show();

    if( hide ){
        setTimeout(function(){
            window.$toast.hide();
        },3000);
    }
}

function getBrowserType(){
    var Sys = {};
    var ua = navigator.userAgent.toLowerCase();
    var s;
    (s = ua.match(/msie ([\d.]+)/)) ? Sys.ie = s[1] :
        (s = ua.match(/firefox\/([\d.]+)/)) ? Sys.firefox = s[1] :
            (s = ua.match(/chrome\/([\d.]+)/)) ? Sys.chrome = s[1] :
                (s = ua.match(/opera.([\d.]+)/)) ? Sys.opera = s[1] :
                    (s = ua.match(/version\/([\d.]+).*safari/)) ? Sys.safari = s[1] : 0;

    adndisk.browser = Sys;

    if (Sys.ie) adndisk.browser.browseVersion = parseInt(Sys.ie);
    if (Sys.firefox) adndisk.browser.browseVersion = parseInt(Sys.firefox);
    if (Sys.chrome) adndisk.browser.browseVersion = parseInt(Sys.chrome);
    if (Sys.opera) adndisk.browser.browseVersion = parseInt(Sys.opera);
    if (Sys.safari) adndisk.browser.browseVersion = parseInt(Sys.safari);
}

//获取组织架构，所有用户信息 ,并将组织架构,用户 组装成树型数据
function struct_users( callback ){
    if(adndisk.struct_users){
        if( callback )
            callback( adndisk.struct_users );
        return  adndisk.struct_users;
    }

    getUserStruct(function(){
        getUserList(function(){
            adndisk.struct_users = userStructDataHandle(adndisk.userStruct,adndisk.userList,userDFill);
            if( callback )
                callback( adndisk.struct_users );
        });
    });
}

function userDFill(data,fid){
    var tmp = {},
        ext = {};
    if( !data )
        return	;

    ext = {
        text : data.uname,
        type : 2,
        parentid : fid,
        censor : data.censor || 0
    };
    $.extend( true, tmp, data, ext );
    return tmp;
}

//将组织架构,用户 组装成树型数据
function userStructDataHandle(data,chdData,filldata){
    function getchldData(tdata)
    {
        for(var key in chdData)
        {
            var d = chdData[key];
            if(chdData[key].oid == tdata.id)
            {
                if(filldata)
                    tdata.children.push(filldata(d,tdata.id));
            }
        }
    }

    function RecurFunc(tempData)
    {
        var parentId;
        if(tempData == undefined)
        {
            parentId = '0';
            tempData = [];
        } else {
            parentId = tempData.id;
        }
        for(key in data)
        {
            var tdata = {};
            if(data[key].parentid == parentId)
            {
                if(parentId == '0'){
                    $.extend( true, tdata, data[key] );
                    tdata.text = data[key].oname;
                    tdata.pyname = toPinyin(data[key].oname);
                    tdata.childid = data[key].childid;
                    tdata.parentid = parentId;
                    tdata.children = [];
                    tdata.type = 1;
                    RecurFunc(tdata);
                    getchldData(tdata);
                    tempData.push(tdata);
                } else {
                    $.extend( true, tdata, data[key] );
                    tdata.children = [];
                    tdata.text = data[key].oname;
                    tdata.pyname = toPinyin(data[key].oname);
                    tdata.parentid = parentId;
                    tdata.childid = data[key].childid;
                    tdata.type = 1;
                    RecurFunc(tdata);
                    getchldData(tdata);
                    tempData.children.push(tdata);
                }
            }
        }
        return tempData;
    }
    var rawdata = {
        identifier: 'id',
        label: 'description',
        items: []
    };

    return RecurFunc();
}

//获取组织架构
function	getUserStruct(callback){
    if(adndisk.userStruct){
        if( callback )
            callback( adndisk.userStruct );
        return  adndisk.userStruct;
    }

    adndisk.xhrPost({mod:'userstruct'},function(response){
        if(response.ret == 1 && response.cont)
        {
            adndisk.userStruct = $.map( response.cont, function( it ){
                return	$.extend( it, {type:1,text:it.oname} );
            });
            if(callback)
                callback(adndisk.userStruct);
        }
        else
            return	notify('error','获取组织架构失败');
    },{sync:true});
}

//获取文件对应已授权人员
function	getFilePower(sky,fid,callback){
    var power = null;
    adndisk.xhrPost({mod:'skypowerask',sky:sky,fd:fid},function(r){
        if(r.ret == 1 && r.cont)
        {
            power =  r.cont;
            if( callback )
                callback( power );
        }
        else
            return	notify('error','获取组文件权限失败');
    },{sync:true,url:'appcore/index.php'});
}

//获取用户列表
function getUserList(callback){
    if(adndisk.userList){
        if( callback )
            callback( adndisk.userList );
        return  adndisk.userList;
    }

    adndisk.xhrPost({mod:'getuserlist'},function(response){
        if(response.ret == 1 && response.cont)
        {
            if( typeof(toPinyin) != 'undefined' ){
                adndisk.userList = $.map( response.cont, function( it ){
                    return	$.extend( it, {type:2,pyname:toPinyin(it.name)} );
                });
            } else {
                adndisk.userList = response.cont;
            }
            adndisk.userList.sort(function( it1, it2 ){
                return it1.name.localeCompare( it2.name );
            });

            if(callback)
                callback(adndisk.userList);
        }
        else
            return	notify('error','获取组织架构失败');
    },{sync:true});
}

//获取权限集
function getRoleList(callback){
    if(adndisk.roleList){
        if( callback )
            callback( adndisk.roleList );
        return  adndisk.roleList;
    }

    adndisk.xhrPost({mod:'rolelist'},function(response){
        if(response.ret == 1 && response.cont)
        {
            adndisk.roleList = setRoleList(response.cont);
            if( callback )
                callback( adndisk.roleList );
        }
        else
            return	notify('error','获取权限集失败');
    },{sync:true,url:'appcore/index.php'});

    function	setRoleList(data){
        var rolelist_data = [];
        for(var kr=0;kr<data.length;kr++){
            var role_name = data[kr].name;
            var V=0,D=0,W=0,R=0,C=0,M=0,S=0,L=0,O=0,B=0,M1=0;
            var permise = data[kr].power;
            var s = '';
            for(var i in permise){
                switch(permise[i]){
                    case 1:
                        V = 1;
                        s += ' 目录查看 ';
                        break;
                    case 2:
                        C = 2;
                        s += ' 创建目录 ';
                        break;
                    case 3:
                        M1 = 3;
                        s += ' 文件移动 ';
                        break;
                    case 4:
                        R = 4;
                        s += ' 删除 ';
                        break;
                    case 8:
                        W = 8;
                        s += ' 上传 ';
                        break;
                    case 16:
                        D = 16;
                        s += ' 源文件下载 ';
                        break;
                    case 32:
                        D = 32;
                        s += ' PDF下载 ';
                        break;
                    case 64:
                        D = 64;
                        s += ' EXE下载 ';
                        break;
                    case 128:
                        M = 128;
                        s += ' 授权 ';
                        break;
                    case 256:
                        S = 256;
                        s += ' 在线阅读 ';
                        break;
                    case 512:
                        L = 512;
                        s += ' 在线编辑 ';
                        break;
                    case 1024:
                        O = 1024;
                        s += ' 远程打印 ';
                        break;
                    case 2048:
                        B = 2048;
                        s += ' 版本回滚 ';
                        break;
                    default:
                        break;
                }
            }
            rolelist_data.push({name:role_name,des:s,tflag:data[kr].tflag,type:data[kr].type,V:V,D:D,W:W,R:R,C:C,M:M,S:S,L:L,O:O,B:B,M1:M1});
        }
        return	rolelist_data;
    }
}

function getUserName( uid, callback ){
    var userData = getUserList();

    if( userData ){
        if(userInfo.prex == uid) {
            if( callback )
                callback( userInfo.uname );
            return userInfo.uname;
        }

        for(var k=0;k<userData.length;k++){
            if(userData[k].id == uid) {
                if( callback )
                    callback( userData[k].uname );
                return userData[k].uname;
            }
        }
    }

    return  getDepartName( uid, callback );
}

function getDepartName( id, callback ){
    var userData = getUserStruct();

    if( userData ){
        for(var k=0;k<userData.length;k++){
            if(userData[k].id == id) {
                if( callback )
                    callback( userData[k].oname );
                return userData[k].oname;
            }
        }
    }

    return	'';

}

function getUid(name){
    var userData = getUserList();
    if(userInfo.uname == name)
        return userInfo.prex;

    for(var k in userData){
        if( userData[k].name === name )//if( userData[k].name.indexOf(name) != -1 || userData[k].logname.indexOf(name) != -1 )
            return userData[k].id;
    }
    return	undefined;
}

function setselinfo(data, callback){
    if(!data)
        return	;

    adndisk.xhrPost({mod:'userinfo_save',uid:userInfo.prex,postData:data},function(res){
        if(callback){
            callback(res.ret == 1);
        }
    },{sync:true});
}

function uploadfileFun(btnId,callback,sendPara,allowext){
    if(btnId == undefined || btnId == '')
        return	null;
    if($('#fileToUpload').length == 0)
        $('<input type="file" id="fileToUpload" name="fileToUpload" style="display:none" />').appendTo('body');
    var sdata = $.extend({ HTTP_MOD:'userfileup',HTTP_ONEST_USERNAME:auName,HTTP_ONEST_SIGNATURE:auSignature }, sendPara);

    new AjaxUpload(btnId, {
        onComplete: function(filae, res) {
            var data = $.evalJSON(res);
            if(callback != undefined && jQuery.isFunction(callback))
                callback(data);
        },
        onSubmit: function(file, ext) {
            if(allowext && ext != allowext)
            {
                notify('warm','请选择'+allowext+'格式的文件');
                return false;
            }
            return true;
        },
        action: "core/index.php",
        data:sdata,	//发送参数：文件名、选择模块名
        allowedExtensions: [],
        autoSubmit: true,
        name: 'fileToUpload'
    });
}


function bldtree( wrap, treedata, option ){
    var data = [];
    if( !wrap || !treedata )
        return	null;
    $.each( treedata, function( i, d ){
        data.push($.extend(true,{},d));
    });
    var op = {
        data:data,
        textFieldName: 'text',
        idFieldName: 'id',
        parentIcon: 'groupIcon',
        childIcon: 'personIcon'
    };
    if( option )
        $.extend( op, option );
    return	wrap.ligerTree( op );
}

function bldUSearch(input,tree,fields){
    if(!input || typeof(input) != 'object' || !tree)
        return	;
    var search_input = input;
    var search_tree  = tree;
    var search_btn   = $('<b class="abs sa_starts"></b>').insertAfter(search_input);
    var search_con   = null;
    var search_list  = null;
    var search_fields= null;

    if(fields && fields.length)
        search_fields = fields;

    function bldcon() {
        if(!search_con || search_con.length == 0)
        {
            search_con  = $('<div class="search_content_n" style="z-index:9898;"></div>').appendTo($('body'));
            search_list = $('<ul class="conlist" style="z-index:9899;"></ul>').appendTo(search_con);
        }
    }

    search_input.keyup(function(event){
        userTreeGridSearch(event);
    })
        .keydown(function(event) {
            $bigAutocompleteContent = search_con;
            switch (event.keyCode) {
                case 40://向下键
                    if(!$bigAutocompleteContent || $bigAutocompleteContent.is(":visible") == false)return;
                    var $nextSiblingTr = $bigAutocompleteContent.find(".selected");
                    if($nextSiblingTr.length <= 0){//没有选中行时，选中第一行
                        $nextSiblingTr = $bigAutocompleteContent.find("li:first");
                    }else{
                        $nextSiblingTr = $nextSiblingTr.next();
                    }
                    $bigAutocompleteContent.find("li").removeClass("selected");

                    if($nextSiblingTr.length > 0){//有下一行时（不是最后一行）
                        $nextSiblingTr.addClass("selected");//选中的行加背景
                        //$this.val($nextSiblingTr.find("div:last").html());//选中行内容设置到输入框中

                        //div滚动到选中的行,jquery-1.6.1 $nextSiblingTr.offset().top 有bug，数值有问题
                        var sh = $nextSiblingTr[0].offsetTop - $bigAutocompleteContent.height() + $nextSiblingTr.height();
                        $bigAutocompleteContent.scrollTop(sh);

                    }else{
                        //$this.val(bigAutocomplete.holdText);//输入框显示用户原始输入的值
                    }


                    break;
                case 38://向上键
                    if(!$bigAutocompleteContent || $bigAutocompleteContent.is(":visible") == false)return;
                    var $previousSiblingTr = $bigAutocompleteContent.find(".selected");
                    if($previousSiblingTr.length <= 0){//没有选中行时，选中最后一行行
                        $previousSiblingTr = $bigAutocompleteContent.find("li:last");
                    }else{
                        $previousSiblingTr = $previousSiblingTr.prev();
                    }
                    $bigAutocompleteContent.find("li").removeClass("selected");

                    if($previousSiblingTr.length > 0){//有上一行时（不是第一行）
                        $previousSiblingTr.addClass("selected");//选中的行加背景
                        var sh = $previousSiblingTr[0].offsetTop - $bigAutocompleteContent.height() + $previousSiblingTr.height();
                        $bigAutocompleteContent.scrollTop(sh);
                    }

                    break;
                case 27://ESC键隐藏下拉框
                    emptySearchContent();
                    break;
                case 13:
                    if(!$bigAutocompleteContent ||$bigAutocompleteContent.is(":visible") == false)
                        return	sa_search();
                    var sel_it = $(".selected",$bigAutocompleteContent);
                    if(sel_it)
                        var data = sel_it.data('rowInfo');
                    if(data)
                    {
                        search_input.val(data.uname);
                        search_con.hide();
                        search_tree.collapseAll();
                        var sel = search_tree.getSelected();
                        if(sel)
                            search_tree.cancelSelect(sel.target);
                        goToTreeGridItem(data);
                    }
                    break;
            }
        });

    $(document).not(search_input).click(function(e){
        var t = $(e.target);
        if(t.hasClass('sa_starts'))
            return	;
        emptySearchContent();
    });

    search_btn.click(function(){
        sa_search();
    });

    function matchSFields(it,val) {
        if(!search_fields || !it || !val)
            return	false;
        for(var i in search_fields)
        {
            if(it[search_fields[i]] && it[search_fields[i]].toLowerCase().indexOf(val.toLowerCase()) != -1)
                return	true;
        }
        return	false;
    }

    function getTreeGridItemsByName(val)
    {
        var depart = [] , valfield ;
        if(!val || typeof val != 'string'|| val == '')
            return	[];
        valfield = search_tree.options.textFieldName;
        for(var x in search_tree.nodes)
        {
            var it = search_tree.nodes[x];
            if((it.pyname && it.pyname.toLowerCase().indexOf(val.toLowerCase())!= -1)||
                (it[valfield] && it[valfield].toLowerCase().indexOf(val.toLowerCase()) != -1) ||
                matchSFields(it,val) == true
                )
            {
                var p = search_tree.getParent(it);
                depart.push({uname:it[valfield],id:it.id,fname:p?p[valfield]:''});
            }
        }
        return	depart;
    }

    function goToTreeGridItem(itdata)
    {
        if(!itdata || !itdata.id)
            return	;
        var node = search_tree.getNodedomByID(itdata.id);
        if(node)
        {
            search_tree.upExpandTreeNode(node);
            search_tree.selectNode(node);
            setTimeout(function(){$(search_tree.element).scrollTop(node[0].offsetTop);},300);
        }
    }

    function	emptySearchContent()
    {
        if(search_list)
        {
            $('li',search_list).each(function(){
                $(this).removeData('rowInfo').removeData('dindex');
            });
            search_list.empty();
        }
        if(search_con)
        {
            search_con.remove();
            search_con = null;
        }
    }

    function sa_search()
    {
        var sword = search_input.val().toLowerCase();
        if(sword == '')
            return	emptySearchContent();
        var res = getTreeGridItemsByName($.trim(sword));
        bldcon();
        //emptySearchContent();
        if(res.length == 0)
            return	search_list.html('<div style="text-align:center;">没有找到匹配结果</div>');
        search_list.show().empty();
        search_con.show().position({
            my: "left top",
            at: "left bottom",
            of: search_input
        });
        for(var k in res)
        {
            var it = res[k];
            $('<li>'+it.uname+'('+it.fname+')</li>').appendTo(search_list).data('rowInfo',res[k]).click(function(){
                var data = $(this).data('rowInfo');
                search_input.val(data.uname);
                emptySearchContent();
                //search_tree.collapseAll();
                var sel = search_tree.getSelected();
                if(sel)
                    search_tree.cancelSelect(sel.target);
                goToTreeGridItem(data);
            })
                .mouseover(function(){
                    $(this).addClass('selected').siblings('.selected').removeClass('selected');
                })
                .mouseout(function(){
                    $(this).removeClass('selected');
                });
        }
    }

    function userTreeGridSearch(e)
    {
        e = window.event || e;
        var code = e.keyCode || e.which;
        var newcode = String.fromCharCode(code);
        /*var validKey = [
         8,        // backspace
         9,        // tab
         13,       // enter
         27,       // escape
         35,       // end
         36,       // home
         37,       // left arrow
         39,       // right arrow
         46,       // delete
         110, 190  // period
         ];*/
        var validKey = [9,20,13,16,17,18,91,92,93,45,36,33,34,35,37,39,112,113,114,115,116,117,118,119,120,121,122,123,144,19,145,40,38,27];//键盘上功能键键值数组
        for (var i = 0, c; c = validKey[i]; i++) {
            if (code == c)
            {
                newcode = '';
                return	;
            }
        }

        sa_search();
    }
}

function dropdownBox( wrap, sub ){
    var hideSearchSet = function(e){
        var target = $(e.target);
        if( target.parents('.ui-datepicker-prev').length || target.parents('.ui-datepicker-next').length )
            return  ;
        if( !target.closest('.'+sub+',.ui-datepicker').length ) {
            wrap.find('.'+sub).hide();
            $(document).off('click',hideSearchSet);
        }

    };

    wrap.mouseover(function(){
        wrap.find('.'+sub).show();
        $(document).on('click',hideSearchSet);
    });
}

function hasSpecialWord( str ){
    if( !str )
        return  false;

    var _reg = /\(|\)|\!\<|\>|\"|\&|\\|\%|\/|\:|\*|\?|\|/g;

    return  _reg.test(str);
}
