// =================================
// Zeman Portfolio
// USB Game Cartridge System
// =================================



// ==============================
// Scene
// ==============================


const scene = new THREE.Scene();



const camera =
new THREE.PerspectiveCamera(
45,
window.innerWidth/window.innerHeight,
0.1,
1000
);



camera.position.set(
0,
4,
20
);




const renderer =
new THREE.WebGLRenderer({
    antialias:true
});


renderer.setSize(
window.innerWidth,
window.innerHeight
);



document
.getElementById("scene")
.appendChild(renderer.domElement);






// ==============================
// Light
// ==============================


scene.add(
new THREE.AmbientLight(
0xffffff,
2
)
);







// ==============================
// Computer
// ==============================


const computer =
new THREE.Group();


scene.add(computer);





// 屏幕

const screen =
new THREE.Mesh(

new THREE.BoxGeometry(
5,
3,
0.3
),


new THREE.MeshBasicMaterial({

color:0x111111

})

);



screen.position.set(
0,
0,
5
);



computer.add(screen);







// 底座

const base =
new THREE.Mesh(

new THREE.BoxGeometry(
1.5,
1,
1
),


new THREE.MeshBasicMaterial({

color:0xffffff

})

);



base.position.set(
0,
-2,
5
);



computer.add(base);







// ==============================
// USB系统
// ==============================


const usbGroup =
new THREE.Group();


scene.add(usbGroup);




const gameCount = 6;



let usbList=[];




const gameColors=[

0x00ffff,
0xff0033,
0x00ff66,
0xffcc00,
0xff00ff,
0xffffff

];






// ==============================
// 创建USB
// ==============================



for(let i=0;i<gameCount;i++){



const usb =
new THREE.Mesh(

new THREE.BoxGeometry(
0.8,
1.8,
0.3
),


new THREE.MeshStandardMaterial({

color:gameColors[i]

})

);





// 后方随机位置


usb.position.set(


(Math.random()-0.5)*12,


(Math.random()-0.5)*8,


-8-Math.random()*10


);






usb.rotation.set(

Math.random(),
Math.random(),
Math.random()

);






usb.userData={


id:i,


state:"FLOAT",



home:
usb.position.clone(),



offset:
Math.random()*10,


speed:
0.001+Math.random()*0.001



};






usbGroup.add(usb);


usbList.push(usb);



}









// ==============================
// 当前游戏
// ==============================


let currentGame=0;


let busy=false;



let currentUSB=null;






// ==============================
// 飞行动画
// ==============================



function moveUSB(usb,target,callback){


let start =
usb.position.clone();


let progress=0;




function animateMove(){



progress+=0.025;



usb.position.lerpVectors(

start,

target,

progress

);



usb.rotation.x+=0.1;

usb.rotation.y+=0.1;



if(progress<1){


requestAnimationFrame(
animateMove
);



}else{


callback();


}



}



animateMove();



}









// ==============================
// 加载游戏
// ==============================



function loadGame(index){



let usb =
usbList[index];



usb.visible=true;



usb.userData.state=
"FLY_IN";





// 飞向电脑接口


moveUSB(

usb,


new THREE.Vector3(

0,

-0.3,

4


),



()=>{



// 屏幕改变


screen.material.color.setHex(
gameColors[index]
);





document
.getElementById("gameName")
.innerHTML=
"GAME0"+(index+1);





// 插入后隐藏


usb.visible=false;


usb.userData.state=
"LOADED";



busy=false;


}



);



}









// ==============================
// 卸载旧游戏
// ==============================


function unloadGame(usb,next){



if(!usb)
{

loadGame(next);

return;

}



usb.visible=true;



usb.userData.state=
"FLY_OUT";





moveUSB(


usb,


usb.userData.home,



()=>{


usb.userData.state=
"FLOAT";



// 下一张卡进入


loadGame(next);



}



);



}









// ==============================
// 切换按钮
// ==============================



function changeGame(direction){



if(busy)

return;



busy=true;



let next =
currentGame+direction;




if(next<0)

next=gameCount-1;



if(next>=gameCount)

next=0;





let oldUSB =
currentUSB;





currentGame=next;



currentUSB=
usbList[next];





unloadGame(

oldUSB,

next

);



}






document
.getElementById("right")
.onclick=()=>{

changeGame(1);

};





document
.getElementById("left")
.onclick=()=>{

changeGame(-1);

};








// ==============================
// USB漂浮
// ==============================


function animate(){



requestAnimationFrame(
animate
);




usbList.forEach(
usb=>{



if(
usb.userData.state==="FLOAT"
){



usb.position.y =


usb.userData.home.y+

Math.sin(

Date.now()*
usb.userData.speed

+
usb.userData.offset

)
*
0.25;




usb.rotation.y+=0.001;



}



});







renderer.render(
scene,
camera
);



}



animate();









// ==============================
// 默认加载GAME01
// ==============================


setTimeout(()=>{


loadGame(0);


currentUSB=
usbList[0];


},1000);









// ==============================
// 滚动镜头
// ==============================


window.addEventListener(
"scroll",

()=>{


let p=
window.scrollY/

(
document.body.scrollHeight-
window.innerHeight
);



camera.position.y=
4-p*8;



camera.position.z=
20-p*6;



camera.lookAt(
0,
0,
3
);



}

);









// ==============================
// Resize
// ==============================


window.onresize=()=>{


camera.aspect=
window.innerWidth/
window.innerHeight;



camera.updateProjectionMatrix();



renderer.setSize(

window.innerWidth,

window.innerHeight

);


};
