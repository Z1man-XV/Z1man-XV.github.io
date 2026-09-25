// =====================
// 初始化
// =====================


const scene =
new THREE.Scene();



const camera =
new THREE.PerspectiveCamera(
45,
window.innerWidth/window.innerHeight,
0.1,
1000
);



// 摄像机

camera.position.set(
0,
8,
15
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




// 灯光

scene.add(
new THREE.AmbientLight(
0xffffff,
2
)
);




// =====================
// 电脑
// 后续换computer.glb
// =====================


const computer =
new THREE.Group();



scene.add(computer);



// 屏幕

const monitor =
new THREE.Mesh(

new THREE.BoxGeometry(
4,
2.5,
0.3
),


new THREE.MeshBasicMaterial({

color:0x222222

})

);


monitor.position.z=-2;


computer.add(monitor);



// 底座

const stand =
new THREE.Mesh(

new THREE.BoxGeometry(
1,
1,
1
),


new THREE.MeshBasicMaterial({

color:0xffffff

})

);


stand.position.y=-2;


stand.position.z=-2;


computer.add(stand);




// =====================
// USB系统
// =====================


const usbGroup =
new THREE.Group();



scene.add(usbGroup);



let usbList=[];



const games=5;



for(let i=0;i<games;i++){



let usb =
new THREE.Mesh(

new THREE.BoxGeometry(
0.7,
1.5,
0.25
),


new THREE.MeshStandardMaterial({

color:0x888888

})

);




// USB在电脑后方

usb.position.set(

(Math.random()-0.5)*12,


Math.random()*5+1,


4+Math.random()*5


);



usb.rotation.y=
Math.random()*3;



usb.userData={

baseY:usb.position.y,

speed:
Math.random()*0.02+0.01

};



usbGroup.add(usb);



usbList.push(usb);


}





// 当前游戏

let current=0;




let flying=false;





// =====================
// USB飞入电脑
// =====================



function insertUSB(index){


if(flying)
return;



flying=true;



let usb=
usbList[index];



let start=
usb.position.clone();



let end=
new THREE.Vector3(
0,
-1,
-1
);



let progress=0;




function fly(){


progress+=0.02;



usb.position.lerpVectors(
start,
end,
progress
);



usb.rotation.x+=0.1;



if(progress<1){


requestAnimationFrame(
fly
);


}

else{


flying=false;


changeScreen(index);


}



}


fly();



}






// =====================
// 屏幕显示
// =====================


function changeScreen(i){


document
.getElementById(
"gameName"
)
.innerHTML=
"GAME0"+(i+1);



let texture =
new THREE.TextureLoader()
.load(
"assets/images/game0"+(i+1)+".png"
);



monitor.material =
new THREE.MeshBasicMaterial({

map:texture

});


}




// =====================
// 按钮
// =====================


document
.getElementById("right")
.onclick=()=>{


current++;


if(current>=games)

current=0;



insertUSB(current);



};



document
.getElementById("left")
.onclick=()=>{


current--;


if(current<0)

current=games-1;



insertUSB(current);


};




// =====================
// 漂浮动画
// =====================


function animate(){


requestAnimationFrame(
animate
);



usbList.forEach(
usb=>{


usb.position.y +=

Math.sin(Date.now()*0.002)

*
usb.userData.speed;



usb.rotation.y+=0.005;


}

);





renderer.render(
scene,
camera
);



}


animate();





// =====================
// 滚动镜头
// =====================


window.addEventListener(
"scroll",
()=>{


let p=
window.scrollY/
(document.body.scrollHeight-window.innerHeight);



camera.position.y=
8-10*p;



camera.position.z=
15-8*p;



camera.lookAt(
0,
0,
0
);



});





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
