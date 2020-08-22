/*
    TODO
    1. EndPoint가 StartPoint보다 앞에있으면 오류를 알릴것
    2. 모바일 환경에서도 자동재생이 되도록 mute=1로 실행후 재생시 mute 끄기
    3. 재생목록 저장기능 추가 ()
    4. 작은 화면에서 재생목록 css 변경(추후 추가 수정 예정)
    5. 재생목록 변경기능 추가
    6. ios환경에서의 자동재생 기능 설정 (ios환경일 경우 muted=1)
    7. 적용버튼 누를 때 시작시간 적용없으면 처음부터, 종료시간 적용 없으면 마지막까지 재생되도록하기

    긴급
*/

//재생목록 크기 조절을 위한 reSize함수
const winmedia = window.matchMedia('(min-width: 1145px)');
function reSize(){ 
    let elem_youtube = document.getElementsByClassName('youtube')[0]
    let elem_option = document.getElementById('options');
    let padding_option = window.getComputedStyle(elem_option).padding;
    if(winmedia.matches){//큰화면
        let height = elem_youtube.offsetHeight;
        height -= parseFloat(padding_option)*2;
        elem_option.style.height = height;
        elem_option.style.removeProperty('width');
    }else{    //작은화면
        
        let width = elem_youtube.offsetWidth;
        width -= parseFloat(padding_option)*2+1;
        elem_option.style.width = width;
        elem_option.style.removeProperty('height');
    }
}

//재생시간 밑 동영상 목록을 위한 List구조
function List(){
    this.id=[];//i번째 원소의 정보가 있는 index를 가리킴
    this.video =[];
    this.starttimes = [];
    this.endtimes = [];
    this.length=0;  //빈공간을 포함한 전체 길이
}
// List.prototype.add = function(num,name,start,end){
//     this.index++;
//     this.id[this.length]=num;//몇번째 functions-table인지 저장
//     this.video[this.length] = name;
//     this.starttimes[this.length]=start;
//     this.endtimes[this.length]=end;
//     this.id.sort((a,b)=>a-b);   //재생목록은 순서대로
//     this.length++;
// }
List.prototype.getVideo=function(num){ return this.video[num]; }
List.prototype.getStart=function(num){return this.starttimes[num];}
List.prototype.getEnd=function(num){return this.endtimes[num];}
List.prototype.size=function(){ return this.id.size;}
List.prototype.clear=function(){
    this.id=[];
    this.video =[];
    this.starttimes = [];
    this.endtimes = [];
    this.length=0;
}
List.prototype.set=function(num,name,start,end){
    let idx = this.id.indexOf(num);
    if(idx<0){
        this.id[this.length]=num;
        this.id.sort((a,b)=>a-b);
        this.length++;
    }
    console.log(this.length);
    this.video[num] = name;
    this.starttimes[num] = start;
    this.endtimes[num] = end;
}
List.prototype.delete=function(num){
    let idx = this.id.indexOf(num);
    if(idx>-1){
        this.id.splice(idx,1);  //id에만 속하지 않는다면 접근할 일이 없고 set이나 push함수로 덮어서 사용할 수 있음
    }
    this.length--;
}
List.prototype.push=function(num,name,start,end){
    this.id[this.length]=num;
    this.video[num] = name;
    this.starttimes[num]=start;
    this.endtimes[num]=end;
    this.id.sort(function(a,b){
        return a-b;
    });
    this.length++;
    console.log(this.length);
}
List.prototype.nextId=function(num){
    console.log(this.length);
    console.log(num);
    if(num<0) return (this.length>-1)?0:-1;
    let idx = this.id.indexOf(num);
    return (idx>-1&&idx+1<this.length)?this.id[idx+1]:-1;
}

let tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
let firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
let player;
let playlist = new List();

let videotime=0;
let timeupdater=null;

let tablenum =0;    //몇개의 재생목록을 받는 div가 생성되었는지 확인받는 변수
let currentidx=0;
let starttime;
let endtime;

var state;  //0 - 로드하고 재생 전, 1 - 재생 중, 2 - 완료

function onYouTubeIframeAPIReady(){
    //기본 재생 동영상 ID mFzHr8Xyo6E
    // playlist.set(0,0,
    //     "S0RiTTbhVBE",
    //     caltime(document.getElementById("playerStartPoint0").value),
    //     caltime(document.getElementById("playerEndPoint0").value));
    playlist.push(0,"S0RiTTbhVBE",
        caltime(document.getElementById("playerStartPoint0").value),
        caltime(document.getElementById("playerEndPoint0").value));
    player = new YT.Player('player',{
        host:'https://www.youtube.com',
        videoId: playlist.getVideo(0),         
        events:{
            'onReady': onPlayerReady
        },
        playerVars:{
            'disablekb' : 1,
            'controls' : 1
        }
    });
}

//동영상 준비되면 발생하는 함수
function onPlayerReady(event){ 
    function updateTime(){
        var oldTime = videotime;
        if(player&&player.getCurrentTime){
            videotime=player.getCurrentTime();//동영상의 현재 재생시간을 기준으로 타이머를 설정
        }
        if(videotime!= oldTime){
            onProgress(videotime);
        }
    }
    timeupdater = setInterval(updateTime,100);

    starttime =playlist.getStart(0);
    endtime = playlist.getEnd(0);
    player.seekTo(starttime);
    event.target.playVideo();
}

