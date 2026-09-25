// =================================
// Zeman Portfolio 3D Space
// =================================


// ---------- Scene ----------

const scene = new THREE.Scene();



const camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);



// 摄像机位置
camera.position.set(
    0,
    6,
    18
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





// ---------- Light ----------


const light =
new THREE.AmbientLight(
    0xffffff,
    2
);


scene.add(light);





// =================================
// Computer
// 后续替换 computer.glb
// =================================



const computer =
new THREE.Group();


scene.add(computer);



// 屏幕

const screen =
new THREE.Mesh(

    new THREE.BoxGeometry(
        4,
        2.4,
        0.25
    ),

    new THREE.MeshBasicMaterial({

        color:0x222222

    })

);



screen.position.set(
    0,
    0,
    -5
);



computer.add(screen);




// 底座

const base =
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



base.position.set(
    0,
    -2,
    -5
);



computer.add(base);





// =================================
// USB System
// USB 位于电脑后方
// =================================


const usbGroup =
new THREE.Group();


scene.add(usbGroup);



const usbNumber = 5;


let usbList=[];



for(let i=0;i<usbNumber;i++){



    const usb =
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



    // -----------------------------
    // USB 后方随机空间
    // -----------------------------


    usb.position.set(

        (Math.random()-0.5)*12,

        Math.random()*5+2,


        // 比电脑远
        5 + Math.random()*8


    );



    usb.rotation.y =
    Math.random()*Math.PI;



    usb.userData={


        baseY:
        usb.position.y,


        offset:
        Math.random()*10,


        floatSpeed:
        Math.random()*0.5+0.5,


        id:i


    };



    usbGroup.add(usb);


    usbList.push(usb);


}





// =================================
// 游戏选择
// =================================



let currentGame=0;


let moving=false;




// =================================
// USB 飞入电脑
// =================================



function insertUSB(index){


    if(moving)
    return;



    moving=true;



    let usb =
    usbList[index];



    let start =
    usb.position.clone();



    // USB接口位置
    let target =
    new THREE.Vector3(

        0,

        -0.5,

        -6

    );



    let t=0;



    function move(){



        t+=0.025;



        usb.position.lerpVectors(

            start,

            target,

            t

        );



        usb.rotation.x +=0.1;

        usb.rotation.z +=0.05;



        if(t<1){


            requestAnimationFrame(move);


        }

        else{


            changeScreen(index);


            moving=false;


        }



    }



    move();



}





// =================================
// 屏幕显示
// =================================


function changeScreen(index){



document
.getElementById("gameName")
.innerHTML =
"GAME0"+(index+1);




let texture =
new THREE.TextureLoader()
.load(

"assets/images/game0"+(index+1)+".png"

);




screen.material =
new THREE.MeshBasicMaterial({

    map:texture

});



}







// =================================
// 左右按钮
// =================================



document
.getElementById("right")
.onclick=function(){


    currentGame++;


    if(currentGame>=usbNumber)

    currentGame=0;



    insertUSB(currentGame);


};






document
.getElementById("left")
.onclick=function(){



    currentGame--;



    if(currentGame<0)

    currentGame=usbNumber-1;



    insertUSB(currentGame);


};









// =================================
// USB漂浮动画
// =================================



function animate(){


requestAnimationFrame(
animate
);





usbList.forEach(
usb=>{


    usb.position.y =

    usb.userData.baseY +

    Math.sin(

        Date.now()*0.001*

        usb.userData.floatSpeed

        +

        usb.userData.offset

    )

    *

    0.3;



    usb.rotation.y +=0.005;



}

);




renderer.render(
scene,
camera
);



}



animate();









// =================================
// Scroll Camera
// =================================


window.addEventListener(
"scroll",

()=>{


let progress =

window.scrollY /

(
document.body.scrollHeight
-
window.innerHeight
);



camera.position.y =

6 -

progress*10;



camera.position.z =

18 -

progress*8;



camera.lookAt(
0,
0,
-3
);



}

);






// =================================
// Resize
// =================================


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
