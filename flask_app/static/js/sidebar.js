let leftToggleBtn, rightToggleBtn, leftSidebar, rightSidebar;

export function initSidebarToggle() {
    leftToggleBtn = document.querySelector('.sidebar-left-toggle');
    rightToggleBtn = document.querySelector('.sidebar-right-toggle');
    leftSidebar = document.querySelector('.left-sidebar');
    rightSidebar = document.querySelector('.right-sidebar');

    leftToggleBtn.addEventListener('click', (e) => toggleLeftSidebar(e));
    rightToggleBtn.addEventListener('click', (e) => toggleRightSidebar(e));
}

function toggleLeftSidebar(e) {
    e.stopPropagation();
    leftSidebar.classList.toggle('collapsed');

    const icon = leftToggleBtn.querySelector('i');
    if (leftSidebar.classList.contains('collapsed')) {
        icon.classList.remove('fa-angle-left');
        icon.classList.add('fa-angle-right');
    } else {
        icon.classList.remove('fa-angle-right');
        icon.classList.add('fa-angle-left');
    }
}

function toggleRightSidebar(e) {
    e.stopPropagation();
    rightSidebar.classList.toggle('collapsed');

    const icon = rightToggleBtn.querySelector('i');
    if (rightSidebar.classList.contains('collapsed')) {
        icon.classList.remove('fa-angle-right');
        icon.classList.add('fa-angle-left');
    } else {
        icon.classList.remove('fa-angle-left');
        icon.classList.add('fa-angle-right');
    }
}