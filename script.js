// =================================
// Zeman Portfolio
// Floating USB Space System
// =================================


// ===============================
// Scene
// ===============================


const scene = new THREE.Scene();



const camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);



// 摄像机在最前方

camera.position.set(
    0,
    6,
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






// ===============================
// Light
// ===============================


const ambient =
new THREE.AmbientLight(
    0xffffff,
    2
);


scene.add(ambient);






// ===============================
// Computer
// 前景
// ===============================


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






// 电脑底座

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
    5

);



computer.add(base);







// ===============================
// USB System
// 后方空间
// ===============================



const usbGroup =
new THREE.Group();


scene.add(usbGroup);




const usbCount = 6;



let usbList=[];



for(let i=0;i<usbCount;i++){



    const usb =
    new THREE.Mesh(

        new THREE.BoxGeometry(
            0.8,
            1.8,
            0.35
        ),


        new THREE.MeshStandardMaterial({

            color:0xff0000


        })

    );





    // ======================
    // 随机空间位置
    // USB在电脑后面
    // ======================


    usb.position.set(


        // 左右随机

        (Math.random()-0.5)*14,



        // 上下随机

        (Math.random()-0.5)*8,



        // 后方随机

        -5 - Math.random()*12


    );





    usb.rotation.set(

        Math.random()*3,

        Math.random()*3,

        Math.random()*3

    );





    usb.userData={


        id:i,


        startY:
        usb.position.y,


        offset:
        Math.random()*10,


        floatHeight:
        0.15 + Math.random()*0.15,


        speed:
        0.0005 + Math.random()*0.0008


    };





    usbGroup.add(usb);


    usbList.push(usb);



}







// ===============================
// USB选择
// ===============================


let currentGame=0;


let moving=false;






// ===============================
// USB飞向电脑
// ===============================


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

        -0.3,

        4.5

    );





    let progress=0;





    function fly(){


        progress+=0.015;



        usb.position.lerpVectors(

            start,

            target,

            progress

        );



        usb.rotation.x+=0.05;



        usb.rotation.y+=0.05;




        if(progress<1){


            requestAnimationFrame(
                fly
            );


        }

        else{


            changeScreen(index);


            moving=false;


        }



    }



    fly();


}







// ===============================
// 屏幕图片
// ===============================


function changeScreen(index){



document
.getElementById("gameName")
.innerHTML =
"GAME0"+(index+1);




const texture =
new THREE.TextureLoader()
.load(

"assets/images/game0"+(index+1)+".png"

);




screen.material =
new THREE.MeshBasicMaterial({

    map:texture

});


}







// ===============================
// Button
// ===============================



document
.getElementById("right")
.onclick=function(){



currentGame++;



if(currentGame>=usbCount)

currentGame=0;



insertUSB(currentGame);



};






document
.getElementById("left")
.onclick=function(){



currentGame--;



if(currentGame<0)

currentGame=usbCount-1;



insertUSB(currentGame);


};









// ===============================
// 漂浮动画
// ===============================



function animate(){



requestAnimationFrame(
animate
);





usbList.forEach(
usb=>{



    usb.position.y =


    usb.userData.startY +



    Math.sin(

        Date.now()
        *
        usb.userData.speed
        +
        usb.userData.offset

    )

    *

    usb.userData.floatHeight;





    // 非常慢的旋转

    usb.rotation.y +=0.001;



}

);





renderer.render(
scene,
camera
);



}



animate();









// ===============================
// Scroll Camera
// ===============================


window.addEventListener(
"scroll",

()=>{


let p =


window.scrollY /

(
document.body.scrollHeight -
window.innerHeight
);



camera.position.y =

6 - p*10;




camera.position.z =

20 - p*8;




camera.lookAt(

0,

0,

3

);



}

);







// ===============================
// Resize
// ===============================


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
