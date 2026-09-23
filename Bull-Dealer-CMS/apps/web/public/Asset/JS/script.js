document.addEventListener("DOMContentLoaded", () => {
    const slides = document.querySelectorAll(".banner-img");
    const buttons = document.querySelectorAll(".caro-change-btn");

    let currentIndex = 0;
    let autoPlayTimer;

    function showSlide(index) {
        slides.forEach((slide, i) => {
            slide.classList.toggle("active", i === index);
        });
        buttons.forEach((btn, i) => {
            btn.parentElement.classList.toggle("active", i === index);
        });
        currentIndex = index;
    }

    function startAutoplay() {
        autoPlayTimer = setInterval(() => {
            let nextIndex = (currentIndex + 1) % slides.length;
            showSlide(nextIndex);
        }, 5000);
    }

    function resetAutoplay() {
        clearInterval(autoPlayTimer);
        startAutoplay();
    }

    buttons.forEach((btn, i) => {
        btn.addEventListener("click", () => {
            showSlide(i);
            resetAutoplay();
        });
    });

    showSlide(0);
    startAutoplay();
});


// overlay


document.addEventListener("DOMContentLoaded", function () {

    var swiper_tube = document.querySelectorAll(".swiper-tube");
    var swiper_overlay = document.querySelector(".swiper-overlay");
    var overlay_iframe = document.querySelector(".overlay-iframe");
    var swiper_cross = document.querySelector(".swiper-cross");


    swiper_tube.forEach(tube => {
        tube.addEventListener("click", event => {
            event.preventDefault();

            let link = event.currentTarget.getAttribute("data-url");
            let embedUrl = link.replace("watch?v=", "embed/") + "?autoplay=1";
            swiper_overlay.style.display = "block";
            overlay_iframe.src = embedUrl;
        });
    });


    swiper_cross.addEventListener("click", event => {
        swiper_overlay.style.display = "none";
        overlay_iframe.src = "";
    });

});

// image hover

document.addEventListener("DOMContentLoaded", function () {

    let con_img_main = document.querySelector(".con-img-main");
    let cons_ul_img = document.querySelectorAll(".cons-ul-img");

    cons_ul_img.forEach(image => {
        image.addEventListener("mouseenter", event => {

            con_img_main.style.opacity = 0;
            setTimeout(() => {
                con_img_main.src = event.target.src;
                con_img_main.style.opacity = 1;
            }, 300)
        })
    });

    cons_ul_img.forEach(image => {
        image.addEventListener("mouseleave", event => {

            con_img_main.style.opacity = 0;
            setTimeout(() => {
                con_img_main.src = "./Asset/Images/construct/SD76_bs4.png";
                con_img_main.style.opacity = 1;
            }, 300)
        })
    });

    let con_img_main2 = document.querySelector(".con-img-main2");
    let cons_ul_img2 = document.querySelectorAll(".cons-ul-img2");

    cons_ul_img2.forEach(image => {
        image.addEventListener("mouseenter", event => {

            con_img_main2.style.opacity = 0;
            setTimeout(() => {
                con_img_main2.src = event.target.src;
                con_img_main2.style.opacity = 1;
            }, 300)
        })
    });

    cons_ul_img2.forEach(image => {
        image.addEventListener("mouseleave", event => {

            con_img_main2.style.opacity = 0;
            setTimeout(() => {
                con_img_main2.src = "./Asset/Images/construct/SKid (2).png";
                con_img_main2.style.opacity = 1;
            }, 300)
        })
    });
});



// selection //

document.addEventListener("DOMContentLoaded", function () {
    const sections = document.querySelectorAll("section[id]");
    const navLinks = document.querySelectorAll(".sect-ul li");

    document.querySelectorAll('.sect-ul a').forEach(anchor => {
        anchor.addEventListener("click", function (e) {
            e.preventDefault();
            document.querySelector(this.getAttribute("href")).scrollIntoView({
                behavior: "smooth"
            });
        });
    });

    window.addEventListener("scroll", () => {
        let current = "";
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 150;
            if (window.scrollY >= sectionTop) {
                current = section.getAttribute("id");
            }
        });

        navLinks.forEach(li => {
            li.classList.remove("active");
            const link = li.querySelector("a");
            if (link.getAttribute("href") === "#" + current) {
                li.classList.add("active");
            }
        });
    });
});

//   menu  //

document.addEventListener("DOMContentLoaded", function () {
    let menuBtn = document.querySelector(".menu-1000-flex");
    let menu_bg = document.querySelector(".menu-1000-bg");
    let menu_x = document.querySelector(".menu-cross");

    function openMenu() {
        menu_bg.style.display = "block";
    }

    function closeMenu() {
        menu_bg.style.display = "none";
    }

    if (menuBtn && menu_bg && menu_x) {
        menuBtn.addEventListener("click", openMenu);
        menu_x.addEventListener("click", closeMenu);
    } else {
        console.error("Menu elements not found!");
    }
});

// menu drop  //

document.addEventListener("DOMContentLoaded", function () {
    let toggleBtn = document.querySelector(".cont-li-js");
    let dropMenu = document.querySelector(".menu-bg-js");

    if (toggleBtn && dropMenu) {
        toggleBtn.addEventListener("click", function (e) {
            e.preventDefault();

            if (dropMenu.style.display === "block") {
                dropMenu.style.display = "none";
            } else {
                dropMenu.style.display = "block";
            }
        });
    } else {
        console.error("Dropdown elements not found!");
    }
});








