// 创建场景

const scene =
new THREE.Scene();



// 摄像机

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
12
);



// 渲染器

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
.appendChild(
renderer.domElement
);





// 光

const light =
new THREE.AmbientLight(
0xffffff,
2
);


scene.add(light);





// =================
// 人物占位
// =================


const body =
new THREE.Mesh(

new THREE.BoxGeometry(
1,
2,
0.5
),


new THREE.MeshStandardMaterial({
color:0xffffff
})

);



body.position.y=-1;


scene.add(body);





// =================
// U盘系统
// =================


let usbGroup =
new THREE.Group();


scene.add(usbGroup);



let usbList=[];



for(let i=0;i<5;i++){


let usb =
new THREE.Mesh(

new THREE.BoxGeometry(
1,
2,
0.3
),


new THREE.MeshStandardMaterial({
color:0x555555
})

);



let angle =
(i-2)*0.8;



usb.position.set(

Math.sin(angle)*5,

3,

Math.cos(angle)*2-5

);



usb.rotation.y=angle;



usbGroup.add(usb);


usbList.push(usb);


}






let current=2;



function selectUSB(index){


usbList.forEach(
(u,i)=>{


let target =
(i-index)*0.8;


u.position.x =
Math.sin(target)*5;


u.position.z =
Math.cos(target)*2-5;



u.rotation.y =
target;


}

);



document
.getElementById("content")
.innerHTML=
"GAME "+(index+1);



overlayShow(index);


}





function overlayShow(i){


let overlay =
document.getElementById(
"overlay"
);



overlay.style.backgroundImage=
"url('assets/images/game"+i+".png')";


overlay.style.opacity=
0.5;


setTimeout(()=>{

overlay.style.opacity=0;

},1000);


}





document
.getElementById("left")
.onclick=()=>{


current--;


if(current<0)
current=4;


selectUSB(current);


}



document
.getElementById("right")
.onclick=()=>{


current++;


if(current>4)
current=0;


selectUSB(current);


}






// =====================
// 滚动控制镜头
// =====================



window.addEventListener(
"scroll",
()=>{


let p=
window.scrollY/
(document.body.scrollHeight-window.innerHeight);



camera.position.y=
8-16*p;



camera.lookAt(
0,
0,
0
);



});







// 动画


function animate(){


requestAnimationFrame(
animate
);



usbGroup.rotation.y+=0.002;



renderer.render(
scene,
camera
);


}



animate();





window.onresize=()=>{


camera.aspect=
window.innerWidth/window.innerHeight;


camera.updateProjectionMatrix();


renderer.setSize(
window.innerWidth,
window.innerHeight
);


}
