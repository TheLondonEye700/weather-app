let mySwiper = new Swiper('.swiper-container', {
    slidesPerView: 4,
    spaceBetween: 20,

    breakpoints: {
        0: {
            slidesPerView: 3,
        },
        640: {
            slidesPerView: 4,
        },
        768: {
            slidesPerView: 3,
        },
        975: {
            slidesPerView: 4,
        },
        1090: {
            slidesPerView: 5,
        }
    },

    navigation: {
        nextEl: '.swiper-button-next',
        prevEl: '.swiper-button-prev',
    },

})