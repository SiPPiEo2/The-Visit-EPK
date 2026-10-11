// หา element ทั้งหมดที่มี class "reveal"
const items = document.querySelectorAll(".reveal");

// สร้างตัวคอยเฝ้าดูว่า element โผล่เข้ามาในหน้าจอหรือยัง
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("show");  // โผล่แล้ว ให้เติม class "show"
    }
  });
});

// สั่งให้เฝ้าดูทีละอัน
items.forEach((el) => observer.observe(el));