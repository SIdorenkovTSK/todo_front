

function addItem(elem){
    var params,result,html;
    params = {'text':$(elem).val()};
    sendToServer('item','POST',params,renderAddItem);

}

function renderAddItem(item){
    if(!$('#completed').hasClass('selected')){
        html = renderTemplate('todo-template', {
            completed: "",
            id: item.id,
            checked: "",
            title: item.text
        });
        $('.todo-list').prepend(html);
    }else{
        html = renderTemplate('todo-template', {
            completed: "hidden",
            id: item.id,
            checked: "",
            title: item.text
        });
        $('.todo-list').prepend(html);
    }
    $('.new-todo').val('');
}

function renderList(list){
    $('.todo-list').html('');
    $.each( list, function( key, value ) {
        var html = renderTemplate('todo-template', {
            completed:  value.completed == '1' ? 'completed' : '',
            id:  value.id,
            title:  value.text,
			checked: value.completed == '1' ? 'checked' : ''
        });
        $('.todo-list').prepend(html);
    });
}

function getList(type,id){
    var params = {'type':type,'id': id};
    return sendToServer('item','GET',params,renderList);
}

function removeItem(id){
    params = {'id':id};
    sendToServer('item','DELETE',params,renderRemoveItem);
}
function renderRemoveItem(result){
    $('[data-id="'+result.id+'"]').remove();
}

function renderTemplate(name, data) {
    var template = document.getElementById(name).innerHTML;

    for (var property in data) {
        if (data.hasOwnProperty(property)) {
            var search = new RegExp('{' + property + '}', 'g');
            template = template.replace(search, data[property]);
        }
    }
    return template;
}

function filter(type,elem){
	$('.filters').find('li').find('a').removeClass('selected');
	$(elem).addClass('selected');
    $('li').show();
	if(type=='active'){
        $('.completed').hide();
    }else if(type=='completed'){
        $('.todo-list').find('li:not(.completed)').hide();
    }

}

function cancelItem(id,elem){
    var params = {'id': id,'operation':'change_status'};
    sendToServer('item','PUT',params,renderCancelItem);

}
function renderCancelItem(result){
    elem = $('[data-id="'+result.id+'"]');
    if(elem.hasClass('completed')){
        elem.removeClass('completed');
    }else {
        elem.addClass('completed');
    }
}

function sendToServer(method_name,method,data,callback){
    $('#before-load').fadeIn();
    var result, url;
    if(localStorage.getItem('token') != null){
        data['guid'] = localStorage.getItem('token');
        data['id_type'] = 'token';
    }else{
        data['guid'] = localStorage.getItem('guid');
        data['id_type'] = 'guid';
    }
    url = 'http://backend.palkinoe.beget.tech/index.php/api/todo/' + method_name;
    $.ajax({
        crossDomain: true,
        dataType: 'json',
        method:method,
        async: true,
        data: data,
        url: url,
        success: function(res){
            if(res.new_token){
                localStorage.setItem('token', res.new_token);
            }
            if (callback != undefined){
                callback(res);
            }
        },
        complete: function(){
            calcActive();
            $('#before-load').fadeOut('slow');
        },
        error: function (xhr, status) {
           showErrors(xhr,status);
            if(xhr.responseText == '"invalid_token"'){
                logout();
            }
        }
    });

}




function init(){
    var guid;
    if(localStorage.getItem('token') != null){
        getList('token',localStorage.getItem('token'));
        renderLogoutForm();
    }else{
        if(localStorage.getItem('guid') == null){
            guid = uuid();
            localStorage.setItem('guid', guid)
        }else{
            guid = localStorage.getItem('guid');
        }
        getList('guid',guid);
        renderLoginForm();
    }
    calcActive();
}

function renderLoginForm(){
    var html = renderTemplate('login-template', { });
    $('.login').html(html);
}

function renderLogoutForm(){
    var html = renderTemplate('logout-template', {
        email:  localStorage.getItem('login')
    });
    $('.login').html(html);
}

function uuid() {
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    )
}

function calcActive(){
    var count = 0, elems = $('.todo-list').find('li');
    $.each( elems, function( key, value ) {
        if(!$(value).hasClass('completed')){
            count++;
        }
    });
    $('.todo-count').find('strong').html(count);
}

function deleteCompleted(){
    params = {'id':'all'};
    sendToServer('item','DELETE',params,renderDeleteCompleted);
}

function renderDeleteCompleted(){
     $('.completed').remove();
}

function startEditing(elem){
    var elem_id = $(elem).data('id');
    var start_text = $(elem).find('label').html();
    $(elem).addClass('editing');
    $(elem).find('.edit').keypress(function (e) {
        var key = e.which;
        if(key == 13)
        {
            if(start_text != $(this).val()){
                editItem($(this).val(),elem_id);
                $(elem).find('label').html($(this).val());
            }
            $(elem).removeClass('editing');
            $(elem).find('.edit').unbind('keypress');
        }
    });

}

function editItem(new_text,id){
    var params = {'id': id,'operation':'update','text':new_text};
    sendToServer('item','PUT',params);
}

function register(){
    var login,pass,params,result;
    login = $('#login').val();
    pass = $('#pass').val();
    params = {'email': login,'operation':'register','password':pass};
    sendToServer('user','POST',params,renderRegister);

}

function renderRegister(result){
    if(result.status=='0'){
        showInfo(result.message);
    }else{
        showInfo (result.message);
        localStorage.setItem('token', result.token);
        localStorage.setItem('login', result.login);
        init();
    }
}

function auth(){
    var login,pass,params,result;
    login = $('#login').val();
    pass = $('#pass').val();
    params = {'email': login,'operation':'register','password':pass};
    renderAuth
    result = sendToServer('login','POST',params,renderAuth);
}
function renderAuth(result){
    if(result.status=='0'){
        showInfo(result.message);
    }else{
        showInfo(result.message);
        localStorage.setItem('token', result.token);
        localStorage.setItem('login', result.login);
        init();
    }
}
function logout(){
    localStorage.removeItem('token');
    localStorage.removeItem('login');
    setTimeout(function(){
        init();
    },100);
}

function showInfo(text){
    $('.info_content').html(text);
    $('#info').fadeIn();
}
function fadeInfo(){
    $('#info').fadeOut();
}
function showErrors(xhr,status){
    console.log(xhr);
    $('.info_content').html(status);
    $('#info').fadeIn();
}

init();