function onProgress(currentTime){
    if(state===0){
        if(currentTime!=starttime){
            //console.log("시작시간 재설정 중");
            player.seekTo(starttime);
        }else{
            state=1;
        }
    }else if(currentTime>endtime){
        state=2;  
        let nextid = playlist.nextId(currentidx);
        if(nextid<0){
            let repeatbox = document.getElementById("player-button-repeat");
            if(repeatbox.checked)    play(0);
            else   player.stopVideo();
        }else{
            play(nextid);
        }

        // if(currentidx>=tablenum) {  //삭제시 tablenum이 줄어들면서 에러 발생
        //     let repeatbox = document.getElementById("player-button-repeat");
        //     if(repeatbox.checked)    play(0);
        //     else   player.stopVideo();
        // }
        // else{          //다음 영상 재생 (이후 인덱스들 중 적용이 되어있는 인덱스만)
        //     play(currentidx+1); 
        // }
    }
}

function redrawPlayer(){//동영상 재생목록 업데이트
    updateLists();
    play(0);
}

function caltime(str){
    let colidx = str.indexOf(':');
    if(colidx!=-1){
        let min = str.substring(0,colidx);
        let second = str.substring(colidx+1,str.length);
        return parseInt(min)*60+parseInt(second);
    }else   return parseInt(str);
}

function setPoint(num){
    let curvideo = playlist.getVideo(currentidx);
    // videolist.set(num,getIdFromUrl(document.getElementById("playerContent"+num).value));
    // starttimes.set(num,caltime(document.getElementById("playerStartPoint"+num).value));
    // endtimes.set(num,caltime(document.getElementById("playerEndPoint"+num).value));
    
    playlist.set(num,
        getIdFromUrl(document.getElementById("playerContent"+num).value),
        caltime(document.getElementById("playerStartPoint"+num).value),
        caltime(document.getElementById("playerEndPoint"+num).value));

    let table = document.getElementById("player-functions-table"+num);
    table.classList.remove("listbox-not-applied");
    table.classList.add("listbox-applied");

    if(currentidx==num &&curvideo!=playlist.getVideo(num)){   //적용한 재생목록이 현재 재생중인데 변경된 경우
        play(currentidx);
    }
}

function deletePoint(num){  //삭제 시 에러발생 -> 현재 재생중인 경우 다음 재생목록 실행
    // console.log(playlist.size());
    playlist.delete(num);
    if(currentidx==num){
        currentidx=-1;
    }
    let dtable = document.getElementById("player-functions-table"+num);
    dtable.parentNode.removeChild(dtable);
    
    for(i=num+1;i<=tablenum;i++){
        let table = document.getElementById("player-functions-table"+i);
        let video = document.getElementById("playerContent"+i);
        let start = document.getElementById("playerStartPoint"+i);
        let end = document.getElementById("playerEndPoint"+i);
        let pbutton = document.getElementById("player-button-play"+i);
        let sbutton = document.getElementById("player-button-set"+i);
        let dbutton = document.getElementById("player-button-delete"+i);
        table.id = "player-functions-table"+(i-1);
        video.id = "playerContent"+(i-1);
        start.id = "playerStartPoint"+(i-1);
        end.id = "playerEndPoint"+(i-1);
        pbutton.id="player-button-play"+(i-1);
        pbutton.setAttribute("onClick","play("+(i-1)+")");
        sbutton.id = "player-button-set"+(i-1);
        sbutton.setAttribute("onClick","setPoint("+(i-1)+");");
        dbutton.id="player-button-delete"+(i-1);
        dbutton.setAttribute("onClick","deletePoint("+(i-1)+")");
    }
    tablenum--;
}

