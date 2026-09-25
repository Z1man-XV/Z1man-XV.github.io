// =================================
// Zeman Portfolio
// Floating USB Space Test
// =================================


// =======================
// Scene
// =======================


const scene = new THREE.Scene();



const camera = new THREE.PerspectiveCamera(
45,
window.innerWidth / window.innerHeight,
0.1,
1000
);


// 摄像机

camera.position.set(
0,
3,
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




// =======================
// Light
// =======================


scene.add(
new THREE.AmbientLight(
0xffffff,
2
)
);





// =======================
// Computer
// 前方
// =======================


const computer =
new THREE.Group();


scene.add(computer);




// 屏幕

const screen =
new THREE.Mesh(

new THREE.BoxGeometry(
5,
3,
0.5
),

new THREE.MeshBasicMaterial({

color:0x00ff00

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








// =======================
// USB
// 后方
// =======================


const usbGroup =
new THREE.Group();


scene.add(usbGroup);



let usbList=[];



const usbCount=6;



for(let i=0;i<usbCount;i++){



const usb =
new THREE.Mesh(

new THREE.BoxGeometry(
0.8,
1.8,
0.3
),


new THREE.MeshStandardMaterial({

color:0xff0000

})

);





// ===================
// 随机空间
// Z 小于电脑
// ===================


usb.position.set(


(Math.random()-0.5)*10,


(Math.random()-0.5)*8,


-8-Math.random()*8


);





usb.rotation.set(

Math.random()*3,

Math.random()*3,

Math.random()*3

);






usb.userData={


baseY:
usb.position.y,


offset:
Math.random()*10,


speed:
0.001+Math.random()*0.001


};




usbGroup.add(usb);


usbList.push(usb);



}









// =======================
// 动画
// =======================


function animate(){


requestAnimationFrame(
animate
);





usbList.forEach(
usb=>{


// 慢速上下漂浮

usb.position.y =

usb.userData.baseY +

Math.sin(

Date.now()*
usb.userData.speed

+

usb.userData.offset

)

*
0.25;





// 慢速旋转

usb.rotation.y +=0.001;



}

);





renderer.render(
scene,
camera
);



}



animate();






// =======================
// Scroll Camera
// =======================


window.addEventListener(
"scroll",
()=>{


let p =
window.scrollY /

(
document.body.scrollHeight
-
window.innerHeight
);



camera.position.y =
3-p*8;



camera.position.z =
20-p*5;



camera.lookAt(

0,

0,

0

);



}

);






// =======================
// Resize
// =======================


window.onresize=function(){


camera.aspect =
window.innerWidth /
window.innerHeight;


camera.updateProjectionMatrix();


renderer.setSize(

window.innerWidth,

window.innerHeight

);


};
