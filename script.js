//=======================
// Three.js 初始化
//=======================


const scene =
new THREE.Scene();



const camera =
new THREE.PerspectiveCamera(
45,
window.innerWidth/window.innerHeight,
0.1,
1000
);



camera.position.set(
0,
8,
14
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






// 光

const light =
new THREE.AmbientLight(
0xffffff,
2
);


scene.add(light);





//=======================
// 人物占位
// 后面换player.glb
//=======================


const player =
new THREE.Mesh(

new THREE.BoxGeometry(
1,
2.5,
1
),


new THREE.MeshStandardMaterial({

color:0xffffff

})

);



player.position.y=-1;


scene.add(player);






//=======================
// USB 扇形系统
//=======================


const usbGroup =
new THREE.Group();



scene.add(usbGroup);



let usbList=[];


const usbNumber=5;


const radius=6;



for(let i=0;i<usbNumber;i++){


let usb =
new THREE.Mesh(

new THREE.BoxGeometry(
1,
2,
0.35
),


new THREE.MeshStandardMaterial({

color:0x777777

})

);



let angle =
(i-2)*25*Math.PI/180;



usb.position.x =
Math.sin(angle)*radius;


usb.position.z =
Math.cos(angle)*radius-3;


usb.position.y=3;



usb.rotation.y=angle;



usbGroup.add(usb);



usbList.push(usb);



}





// 当前编号

let current=0;



let targetRotation=0;




//=======================
// 切换
//=======================


function changeUSB(direction){


current += direction;



if(current<0)
current=usbNumber-1;


if(current>=usbNumber)
current=0;



targetRotation =
-current*25*Math.PI/180;



document
.getElementById("gameTitle")
.innerHTML=
"GAME 0"+(current+1);



document
.getElementById("gameText")
.innerHTML=
"Portfolio Project "+(current+1);



showImage(current);


}





document
.getElementById("left")
.onclick=()=>{


changeUSB(-1);


}




document
.getElementById("right")
.onclick=()=>{


changeUSB(1);


}





//=======================
// 图片覆盖
//=======================


function showImage(i){


let overlay =
document.getElementById(
"overlay"
);



overlay.style.backgroundImage=
"url(assets/images/game"+(i+1)+".png)";



overlay.style.opacity=.5;



setTimeout(()=>{


overlay.style.opacity=0;


},800);



}







//=======================
// 滚动改变镜头
//=======================



window.addEventListener(
"scroll",
()=>{


let scroll =
window.scrollY/
(document.body.scrollHeight-window.innerHeight);



camera.position.y =
8-scroll*16;



camera.lookAt(
0,
0,
0
);



});








//=======================
// 动画
//=======================


function animate(){


requestAnimationFrame(
animate
);



usbGroup.rotation.y +=
(targetRotation-usbGroup.rotation.y)*0.08;



renderer.render(
scene,
camera
);



}



animate();






window.onresize=()=>{


camera.aspect=
window.innerWidth/
window.innerHeight;


camera.updateProjectionMatrix();


renderer.setSize(
window.innerWidth,
window.innerHeight
);



}