function addTable(){
    let newTable = document.createElement("table");
    newTable.setAttribute("id","player-functions-table"+(++tablenum));
    // console.log("재생목록 추가"+tablenum);
    newTable.setAttribute("class","listbox listbox-not-applied");
        let sectiontable="<tbody>";
            sectiontable+="<tr>";
                sectiontable+="<td class=\"noborder player-group-header\">동영상 URL</td>";
                sectiontable+="<td class=\"player-group-options\">"
                    sectiontable+="<div class=\"player-option-row\">";
                        sectiontable+="<input type=\"text\" class=\"player-text-input\" size=\"18\" id=\"playerContent"+tablenum+"\" value=\"\" placeholder=\"URL 또는 동영상 ID\">";
                    sectiontable+="</div>";
                sectiontable+="</td>";
                sectiontable+="<td class=\"player-group-button\">";
                        sectiontable+="<button id=\"player-button-play"+tablenum +"\" type=\"button\" class=\"button\" onclick=\"play("+tablenum +");\">재생</button>";
                    sectiontable+="</td>";
            sectiontable+="</tr>";            
            sectiontable+="<tr>";
                sectiontable+="<td class=\"noborder player-group-header\">시작 지점</td>";
                sectiontable+="<td class=\"player-group-options\">";
                    sectiontable+="<div class=\"player-option-row\">";
                        sectiontable+="<input type=\"text\" class=\"player-text-input\" size=\"18\" id=\"playerStartPoint"+tablenum +"\" value=\"\" placeholder=분:초 또는 초>"
                    sectiontable+="</div>";
                sectiontable+="</td>"
                sectiontable+="<td class=\"player-group-button\">"
                    sectiontable+="<button id=\"player-button-set"+tablenum+"\" type=\"button\" class=\"button\" onclick=\"setPoint("+tablenum+");\">적용</button>"
                sectiontable+="</td>"
            sectiontable+="</tr>"
            sectiontable+="<tr>"
                sectiontable+="<td class=\"noborder player-group-header\">종료 지점</td>"
                sectiontable+="<td class=\"player-group-options\">"
                    sectiontable+="<div class=\"player-option-row\">"
                        sectiontable+="<input type=\"text\" class=\"player-text-input\" size=\"18\" id=\"playerEndPoint"+tablenum +"\" value=\"\" placeholder=분:초 또는 초>";
                    sectiontable+="</div>"
                sectiontable+="</td>"
                sectiontable+="<td class=\"player-group-button\">"
                    sectiontable+="<button id=\"player-button-delete"+tablenum+"\" type=\"button\" class=\"button\" onclick=\"deletePoint("+tablenum+");\">삭제</button>"
                sectiontable+="</td>"
            sectiontable+="</tr>"
        sectiontable+="</tbody>"
    newTable.innerHTML = sectiontable;
    let tableparent = document.getElementById("player-functions");
    tableparent.appendChild(newTable);
}

function updatePoints(){
    starttimes.clear();
    endtimes.clear();
    // console.log("tablenum is "+tablenum);
    for(i=0;i<=tablenum;i++){
        var sid="playerStartPoint"+i;
        var eid="playerEndPoint"+i;
        starttimes.add(caltime(document.getElementById(sid).value));
        endtimes.add(caltime(document.getElementById(eid).value));
        // console.log(i+"-> "+" start="+starttimes.get(i)+", end="+endtimes.get(i));
    }
}
function updateLists(){
    // videolist.clear();
    // starttimes.clear();
    // endtimes.clear();
    playlist.clear();
    for(i=0;i<=tablenum;i++){
        // videolist.add(getIdFromUrl(document.getElementById("playerContent"+i).value));
        // starttimes.add(caltime(document.getElementById("playerStartPoint"+i).value));
        // endtimes.add(caltime(document.getElementById("playerEndPoint"+i).value));
        playlist.set(i,
            getIdFromUrl(document.getElementById("playerContent"+i).value),
            caltime(document.getElementById("playerStartPoint"+i).value),
            caltime(document.getElementById("playerEndPoint"+i).value));
        // console.log(i+"-> "+"id="+videolist.get(i)+", start="+starttimes.get(i)+", end="+endtimes.get(i));
    }
}        

function getIdFromUrl(str){
    if(str.indexOf("https")!=-1){   //URL입력에 두가지 경우의 수 존재
    //1.웹브라우저의 주소 링크(https://youtube.com/watch?v=(id))
        let pos = str.indexOf('v=');
        let substr,qpos,epos;
        if(pos!=-1){
            substr = str.substring(pos+2,str.length);
        }   
        //2.유튜브 내의 공유 링크(https://youtu.be/(id))
        else{
            pos = str.indexOf('u.be/');
            substr = str.substring(pos+5,str.length);
        }
        qpos = substr.indexOf('?');
        if(qpos!=-1){
            substr =  substr.substring(0,qpos);
        }
        epos = substr.indexOf('&');
        if(epos!=-1){
            substr = substr.substring(0,epos);
        }
        return substr;
    }else{//URL입력이 아닌경우
        return str;
    }

}

function loadvideo(){
    var url = player.getVideoUrl();
    var andpos=url.indexOf('v=');
    var id;
    if(andpos != -1){
        id = url.substring(andpos+2,url.length);
    }else{
        id = url;
    }
    // console.log(id);
    // if(id!=videolist.get(currentidx)){
    if(id!=playlist.getVideo(currentidx)){
        // player.loadVideoById(
        //     {'videoId':videolist.get(currentidx), 'starttime':starttimes.get(currentidx)});
        player.loadVideoById({'videoId':playlist.getVideo(currentidx), 'starttime':playlist.getStart(currentidx)});
    }
}

function  play(idx){
    state=0;
    if(currentidx>-1){    
        let table = document.getElementById("player-functions-table"+currentidx);
        table.classList.remove("listbox-playing");
        table.classList.add("listbox-applied"); 
    }

    currentidx=idx;
    setPoint(idx);
    loadvideo();
    starttime = playlist.getStart(idx);
    endtime = playlist.getEnd(idx);

    table = document.getElementById("player-functions-table"+idx);
    table.classList.remove("listbox-applied");
    table.classList.add("listbox-playing");

    // console.log("starttime="+starttime+", endttime="+endtime);
    player.seekTo(starttime);
}

